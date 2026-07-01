import { RoundedBox } from "@react-three/drei";
import { toUnits, TRAY_THICKNESS_MM, type SceneLayout } from "@/lib/three/layout";
import { NEUTRAL_COLOR } from "@/lib/statusColor";
import type { MotherboardPart } from "@/types/parts";

export function MotherboardMesh({
  motherboard,
  layout,
  color,
}: {
  motherboard?: MotherboardPart;
  layout: SceneLayout;
  color?: string;
}) {
  const boardVerticalMm = layout.boardTopMm - layout.boardBottomMm;
  const boardDepthMm = layout.boardDepthMm;
  const boardCenterYMm = (layout.boardTopMm + layout.boardBottomMm) / 2;

  // 板身緊貼機殼背板（tray 面），沿前後方向（X）向前延伸
  const boardCenterXMm = layout.trayXMm + TRAY_THICKNESS_MM - boardDepthMm / 2;

  const boardColor = color ?? NEUTRAL_COLOR;

  return (
    <group>
      {/* 主機板 tray 板身：薄片朝向側板（Z 方向），前後（X）與上下（Y）為板面延伸方向 */}
      <RoundedBox
        args={[toUnits(boardDepthMm), toUnits(boardVerticalMm), toUnits(TRAY_THICKNESS_MM)]}
        radius={0.02}
        smoothness={2}
        position={[toUnits(boardCenterXMm), toUnits(boardCenterYMm), toUnits(TRAY_THICKNESS_MM / 2)]}
      >
        <meshStandardMaterial color={boardColor} opacity={motherboard ? 0.95 : 0.4} transparent />
      </RoundedBox>

      {motherboard && (
        <>
          {/* CPU 腳位示意 */}
          <mesh
            position={[
              toUnits(layout.coolerBaseXMm),
              toUnits(layout.coolerBaseYMm),
              toUnits(TRAY_THICKNESS_MM + 4),
            ]}
          >
            <boxGeometry args={[toUnits(45), toUnits(45), toUnits(6)]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>

          {/* 記憶體插槽示意 */}
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[
                toUnits(layout.coolerBaseXMm + 55 + i * 8),
                toUnits(layout.coolerBaseYMm + 45),
                toUnits(TRAY_THICKNESS_MM + 16),
              ]}
            >
              <boxGeometry args={[toUnits(4), toUnits(32), toUnits(32)]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
