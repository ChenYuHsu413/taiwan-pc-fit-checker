import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { CatmullRomCurve3, Vector3 } from "three";
import { toUnits, TRAY_THICKNESS_MM, type SceneLayout } from "@/lib/three/layout";
import type { GpuPart } from "@/types/parts";

const SLOT_GAP_MM = 8;

export function CableBend({
  gpu,
  gpuLengthMm,
  gpuThicknessMm,
  layout,
  color,
}: {
  gpu: GpuPart;
  gpuLengthMm: number;
  gpuThicknessMm: number;
  layout: SceneLayout;
  color: string;
}) {
  // 12VHPWR / 12V-2x6 接頭位於顯卡「頂面」（+Y，背板側），約長度中前段、靠近外緣（玻璃側）。
  const connectorX = toUnits(layout.trayXMm - gpuLengthMm * 0.55);
  const connectorY = toUnits(layout.gpuYMm + gpuThicknessMm);
  const connectorZ = toUnits(TRAY_THICKNESS_MM + SLOT_GAP_MM) + toUnits(gpu.heightMm) * 0.7;

  const clearance = toUnits(gpu.recommendedSideClearanceMm);

  const points = useMemo(() => {
    // 線材由接頭往上（+Y）並向側板彎折，示意所需的彎折淨空
    const start = new Vector3(connectorX, connectorY, connectorZ);
    const bendUp = new Vector3(connectorX, connectorY + clearance * 0.7, connectorZ + clearance * 0.3);
    const bendOver = new Vector3(connectorX - 0.05, connectorY + clearance * 1.3, connectorZ - clearance * 0.2);
    const curve = new CatmullRomCurve3([start, bendUp, bendOver]);
    return curve.getPoints(16);
  }, [connectorX, connectorY, connectorZ, clearance]);

  return <Line points={points} color={color} lineWidth={4} />;
}
