import { RoundedBox } from "@react-three/drei";
import { toUnits, TRAY_THICKNESS_MM, type SceneLayout } from "@/lib/three/layout";
import type { GpuPart } from "@/types/parts";

const CONNECTOR_LENGTH_MM = 89; // PCIe x16 金手指長度
const SLOT_GAP_MM = 8; // 金手指邊緣與主機板面之間的插槽高度

export function GpuMesh({
  gpu,
  lengthMm,
  thicknessMm,
  layout,
  color,
}: {
  gpu: GpuPart;
  lengthMm: number;
  thicknessMm: number;
  layout: SceneLayout;
  color: string;
}) {
  // 顯卡以「窄長邊」的金手指插入主機板 PCIe 槽，並由主機板面「立起」往玻璃側延伸。
  //   X：前後方向 = 顯卡長度 lengthMm（長邊平躺，往前延伸）
  //   Y：垂直方向 = 顯卡厚度 thicknessMm（佔幾個插槽的高度，薄帶）
  //   Z：由主機板面往玻璃側立起 = 顯卡高度 heightMm（往外突出的深度）
  const centerX = toUnits(layout.trayXMm - lengthMm / 2);

  const cardBottomY = layout.gpuYMm;
  const centerY = toUnits(cardBottomY + thicknessMm / 2);

  const zInner = toUnits(TRAY_THICKNESS_MM + SLOT_GAP_MM);
  const zOuter = zInner + toUnits(gpu.heightMm);
  const centerZ = (zInner + zOuter) / 2;

  const fanCount = lengthMm > 285 ? 3 : 2;
  const fanRadius = Math.min(toUnits(gpu.heightMm) * 0.34, (toUnits(lengthMm) / fanCount) * 0.42);

  return (
    <group>
      {/* PCIe 金手指：顯卡的窄長邊插入主機板槽，僅 x16 一小段貼著主機板面 */}
      <mesh
        position={[
          toUnits(layout.trayXMm - CONNECTOR_LENGTH_MM / 2),
          centerY,
          (toUnits(TRAY_THICKNESS_MM) + zInner) / 2,
        ]}
      >
        <boxGeometry args={[toUnits(CONNECTOR_LENGTH_MM), toUnits(thicknessMm * 0.5), zInner - toUnits(TRAY_THICKNESS_MM)]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* GPU 本體：長(X) × 厚(Y) × 高(Z，由主機板立起往外突出) */}
      <RoundedBox
        args={[toUnits(lengthMm), toUnits(thicknessMm), toUnits(gpu.heightMm)]}
        radius={0.02}
        smoothness={2}
        position={[centerX, centerY, centerZ]}
      >
        <meshStandardMaterial color={color} opacity={0.85} transparent />
      </RoundedBox>

      {/* 背板（頂面，朝上，靠近主機板上方的 PCB 背面） */}
      <mesh position={[centerX, toUnits(cardBottomY + thicknessMm) + 0.004, centerZ]}>
        <boxGeometry args={[toUnits(lengthMm) * 0.97, 0.014, toUnits(gpu.heightMm) * 0.9]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* 風扇（底面，朝下進氣） */}
      {Array.from({ length: fanCount }).map((_, i) => {
        const offset = (i - (fanCount - 1) / 2) * (toUnits(lengthMm) / fanCount);
        return (
          <mesh key={i} position={[centerX + offset, toUnits(cardBottomY) - 0.004, centerZ]}>
            <cylinderGeometry args={[fanRadius, fanRadius, 0.02, 20]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        );
      })}
    </group>
  );
}
