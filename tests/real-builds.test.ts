// 真實資料組合測試：用 data/ 內的官方規格資料檢查規則結果。
import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/data/catalog";
import { evaluateReport } from "@/lib/compatibility";
import type { RuleId } from "@/lib/compatibility/rules";
import type { BuildSelection, CpuPart, PartByCategory, PartCategory } from "@/types/parts";

function part<C extends PartCategory>(category: C, id: string): PartByCategory[C] {
  const found = (catalog[category] as PartByCategory[C][]).find((p) => p.id === id);
  if (!found) throw new Error(`找不到 ${category}/${id}`);
  return found;
}
function report(o: Partial<BuildSelection>) {
  return evaluateReport({ cooler: { kind: "none" }, m2Ssds: [], overrides: {}, ...o });
}
function get(o: Partial<BuildSelection>, id: RuleId) {
  return report(o).results.find((r) => r.ruleId === id);
}

describe("真實資料組合", () => {
  it("TUF B650M-PLUS WIFI × Ryzen 9000 世代：需要更新 BIOS，附最低版本與官方 CPU 清單連結", () => {
    // AMD 官網對自動讀取逾時，Ryzen 5 9600X 本輪沒有收錄（docs/pending.md D-21）。
    // 這裡以「amd-ryzen-9000 世代、AM5」的最小 CPU 物件代替，主機板與 BIOS 規則表都是真實資料。
    const cpu9000: CpuPart = {
      id: "test-ryzen-9000",
      category: "cpu",
      brand: "AMD",
      model: "Ryzen 9000（測試用）",
      twName: "Ryzen 9000（測試用）",
      sourceUrl: null,
      specVerifiedAt: null,
      socket: "AM5",
      generation: "amd-ryzen-9000",
    };
    const r = get({ cpu: cpu9000, motherboard: part("motherboard", "asus-tuf-gaming-b650m-plus-wifi") }, "R27");
    expect(r?.status).toBe("warning");
    expect(r?.message).toContain("Flashback");
    expect(r?.conditions?.[0]).toContain("2613");
    expect(r?.link?.url).toContain("helpdesk_cpu");
  });

  it("i5-14400F 沒選顯卡：沒有影像輸出", () => {
    const r = get({ cpu: part("cpu", "intel-core-i5-14400f"), motherboard: part("motherboard", "asus-tuf-gaming-b760m-plus-wifi") }, "R28");
    expect(r?.status).toBe("incompatible");
  });

  it("i5-14400F × B760：Intel 官方通則需要更新 BIOS", () => {
    const r = get({ cpu: part("cpu", "intel-core-i5-14400f"), motherboard: part("motherboard", "asus-tuf-gaming-b760m-plus-wifi") }, "R27");
    expect(r?.status).toBe("warning");
  });

  it("DDR4 記憶體配 DDR5 主機板：不相容", () => {
    const r = get(
      { ram: part("ram", "kingston-fury-beast-kf432c16bbk2-16"), motherboard: part("motherboard", "asus-tuf-gaming-b760m-plus-wifi") },
      "R23"
    );
    expect(r?.status).toBe("incompatible");
    const ok = get(
      { ram: part("ram", "kingston-fury-beast-kf432c16bbk2-16"), motherboard: part("motherboard", "asus-tuf-gaming-b760m-plus-wifi-d4") },
      "R23"
    );
    expect(ok?.status).not.toBe("incompatible");
  });

  it("ROG Astral 5090 × Fractal North：前置內附風扇時官方上限 355 mm，357.6 mm 裝不下", () => {
    const r = get({ case: part("case", "fractal-design-north"), gpu: part("gpu", "asus-rog-astral-rtx-5090-oc") }, "R02");
    expect(r?.status).toBe("incompatible");
    expect(r?.limitValue).toBe(355);
  });

  it("ROG Astral 5090 × O11 VISION COMPACT：官方只給 408 mm 未註明條件 → Info，附餘裕", () => {
    const r = get({ case: part("case", "lian-li-o11-vision-compact"), gpu: part("gpu", "asus-rog-astral-rtx-5090-oc") }, "R02");
    expect(r?.status).toBe("info");
    expect(r?.remainingValue).toBeCloseTo(50.4, 1);
  });

  it("ROG Astral 5090 × 前置 360 水冷的 North：用官方 300 mm 條件，不再扣厚度", () => {
    const r = get(
      {
        case: part("case", "fractal-design-north"),
        gpu: part("gpu", "asus-rog-astral-rtx-5090-oc"),
        cooler: { kind: "aio", cooler: part("aio", "arctic-liquid-freezer-iii-pro-360"), mountLocation: "front" },
      },
      "R02"
    );
    expect(r?.status).toBe("incompatible");
    expect(r?.limitValue).toBe(300);
  });

  it("SFX 電源配 ITX 機殼：Terra 官方上限 130 mm → 裝得下；ATX 電源 → 不相容", () => {
    const terra = part("case", "fractal-design-terra");
    const sfx = get({ case: terra, psu: part("psu", "fsp-dagger-pro-atx31-850w") }, "R10");
    expect(sfx?.status).toBe("safe");
    expect(sfx?.remainingValue).toBe(30);
    const atx = get({ case: terra, psu: part("psu", "cooler-master-mwe-gold-850-v4") }, "R10");
    expect(atx?.status).toBe("incompatible");
  });

  it("SFX 電源配 NR200P V2：官方沒有 PSU 長度上限 → Unknown", () => {
    const r = get({ case: part("case", "cooler-master-masterbox-nr200p-v2"), psu: part("psu", "lian-li-sp850") }, "R10");
    expect(r?.status).toBe("unknown");
  });

  it("Astral 5090 × 650W 電源：低於官方建議 1000W → Warning；16-pin 有原生接頭", () => {
    const build = { gpu: part("gpu", "asus-rog-astral-rtx-5090-oc"), psu: part("psu", "fsp-hexa-85-plus-650w") };
    expect(get(build, "R15")?.status).toBe("warning");
    expect(get(build, "R33")?.status).toBe("warning"); // HEXA 85+ 650W 沒有原生 16-pin → 需轉接線
  });

  it("所有真實資料兩兩組合都不會丟例外，且沒有 tight", () => {
    const cases = catalog.case.slice(0, 4);
    for (const c of cases)
      for (const g of catalog.gpu)
        for (const p of catalog.psu) {
          const rep = report({ case: c, gpu: g, psu: p, motherboard: catalog.motherboard[0], cpu: catalog.cpu[0], ram: catalog.ram[0], m2Ssds: catalog.m2Ssd.slice(0, 2) });
          expect(rep.results.every((r) => r.status !== "tight")).toBe(true);
        }
  });
});
