// 相容性判斷（Phase 3 重寫，依 docs/compatibility-spec.md）
// 本工具為「參考級」：只用官方數值判斷，沒有可靠依據的規則不產生結果，改列「尚未檢查的項目」。
//
// 狀態判定原則：
//   incompatible = 官方數值明確顯示裝不下 / 插不上
//   safe         = 官方數值明確顯示裝得下（附「餘裕」）
//   warning      = 有明確官方依據的風險（需更新 BIOS、需轉接線、電源低於官方建議）
//   info         = 能用但降速，或官方另有條件
//   unknown      = 需要的資料缺值、或只選了一側零件
//   tight        = 本輪不使用（門檻沒有可靠依據）

import type {
  BuildSelection,
  CompatibilityReportData,
  CompatibilityResult,
  CompatibilityStatus,
  CpuPart,
  GpuPart,
  M2SsdPart,
  MotherboardPart,
  UncheckedItem,
} from "@/types/parts";
import type { ConditionalMm, PcieGen } from "@/lib/schema/common";
import type { BiosSupportEntry } from "@/lib/schema/biosSupport";
import type { GpuChip } from "@/lib/schema/gpuChips";
import { biosSupportEntries, gpuChips } from "@/lib/data/catalog";
import { defaultEntry, otherConditions } from "@/lib/data/conditional";
import { MSG } from "./messages";
import { coolerHeightLimitMm, gpuLengthLimit } from "./limits";
import { RULES, UNCHECKED_RULES, type RuleId } from "./rules";

/** 規則用到的參考表（測試可注入） */
export interface RuleRefs {
  bios: readonly BiosSupportEntry[];
  gpuChips: ReadonlyMap<string, GpuChip>;
}

const DEFAULT_REFS: RuleRefs = { bios: biosSupportEntries, gpuChips };

type RuleOutput = CompatibilityResult | UncheckedItem | null;

// ---------- 共用 ----------

function result(
  ruleId: RuleId,
  status: CompatibilityStatus,
  message: string,
  extra: Partial<CompatibilityResult> = {}
): CompatibilityResult {
  const r: CompatibilityResult = { ruleId, status, message, ...extra };
  if (r.conditions && r.conditions.length === 0) delete r.conditions;
  return r;
}

function unknown(ruleId: RuleId, message: string): CompatibilityResult {
  return result(ruleId, "unknown", message, { suggestion: MSG.common.missingSpecSuggestion });
}

function needPart(ruleId: RuleId, what: string): CompatibilityResult {
  return result(ruleId, "unknown", MSG.common.needPart(what));
}

/** 有條件時 safe → info（官方另有條件） */
function withConditions(status: CompatibilityStatus, conditions: string[]): CompatibilityStatus {
  return status === "safe" && conditions.length > 0 ? "info" : status;
}

/** 長度型比較：measured ≤ limit → safe（有條件則 info），否則 incompatible */
function fit(
  ruleId: RuleId,
  label: string,
  measured: number,
  limit: number,
  limitLabel: string,
  conditions: string[],
  incompatibleSuggestion?: string
): CompatibilityResult {
  const over = measured > limit;
  return result(
    ruleId,
    over ? "incompatible" : withConditions("safe", conditions),
    MSG.common.fit(label, measured, limit, limitLabel),
    {
      measuredValue: measured,
      limitValue: limit,
      remainingValue: Math.round((limit - measured) * 10) / 10,
      suggestion: over ? incompatibleSuggestion : undefined,
      conditions,
    }
  );
}

function conditionalTexts(list: ConditionalMm | undefined): string[] {
  return otherConditions(list).map((c) => MSG.common.otherCondition(c.mm, c.condition));
}

function chipOf(gpu: GpuPart, refs: RuleRefs): GpuChip | undefined {
  return refs.gpuChips.get(gpu.gpuChip);
}

/** 顯卡使用的 16-pin 接頭類型（12VHPWR / 12V-2x6 / 未區分的 16-pin），沒有則為 undefined */
export function gpuHighPowerConnector(gpu: GpuPart): string | undefined {
  return gpu.powerConnectors?.find((c) => c.type === "12VHPWR" || c.type === "12V-2x6" || c.type === "16-pin")
    ?.type;
}

const minGen = (...gens: (number | undefined)[]) =>
  Math.min(...gens.filter((g): g is number => g !== undefined));

// ---------- 空間規則 ----------

function r01(s: BuildSelection): RuleOutput {
  const { case: c, motherboard: mb } = s;
  if (!c && !mb) return null;
  if (!c) return needPart("R01", "機殼");
  if (!mb) return needPart("R01", "主機板");
  if (!c.supportedFormFactors.includes(mb.formFactor)) {
    return result("R01", "incompatible", MSG.R01.unsupported(mb.formFactor, c.supportedFormFactors), {
      suggestion: MSG.R01.unsupportedSuggestion,
    });
  }
  const depth = mb.dimensions.depthMm;
  const limit = c.maxMotherboardDepthMm;
  if (mb.formFactor === "E-ATX" && depth !== undefined && limit !== undefined) {
    return depth > limit
      ? result("R01", "incompatible", MSG.R01.depthOver(depth, limit), {
          measuredValue: depth,
          limitValue: limit,
          remainingValue: limit - depth,
          suggestion: MSG.R01.unsupportedSuggestion,
        })
      : result("R01", "safe", MSG.R01.depthFit(mb.formFactor, depth, limit), {
          measuredValue: depth,
          limitValue: limit,
          remainingValue: limit - depth,
        });
  }
  return result("R01", "safe", MSG.R01.supported(mb.formFactor));
}

function r02(s: BuildSelection): RuleOutput {
  const { case: c, gpu, overrides } = s;
  if (!c && !gpu) return null;
  if (!c) return needPart("R02", "機殼");
  if (!gpu) return needPart("R02", "顯示卡");

  const length = overrides.gpuLengthMm ?? gpu.lengthMm;
  if (length === undefined) return unknown("R02", MSG.common.missingSpec("顯卡長度"));
  const lim = gpuLengthLimit(s)!;
  if (lim.mm === undefined) return unknown("R02", lim.missingMsg);
  return fit("R02", MSG.R02.labelGpu, length, lim.mm, lim.label, lim.conditions, MSG.R02.incompatibleSuggestion);
}

function r03(s: BuildSelection): RuleOutput {
  const { case: c, gpu } = s;
  if (!c || !gpu) return null;
  const conditions: string[] = [];
  if (c.gpuMountOrientation === "vertical") conditions.push(MSG.R03.verticalOnly);

  const slots = gpu.slotWidth;
  if (slots === undefined) return unknown("R03", MSG.R03.missing);

  if (c.maxGpuSlotWidth !== undefined) {
    const limit = c.maxGpuSlotWidth;
    return slots > limit
      ? result("R03", "incompatible", MSG.R03.overSlotLimit(slots, limit), {
          measuredValue: slots,
          limitValue: limit,
          conditions,
        })
      : result("R03", withConditions("safe", conditions), MSG.R03.fitSlotLimit(slots, limit), {
          measuredValue: slots,
          limitValue: limit,
          remainingValue: Math.round((limit - slots) * 100) / 100,
          conditions,
        });
  }
  if (c.expansionSlots !== undefined && Math.ceil(slots) > c.expansionSlots) {
    return result("R03", "incompatible", MSG.R03.overExpansion(Math.ceil(slots), c.expansionSlots), { conditions });
  }
  if (conditions.length) return result("R03", "info", conditions.join(" "), { conditions: [] });
  return c.expansionSlots === undefined ? unknown("R03", MSG.R03.missing) : { ruleId: "R03", reason: MSG.R03.noBasis };
}

function r04(s: BuildSelection): RuleOutput {
  const { case: c, gpu } = s;
  if (!c || !gpu) return null;
  const entry = defaultEntry(c.gpuHeightLimits);
  if (gpu.heightMm === undefined) return unknown("R04", MSG.common.missingSpec("顯卡高度"));
  if (!entry) return unknown("R04", MSG.common.missingSpec("機殼的顯卡高度上限"));
  const others = conditionalTexts(c.gpuHeightLimits);
  const conditions = others.length ? [`預設條件：${entry.condition}`, ...others] : [];
  return fit("R04", MSG.R04.label, gpu.heightMm, entry.mm, MSG.R04.limitLabel, conditions);
}

function r05(s: BuildSelection): RuleOutput {
  const { case: c, cooler, overrides } = s;
  if (!c) return null;
  if (cooler.kind === "none") return needPart("R05", "CPU 散熱器");
  if (cooler.kind !== "air") return null;
  const height = overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm;
  const entry = defaultEntry(c.cpuCoolerHeightLimits);
  const limit = coolerHeightLimitMm(s);
  if (height === undefined) return unknown("R05", MSG.common.missingSpec("散熱器高度"));
  if (limit === undefined) return unknown("R05", MSG.common.missingSpec("機殼的散熱器高度上限"));
  const others = overrides.caseMaxCpuCoolerHeightMm !== undefined ? [] : conditionalTexts(c.cpuCoolerHeightLimits);
  const conditions = others.length && entry ? [`預設條件：${entry.condition}`, ...others] : others;
  return fit("R05", MSG.R05.label, height, limit, MSG.R05.limitLabel, conditions, MSG.R05.incompatibleSuggestion);
}

function r06(s: BuildSelection): RuleOutput {
  const { ram, cooler } = s;
  if (!ram || cooler.kind !== "air") return null;
  const limit = cooler.cooler.ramClearance?.defaultMm;
  if (ram.moduleHeightMm === undefined) return unknown("R06", MSG.common.missingSpec("記憶體高度"));
  if (limit === undefined) return unknown("R06", MSG.common.missingSpec("散熱器的 RAM 淨空"));
  return fit("R06", MSG.R06.label, ram.moduleHeightMm, limit, MSG.R06.limitLabel, [], MSG.R06.overSuggestion);
}

function r08(s: BuildSelection): RuleOutput {
  const { case: c, cooler } = s;
  if (!c || cooler.kind !== "aio") return null;
  const aio = cooler.cooler;
  const pos = MSG.R08.position[cooler.mountLocation];
  const mount = c.radiatorMounts[cooler.mountLocation];
  if (!mount) return unknown("R08", MSG.R08.positionUnknown(pos));
  const conditions = mount.conditionText ? [`官方條件：${mount.conditionText}`] : [];
  if (mount.sizes.length === 0)
    return result("R08", "incompatible", MSG.R08.noSupport(pos), { suggestion: MSG.R08.unsupportedSuggestion, conditions });
  if (!mount.sizes.includes(aio.radiatorSize))
    return result("R08", "incompatible", MSG.R08.sizeUnsupported(pos, mount.sizes, aio.radiatorSize), {
      suggestion: MSG.R08.unsupportedSuggestion,
      conditions,
    });

  const checks: { measured: number; limit: number; kind: string }[] = [];
  if (mount.maxTotalThicknessMm !== undefined && aio.radiatorThicknessMm !== undefined && aio.fanThicknessMm !== undefined)
    checks.push({ measured: aio.radiatorThicknessMm + aio.fanThicknessMm, limit: mount.maxTotalThicknessMm, kind: "排＋風扇厚度" });
  if (mount.maxRadiatorThicknessMm !== undefined && aio.radiatorThicknessMm !== undefined)
    checks.push({ measured: aio.radiatorThicknessMm, limit: mount.maxRadiatorThicknessMm, kind: "水冷排厚度" });
  if (checks.length === 0) return result("R08", "unknown", MSG.R08.noThicknessLimit(pos, aio.radiatorSize), { conditions });

  const over = checks.find((ck) => ck.measured > ck.limit);
  if (over)
    return result("R08", "incompatible", MSG.R08.thicknessOver(pos, over.measured, over.limit, over.kind), {
      measuredValue: over.measured,
      limitValue: over.limit,
      remainingValue: over.limit - over.measured,
      suggestion: MSG.R08.unsupportedSuggestion,
      conditions,
    });
  const tightest = checks.reduce((a, b) => (b.limit - b.measured < a.limit - a.measured ? b : a));
  return result(
    "R08",
    withConditions("safe", conditions),
    MSG.R08.thicknessFit(pos, aio.radiatorSize, tightest.measured, tightest.limit, tightest.kind),
    {
      measuredValue: tightest.measured,
      limitValue: tightest.limit,
      remainingValue: Math.round((tightest.limit - tightest.measured) * 10) / 10,
      conditions,
    }
  );
}

function r10(s: BuildSelection): RuleOutput {
  const { case: c, psu, overrides } = s;
  if (!c && !psu) return null;
  if (!c) return needPart("R10", "機殼");
  if (!psu) return needPart("R10", "電源供應器");
  const forms = c.psu.formFactors;
  const conditions = c.psu.conditionText ? [`官方條件：${c.psu.conditionText}`] : [];
  if (!forms) return unknown("R10", MSG.common.missingSpec("機殼支援的電源規格"));
  if (!forms.includes(psu.formFactor)) {
    if (psu.formFactor !== "ATX" && forms.includes("ATX") && !forms.includes("SFX") && !forms.includes("SFX-L"))
      return result("R10", "unknown", MSG.R10.sfxInAtx(psu.formFactor));
    return result("R10", "incompatible", MSG.R10.formUnsupported(psu.formFactor, forms), {
      suggestion: MSG.R10.incompatibleSuggestion,
    });
  }
  const length = overrides.psuLengthMm ?? psu.lengthMm;
  const entry = defaultEntry(c.psu.lengthLimits);
  if (length === undefined) return unknown("R10", MSG.common.missingSpec("電源長度"));
  if (!entry) return unknown("R10", MSG.common.missingSpec("機殼的電源長度上限"));
  const others = conditionalTexts(c.psu.lengthLimits);
  const all = [...(others.length ? [`預設條件：${entry.condition}`, ...others] : []), ...conditions];
  return fit("R10", MSG.R10.label, length, entry.mm, MSG.R10.limitLabel, all, MSG.R10.incompatibleSuggestion);
}

// ---------- 平台規則 ----------

function r14(s: BuildSelection): RuleOutput {
  const { cooler, motherboard: mb, cpu } = s;
  if (cooler.kind === "none") return null;
  const socket = mb?.socket ?? cpu?.socket;
  if (!socket) return null;
  const list = cooler.cooler.supportedSockets;
  if (!list) return unknown("R14", MSG.common.missingSpec("散熱器支援腳位"));
  return list.includes(socket)
    ? result("R14", "safe", MSG.R14.supported(socket))
    : result("R14", "incompatible", MSG.R14.unsupported(socket, list), { suggestion: MSG.R14.unsupportedSuggestion });
}

function r15(s: BuildSelection, refs: RuleRefs): RuleOutput {
  const { psu, gpu } = s;
  if (!psu || !gpu) return null;
  const chip = chipOf(gpu, refs);
  const fromBoard = gpu.recommendedPsuW;
  const need = fromBoard ?? chip?.recommendedPsuW;
  if (need === undefined) return unknown("R15", MSG.common.missingSpec("顯卡建議電源瓦數"));
  const source = fromBoard !== undefined ? MSG.R15.sourceBoard : MSG.R15.sourceChip;
  const conditions = fromBoard === undefined && chip?.psuWording ? [`晶片官方用詞：${chip.psuWording}`] : [];
  return psu.wattage < need
    ? result("R15", "warning", `${MSG.R15.under(psu.wattage, need, source)}${MSG.R15.note}`, {
        measuredValue: need,
        limitValue: psu.wattage,
        remainingValue: psu.wattage - need,
        suggestion: MSG.R15.underSuggestion,
        conditions,
      })
    : result("R15", withConditions("safe", conditions), `${MSG.R15.ok(psu.wattage, need, source)}。${MSG.R15.note}`, {
        measuredValue: need,
        limitValue: psu.wattage,
        remainingValue: psu.wattage - need,
        conditions,
      });
}

function r22(s: BuildSelection): RuleOutput {
  const { cpu, motherboard: mb } = s;
  if (!cpu || !mb) return null;
  return cpu.socket === mb.socket
    ? result("R22", "safe", MSG.R22.match(cpu.socket))
    : result("R22", "incompatible", MSG.R22.mismatch(cpu.socket, mb.socket));
}

function r23(s: BuildSelection): RuleOutput {
  const { ram, motherboard: mb, cpu } = s;
  if (!ram || !mb) return null;
  if (!mb.memoryType) return unknown("R23", MSG.common.missingSpec("主機板記憶體類型"));
  if (ram.memoryType !== mb.memoryType) return result("R23", "incompatible", MSG.R23.ramMismatch(ram.memoryType, mb.memoryType));
  if (cpu) {
    if (!cpu.memoryTypes) return result("R23", "info", MSG.R23.ok(mb.memoryType), { conditions: [MSG.R23.cpuUnknown] });
    if (!cpu.memoryTypes.includes(mb.memoryType))
      return result("R23", "incompatible", MSG.R23.cpuMismatch(mb.memoryType, cpu.memoryTypes));
  }
  return result("R23", "safe", MSG.R23.ok(mb.memoryType));
}

function r24(s: BuildSelection): RuleOutput {
  const { ram, motherboard: mb } = s;
  if (!ram || !mb) return null;
  if (mb.memorySlots === undefined) return unknown("R24", MSG.common.missingSpec("主機板記憶體插槽數"));
  return ram.moduleCount > mb.memorySlots
    ? result("R24", "incompatible", MSG.R24.over(ram.moduleCount, mb.memorySlots))
    : result("R24", "safe", MSG.R24.ok(ram.moduleCount, mb.memorySlots), {
        remainingValue: mb.memorySlots - ram.moduleCount,
      });
}

function r25(s: BuildSelection): RuleOutput {
  const { ram, motherboard: mb, cpu } = s;
  if (!ram || (!mb && !cpu)) return null;
  const total = ram.moduleCapacityGb * ram.moduleCount;
  const limits = [
    { who: "主機板", v: mb?.maxMemoryCapacityGb },
    { who: "CPU ", v: cpu?.maxMemoryCapacityGb },
  ].filter((l): l is { who: string; v: number } => l.v !== undefined);
  const over = limits.find((l) => total > l.v);
  if (over) return result("R25", "incompatible", MSG.R25.over(total, over.v, over.who));
  if (mb && mb.maxMemoryCapacityGb === undefined)
    return unknown("R25", MSG.common.missingSpec("主機板記憶體容量上限"));
  if (limits.length === 0) return unknown("R25", MSG.common.missingSpec("記憶體容量上限"));
  const strictest = limits.reduce((a, b) => (b.v < a.v ? b : a));
  return result("R25", "safe", MSG.R25.ok(total, strictest.v, strictest.who), {
    measuredValue: total,
    limitValue: strictest.v,
    remainingValue: strictest.v - total,
  });
}

function r26(s: BuildSelection): RuleOutput {
  const { ram, cpu, motherboard: mb } = s;
  if (!ram || !cpu) return null;
  const conditions: string[] = [];
  let cpuLimit: number | undefined;
  let basis: string = MSG.R26.maxBasis;

  const perChannel = ram.moduleCount <= 2 ? 1 : 2;
  if (cpu.memorySpeedTable?.length) {
    if (ram.rank === undefined) {
      conditions.push(MSG.R26.rankUnknown);
    } else {
      const row = cpu.memorySpeedTable.find(
        (t) => t.memoryType === ram.memoryType && t.modulesPerChannel === perChannel && t.rank === ram.rank
      );
      if (row && ram.moduleCount <= 4) {
        cpuLimit = row.mts;
        basis = MSG.R26.tableBasis(perChannel, ram.rank);
      }
    }
  }
  cpuLimit ??= cpu.officialMemorySpeedMts?.[ram.memoryType];
  if (cpuLimit === undefined) return unknown("R26", MSG.common.missingSpec("CPU 支援的記憶體速度"));

  const notes: string[] = [];
  if (ram.speedMts > cpuLimit) notes.push(MSG.R26.overCpu(ram.speedMts, cpuLimit, basis));
  if (mb?.maxMemorySpeedMts !== undefined && ram.speedMts > mb.maxMemorySpeedMts)
    notes.push(MSG.R26.overMb(ram.speedMts, mb.maxMemorySpeedMts));
  if (notes.length === 0 && ram.requiresXmpExpo) notes.push(MSG.R26.needProfile);

  if (notes.length) return result("R26", "info", notes.join(" "), { conditions, measuredValue: ram.speedMts, limitValue: cpuLimit });
  return result("R26", withConditions("safe", conditions), MSG.R26.ok(ram.speedMts, cpuLimit), {
    conditions,
    measuredValue: ram.speedMts,
    limitValue: cpuLimit,
  });
}

function r27(s: BuildSelection, refs: RuleRefs): RuleOutput {
  const { cpu, motherboard: mb } = s;
  if (!cpu || !mb) return null;
  if (cpu.socket !== mb.socket) return null; // 腳位不同已由 R22 判定
  const entry = refs.bios.find((e) => e.chipset === mb.chipset && e.cpuGeneration === cpu.generation);
  const link = mb.cpuSupportListUrl ? { label: MSG.R27.linkLabel, url: mb.cpuSupportListUrl } : undefined;
  if (!entry) return result("R27", "unknown", MSG.R27.notInTable, { link });
  const conditions = entry.minBiosNote ? [`官方說明：${entry.minBiosNote}`] : [];
  const override = entry.boardOverrides?.[mb.id];
  if (override) conditions.unshift(MSG.R27.minBios(override.minBios));
  const boardLink = link ?? (override ? { label: MSG.R27.linkLabel, url: override.sourceUrl } : undefined);

  switch (entry.support) {
    case "native":
      return result("R27", withConditions("safe", conditions), MSG.R27.native(mb.chipset), {
        conditions,
        link: boardLink,
      });
    case "unsupported":
      return result("R27", "incompatible", MSG.R27.unsupported(mb.chipset), { conditions, link: boardLink });
    case "biosUpdate": {
      const msg =
        mb.biosFlashback === true
          ? MSG.R27.updateFlashback(mb.chipset)
          : mb.biosFlashback === false
          ? MSG.R27.updateNoFlashback(mb.chipset)
          : MSG.R27.updateFlashbackUnknown(mb.chipset);
      return result("R27", "warning", msg, { conditions, link: boardLink });
    }
  }
}

function r28(s: BuildSelection): RuleOutput {
  const { cpu, motherboard: mb, gpu } = s;
  if (!cpu) return null;
  if (gpu) return result("R28", "safe", MSG.R28.hasGpu);
  if (cpu.hasIntegratedGraphics === false)
    return result("R28", "incompatible", MSG.R28.noOutput, { suggestion: MSG.R28.suggestion });
  if (cpu.hasIntegratedGraphics === undefined) return unknown("R28", MSG.common.missingSpec("CPU 是否有內建顯示"));
  if (!mb) return null;
  if (mb.hasVideoOutput === false)
    return result("R28", "incompatible", MSG.R28.noBoardOutput, { suggestion: MSG.R28.suggestion });
  if (mb.hasVideoOutput === undefined) return unknown("R28", MSG.common.missingSpec("主機板影像輸出"));
  return result("R28", "safe", MSG.R28.ok);
}

// ---------- M.2 分配（R29–R32 共用） ----------

type Sharing = NonNullable<MotherboardPart["laneSharing"]>[number];

function cpuTriggered(rule: Sharing, cpu: CpuPart | undefined): boolean {
  return rule.when.kind === "cpuGeneration" && cpu !== undefined && rule.when.generations.includes(cpu.generation);
}

function occupiedTriggered(rule: Sharing, occupied: ReadonlySet<string>): boolean {
  const w = rule.when;
  if (w.kind === "m2Slot") return occupied.has(w.label);
  if (w.kind === "allOf") return w.slots.every((ref) => ref.kind === "m2Slot" && occupied.has(ref.label));
  return false;
}

interface EffSlot {
  label: string;
  gen: PcieGen | null | undefined;
  lanes: number | undefined;
  supportsSata: boolean | undefined;
  formFactors: string[] | undefined;
}

/** 依 CPU 世代套用共用通道後，主機板目前可用的 M.2 槽 */
function availableM2Slots(mb: MotherboardPart, cpu: CpuPart | undefined) {
  const disabled: string[] = [];
  const slots: EffSlot[] = [];
  (mb.m2Slots ?? []).forEach((slot, i) => {
    const label = slot.label ?? `M.2 #${i + 1}`;
    let gen = slot.pcieGen;
    let lanes: number | undefined = slot.pcieLanes;
    let off = false;
    for (const rule of mb.laneSharing ?? []) {
      if (rule.affects.kind !== "m2Slot" || rule.affects.label !== label || !cpuTriggered(rule, cpu)) continue;
      if (rule.effect.kind === "disabled") off = true;
      else if (rule.effect.kind === "reducedLanes") lanes = Math.min(lanes ?? 16, rule.effect.lanes);
      else {
        if (rule.effect.gen !== undefined && typeof gen === "number") gen = Math.min(gen, rule.effect.gen) as PcieGen;
        if (rule.effect.lanes !== undefined) lanes = Math.min(lanes ?? 16, rule.effect.lanes);
      }
    }
    // CPU 提供的 M.2 世代（官方有寫才套用）
    if (slot.laneSource === "cpu" && cpu?.pcieGen?.m2 !== undefined && typeof gen === "number")
      gen = Math.min(gen, cpu.pcieGen.m2) as PcieGen;
    if (off) disabled.push(label);
    else slots.push({ label, gen, lanes, supportsSata: slot.supportsSata, formFactors: slot.formFactors });
  });
  return { slots, disabled };
}

type Fit = "yes" | "no" | "unknown";

function interfaceFit(ssd: M2SsdPart, slot: EffSlot): Fit {
  if (ssd.interface.kind === "sata") return slot.supportsSata === true ? "yes" : slot.supportsSata === false ? "no" : "unknown";
  if (slot.gen === null) return "no";
  return slot.gen === undefined ? "unknown" : "yes";
}

function formFit(ssd: M2SsdPart, slot: EffSlot): Fit {
  if (!slot.formFactors) return "unknown";
  return slot.formFactors.includes(ssd.formFactor) ? "yes" : "no";
}

function ssdTopGen(ssd: M2SsdPart): number {
  return ssd.interface.kind === "pcie" ? Math.max(...ssd.interface.modes.map((m) => m.gen)) : 0;
}

/** SSD 在此槽是否能以完整速度運作（任一模式的世代與通道都不超過槽位） */
function fullSpeed(ssd: M2SsdPart, slot: EffSlot): boolean {
  if (ssd.interface.kind !== "pcie" || typeof slot.gen !== "number") return true;
  const gen = slot.gen;
  return ssd.interface.modes.some((m) => m.gen <= gen && (slot.lanes === undefined || m.lanes <= slot.lanes));
}

interface Assignment {
  pairs: { ssd: M2SsdPart; slot: EffSlot }[];
  unassigned: { ssd: M2SsdPart; reason: "form" | "interface" | "full" | "unknown" }[];
}

/** 貪婪分配：世代高的 SSD 先挑，挑世代最高、完整速度的槽 */
function assignSsds(ssds: M2SsdPart[], slots: EffSlot[]): Assignment {
  const free = [...slots];
  const out: Assignment = { pairs: [], unassigned: [] };
  [...ssds]
    .sort((a, b) => ssdTopGen(b) - ssdTopGen(a))
    .forEach((ssd) => {
      const ok = free.filter((sl) => formFit(ssd, sl) === "yes" && interfaceFit(ssd, sl) === "yes");
      if (ok.length) {
        ok.sort(
          (a, b) =>
            Number(fullSpeed(ssd, b)) - Number(fullSpeed(ssd, a)) ||
            (typeof b.gen === "number" ? b.gen : 0) - (typeof a.gen === "number" ? a.gen : 0)
        );
        // 完整速度的槽中挑世代最低的，保留高世代槽給後面的 SSD
        const full = ok.filter((sl) => fullSpeed(ssd, sl));
        const pick = full.length
          ? full.reduce((a, b) => ((typeof b.gen === "number" ? b.gen : 0) < (typeof a.gen === "number" ? a.gen : 0) ? b : a))
          : ok[0];
        free.splice(free.indexOf(pick), 1);
        out.pairs.push({ ssd, slot: pick });
        return;
      }
      if (free.length === 0) return out.unassigned.push({ ssd, reason: "full" });
      const anyUnknown = free.some((sl) => formFit(ssd, sl) !== "no" && interfaceFit(ssd, sl) !== "no");
      if (anyUnknown) return out.unassigned.push({ ssd, reason: "unknown" });
      const formOk = free.some((sl) => formFit(ssd, sl) === "yes");
      out.unassigned.push({ ssd, reason: formOk ? "interface" : "form" });
    });
  return out;
}

const ssdName = (ssd: M2SsdPart) => ssd.model;

function m2Rules(s: BuildSelection): RuleOutput[] {
  const { m2Ssds: ssds, motherboard: mb, cpu } = s;
  if (!mb || ssds.length === 0) return [];
  if (!mb.m2Slots) {
    const msg = MSG.common.missingSpec("主機板 M.2 槽");
    return [unknown("R30", msg), unknown("R31", msg), unknown("R32", msg)];
  }
  const { slots, disabled } = availableM2Slots(mb, cpu);
  const disabledNote = disabled.length ? [MSG.R32.disabledNote(disabled)] : [];

  const r32 =
    ssds.length > slots.length
      ? result("R32", "incompatible", MSG.R32.over(ssds.length, slots.length), { conditions: disabledNote })
      : result("R32", withConditions("safe", disabledNote), MSG.R32.ok(ssds.length, slots.length), {
          conditions: disabledNote,
          remainingValue: slots.length - ssds.length,
        });

  // R31：任何可用槽都不支援此尺寸
  const formFail = ssds.find((ssd) => slots.length > 0 && slots.every((sl) => formFit(ssd, sl) === "no"));
  const formUnknown = ssds.some((ssd) => slots.some((sl) => formFit(ssd, sl) === "unknown"));
  const r31 = formFail
    ? result("R31", "incompatible", MSG.R31.noSlot(ssdName(formFail), formFail.formFactor))
    : formUnknown && !ssds.every((ssd) => slots.some((sl) => formFit(ssd, sl) === "yes"))
    ? unknown("R31", MSG.common.missingSpec("M.2 槽支援的尺寸"))
    : result("R31", "safe", MSG.R31.ok);

  const a = assignSsds(ssds, slots);
  const pairs = a.pairs.map((p) => `${ssdName(p.ssd)} → ${p.slot.label}`);
  const badIface = a.unassigned.find((u) => u.reason === "interface");
  const unk = a.unassigned.find((u) => u.reason === "unknown");
  let r30: CompatibilityResult;
  if (badIface) r30 = result("R30", "incompatible", MSG.R30.noSlot(ssdName(badIface.ssd)));
  else if (unk) r30 = unknown("R30", MSG.common.missingSpec("M.2 槽支援的介面或尺寸"));
  else if (a.unassigned.length) r30 = result("R30", "unknown", MSG.R32.over(ssds.length, slots.length));
  else {
    const slow = a.pairs.filter((p) => !fullSpeed(p.ssd, p.slot));
    r30 = slow.length
      ? result(
          "R30",
          "info",
          slow.map((p) => MSG.R30.downgraded(ssdName(p.ssd), p.slot.label, ssdTopGen(p.ssd), Number(p.slot.gen))).join(" "),
          { conditions: [MSG.R30.assignment(pairs)] }
        )
      : result("R30", "safe", `${MSG.R30.ok(ssds.length)} ${MSG.R30.assignment(pairs)}`);
  }
  return [r30, r31, r32];
}

/** 已分配 SSD 的 M.2 槽 label（R29 計算共用通道用） */
function occupiedM2(s: BuildSelection): Set<string> {
  const { motherboard: mb, cpu, m2Ssds } = s;
  if (!mb?.m2Slots || m2Ssds.length === 0) return new Set();
  const { slots } = availableM2Slots(mb, cpu);
  return new Set(assignSsds(m2Ssds, slots).pairs.map((p) => p.slot.label));
}

function r29(s: BuildSelection, refs: RuleRefs): RuleOutput {
  const { gpu, motherboard: mb, cpu } = s;
  if (!gpu || !mb) return null;
  const slot = mb.pcieX16Slots?.[0];
  if (!slot || slot.gen === undefined) return unknown("R29", MSG.R29.noSlot);
  const chip = chipOf(gpu, refs);
  const cardGen = gpu.pcieGen ?? chip?.pcieGen;
  const cardLanes = gpu.pcieLanes ?? chip?.pcieLanes;
  if (cardGen === undefined) return unknown("R29", MSG.common.missingSpec("顯卡 PCIe 世代"));

  const conditions: string[] = [MSG.R29.assumeFirstSlot];
  const reasons: string[] = [];
  let gen: number = slot.gen;
  let lanes: number | undefined = slot.electricalLanes;
  if (gen < cardGen) reasons.push(MSG.R29.reasonSlot(gen));

  if (slot.laneSource === "cpu" && cpu) {
    const cg = cpu.pcieGen?.gpu;
    if (cg !== undefined && cg < gen) {
      gen = cg;
      if (cg < cardGen) reasons.push(MSG.R29.reasonCpu(cg));
    }
  }

  const occupied = occupiedM2(s);
  for (const rule of mb.laneSharing ?? []) {
    if (rule.affects.kind !== "pcieSlot" || rule.affects.label !== slot.label) continue;
    if (!cpuTriggered(rule, cpu) && !occupiedTriggered(rule, occupied)) continue;
    const e = rule.effect;
    const before = { gen, lanes };
    if (e.kind === "reducedLanes") lanes = Math.min(lanes ?? 16, e.lanes);
    else if (e.kind === "downgraded") {
      if (e.gen !== undefined) gen = Math.min(gen, e.gen);
      if (e.lanes !== undefined) lanes = Math.min(lanes ?? 16, e.lanes);
    }
    if (before.gen !== gen || before.lanes !== lanes) reasons.push(MSG.R29.reasonSharing(rule.sourceText ?? rule.affects.label));
  }

  const effLanes = lanes !== undefined && cardLanes !== undefined ? Math.min(lanes, cardLanes) : lanes ?? cardLanes;
  const lanesText = effLanes !== undefined ? `x${effLanes}` : "（通道數官方未公開）";
  if (lanes !== undefined && cardLanes !== undefined && lanes < cardLanes) {
    if (!reasons.some((r) => r.startsWith("共用通道"))) reasons.push(MSG.R29.reasonLanes(lanes, cardLanes));
  }
  if (slot.laneSource === "cpu" && cpu && cpu.pcieGen?.gpu === undefined)
    conditions.push("CPU 提供給顯卡的 PCIe 世代官方未分開列出，以主機板槽位規格判斷。");

  if (gen < cardGen || reasons.length)
    return result("R29", "info", MSG.R29.downgraded(cardGen, gen, lanesText, reasons), { conditions });
  return result("R29", withConditions("safe", conditions.slice(1)), MSG.R29.ok(gen, lanesText), { conditions });
}

function r33(s: BuildSelection): RuleOutput {
  const { gpu, psu } = s;
  if (!gpu || !psu) return null;
  const conns = gpu.powerConnectors;
  if (!conns) return unknown("R33", MSG.common.missingSpec("顯卡供電接頭"));
  const need16 = conns.filter((c) => c.type !== "8-pin" && c.type !== "6-pin").reduce((n, c) => n + c.count, 0);
  const need8 = conns.filter((c) => c.type === "8-pin").reduce((n, c) => n + c.count, 0);
  const conditions = conns.some((c) => c.type === "6-pin") ? [MSG.R33.sixPin] : [];
  const parts: { status: CompatibilityStatus; msg: string }[] = [];

  if (need16 > 0) {
    const have = psu.native16PinCount;
    if (have === undefined) return unknown("R33", MSG.common.missingSpec("電源原生 16-pin 接頭數"));
    if (have === 0) parts.push({ status: "warning", msg: MSG.R33.adapter16 });
    else if (have < need16) parts.push({ status: "warning", msg: MSG.R33.few16(need16, have) });
    else parts.push({ status: "safe", msg: MSG.R33.ok16(need16, have) });
  }
  if (need8 > 0) {
    const have = psu.pcie8PinCount;
    if (have === undefined) return unknown("R33", MSG.common.missingSpec("電源 PCIe 8-pin 接頭數"));
    parts.push(have < need8 ? { status: "incompatible", msg: MSG.R33.few8(need8, have) } : { status: "safe", msg: MSG.R33.ok8(need8, have) });
  }
  if (parts.length === 0) return result("R33", conditions.length ? "info" : "safe", conditions.join(""));
  const status = worst(parts.map((p) => p.status));
  return result("R33", withConditions(status, conditions), parts.map((p) => p.msg).join(" "), { conditions });
}

// ---------- 彙整 ----------

const SEVERITY: CompatibilityStatus[] = ["incompatible", "warning", "tight", "info", "safe"];

function worst(list: CompatibilityStatus[]): CompatibilityStatus {
  for (const s of SEVERITY) if (list.includes(s)) return s;
  return list.includes("unknown") ? "unknown" : "safe";
}

const RULE_ORDER = Object.keys(RULES) as RuleId[];

/** 依使用者選擇的零件與手動覆蓋值，產生完整報告（判斷結果 + 尚未檢查的項目） */
export function evaluateReport(selection: BuildSelection, refs: RuleRefs = DEFAULT_REFS): CompatibilityReportData {
  const outputs: RuleOutput[] = [
    r01(selection),
    r02(selection),
    r03(selection),
    r04(selection),
    r05(selection),
    r06(selection),
    r08(selection),
    r10(selection),
    r14(selection),
    r15(selection, refs),
    r22(selection),
    r23(selection),
    r24(selection),
    r25(selection),
    r26(selection),
    r27(selection, refs),
    r28(selection),
    r29(selection, refs),
    ...m2Rules(selection),
    r33(selection),
  ];
  const results: CompatibilityResult[] = [];
  const unchecked: UncheckedItem[] = [];
  for (const o of outputs) {
    if (!o) continue;
    if ("status" in o) results.push(o);
    else unchecked.push(o);
  }
  results.sort((a, b) => RULE_ORDER.indexOf(a.ruleId) - RULE_ORDER.indexOf(b.ruleId));
  for (const id of UNCHECKED_RULES) unchecked.push({ ruleId: id, reason: (RULES[id] as { uncheckedReason?: string }).uncheckedReason ?? "" });
  return { results, unchecked };
}

/** 只取判斷結果（2D / 3D 使用） */
export function evaluateBuild(selection: BuildSelection, refs: RuleRefs = DEFAULT_REFS): CompatibilityResult[] {
  return evaluateReport(selection, refs).results;
}

/** 走線建議：只保留不需要門檻的提醒 */
export function buildCablePlanningSuggestions(selection: BuildSelection, _results: CompatibilityResult[]): string[] {
  const suggestions: string[] = [];
  const connector = selection.gpu ? gpuHighPowerConnector(selection.gpu) : undefined;
  if (connector) suggestions.push(MSG.cablePlan.highPowerConnector(connector));
  if (selection.psu?.modularType === "non") suggestions.push(MSG.cablePlan.nonModularPsu);
  return suggestions;
}

/** 依 ruleId 取得檢查結果（2D / 3D / 報告共用） */
export function findResult(results: CompatibilityResult[], ruleId: RuleId): CompatibilityResult | undefined {
  return results.find((r) => r.ruleId === ruleId);
}

export function statusOf(results: CompatibilityResult[], ruleId: RuleId): CompatibilityStatus | undefined {
  return findResult(results, ruleId)?.status;
}
