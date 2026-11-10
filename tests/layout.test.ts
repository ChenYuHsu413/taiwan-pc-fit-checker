// 佈局測試（真實資料）：方向、位置、與報告的一致性、不截短。規格見 docs/3d-layout-spec.md。
import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/data/catalog";
import { evaluateReport } from "@/lib/compatibility";
import { computeLayout, size, type SceneLayout } from "@/lib/three/layout";
import type { BuildSelection, PartByCategory, PartCategory } from "@/types/parts";

function part<C extends PartCategory>(category: C, id: string): PartByCategory[C] {
  const found = (catalog[category] as PartByCategory[C][]).find((p) => p.id === id);
  if (!found) throw new Error(`找不到 ${category}/${id}`);
  return found;
}
function build(o: Partial<BuildSelection>): BuildSelection {
  return { cooler: { kind: "none" }, m2Ssds: [], overrides: {}, ...o };
}
function layoutOf(sel: BuildSelection) {
  const report = evaluateReport(sel);
  const layout = computeLayout(sel, report.results) as SceneLayout;
  return { layout, report };
}

const astral = () => part("gpu", "asus-rog-astral-rtx-5090-oc");

describe("顯卡方向與位置", () => {
  it("橫插：x = 長度、y = 厚度（由插槽往下）、z = 高度（由主機板往玻璃）", () => {
    const g = astral();
    const { layout } = layoutOf(build({ case: part("case", "corsair-3500x"), motherboard: part("motherboard", "asus-rog-strix-b850-i-gaming-wifi"), gpu: g }));
    const b = layout.parts.gpu!;
    const [sx, sy, sz] = size(b);
    expect(layout.gpuOrientation).toBe("horizontal");
    expect(sx).toBeCloseTo(g.lengthMm!, 5);
    expect(sy).toBeCloseTo(g.thicknessMm!, 5);
    expect(sz).toBeCloseTo(g.heightMm!, 5);
    expect(b.min[2]).toBeCloseTo(layout.boardFrontZ, 5); // 由主機板正面往玻璃
  });

  it("後端 = 擋板（後方內壁 x=0）；前端 = 後端 + 長度", () => {
    const g = astral();
    const { layout } = layoutOf(build({ case: part("case", "fractal-design-north"), gpu: g }));
    expect(layout.parts.gpu!.min[0]).toBe(0);
    expect(layout.parts.gpu!.max[0]).toBeCloseTo(0 + g.lengthMm!, 5);
  });

  it("顯卡上緣在第一條 PCIe x16 槽，且與插槽前後重疊（插在槽上）", () => {
    for (const mb of catalog.motherboard) {
      const { layout } = layoutOf(build({ case: part("case", "corsair-3500x"), motherboard: mb, gpu: astral() }));
      const slot = layout.items.find((i) => i.kind === "pcieSlot")!.box;
      const g = layout.parts.gpu!;
      expect(g.max[1]).toBeCloseTo((slot.min[1] + slot.max[1]) / 2, 5);
      expect(g.min[0] < slot.max[0] && g.max[0] > slot.min[0]).toBe(true);
      // 插槽在主機板範圍內
      expect(slot.min[1]).toBeGreaterThanOrEqual(layout.parts.board!.min[1]);
    }
  });

  it("直立安裝（HYTE Y70）：大平面朝玻璃，x = 長度、y = 高度、z = 厚度", () => {
    const g = part("gpu", "sapphire-nitro-plus-rx-9070-xt");
    const { layout } = layoutOf(build({ case: part("case", "hyte-y70"), gpu: g }));
    const [sx, sy, sz] = size(layout.parts.gpu!);
    expect(layout.gpuOrientation).toBe("vertical");
    expect([sx, sy, sz]).toEqual([g.lengthMm, g.heightMm, g.thicknessMm]);
  });
});

describe("主機板基準點", () => {
  it("ITX、M-ATX、ATX 的後方上緣角落座標相同", () => {
    const c = part("case", "corsair-3500x");
    const corners = ["asus-rog-strix-b850-i-gaming-wifi", "asus-tuf-gaming-b650m-plus-wifi", "asus-tuf-gaming-b850-plus-wifi"].map((id) => {
      const mb = part("motherboard", id);
      const { layout } = layoutOf(build({ case: c, motherboard: mb }));
      return [layout.parts.board!.min[0], layout.parts.board!.max[1]];
    });
    expect(new Set(corners.map((c) => c.join(","))).size).toBe(1);
    expect(["ITX", "M-ATX", "ATX"]).toEqual(
      ["asus-rog-strix-b850-i-gaming-wifi", "asus-tuf-gaming-b650m-plus-wifi", "asus-tuf-gaming-b850-plus-wifi"].map((id) => part("motherboard", id).formFactor)
    );
  });

  it("ITX 主機板在後方上緣，不在機殼中間高度", () => {
    const { layout } = layoutOf(build({ case: part("case", "corsair-3500x"), motherboard: part("motherboard", "asus-rog-strix-b850-i-gaming-wifi") }));
    expect(layout.parts.board!.max[1]).toBeGreaterThan(layout.interior.max[1] - 60);
    expect(layout.parts.board!.min[0]).toBeLessThan(20);
  });
});

describe("與報告一致", () => {
  it("R02：顯卡長度上限面 − 顯卡前端 = 報告餘裕（所有機殼 × 顯卡 × 前置水冷有無）", () => {
    let checked = 0;
    for (const c of catalog.case)
      for (const g of catalog.gpu)
        for (const cooler of [{ kind: "none" as const }, { kind: "aio" as const, cooler: part("aio", "arctic-liquid-freezer-iii-pro-360"), mountLocation: "front" as const }]) {
          const { layout, report } = layoutOf(build({ case: c, gpu: g, cooler }));
          const r = report.results.find((x) => x.ruleId === "R02");
          if (r?.remainingValue === undefined) continue;
          expect(Math.abs(layout.limits.gpuLengthX! - layout.parts.gpu!.max[0] - r.remainingValue)).toBeLessThanOrEqual(1);
          checked++;
        }
    expect(checked).toBeGreaterThan(50);
  });

  it("R05：塔散高度上限面 − 塔散頂端 = 報告餘裕", () => {
    let checked = 0;
    for (const c of catalog.case)
      for (const a of catalog.airCooler) {
        const { layout, report } = layoutOf(build({ case: c, cooler: { kind: "air", cooler: a } }));
        const r = report.results.find((x) => x.ruleId === "R05");
        if (r?.remainingValue === undefined) continue;
        expect(Math.abs(layout.limits.coolerTopZ! - layout.parts.cooler!.max[2] - r.remainingValue)).toBeLessThanOrEqual(1);
        checked++;
      }
    expect(checked).toBeGreaterThan(30);
  });

  it("R10：電源長度上限面 − 電源前端 = 報告餘裕", () => {
    let checked = 0;
    for (const c of catalog.case)
      for (const p of catalog.psu) {
        const { layout, report } = layoutOf(build({ case: c, psu: p }));
        const r = report.results.find((x) => x.ruleId === "R10");
        if (r?.remainingValue === undefined) continue;
        const used = Math.abs(layout.limits.psuEndX! - layout.limits.psuStartX!);
        const limit = Math.abs(layout.limits.psuFrontX! - layout.limits.psuStartX!);
        expect(Math.abs(limit - used - r.remainingValue)).toBeLessThanOrEqual(1);
        checked++;
      }
    expect(checked).toBeGreaterThan(20);
  });
});

describe("裝不下時照實畫", () => {
  it("North + Astral 5090：顯卡不截短，超出部分標為衝突，與出廠前置風扇重疊", () => {
    const g = astral();
    const { layout } = layoutOf(build({ case: part("case", "fractal-design-north"), gpu: g }));
    expect(size(layout.parts.gpu!)[0]).toBeCloseTo(g.lengthMm!, 5);
    expect(layout.items.some((i) => i.id === "conflict-gpu-length")).toBe(true);
    expect(layout.parts.frontFans).toHaveLength(2);
    expect(layout.parts.frontFans[0].min[0]).toBe(355); // R02 採用「前置裝風扇」條件 → 風扇貼在 355 mm 上限面
    expect(layout.items.some((i) => i.id.startsWith("conflict-gpu-front"))).toBe(true);
  });

  it("North + 前置 360 水冷 + Astral 5090：水冷排貼在 300 mm 上限面，顯卡穿過水冷排", () => {
    const { layout } = layoutOf(
      build({
        case: part("case", "fractal-design-north"),
        gpu: astral(),
        cooler: { kind: "aio", cooler: part("aio", "arctic-liquid-freezer-iii-pro-360"), mountLocation: "front" },
      })
    );
    expect(layout.parts.radiator!.min[0]).toBe(300);
    expect(layout.parts.frontFans).toHaveLength(0); // 換成水冷排後不畫出廠前置風扇
    expect(layout.items.some((i) => i.id.startsWith("conflict-gpu-front"))).toBe(true);
  });

  it("水冷排與塔散照實際尺寸，不縮放", () => {
    const aio = part("aio", "arctic-liquid-freezer-iii-pro-420");
    for (const c of catalog.case)
      for (const mountLocation of ["front", "top"] as const) {
        const { layout } = layoutOf(build({ case: c, cooler: { kind: "aio", cooler: aio, mountLocation } }));
        const s = size(layout.parts.radiator!);
        expect(mountLocation === "front" ? s[1] : s[0]).toBe(aio.radiatorLengthMm);
      }
    const d15 = part("airCooler", "noctua-nh-d15-g2");
    const { layout } = layoutOf(build({ case: part("case", "cooler-master-masterbox-nr200p-v2"), cooler: { kind: "air", cooler: d15 } }));
    expect(size(layout.parts.cooler!)[2]).toBe(d15.heightMm);
    expect(layout.items.some((i) => i.id === "conflict-cooler")).toBe(true);
  });

  it("電源在電源倉內，長度沿 x 由後方往前", () => {
    const p = part("psu", "cooler-master-mwe-gold-850-v4");
    const { layout } = layoutOf(build({ case: part("case", "fractal-design-north"), psu: p }));
    expect(layout.parts.psu!.min[0]).toBe(0);
    expect(size(layout.parts.psu!)[0]).toBe(p.lengthMm);
    expect(layout.parts.psu!.min[1]).toBe(0);
    expect(layout.items.some((i) => i.kind === "shroud")).toBe(true);
  });

  it("只支援 ITX 的機殼：不畫電源倉，電源在前上方，不與顯卡重疊", () => {
    const p = part("psu", "fsp-dagger-pro-atx31-850w");
    for (const id of ["cooler-master-masterbox-nr200p-v2", "fractal-design-terra"]) {
      const { layout } = layoutOf(
        build({ case: part("case", id), motherboard: part("motherboard", "asus-rog-strix-b850-i-gaming-wifi"), psu: p, gpu: part("gpu", "asus-dual-rtx-5050-oc") })
      );
      expect(layout.items.some((i) => i.kind === "shroud")).toBe(false);
      expect(size(layout.parts.psu!)[0]).toBe(p.lengthMm);
      expect(layout.parts.psu!.max[0]).toBe(layout.interior.max[0]);
      const g = layout.parts.gpu!;
      const q = layout.parts.psu!;
      const overlap = [0, 1, 2].every((i) => Math.max(g.min[i], q.min[i]) < Math.min(g.max[i], q.max[i]));
      expect(overlap).toBe(false);
      expect(g.min[1]).toBeGreaterThanOrEqual(0);
    }
  });
});
