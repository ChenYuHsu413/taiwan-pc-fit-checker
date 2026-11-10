import type { BuildSelection, CompatibilityResult, CompatibilityStatus } from "@/types/parts";
import { STATUS_COLOR, NEUTRAL_COLOR } from "@/lib/statusColor";
import { statusOf } from "@/lib/compatibility";
import { STATUS_SHORT_LABEL } from "@/lib/compatibility/messages";
import { caseGpuLimitMm, FALLBACK_LABEL, visualMm, type FallbackKey } from "@/lib/three/layout";
import { defaultMm } from "@/lib/data/conditional";

const colorOf = (s: CompatibilityStatus | undefined) => STATUS_COLOR[s ?? "unknown"];

/** 長度比較條：上限畫成虛線，實際長度超過上限時照實畫出超出的部分（不截短） */
function LengthBar({
  label,
  measured,
  limit,
  status,
}: {
  label: string;
  measured: number;
  limit: number;
  status: CompatibilityStatus | undefined;
}) {
  const scaleMax = Math.max(measured, limit) * 1.05;
  const pct = (v: number) => `${(v / scaleMax) * 100}%`;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-white/60">
        <span>{label}</span>
        <span>
          {measured} mm / 上限 {limit} mm（{measured <= limit ? `餘裕 ${Math.round((limit - measured) * 10) / 10}` : `超出 ${Math.round((measured - limit) * 10) / 10}`} mm）
        </span>
      </div>
      <div className="relative h-5 w-full rounded bg-white/5">
        <div className="absolute inset-y-0 left-0 rounded" style={{ width: pct(measured), backgroundColor: colorOf(status), opacity: 0.7 }} />
        <div className="absolute inset-y-[-3px] border-l-2 border-dashed border-white/70" style={{ left: pct(limit) }} />
      </div>
    </div>
  );
}

export function FitPreview2D({
  selection,
  results,
}: {
  selection: BuildSelection;
  results: CompatibilityResult[];
}) {
  const { case: pcCase, gpu, cooler, psu, overrides } = selection;

  if (!pcCase) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-bg-panel text-sm text-white/40">
        請先選擇機殼以顯示 2D 空間示意圖
      </div>
    );
  }

  const used = new Set<FallbackKey>();
  const bars: { label: string; measured: number; limit: number; status: CompatibilityStatus | undefined }[] = [];

  if (gpu) {
    bars.push({
      label: "顯卡長度 GPU length",
      measured: visualMm(overrides.gpuLengthMm ?? gpu.lengthMm, "gpuLength", used),
      limit: visualMm(overrides.caseMaxGpuLengthMm ?? caseGpuLimitMm(selection, results), "caseMaxGpuLength", used),
      status: statusOf(results, "R02"),
    });
  }
  if (cooler.kind === "air") {
    bars.push({
      label: "散熱器高度 Cooler height",
      measured: visualMm(overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm, "coolerHeight", used),
      limit: visualMm(
        overrides.caseMaxCpuCoolerHeightMm ?? defaultMm(pcCase.cpuCoolerHeightLimits),
        "caseMaxCpuCoolerHeight",
        used
      ),
      status: statusOf(results, "R05"),
    });
  }
  if (psu) {
    bars.push({
      label: "電源長度 PSU length",
      measured: visualMm(overrides.psuLengthMm ?? psu.lengthMm, "psuLength", used),
      limit: visualMm(defaultMm(pcCase.psu.lengthLimits), "caseMaxPsuLength", used),
      status: statusOf(results, "R10"),
    });
  }

  const radiator = cooler.kind === "aio" ? statusOf(results, "R08") : undefined;
  const cableSpace = overrides.caseCableManagementSpaceMm ?? pcCase.cableSpaceMm;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-bg-panel p-4">
      <div>
        <h2 className="mb-1 text-sm font-bold">2D Fit Preview 尺寸比較</h2>
        <p className="text-[11px] text-white/40">
          色條為零件尺寸、虛線為機殼官方上限（依報告採用的條件）。超出上限時色條會越過虛線。
        </p>
        {used.size > 0 && (
          <p className="mt-1 text-[11px] text-status-tight">
            示意尺寸：{[...used].map((k) => FALLBACK_LABEL[k]).join("、")}（官方未公開，以預設值繪製，相關判斷見報告的 Unknown 項目）
          </p>
        )}
      </div>

      {bars.length === 0 && <p className="text-sm text-white/40">選擇顯卡、塔散或電源後顯示尺寸比較。</p>}
      {bars.map((b) => (
        <LengthBar key={b.label} {...b} />
      ))}

      {cooler.kind === "aio" && (
        <p className="text-xs text-white/60">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorOf(radiator) }} />
          水冷排（{cooler.mountLocation === "front" ? "前置" : "上置"} {cooler.cooler.radiatorSize}）：見報告「水冷排安裝位置」
        </p>
      )}

      <p className="text-xs text-white/50">
        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: NEUTRAL_COLOR }} />
        背板走線空間：{cableSpace !== undefined ? `${cableSpace} mm（官方值，未判斷）` : "官方未公開"}
      </p>

      <div className="flex flex-wrap gap-3 text-[11px] text-white/50">
        {(Object.keys(STATUS_COLOR) as CompatibilityStatus[])
          .filter((s) => s !== "tight")
          .map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
              {STATUS_SHORT_LABEL[s]}
            </span>
          ))}
      </div>
    </div>
  );
}
