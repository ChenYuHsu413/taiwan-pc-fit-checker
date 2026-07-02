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

          {/* 後方 I/O 散熱裝甲（主機板上緣、靠機殼後壁的直立區塊） */}
          <mesh
            position={[
              toUnits(layout.trayXMm - 20),
              toUnits(layout.boardTopMm - 78),
              toUnits(TRAY_THICKNESS_MM + 11),
            ]}
          >
            <boxGeometry args={[toUnits(38), toUnits(150), toUnits(20)]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>

          {/* 記憶體插槽：CPU 腳位「前方」的四根直立 DIMM（長邊沿垂直方向） */}
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[
                toUnits(layout.coolerBaseXMm - 52 - i * 10),
                toUnits(layout.coolerBaseYMm),
                toUnits(TRAY_THICKNESS_MM + 17),
              ]}
            >
              <boxGeometry args={[toUnits(6), toUnits(133), toUnits(34)]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}

          {/* 晶片組散熱片（主機板中下段的扁平區塊） */}
          <mesh
            position={[
              toUnits(layout.coolerBaseXMm + 10),
              toUnits(layout.boardBottomMm + 55),
              toUnits(TRAY_THICKNESS_MM + 5),
            ]}
          >
            <boxGeometry args={[toUnits(60), toUnits(60), toUnits(8)]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>
        </>
      )}
    </group>
  );
}
