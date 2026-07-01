import { useMemo } from "react";
import { DoubleSide } from "three";
import { toUnits, TRAY_THICKNESS_MM, type SceneLayout } from "@/lib/three/layout";
import { STATUS_COLOR } from "@/lib/statusColor";
import type { CompatibilityStatus } from "@/types/parts";

export function CaseFrame({
  layout,
  cableStatus,
}: {
  layout: SceneLayout;
  cableStatus: CompatibilityStatus;
}) {
  const depth = toUnits(layout.caseDepthMm);
  const height = toUnits(layout.caseHeightMm);
  const zMin = -toUnits(layout.cableSideMm);
  const zMax = toUnits(TRAY_THICKNESS_MM + layout.compSideMm);
  const totalZ = zMax - zMin;
  const zCenter = (zMin + zMax) / 2;

  const shroudH = toUnits(layout.shroudHeightMm);

  const meshBars = useMemo(() => {
    const bars = [];
    const count = 8;
    for (let i = 1; i < count; i++) {
      bars.push((i / count) * height);
    }
    return bars;
  }, [height]);

  return (
    <group>
      {/* 機殼外框（線框） */}
      <mesh position={[depth / 2, height / 2, zCenter]}>
        <boxGeometry args={[depth, height, totalZ]} />
        <meshBasicMaterial color="#64748b" wireframe />
      </mesh>

      {/* 玻璃側板（元件／視覺化側） */}
      <mesh position={[depth / 2, height / 2, zMax]} rotation={[0, 0, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshPhysicalMaterial
          color="#8fd6ff"
          transparent
          opacity={0.08}
          roughness={0.1}
          metalness={0.1}
          side={DoubleSide}
        />
      </mesh>

      {/* 背板（走線側，依走線空間狀態上色） */}
      <mesh position={[depth / 2, height / 2, zMin]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial
          color={STATUS_COLOR[cableStatus]}
          transparent
          opacity={0.18}
          side={DoubleSide}
        />
      </mesh>

      {/* 前面板網孔示意（水平格柵） */}
      {meshBars.map((y, i) => (
        <mesh key={i} position={[0.02, y, zCenter]}>
          <boxGeometry args={[0.04, 0.03, totalZ * 0.94]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      ))}

      {/* 底部電源分艙（PSU shroud）：半透明外殼，內部可見電源長度；顯卡橫躺於其上方 */}
      <mesh position={[depth / 2, shroudH / 2, zCenter]}>
        <boxGeometry args={[depth, shroudH, totalZ]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.22} />
      </mesh>
      {/* 分艙頂板（顯卡承載面） */}
      <mesh position={[depth / 2, shroudH, zCenter]}>
        <boxGeometry args={[depth, toUnits(4), totalZ]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}
