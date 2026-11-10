"use client";

// 3D 示意：只負責把 lib/three/layout.ts 輸出的 bounding box 畫出來。
// mm → 場景單位只透過 toSceneUnits()；鏡頭預設在側透玻璃那一側（+z）往內看，前面板在右。

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import type { BuildSelection, CompatibilityResult, CompatibilityStatus } from "@/types/parts";
import { computeLayout, FALLBACK_LABEL, toSceneUnits, type ItemKind, type SceneItem } from "@/lib/three/layout";
import { STATUS_SHORT_LABEL } from "@/lib/compatibility/messages";
import { NEUTRAL_COLOR, STATUS_COLOR } from "@/lib/statusColor";

const KIND_STYLE: Record<ItemKind, { color?: string; opacity: number; edges?: boolean }> = {
  shell: { color: "#94a3b8", opacity: 0.04, edges: true },
  shroud: { color: "#475569", opacity: 0.45, edges: true },
  board: { opacity: 0.95 },
  socket: { color: "#cbd5e1", opacity: 1 },
  pcieSlot: { color: "#020617", opacity: 1 },
  ramSlot: { color: "#334155", opacity: 1 },
  ram: { opacity: 0.95 },
  gpu: { opacity: 0.9, edges: true },
  gpuFan: { color: "#0b1220", opacity: 1 },
  cooler: { opacity: 0.85, edges: true },
  pump: { color: "#475569", opacity: 1 },
  radiator: { opacity: 0.85, edges: true },
  caseFan: { color: "#64748b", opacity: 0.9, edges: true },
  psu: { opacity: 0.9, edges: true },
  limit: { color: "#f8fafc", opacity: 0.22 },
  conflict: { color: STATUS_COLOR.incompatible, opacity: 0.9, edges: true },
};

/** 不相容的零件本體用淺灰（紅框），讓超出上限的紅色衝突區看得出來 */
const INCOMPATIBLE_BODY = "#cbd5e1";

function colorOf(item: SceneItem): string {
  const style = KIND_STYLE[item.kind];
  if (style.color) return style.color;
  if (item.status === "incompatible") return INCOMPATIBLE_BODY;
  return item.status ? STATUS_COLOR[item.status] : NEUTRAL_COLOR;
}

function edgeColorOf(item: SceneItem): string {
  if (item.kind === "shell") return "#64748b";
  if (item.kind === "conflict" || item.status === "incompatible") return STATUS_COLOR.incompatible;
  return "#0f172a";
}

function BoxItem({ item }: { item: SceneItem }) {
  const { min, max } = item.box;
  const size = [0, 1, 2].map((i) => toSceneUnits(max[i] - min[i])) as [number, number, number];
  const pos = [0, 1, 2].map((i) => toSceneUnits((max[i] + min[i]) / 2)) as [number, number, number];
  const style = KIND_STYLE[item.kind];
  const opacity = item.placeholder ? 0.25 : style.opacity;
  const color = colorOf(item);
  return (
    <mesh position={pos} renderOrder={item.kind === "conflict" ? 2 : 0}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 0.5}
        metalness={0.2}
        roughness={0.6}
      />
      {(style.edges || item.status === "incompatible") && <Edges color={edgeColorOf(item)} />}
    </mesh>
  );
}

export function FitPreview3D({ selection, results }: { selection: BuildSelection; results: CompatibilityResult[] }) {
  const layout = useMemo(() => computeLayout(selection, results), [selection, results]);

  if (!selection.case || !layout) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-bg-panel text-sm text-white/40">
        請先選擇機殼以顯示 3D 空間示意圖
      </div>
    );
  }

  const { min, max } = layout.bounds;
  const center = [0, 1, 2].map((i) => toSceneUnits((min[i] + max[i]) / 2)) as [number, number, number];
  const span = toSceneUnits(Math.max(max[0] - min[0], max[1] - min[1]));
  // 由側透玻璃那一側、略偏前上方看進去（前面板在右），看得出深度
  const camera: [number, number, number] = [center[0] + span * 0.4, center[1] + span * 0.3, toSceneUnits(max[2]) + span * 1.45];
  const hasConflict = layout.items.some((i) => i.kind === "conflict");

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-bg-panel p-2">
      <div className="mb-1 shrink-0 px-2 pt-1">
        <h2 className="text-sm font-bold">3D Fit Preview 空間示意（可拖曳旋轉／滾輪縮放）</h2>
        <p className="text-[11px] text-white/40">
          由真實尺寸推導的示意圖，非 CAD；插槽與元件位置為板型示意值。白色半透明面 = 官方上限，紅色 = 超出上限的部分。
        </p>
        {layout.fallbacks.length > 0 && (
          <p className="text-[11px] text-status-tight">
            示意尺寸：{layout.fallbacks.map((k) => FALLBACK_LABEL[k]).join("、")}（官方未公開，以預設值繪製）
          </p>
        )}
        {hasConflict && <p className="text-[11px] text-status-incompatible">紅色區塊為超出官方上限的部分。</p>}
      </div>
      <div className="min-h-0 flex-1" data-testid="fit-3d-canvas">
        <Canvas
          key={selection.case.id}
          frameloop="demand"
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          camera={{ position: camera, fov: 40, near: 0.01, far: 100 }}
        >
          <color attach="background" args={["#0a0e14"]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[center[0] + span, center[1] + span * 2, center[2] + span * 2]} intensity={1.2} />
          <directionalLight position={[center[0] - span, center[1], center[2] - span]} intensity={0.4} />
          {layout.items.map((item) => (
            <BoxItem key={item.id} item={item} />
          ))}
          <OrbitControls target={center} makeDefault />
        </Canvas>
      </div>
      <div className="flex shrink-0 flex-wrap gap-3 px-2 pb-1 pt-2 text-[11px] text-white/50">
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
