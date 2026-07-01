import type { BuildSelection, CompatibilityResult, CompatibilityStatus } from "@/types/parts";
import { STATUS_COLOR } from "@/lib/statusColor";

function statusOf(results: CompatibilityResult[], prefix: string): CompatibilityStatus | undefined {
  return results.find((r) => r.item.startsWith(prefix))?.status;
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

  // --- 主視圖：機殼俯視示意（前 = 左，主機板/背板 = 右）---
  const caseX = 20;
  const caseY = 20;
  const caseW = 400;
  const caseH = 200;
  const trayW = 18;
  const trayX = caseX + caseW - trayW;

  const caseMaxGpuLength = overrides.caseMaxGpuLengthMm ?? pcCase.maxGpuLengthMm;
  const gpuScale = (caseW - trayW) / caseMaxGpuLength;

  const gpuLength = gpu ? overrides.gpuLengthMm ?? gpu.lengthMm : undefined;
  const gpuStatus = statusOf(results, "顯卡長度空間") ?? "warning";
  const gpuWpx = gpuLength ? gpuLength * gpuScale : 0;
  const gpuX = trayX - gpuWpx;

  const isFrontAio = cooler.kind === "aio" && cooler.mountLocation === "front";
  const radiatorStatus = statusOf(results, "前置水冷排相容性");
  const radWpx = isFrontAio
    ? (cooler.cooler.radiatorThicknessMm + cooler.cooler.fanThicknessMm) * gpuScale
    : 0;

  const overlapX = Math.max(caseX + radWpx, gpuX);
  const overlapEnd = Math.min(trayX, caseX + radWpx + gpuWpx);
  const hasOverlap = isFrontAio && gpu && overlapX < overlapEnd;

  const caseMaxPsuLength = pcCase.maxPsuLengthMm;
  const psuScale = (caseW - trayW) / caseMaxPsuLength;
  const psuLength = psu ? overrides.psuLengthMm ?? psu.lengthMm : undefined;
  const psuStatus = statusOf(results, "電源供應器長度") ?? "warning";
  const psuWpx = psuLength ? psuLength * psuScale : 0;
  const psuX = trayX - psuWpx;

  const cableSpace = overrides.caseCableManagementSpaceMm ?? pcCase.cableManagementSpaceMm;
  const cableStatus = statusOf(results, "背板走線空間") ?? "safe";
  const cableStripW = Math.min(40, Math.max(4, cableSpace * 1.2));

  const svgW = caseX + caseW + 20 + cableStripW + 20;
  const svgH = caseY + caseH + 20;

  // --- CPU 散熱器高度量規 ---
  const coolerHeight = cooler.kind === "air" ? overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm : undefined;
  const coolerLimit = overrides.caseMaxCpuCoolerHeightMm ?? pcCase.maxCpuCoolerHeightMm;
  const coolerStatus = statusOf(results, "CPU 空冷高度");
  const coolerRatio = coolerHeight ? Math.min(1.15, coolerHeight / coolerLimit) : 0;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-bg-panel p-4">
      <div>
        <h2 className="mb-1 text-sm font-bold">2D Fit Preview 空間示意（俯視簡化圖）</h2>
        <p className="mb-2 text-[11px] text-white/40">
          示意圖為簡化 bounding box，非精密 CAD 比例，僅供快速判斷空間關係。
        </p>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 260 }}>
          {/* 機殼外框 */}
          <rect
            x={caseX}
            y={caseY}
            width={caseW}
            height={caseH}
            fill="none"
            stroke="#64748b"
            strokeWidth={2}
            rx={6}
          />
          <text x={caseX + 4} y={caseY - 6} fill="#94a3b8" fontSize={10}>
            前 Front
          </text>
          <text x={trayX - 24} y={caseY - 6} fill="#94a3b8" fontSize={10}>
            後 / 主機板 Back
          </text>

          {/* 主機板 tray */}
          <rect x={trayX} y={caseY} width={trayW} height={caseH} fill="#475569" />

          {/* 前置水冷排 */}
          {isFrontAio && (
            <rect
              x={caseX}
              y={caseY + 8}
              width={radWpx}
              height={caseH - 16}
              fill={STATUS_COLOR[radiatorStatus ?? "warning"]}
              opacity={0.35}
              stroke={STATUS_COLOR[radiatorStatus ?? "warning"]}
              strokeDasharray="4 3"
            />
          )}

          {/* GPU */}
          {gpu && (
            <rect
              x={gpuX}
              y={caseY + 30}
              width={gpuWpx}
              height={36}
              fill={STATUS_COLOR[gpuStatus]}
              opacity={0.55}
              stroke={STATUS_COLOR[gpuStatus]}
              strokeWidth={1.5}
            />
          )}

          {/* 衝突區域 */}
          {hasOverlap && (
            <rect
              x={overlapX}
              y={caseY + 30}
              width={Math.max(0, overlapEnd - overlapX)}
              height={36}
              fill="#ef4444"
              opacity={0.6}
            />
          )}

          {/* PSU */}
          {psu && (
            <rect
              x={psuX}
              y={caseY + caseH - 26}
              width={psuWpx}
              height={18}
              fill={STATUS_COLOR[psuStatus]}
              opacity={0.55}
              stroke={STATUS_COLOR[psuStatus]}
              strokeWidth={1.5}
            />
          )}

          {/* 走線空間 */}
          <rect
            x={trayX + trayW + 8}
            y={caseY}
            width={cableStripW}
            height={caseH}
            fill={STATUS_COLOR[cableStatus === "safe" ? "safe" : "warning"]}
            opacity={0.3}
          />
          <text x={trayX + trayW + 8} y={caseY + caseH + 14} fill="#94a3b8" fontSize={9}>
            走線 Cable
          </text>

          <text x={caseX} y={caseY + 26} fill="#cbd5e1" fontSize={10}>
            GPU
          </text>
          <text x={caseX} y={caseY + caseH - 30} fill="#cbd5e1" fontSize={10}>
            PSU
          </text>
        </svg>
      </div>

      {cooler.kind === "air" && coolerHeight && (
        <div>
          <h3 className="mb-1 text-xs font-bold text-white/70">CPU 空冷高度 Cooler height clearance</h3>
          <div className="h-4 w-full overflow-hidden rounded bg-white/5">
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, coolerRatio * 100)}%`,
                backgroundColor: STATUS_COLOR[coolerStatus ?? "warning"],
                opacity: 0.7,
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-white/40">
            {coolerHeight} mm / 機殼上限 {coolerLimit} mm
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-[11px] text-white/50">
        {(Object.keys(STATUS_COLOR) as CompatibilityStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
            {s === "safe" ? "Safe" : s === "tight" ? "Tight" : s === "warning" ? "Warning" : "Incompatible"}
          </span>
        ))}
      </div>
    </div>
  );
}
