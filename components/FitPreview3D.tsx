"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { BuildSelection, CompatibilityResult, CompatibilityStatus } from "@/types/parts";
import { computeLayout, toUnits } from "@/lib/three/layout";
import { STATUS_COLOR, NEUTRAL_COLOR } from "@/lib/statusColor";
import { CaseFrame } from "./three/CaseFrame";
import { MotherboardMesh } from "./three/MotherboardMesh";
import { GpuMesh } from "./three/GpuMesh";
import { AirCoolerMesh } from "./three/AirCoolerMesh";
import { AioCoolerMesh } from "./three/AioCoolerMesh";
import { PsuMesh } from "./three/PsuMesh";
import { CableBend } from "./three/CableBend";

function statusOf(results: CompatibilityResult[], prefix: string): CompatibilityStatus | undefined {
  return results.find((r) => r.item.startsWith(prefix))?.status;
}

function Scene({ selection, results }: { selection: BuildSelection; results: CompatibilityResult[] }) {
  const layout = computeLayout(selection);
  if (!layout) return null;

  const { motherboard, gpu, cooler, psu, overrides } = selection;

  const motherboardStatus = statusOf(results, "主機板尺寸相容性");
  const gpuStatus = statusOf(results, "顯卡長度空間");
  const coolerStatus = statusOf(results, "CPU 空冷高度");
  const radiatorStatus = statusOf(results, "前置水冷排相容性");
  const psuStatus = statusOf(results, "電源供應器長度");
  const cableStatus: CompatibilityStatus = statusOf(results, "背板走線空間") ?? "safe";
  const connectorStatus = statusOf(results, "顯卡供電線彎折空間");

  const center: [number, number, number] = [
    toUnits(layout.caseDepthMm) / 2,
    toUnits(layout.caseHeightMm) / 2,
    0,
  ];

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 12, 8]} intensity={1.3} />
      <directionalLight position={[-6, 5, -6]} intensity={0.45} />
      <pointLight position={[center[0], center[1], 7]} intensity={1.1} distance={26} />
      <ContactShadows
        position={[center[0], -0.6, 0]}
        opacity={0.5}
        scale={Math.max(toUnits(layout.caseDepthMm), toUnits(layout.caseHeightMm)) * 2.4}
        blur={2.4}
        far={3}
      />

      {/* 機殼慣例 X 軸為前(x=0)→後(tray)；透過側透玻璃看的標準視角是前面板在右、
          後方 I/O 在左，故整組沿 X 中心鏡射。燈光與地面陰影留在群組外維持打光方向。 */}
      <group position={[toUnits(layout.caseDepthMm), 0, 0]} scale={[-1, 1, 1]}>
        <CaseFrame layout={layout} cableStatus={cableStatus} />
        <MotherboardMesh
          motherboard={motherboard}
          layout={layout}
          color={motherboard && motherboardStatus ? STATUS_COLOR[motherboardStatus] : undefined}
        />

        {gpu && (
          <GpuMesh
            gpu={gpu}
            lengthMm={overrides.gpuLengthMm ?? gpu.lengthMm}
            thicknessMm={overrides.gpuThicknessMm ?? gpu.thicknessMm}
            layout={layout}
            color={gpuStatus ? STATUS_COLOR[gpuStatus] : NEUTRAL_COLOR}
          />
        )}

        {gpu && (gpu.powerConnectorType === "12VHPWR" || gpu.powerConnectorType === "12V-2x6") && (
          <CableBend
            gpu={gpu}
            gpuLengthMm={overrides.gpuLengthMm ?? gpu.lengthMm}
            layout={layout}
            color={STATUS_COLOR[connectorStatus ?? "warning"]}
          />
        )}

        {cooler.kind === "air" && (
          <AirCoolerMesh
            cooler={cooler.cooler}
            heightMm={overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm}
            layout={layout}
            color={STATUS_COLOR[coolerStatus ?? "warning"]}
          />
        )}

        {cooler.kind === "aio" && (
          <AioCoolerMesh
            cooler={cooler.cooler}
            mountLocation={cooler.mountLocation}
            layout={layout}
            color={STATUS_COLOR[(cooler.mountLocation === "front" ? radiatorStatus : undefined) ?? "safe"]}
          />
        )}

        {psu && (
          <PsuMesh
            psu={psu}
            lengthMm={overrides.psuLengthMm ?? psu.lengthMm}
            layout={layout}
            color={psuStatus ? STATUS_COLOR[psuStatus] : NEUTRAL_COLOR}
          />
        )}
      </group>

      <OrbitControls target={center} minDistance={2} maxDistance={30} />
    </>
  );
}

export function FitPreview3D({
  selection,
  results,
}: {
  selection: BuildSelection;
  results: CompatibilityResult[];
}) {
  const layout = useMemo(() => computeLayout(selection), [selection]);

  if (!selection.case || !layout) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-bg-panel text-sm text-white/40">
        請先選擇機殼以顯示 3D 空間示意圖
      </div>
    );
  }

  const cameraDistance = Math.max(toUnits(layout.caseDepthMm), toUnits(layout.caseHeightMm)) * 1.6;

  return (
    <div className="h-full rounded-xl border border-white/10 bg-bg-panel p-2">
      <div className="mb-1 px-2 pt-1">
        <h2 className="text-sm font-bold">3D Fit Preview 空間示意（可拖曳旋轉／滾輪縮放）</h2>
        <p className="text-[11px] text-white/40">
          模型為簡化擬真造型，非精密 CAD 比例，僅供快速判斷空間關係。
        </p>
      </div>
      <div style={{ height: "calc(100% - 40px)" }}>
        <Canvas
          frameloop="demand"
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          camera={{
            position: [
              toUnits(layout.caseDepthMm) * 0.9,
              toUnits(layout.caseHeightMm) * 0.75,
              cameraDistance,
            ],
            fov: 40,
          }}
        >
          <color attach="background" args={["#0a0e14"]} />
          <Suspense fallback={null}>
            <Scene selection={selection} results={results} />
          </Suspense>
        </Canvas>
      </div>
      <div className="flex flex-wrap gap-3 px-2 pb-1 pt-2 text-[11px] text-white/50">
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
