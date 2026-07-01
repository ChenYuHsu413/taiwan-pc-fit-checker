import {
  toUnits,
  TRAY_THICKNESS_MM,
  PSU_VISUAL_HEIGHT_MM,
  PSU_VISUAL_DEPTH_MM,
  type SceneLayout,
} from "@/lib/three/layout";
import type { PsuPart } from "@/types/parts";

export function PsuMesh({
  psu,
  lengthMm,
  layout,
  color,
}: {
  psu: PsuPart;
  lengthMm: number;
  layout: SceneLayout;
  color: string;
}) {
  const centerX = toUnits(layout.trayXMm - lengthMm / 2);
  const centerY = toUnits(layout.psuYMm);
  const centerZ = toUnits(TRAY_THICKNESS_MM + PSU_VISUAL_DEPTH_MM / 2);

  const fanRadius = toUnits(PSU_VISUAL_DEPTH_MM) * 0.32;

  return (
    <group>
      <mesh position={[centerX, centerY, centerZ]}>
        <boxGeometry args={[toUnits(lengthMm), toUnits(PSU_VISUAL_HEIGHT_MM), toUnits(PSU_VISUAL_DEPTH_MM)]} />
        <meshStandardMaterial color={color} opacity={0.85} transparent />
      </mesh>

      {/* 底部風扇 */}
      <mesh position={[centerX, centerY - toUnits(PSU_VISUAL_HEIGHT_MM) / 2 - 0.005, centerZ]}>
        <cylinderGeometry args={[fanRadius, fanRadius, 0.01, 20]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* 非模組化線材示意 */}
      {psu.modularType === "非模組化" &&
        [0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[
              toUnits(layout.trayXMm) + 0.02,
              centerY + (i - 1) * toUnits(18),
              centerZ,
            ]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.012, 0.012, toUnits(60), 8]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
        ))}
    </group>
  );
}
