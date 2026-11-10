// 相容性規則單元測試（合成資料）：每條實作的規則至少 Safe、Incompatible / Info / Warning、Unknown 三種情境。
import { describe, expect, it } from "vitest";
import { evaluateReport, type RuleRefs } from "@/lib/compatibility";
import type { RuleId } from "@/lib/compatibility/rules";
import { UNCHECKED_RULES } from "@/lib/compatibility/rules";
import type {
  AioPart,
  AirCoolerPart,
  BuildSelection,
  CasePart,
  CompatibilityStatus,
  CpuPart,
  GpuPart,
  M2SsdPart,
  MotherboardPart,
  PsuPart,
  RamPart,
} from "@/types/parts";

const base = { brand: "T", model: "T", twName: "T", sourceUrl: null, specVerifiedAt: null };

const pcCase = (o: Partial<CasePart> = {}): CasePart => ({
  ...base,
  id: "case",
  category: "case",
  external: {},
  supportedFormFactors: ["ATX", "M-ATX", "ITX"],
  gpuLength: { noFrontMm: 400 },
  radiatorMounts: {},
  psu: { formFactors: ["ATX"] },
  ...o,
});
const mb = (o: Partial<MotherboardPart> = {}): MotherboardPart => ({
  ...base,
  id: "mb",
  category: "motherboard",
  formFactor: "ATX",
  socket: "AM5",
  chipset: "B650",
  dimensions: {},
  ...o,
});
const cpu = (o: Partial<CpuPart> = {}): CpuPart => ({
  ...base,
  id: "cpu",
  category: "cpu",
  socket: "AM5",
  generation: "amd-ryzen-9000",
  ...o,
});
const ram = (o: Partial<RamPart> = {}): RamPart => ({
  ...base,
  id: "ram",
  category: "ram",
  memoryType: "DDR5",
  moduleCapacityGb: 16,
  moduleCount: 2,
  speedMts: 5600,
  ...o,
});
const gpu = (o: Partial<GpuPart> = {}): GpuPart => ({
  ...base,
  id: "gpu",
  category: "gpu",
  gpuChip: "chip-a",
  ...o,
});
const air = (o: Partial<AirCoolerPart> = {}): AirCoolerPart => ({ ...base, id: "air", category: "airCooler", ...o });
const aio = (o: Partial<AioPart> = {}): AioPart => ({ ...base, id: "aio", category: "aio", radiatorSize: 360, ...o });
const psu = (o: Partial<PsuPart> = {}): PsuPart => ({
  ...base,
  id: "psu",
  category: "psu",
  formFactor: "ATX",
  wattage: 850,
  ...o,
});
const ssd = (o: Partial<M2SsdPart> = {}): M2SsdPart => ({
  ...base,
  id: "ssd",
  category: "m2Ssd",
  interface: { kind: "pcie", modes: [{ gen: 4, lanes: 4 }] },
  formFactor: "2280",
  ...o,
});

const REFS: RuleRefs = {
  gpuChips: new Map([
    [
      "chip-a",
      { id: "chip-a", vendor: "NVIDIA", name: "A", pcieGen: 5, tbpW: 300, recommendedPsuW: 750, sourceUrl: "https://x.test/a", verifiedAt: "2026-11-10" },
    ],
  ]),
  bios: {
    entries: [
      { chipset: "B650", cpuGeneration: "amd-ryzen-9000", support: "biosUpdate", sourceUrl: "https://x.test/b", verifiedAt: "2026-11-10" },
      { chipset: "B850", cpuGeneration: "amd-ryzen-9000", support: "native", sourceUrl: "https://x.test/b", verifiedAt: "2026-11-10" },
      { chipset: "A520", cpuGeneration: "amd-ryzen-9000", support: "unsupported", sourceUrl: "https://x.test/b", verifiedAt: "2026-11-10" },
    ],
    boardOverrides: [
      { motherboardId: "mb-list", cpuId: "cpu", support: "biosUpdate", minBios: "2613", sourceUrl: "https://x.test/mb", verifiedAt: "2026-11-10" },
      { motherboardId: "mb-native", cpuId: "cpu", support: "native", minBios: "all", sourceUrl: "https://x.test/mb", verifiedAt: "2026-11-10" },
      { motherboardId: "mb-boot", cpuId: "cpu", support: "biosUpdate", minBios: "4.03", bootableSinceBios: "3.12", sourceUrl: "https://x.test/mb", verifiedAt: "2026-11-10" },
      { motherboardId: "mb-boot-same", cpuId: "cpu", support: "biosUpdate", minBios: "3.12", bootableSinceBios: "3.12", sourceUrl: "https://x.test/mb", verifiedAt: "2026-11-10" },
    ],
  },
};

function sel(o: Partial<BuildSelection>): BuildSelection {
  return { cooler: { kind: "none" }, m2Ssds: [], overrides: {}, ...o };
}
function run(o: Partial<BuildSelection>, id: RuleId) {
  return evaluateReport(sel(o), REFS).results.find((r) => r.ruleId === id);
}
function status(o: Partial<BuildSelection>, id: RuleId): CompatibilityStatus | undefined {
  return run(o, id)?.status;
}

describe("R01 主機板板型", () => {
  it("safe", () => expect(status({ case: pcCase(), motherboard: mb() }, "R01")).toBe("safe"));
  it("incompatible：板型不在清單", () =>
    expect(status({ case: pcCase({ supportedFormFactors: ["ITX"] }), motherboard: mb() }, "R01")).toBe("incompatible"));
  it("incompatible：E-ATX 寬度超過", () =>
    expect(
      status(
        { case: pcCase({ supportedFormFactors: ["E-ATX"], maxMotherboardDepthMm: 272 }), motherboard: mb({ formFactor: "E-ATX", dimensions: { depthMm: 277 } }) },
        "R01"
      )
    ).toBe("incompatible"));
  it("unknown：只選機殼", () => expect(status({ case: pcCase() }, "R01")).toBe("unknown"));
});

describe("R02 顯卡長度", () => {
  const g = gpu({ lengthMm: 340 });
  it("safe（附餘裕）", () => {
    const r = run({ case: pcCase(), gpu: g }, "R02");
    expect(r?.status).toBe("safe");
    expect(r?.remainingValue).toBe(60);
  });
  it("前置內附風扇 → 用 withFrontFanMm", () =>
    expect(
      status({ case: pcCase({ gpuLength: { noFrontMm: 400, withFrontFanMm: 330 }, includedFans: { front: { sizeMm: 140, count: 2 } } }), gpu: g }, "R02")
    ).toBe("incompatible"));
  it("前置水冷 → 依尺寸取官方上限，不再扣厚度", () => {
    const c = pcCase({ gpuLength: { noFrontMm: 400, withFrontRadiator: [{ radiatorSize: 360, maxGpuMm: 345 }] } });
    const r = run({ case: c, gpu: g, cooler: { kind: "aio", cooler: aio({ radiatorThicknessMm: 30, fanThicknessMm: 25 }), mountLocation: "front" } }, "R02");
    expect(r?.status).toBe("safe");
    expect(r?.limitValue).toBe(345);
  });
  it("前置水冷但官方沒有該尺寸條件 → unknown", () =>
    expect(
      status({ case: pcCase(), gpu: g, cooler: { kind: "aio", cooler: aio(), mountLocation: "front" } }, "R02")
    ).toBe("unknown"));
  it("只有 unspecifiedMm → info", () =>
    expect(status({ case: pcCase({ gpuLength: { unspecifiedMm: 380 } }), gpu: g }, "R02")).toBe("info"));
  it("incompatible", () => expect(status({ case: pcCase({ gpuLength: { noFrontMm: 300 } }), gpu: g }, "R02")).toBe("incompatible"));
  it("unknown：顯卡長度缺值", () => expect(status({ case: pcCase(), gpu: gpu() }, "R02")).toBe("unknown"));
  it("unknown：只選顯卡", () => expect(status({ gpu: g }, "R02")).toBe("unknown"));
});

describe("R03 顯卡槽數 / 安裝方向", () => {
  it("safe", () => expect(status({ case: pcCase({ maxGpuSlotWidth: 3.5 }), gpu: gpu({ slotWidth: 3 }) }, "R03")).toBe("safe"));
  it("incompatible", () =>
    expect(status({ case: pcCase({ maxGpuSlotWidth: 3 }), gpu: gpu({ slotWidth: 3.8 }) }, "R03")).toBe("incompatible"));
  it("info：只能直立", () =>
    expect(status({ case: pcCase({ gpuMountOrientation: "vertical", expansionSlots: 7 }), gpu: gpu({ slotWidth: 3 }) }, "R03")).toBe("info"));
  it("unknown：槽數缺值", () => expect(status({ case: pcCase({ maxGpuSlotWidth: 3 }), gpu: gpu() }, "R03")).toBe("unknown"));
  it("沒有槽數上限 → 列入尚未檢查", () => {
    const rep = evaluateReport(sel({ case: pcCase({ expansionSlots: 7 }), gpu: gpu({ slotWidth: 3 }) }), REFS);
    expect(rep.results.find((r) => r.ruleId === "R03")).toBeUndefined();
    expect(rep.unchecked.some((u) => u.ruleId === "R03")).toBe(true);
  });
});

describe("R04 顯卡高度", () => {
  const lim = [{ mm: 150, condition: "預設", isDefault: true }];
  it("safe", () => expect(status({ case: pcCase({ gpuHeightLimits: lim }), gpu: gpu({ heightMm: 140 }) }, "R04")).toBe("safe"));
  it("incompatible", () => expect(status({ case: pcCase({ gpuHeightLimits: lim }), gpu: gpu({ heightMm: 155 }) }, "R04")).toBe("incompatible"));
  it("info：有其他條件", () =>
    expect(
      status({ case: pcCase({ gpuHeightLimits: [...lim, { mm: 170, condition: "拆支架", isDefault: false }] }), gpu: gpu({ heightMm: 140 }) }, "R04")
    ).toBe("info"));
  it("unknown", () => expect(status({ case: pcCase(), gpu: gpu({ heightMm: 140 }) }, "R04")).toBe("unknown"));
});

describe("R05 塔散高度", () => {
  const lim = [
    { mm: 145, condition: "含支架", isDefault: true },
    { mm: 170, condition: "不含支架", isDefault: false },
  ];
  it("safe", () =>
    expect(status({ case: pcCase({ cpuCoolerHeightLimits: [lim[0]] }), cooler: { kind: "air", cooler: air({ heightMm: 140 }) } }, "R05")).toBe("safe"));
  it("用 isDefault 判斷，其他條件 info", () => {
    expect(status({ case: pcCase({ cpuCoolerHeightLimits: lim }), cooler: { kind: "air", cooler: air({ heightMm: 140 }) } }, "R05")).toBe("info");
    expect(status({ case: pcCase({ cpuCoolerHeightLimits: lim }), cooler: { kind: "air", cooler: air({ heightMm: 160 }) } }, "R05")).toBe("incompatible");
  });
  it("unknown：未選散熱器（不再誤報 warning）", () => expect(status({ case: pcCase() }, "R05")).toBe("unknown"));
  it("unknown：上限缺值", () => expect(status({ case: pcCase(), cooler: { kind: "air", cooler: air({ heightMm: 140 }) } }, "R05")).toBe("unknown"));
});

describe("R06 塔散 vs RAM", () => {
  const c = air({ ramClearance: { defaultMm: 32 } });
  it("safe", () => expect(status({ ram: ram({ moduleHeightMm: 31 }), cooler: { kind: "air", cooler: c } }, "R06")).toBe("safe"));
  it("incompatible", () => expect(status({ ram: ram({ moduleHeightMm: 44 }), cooler: { kind: "air", cooler: c } }, "R06")).toBe("incompatible"));
  it("unknown", () => expect(status({ ram: ram(), cooler: { kind: "air", cooler: c } }, "R06")).toBe("unknown"));
});

describe("R08 水冷排位置", () => {
  const a = aio({ radiatorThicknessMm: 27, fanThicknessMm: 25 });
  const cooler = { kind: "aio" as const, cooler: a, mountLocation: "top" as const };
  it("safe", () =>
    expect(status({ case: pcCase({ radiatorMounts: { top: { sizes: [360], maxTotalThicknessMm: 60 } } }), cooler }, "R08")).toBe("safe"));
  it("incompatible：位置不支援", () =>
    expect(status({ case: pcCase({ radiatorMounts: { top: { sizes: [] } } }), cooler }, "R08")).toBe("incompatible"));
  it("incompatible：厚度超過", () =>
    expect(status({ case: pcCase({ radiatorMounts: { top: { sizes: [360], maxTotalThicknessMm: 50 } } }), cooler }, "R08")).toBe("incompatible"));
  it("unknown：沒有厚度上限", () =>
    expect(status({ case: pcCase({ radiatorMounts: { top: { sizes: [360] } } }), cooler }, "R08")).toBe("unknown"));
  it("不需選顯卡也會檢查（修正舊 bug）", () =>
    expect(status({ case: pcCase({ radiatorMounts: { front: { sizes: [240] } } }), cooler: { ...cooler, mountLocation: "front" } }, "R08")).toBe("incompatible"));
});

describe("R10 電源", () => {
  const lim = [{ mm: 180, condition: "官方未註明條件", isDefault: true }];
  it("safe", () => expect(status({ case: pcCase({ psu: { formFactors: ["ATX"], lengthLimits: lim } }), psu: psu({ lengthMm: 160 }) }, "R10")).toBe("safe"));
  it("incompatible：長度", () =>
    expect(status({ case: pcCase({ psu: { formFactors: ["ATX"], lengthLimits: lim } }), psu: psu({ lengthMm: 200 }) }, "R10")).toBe("incompatible"));
  it("incompatible：ATX 電源放 SFX 機殼", () =>
    expect(status({ case: pcCase({ psu: { formFactors: ["SFX", "SFX-L"] } }), psu: psu({ lengthMm: 140 }) }, "R10")).toBe("incompatible"));
  it("unknown：SFX 放只列 ATX 的機殼", () =>
    expect(status({ case: pcCase({ psu: { formFactors: ["ATX"], lengthLimits: lim } }), psu: psu({ formFactor: "SFX", lengthMm: 100 }) }, "R10")).toBe("unknown"));
  it("unknown：只選機殼", () => expect(status({ case: pcCase() }, "R10")).toBe("unknown"));
});

describe("R14 散熱器腳位", () => {
  it("safe", () => expect(status({ motherboard: mb(), cooler: { kind: "air", cooler: air({ supportedSockets: ["AM5"] }) } }, "R14")).toBe("safe"));
  it("incompatible", () =>
    expect(status({ motherboard: mb(), cooler: { kind: "air", cooler: air({ supportedSockets: ["LGA1700"] }) } }, "R14")).toBe("incompatible"));
  it("unknown", () => expect(status({ motherboard: mb(), cooler: { kind: "air", cooler: air() } }, "R14")).toBe("unknown"));
});

describe("R15 電源瓦數", () => {
  it("safe（板卡廠沒寫 → 用晶片表）", () => expect(run({ gpu: gpu(), psu: psu() }, "R15")?.limitValue).toBe(850));
  it("safe（板卡廠數值）", () => expect(status({ gpu: gpu({ recommendedPsuW: 750 }), psu: psu() }, "R15")).toBe("safe"));
  it("warning：低於建議", () => expect(status({ gpu: gpu({ recommendedPsuW: 1000 }), psu: psu() }, "R15")).toBe("warning"));
  it("unknown", () => expect(status({ gpu: gpu({ gpuChip: "nope" }), psu: psu() }, "R15")).toBe("unknown"));
});

describe("R22 CPU 腳位", () => {
  it("safe", () => expect(status({ cpu: cpu(), motherboard: mb() }, "R22")).toBe("safe"));
  it("incompatible", () => expect(status({ cpu: cpu({ socket: "LGA1700" }), motherboard: mb() }, "R22")).toBe("incompatible"));
  it("未選齊不產生結果", () => expect(status({ cpu: cpu() }, "R22")).toBeUndefined());
});

describe("R23 記憶體類型", () => {
  it("safe", () => expect(status({ ram: ram(), motherboard: mb({ memoryType: "DDR5" }) }, "R23")).toBe("safe"));
  it("incompatible：DDR4 記憶體配 DDR5 主機板", () =>
    expect(status({ ram: ram({ memoryType: "DDR4" }), motherboard: mb({ memoryType: "DDR5" }) }, "R23")).toBe("incompatible"));
  it("incompatible：CPU 不支援", () =>
    expect(status({ ram: ram({ memoryType: "DDR4" }), motherboard: mb({ memoryType: "DDR4" }), cpu: cpu({ memoryTypes: ["DDR5"] }) }, "R23")).toBe("incompatible"));
  it("unknown", () => expect(status({ ram: ram(), motherboard: mb() }, "R23")).toBe("unknown"));
});

describe("R24 記憶體條數", () => {
  it("safe", () => expect(status({ ram: ram(), motherboard: mb({ memorySlots: 2 }) }, "R24")).toBe("safe"));
  it("incompatible", () => expect(status({ ram: ram({ moduleCount: 4 }), motherboard: mb({ memorySlots: 2 }) }, "R24")).toBe("incompatible"));
  it("unknown", () => expect(status({ ram: ram(), motherboard: mb() }, "R24")).toBe("unknown"));
});

describe("R25 記憶體容量", () => {
  it("safe", () => expect(status({ ram: ram(), motherboard: mb({ maxMemoryCapacityGb: 128 }) }, "R25")).toBe("safe"));
  it("incompatible：超過 CPU 上限", () =>
    expect(status({ ram: ram({ moduleCapacityGb: 64, moduleCount: 4 }), motherboard: mb({ maxMemoryCapacityGb: 256 }), cpu: cpu({ maxMemoryCapacityGb: 192 }) }, "R25")).toBe(
      "incompatible"
    ));
  it("unknown", () => expect(status({ ram: ram(), motherboard: mb() }, "R25")).toBe("unknown"));
});

describe("R26 記憶體速度", () => {
  const table = [
    { memoryType: "DDR5" as const, modulesPerChannel: 1 as const, rank: 1 as const, mts: 5600 },
    { memoryType: "DDR5" as const, modulesPerChannel: 2 as const, rank: 2 as const, mts: 3600 },
  ];
  it("safe", () => expect(status({ ram: ram({ speedMts: 5600 }), cpu: cpu({ officialMemorySpeedMts: { DDR5: 5600 } }) }, "R26")).toBe("safe"));
  it("info：需 XMP/EXPO", () =>
    expect(status({ ram: ram({ speedMts: 6000, requiresXmpExpo: true }), cpu: cpu({ officialMemorySpeedMts: { DDR5: 5600 } }) }, "R26")).toBe("info"));
  it("有速度表時依條數與 rank 查表（4 條 2R → 3600）", () => {
    const r = run({ ram: ram({ moduleCount: 4, rank: 2, speedMts: 5600 }), cpu: cpu({ officialMemorySpeedMts: { DDR5: 5600 }, memorySpeedTable: table }) }, "R26");
    expect(r?.status).toBe("info");
    expect(r?.limitValue).toBe(3600);
  });
  it("unknown", () => expect(status({ ram: ram(), cpu: cpu() }, "R26")).toBe("unknown"));
});

describe("R27 BIOS", () => {
  it("safe：原生支援", () => expect(status({ cpu: cpu(), motherboard: mb({ chipset: "B850" }) }, "R27")).toBe("safe"));
  it("warning：晶片組層級需更新 BIOS，訊息依 Flashback 不同，附 CPU 支援清單連結", () => {
    const a = run({ cpu: cpu(), motherboard: mb({ biosFlashback: true, cpuSupportListUrl: "https://x.test/list" }) }, "R27");
    const b = run({ cpu: cpu(), motherboard: mb({ biosFlashback: false }) }, "R27");
    expect(a?.status).toBe("warning");
    expect(a?.message).not.toBe(b?.message);
    expect(a?.link?.url).toBe("https://x.test/list");
  });
  it("主機板層級優先：清單寫最低 BIOS → warning 並列出版本", () => {
    const r = run({ cpu: cpu(), motherboard: mb({ id: "mb-list", chipset: "B850" }) }, "R27"); // 晶片組層級是 native，仍以主機板清單為準
    expect(r?.status).toBe("warning");
    expect(r?.conditions?.[0]).toContain("2613");
    expect(r?.link?.url).toBe("https://x.test/mb");
  });
  it("主機板層級優先：清單寫 all → safe（即使晶片組層級需更新）", () =>
    expect(status({ cpu: cpu(), motherboard: mb({ id: "mb-native", chipset: "B650" }) }, "R27")).toBe("safe"));
  it("bootableSinceBios 比 minBios 舊時補充「可在該版開機」；相同時不補充", () => {
    expect(run({ cpu: cpu(), motherboard: mb({ id: "mb-boot" }) }, "R27")?.conditions?.join("")).toContain("可在 BIOS 3.12 開機");
    expect(run({ cpu: cpu(), motherboard: mb({ id: "mb-boot-same" }) }, "R27")?.conditions?.join("")).not.toContain("開機");
  });
  it("incompatible：晶片組層級 unsupported", () => expect(status({ cpu: cpu(), motherboard: mb({ chipset: "A520" }) }, "R27")).toBe("incompatible"));
  it("incompatible：晶片組不在 CPU 官方支援晶片組清單內", () =>
    expect(status({ cpu: cpu({ supportedChipsets: ["B650", "X670"] }), motherboard: mb({ chipset: "B850" }) }, "R27")).toBe("incompatible"));
  it("unknown：表中沒有", () => expect(status({ cpu: cpu({ generation: "amd-ryzen-8000" }), motherboard: mb() }, "R27")).toBe("unknown"));
});

describe("R28 影像輸出", () => {
  it("safe：有內顯與輸出", () => expect(status({ cpu: cpu({ hasIntegratedGraphics: true }), motherboard: mb({ hasVideoOutput: true }) }, "R28")).toBe("safe"));
  it("incompatible：無內顯且沒選顯卡", () => expect(status({ cpu: cpu({ hasIntegratedGraphics: false }) }, "R28")).toBe("incompatible"));
  it("unknown", () => expect(status({ cpu: cpu() }, "R28")).toBe("unknown"));
});

describe("R29 顯卡 PCIe", () => {
  const slot = { label: "X16_1", gen: 5 as const, electricalLanes: 16 as const, laneSource: "cpu" as const };
  it("safe", () => expect(status({ gpu: gpu(), motherboard: mb({ pcieX16Slots: [slot] }), cpu: cpu({ pcieGen: { gpu: 5 } }) }, "R29")).toBe("safe"));
  it("info：槽位世代較低", () => expect(status({ gpu: gpu(), motherboard: mb({ pcieX16Slots: [{ ...slot, gen: 4 }] }) }, "R29")).toBe("info"));
  it("info：CPU 世代觸發共用通道", () => {
    const board = mb({
      pcieX16Slots: [slot],
      laneSharing: [
        { when: { kind: "cpuGeneration", generations: ["amd-ryzen-8000"] }, affects: { kind: "pcieSlot", label: "X16_1" }, effect: { kind: "downgraded", gen: 4, lanes: 8 } },
      ],
    });
    expect(status({ gpu: gpu(), motherboard: board, cpu: cpu({ generation: "amd-ryzen-8000", pcieGen: { gpu: 5 } }) }, "R29")).toBe("info");
  });
  it("info：M.2 佔用觸發降 x8（allOf）", () => {
    const board = mb({
      pcieX16Slots: [slot],
      m2Slots: [
        { label: "M2_1", pcieGen: 5, pcieLanes: 4, formFactors: ["2280"] },
        { label: "M2_2", pcieGen: 5, pcieLanes: 4, formFactors: ["2280"] },
      ],
      laneSharing: [
        { when: { kind: "allOf", slots: [{ kind: "m2Slot", label: "M2_1" }, { kind: "m2Slot", label: "M2_2" }] }, affects: { kind: "pcieSlot", label: "X16_1" }, effect: { kind: "reducedLanes", lanes: 8 } },
      ],
    });
    const pcie16 = gpu({ pcieLanes: 16 });
    const c = cpu({ pcieGen: { gpu: 5 } });
    expect(status({ gpu: pcie16, motherboard: board, cpu: c, m2Ssds: [ssd()] }, "R29")).toBe("safe");
    expect(status({ gpu: pcie16, motherboard: board, cpu: c, m2Ssds: [ssd(), ssd({ id: "ssd2" })] }, "R29")).toBe("info");
  });
  it("unknown", () => expect(status({ gpu: gpu(), motherboard: mb() }, "R29")).toBe("unknown"));
});

describe("R30–R32 M.2", () => {
  const slots = [
    { label: "M2_1", pcieGen: 4 as const, pcieLanes: 4 as const, formFactors: ["2280" as const], supportsSata: false },
    { label: "M2_2", pcieGen: 4 as const, pcieLanes: 4 as const, formFactors: ["2280" as const, "22110" as const], supportsSata: true },
  ];
  const board = mb({ m2Slots: slots });
  it("safe", () => {
    const rep = evaluateReport(sel({ motherboard: board, m2Ssds: [ssd()] }), REFS).results;
    expect(rep.filter((r) => ["R30", "R31", "R32"].includes(r.ruleId)).map((r) => r.status)).toEqual(["safe", "safe", "safe"]);
  });
  it("R30 info：Gen5 SSD 插 Gen4 槽", () =>
    expect(status({ motherboard: board, m2Ssds: [ssd({ interface: { kind: "pcie", modes: [{ gen: 5, lanes: 4 }] } })] }, "R30")).toBe("info"));
  it("R30 incompatible：SATA SSD 沒有支援 SATA 的槽", () =>
    expect(status({ motherboard: mb({ m2Slots: [slots[0]] }), m2Ssds: [ssd({ interface: { kind: "sata" } })] }, "R30")).toBe("incompatible"));
  it("R31 incompatible：尺寸不支援", () => expect(status({ motherboard: mb({ m2Slots: [slots[0]] }), m2Ssds: [ssd({ formFactor: "22110" })] }, "R31")).toBe("incompatible"));
  it("R32 incompatible：數量超過", () =>
    expect(status({ motherboard: board, m2Ssds: [ssd(), ssd({ id: "b" }), ssd({ id: "c" })] }, "R32")).toBe("incompatible"));
  it("R32：CPU 世代停用槽位", () => {
    const b = mb({ m2Slots: slots, laneSharing: [{ when: { kind: "cpuGeneration", generations: ["amd-ryzen-8000"] }, affects: { kind: "m2Slot", label: "M2_2" }, effect: { kind: "disabled" } }] });
    expect(status({ motherboard: b, cpu: cpu({ generation: "amd-ryzen-8000" }), m2Ssds: [ssd(), ssd({ id: "b" })] }, "R32")).toBe("incompatible");
  });
  it("unknown：主機板 M.2 資料缺值", () => {
    const rep = evaluateReport(sel({ motherboard: mb(), m2Ssds: [ssd()] }), REFS).results;
    expect(rep.filter((r) => ["R30", "R31", "R32"].includes(r.ruleId)).map((r) => r.status)).toEqual(["unknown", "unknown", "unknown"]);
  });
  it("R31 unknown：槽位尺寸缺值", () => expect(status({ motherboard: mb({ m2Slots: [{ label: "M2_1", pcieGen: 4 }] }), m2Ssds: [ssd()] }, "R31")).toBe("unknown"));
});

describe("R33 供電接頭", () => {
  it("safe", () => expect(status({ gpu: gpu({ powerConnectors: [{ type: "12V-2x6", count: 1 }] }), psu: psu({ native16PinCount: 1 }) }, "R33")).toBe("safe"));
  it("warning：需轉接線", () => expect(status({ gpu: gpu({ powerConnectors: [{ type: "16-pin", count: 1 }] }), psu: psu({ native16PinCount: 0 }) }, "R33")).toBe("warning"));
  it("incompatible：8-pin 不足", () => expect(status({ gpu: gpu({ powerConnectors: [{ type: "8-pin", count: 3 }] }), psu: psu({ pcie8PinCount: 2 }) }, "R33")).toBe("incompatible"));
  it("unknown", () => expect(status({ gpu: gpu({ powerConnectors: [{ type: "8-pin", count: 1 }] }), psu: psu() }, "R33")).toBe("unknown"));
});

describe("報告", () => {
  it("沒有任何 tight 結果；尚未檢查的項目固定列出", () => {
    const rep = evaluateReport(sel({ case: pcCase(), gpu: gpu({ lengthMm: 395 }) }), REFS);
    expect(rep.results.some((r) => r.status === "tight")).toBe(false);
    for (const id of UNCHECKED_RULES) expect(rep.unchecked.some((u) => u.ruleId === id)).toBe(true);
    expect(UNCHECKED_RULES).toEqual(expect.arrayContaining(["R07", "R09", "R11", "R12", "R13"]));
  });
  it("沒選零件時沒有結果", () => expect(evaluateReport(sel({}), REFS).results).toEqual([]));
});
