// 2D 示意圖與報告在真實資料組合下可正常渲染（不丟例外），且缺值時標示「示意尺寸」。
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { catalog } from "@/lib/data/catalog";
import { evaluateReport } from "@/lib/compatibility";
import { FitPreview2D } from "@/components/FitPreview2D";
import { CompatibilityReport } from "@/components/CompatibilityReport";
import { collectFallbacks, computeLayout } from "@/lib/three/layout";
import type { BuildSelection } from "@/types/parts";

function build(o: Partial<BuildSelection>): BuildSelection {
  return { cooler: { kind: "none" }, m2Ssds: [], overrides: {}, ...o };
}

describe("渲染", () => {
  it("每個機殼 × 每張顯卡 × 每顆塔散：2D 與報告都能渲染，3D 佈局可計算", () => {
    for (const c of catalog.case)
      for (const g of catalog.gpu)
        for (const a of catalog.airCooler) {
          const sel = build({ case: c, gpu: g, psu: catalog.psu[0], cooler: { kind: "air", cooler: a } });
          const report = evaluateReport(sel);
          expect(() => renderToStaticMarkup(createElement(FitPreview2D, { selection: sel, results: report.results }))).not.toThrow();
          expect(computeLayout(sel, report.results)).not.toBeNull();
        }
  });

  it("水冷排照實際長度：前置 / 上置都能計算佈局", () => {
    for (const c of catalog.case)
      for (const aio of catalog.aio)
        for (const mountLocation of ["front", "top"] as const) {
          const sel = build({ case: c, cooler: { kind: "aio", cooler: aio, mountLocation } });
          expect(computeLayout(sel, evaluateReport(sel).results)).not.toBeNull();
        }
  });

  it("官方缺值時標示示意尺寸（MSI RTX 5080 沒有高度 / 厚度）", () => {
    const gpu = catalog.gpu.find((g) => g.id === "msi-rtx-5080-16g-gaming-trio-oc")!;
    const sel = build({ case: catalog.case[0], gpu });
    expect(collectFallbacks(sel, evaluateReport(sel).results)).toEqual(expect.arrayContaining(["gpuHeight", "gpuThickness"]));
  });

  it("裝不下時 2D 不會畫成裝得下：顯示「超出」", () => {
    const sel = build({
      case: catalog.case.find((c) => c.id === "fractal-design-north")!,
      gpu: catalog.gpu.find((g) => g.id === "asus-rog-astral-rtx-5090-oc")!,
    });
    const html = renderToStaticMarkup(createElement(FitPreview2D, { selection: sel, results: evaluateReport(sel).results }));
    expect(html).toContain("超出");
  });

  it("報告顯示分組與「尚未檢查的項目」", () => {
    const sel = build({ case: catalog.case[0], motherboard: catalog.motherboard[0], cpu: catalog.cpu[0] });
    const html = renderToStaticMarkup(createElement(CompatibilityReport, { report: evaluateReport(sel) }));
    expect(html).toContain("空間 Spatial");
    expect(html).toContain("平台 Platform");
    expect(html).toContain("尚未檢查的項目");
  });
});
