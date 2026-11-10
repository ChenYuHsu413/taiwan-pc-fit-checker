// 2D 示意：同一份佈局（lib/three/layout.ts）投影到 x–y 平面（從側透玻璃看進去，前面板在右），同一個比例尺；
// 下方保留尺寸比較條（零件尺寸 vs 報告採用的官方上限）。

import type { BuildSelection, CompatibilityResult, CompatibilityStatus } from "@/types/parts";
import { STATUS_COLOR, NEUTRAL_COLOR } from "@/lib/statusColor";
import { statusOf } from "@/lib/compatibility";
import { STATUS_SHORT_LABEL } from "@/lib/compatibility/messages";
import { coolerHeightLimitMm, gpuLengthLimit, psuLengthLimitMm } from "@/lib/compatibility/limits";
import { computeLayout, FALLBACK_LABEL, type ItemKind, type SceneItem } from "@/lib/three/layout";

const colorOf = (s: CompatibilityStatus | undefined) => STATUS_COLOR[s ?? "unknown"];

const KIND_2D: Partial<Record<ItemKind, { fill?: string; opacity: number; stroke?: string; dash?: string }>> = {
  shroud: { fill: "#334155", opacity: 0.8 },
  board: { opacity: 0.6 },
  socket: { fill: "#cbd5e1", opacity: 0.9 },
  pcieSlot: { fill: "#020617", opacity: 1 },
  ramSlot: { fill: "#334155", opacity: 1 },
  ram: { opacity: 0.85 },
  radiator: { opacity: 0.6, stroke: "#0f172a" },
  caseFan: { fill: "#334155", opacity: 0.8, stroke: "#0f172a" },
  pump: { fill: "#475569", opacity: 0.9 },
  cooler: { opacity: 0.55, stroke: "#0f172a" },
  gpu: { opacity: 0.7, stroke: "#0f172a" },
  psu: { opacity: 0.7, stroke: "#0f172a" },
  limit: { fill: "#f8fafc", opacity: 0.9, dash: "4 3" },
  conflict: { fill: STATUS_COLOR.incompatible, opacity: 0.85 },
};

/** 長度比較條：上限畫成虛線，實際長度超過上限時照實畫出超出的部分（不截短） */
function LengthBar({ label, measured, limit, status }: { label: string; measured: number; limit: number; status: CompatibilityStatus | undefined }) {
  const scaleMax = Math.max(measured, limit) * 1.05;
  const pct = (v: number) => `${(v / scaleMax) * 100}%`;
  const diff = Math.round(Math.abs(limit - measured) * 10) / 10;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-white/60">
        <span>{label}</span>
        <span>
          {measured} mm / 上限 {limit} mm（{measured <= limit ? `餘裕 ${diff}` : `超出 ${diff}`} mm）
        </span>
      </div>
      <div className="relative h-4 w-full rounded bg-white/5">
        <div className="absolute inset-y-0 left-0 rounded" style={{ width: pct(measured), backgroundColor: colorOf(status), opacity: 0.7 }} />
        <div className="absolute inset-y-[-3px] border-l-2 border-dashed border-white/70" style={{ left: pct(limit) }} />
      </div>
    </div>
  );
}

export function FitPreview2D({ selection, results }: { selection: BuildSelection; results: CompatibilityResult[] }) {
  const layout = computeLayout(selection, results);
  const { case: pcCase, gpu, cooler, psu, overrides } = selection;

  if (!pcCase || !layout) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-bg-panel text-sm text-white/40">
        請先選擇機殼以顯示 2D 空間示意圖
      </div>
    );
  }

  // 正視圖：x 往右 = 往前面板；y 往上（SVG 需翻轉）。依 z 由後往前畫，靠近玻璃的蓋在上面
  const { shell, bounds } = layout;
  const pad = 30;
  const x0 = Math.min(shell.min[0], bounds.min[0]) - pad;
  const x1 = Math.max(shell.max[0], bounds.max[0]) + pad;
  const y0 = Math.min(shell.min[1], bounds.min[1]) - pad;
  const y1 = Math.max(shell.max[1], bounds.max[1]) + pad;
  const toY = (y: number) => y1 - y;
  const drawn = layout.items
    .filter((i) => i.kind !== "shell" && KIND_2D[i.kind])
    .sort((a, b) => (a.kind === "conflict" ? 1 : b.kind === "conflict" ? -1 : a.box.max[2] - b.box.max[2]));

  const rect = (item: SceneItem) => {
    const s = KIND_2D[item.kind]!;
    // 不相容的零件本體用淺灰（紅框），只有超出上限的衝突區是實心紅色
    const bad = item.status === "incompatible";
    const fill = s.fill ?? (bad ? "#cbd5e1" : item.status ? STATUS_COLOR[item.status] : NEUTRAL_COLOR);
    const w = item.box.max[0] - item.box.min[0];
    const h = item.box.max[1] - item.box.min[1];
    return (
      <rect
        key={item.id}
        x={item.box.min[0]}
        y={toY(item.box.max[1])}
        width={Math.max(w, item.kind === "limit" ? 1.5 : 0)}
        height={h}
        fill={fill}
        fillOpacity={item.placeholder ? 0.2 : s.opacity}
        stroke={bad ? STATUS_COLOR.incompatible : s.stroke}
        strokeWidth={bad ? 2 : s.stroke ? 0.8 : 0}
        strokeDasharray={s.dash}
      />
    );
  };

  // 尺寸比較條（與報告採用相同上限）
  const bars: { label: string; measured: number; limit: number; status: CompatibilityStatus | undefined }[] = [];
  const gpuLimit = gpuLengthLimit(selection)?.mm;
  const gpuLen = overrides.gpuLengthMm ?? gpu?.lengthMm;
  if (gpu && gpuLimit !== undefined && gpuLen !== undefined)
    bars.push({ label: "顯卡長度 GPU length", measured: gpuLen, limit: gpuLimit, status: statusOf(results, "R02") });
  const coolerLimit = coolerHeightLimitMm(selection);
  const coolerH = cooler.kind === "air" ? overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm : undefined;
  if (coolerLimit !== undefined && coolerH !== undefined)
    bars.push({ label: "散熱器高度 Cooler height", measured: coolerH, limit: coolerLimit, status: statusOf(results, "R05") });
  const psuLimit = psuLengthLimitMm(selection);
  const psuLen = overrides.psuLengthMm ?? psu?.lengthMm;
  if (psu && psuLimit !== undefined && psuLen !== undefined)
    bars.push({ label: "電源長度 PSU length", measured: psuLen, limit: psuLimit, status: statusOf(results, "R10") });

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-bg-panel p-4">
      <div>
        <h2 className="mb-1 text-sm font-bold">2D Fit Preview 正視圖（從側透玻璃看，前面板在右）</h2>
        <p className="text-[11px] text-white/40">與 3D 同一份佈局、同一比例尺。白色虛線 = 官方上限，紅色 = 超出上限的部分。</p>
        {layout.fallbacks.length > 0 && (
          <p className="mt-1 text-[11px] text-status-tight">
            示意尺寸：{layout.fallbacks.map((k) => FALLBACK_LABEL[k]).join("、")}（官方未公開，以預設值繪製）
          </p>
        )}
      </div>

      <svg viewBox={`${x0} 0 ${x1 - x0} ${y1 - y0}`} className="w-full" style={{ maxHeight: 300 }} data-testid="fit-2d-svg">
        <rect
          x={shell.min[0]}
          y={toY(shell.max[1])}
          width={shell.max[0] - shell.min[0]}
          height={shell.max[1] - shell.min[1]}
          fill="#0b1018"
          stroke="#64748b"
          strokeWidth={2}
        />
        {drawn.map(rect)}
        <text x={shell.min[0] + 4} y={toY(shell.max[1]) - 3} fill="#94a3b8" fontSize={20}>
          後 Rear / I/O
        </text>
        <text x={shell.max[0] - 90} y={toY(shell.max[1]) - 3} fill="#94a3b8" fontSize={20}>
          前 Front
        </text>
      </svg>

      {bars.map((b) => (
        <LengthBar key={b.label} {...b} />
      ))}

      <p className="text-xs text-white/50">
        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: NEUTRAL_COLOR }} />
        背板走線空間：{pcCase.cableSpaceMm !== undefined ? `${pcCase.cableSpaceMm} mm（官方值，未判斷）` : "官方未公開"}
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
