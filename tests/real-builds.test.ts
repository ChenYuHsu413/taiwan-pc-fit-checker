// 真實資料組合測試：用 data/ 內的官方規格資料檢查規則結果。
import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/data/catalog";
import { evaluateReport } from "@/lib/compatibility";
import type { RuleId } from "@/lib/compatibility/rules";
import type { BuildSelection, PartByCategory, PartCategory } from "@/types/parts";

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
  it("TUF B650M-PLUS WIFI + Ryzen 5 9600X：主機板清單需 BIOS 2613 → Warning，附官方 CPU 支援清單連結", () => {
    const r = get({ cpu: part("cpu", "amd-ryzen-5-9600x"), motherboard: part("motherboard", "asus-tuf-gaming-b650m-plus-wifi") }, "R27");
    expect(r?.status).toBe("warning");
    expect(r?.message).toContain("Flashback");
    expect(r?.conditions?.[0]).toContain("2613");
    expect(r?.link?.url).toContain("helpdesk_cpu");
  });

  it("AM5 主機板 + 9800X3D：沒有主機板清單時依 BIOS 表（X870E 原生 / B650 需更新）", () => {
    const x3d = part("cpu", "amd-ryzen-7-9800x3d");
    const x870e = get({ cpu: x3d, motherboard: part("motherboard", "asus-rog-strix-x870e-e-gaming-wifi") }, "R27");
    expect(["safe", "info"]).toContain(x870e?.status);
    const b650 = get({ cpu: x3d, motherboard: part("motherboard", "msi-mag-b650-tomahawk-wifi") }, "R27");
    expect(b650?.status).toBe("warning");
  });

  it("TUF B850-PLUS WIFI：主機板清單優先於晶片組層級", () => {
    const b850 = part("motherboard", "asus-tuf-gaming-b850-plus-wifi");
    const r = get({ cpu: part("cpu", "amd-ryzen-7-9850x3d"), motherboard: b850 }, "R27");
    expect(r?.status).toBe("warning"); // 晶片組層級是 native，但清單寫 1066
    expect(r?.conditions?.[0]).toContain("1066");
    // 800 系列 × Ryzen 8000 晶片組層級沒有依據，但主機板清單寫 all → safe
    expect(get({ cpu: part("cpu", "amd-ryzen-5-8600g"), motherboard: b850 }, "R27")?.status).toBe("safe");
    expect(get({ cpu: part("cpu", "amd-ryzen-5-9600x"), motherboard: b850 }, "R27")?.status).toBe("safe");
  });

  it("B550M Pro4 + Ryzen 5 5600 沒選顯卡：沒有畫面輸出", () => {
    const r = get({ cpu: part("cpu", "amd-ryzen-5-5600"), motherboard: part("motherboard", "asrock-b550m-pro4") }, "R28");
    expect(r?.status).toBe("incompatible");
  });

  it("B550M Pro4 + Ryzen 7 5700X3D：腳位相容；B550 × 5000X3D 沒有官方依據 → R27 Unknown", () => {
    const build = { cpu: part("cpu", "amd-ryzen-7-5700x3d"), motherboard: part("motherboard", "asrock-b550m-pro4") };
    expect(get(build, "R22")?.status).toBe("safe");
    expect(get(build, "R27")?.status).toBe("unknown");
    const ddr4 = get({ ...build, ram: part("ram", "kingston-fury-beast-kf432c16bbk2-16") }, "R23");
    expect(ddr4?.status).toBe("safe");
  });

  it("AM5 主機板 + DDR4 記憶體：不相容", () => {
    const r = get(
      { cpu: part("cpu", "amd-ryzen-5-9600x"), motherboard: part("motherboard", "asus-tuf-gaming-b850-plus-wifi"), ram: part("ram", "kingston-fury-beast-kf432c16bbk2-16") },
      "R23"
    );
    expect(r?.status).toBe("incompatible");
  });

  it("Ryzen 5 9600X + 4 條 DDR5（2R）：依官方速度表降到 3600 → Info", () => {
    const r = get({ cpu: part("cpu", "amd-ryzen-5-9600x"), ram: part("ram", "kingston-fury-beast-kf556c40bbk4-128") }, "R26");
    expect(r?.status).toBe("info");
    expect(r?.limitValue).toBe(3600);
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
