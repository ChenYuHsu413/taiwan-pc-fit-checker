import { toUnits, TRAY_THICKNESS_MM, type SceneLayout } from "@/lib/three/layout";
import type { CpuCoolerPart } from "@/types/parts";

export function AirCoolerMesh({
  cooler,
  heightMm,
  layout,
  color,
}: {
  cooler: CpuCoolerPart;
  heightMm: number;
  layout: SceneLayout;
  color: string;
}) {
  const baseX = layout.coolerBaseXMm;
  const baseY = layout.coolerBaseYMm;

  const zInner = toUnits(TRAY_THICKNESS_MM);
  const zOuter = toUnits(TRAY_THICKNESS_MM + heightMm);
  const centerZ = (zInner + zOuter) / 2;

  const towerOffsetX = toUnits(cooler.depthMm) * 0.28;
  const finWidth = toUnits(cooler.depthMm) * 0.32;
  const finHeight = toUnits(cooler.widthMm) * 0.92;

  return (
    <group>
      {/* 雙塔散熱鰭片 */}
      {[-towerOffsetX, towerOffsetX].map((ox, i) => (
        <mesh key={i} position={[toUnits(baseX) + ox, toUnits(baseY), centerZ]}>
          <boxGeometry args={[finWidth, finHeight, zOuter - zInner]} />
          <meshStandardMaterial color={color} opacity={0.75} transparent />
        </mesh>
      ))}

      {/* 熱導管 */}
      {[-0.6, -0.2, 0.2, 0.6].map((f, i) => (
        <mesh
          key={i}
          position={[toUnits(baseX) + f * towerOffsetX, toUnits(baseY) - finHeight * 0.3, centerZ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.015, 0.015, zOuter - zInner, 8]} />
          <meshStandardMaterial color="#b45309" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* 中央風扇（軸向前後，風道由前往後吹向機殼後方排風口） */}
      <mesh position={[toUnits(baseX), toUnits(baseY), centerZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[finHeight * 0.45, finHeight * 0.45, 0.03, 20]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
