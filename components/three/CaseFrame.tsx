import { DoubleSide } from "three";
import { toUnits, TRAY_THICKNESS_MM, type SceneLayout } from "@/lib/three/layout";
import { STATUS_COLOR } from "@/lib/statusColor";
import type { CompatibilityStatus } from "@/types/parts";

const PANEL_MM = 4; // 鈑金厚度
const STEEL = "#181c23";
const STEEL_DARK = "#111419";

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
  const panel = toUnits(PANEL_MM);

  const shroudH = toUnits(layout.shroudHeightMm);
  const slotY = toUnits(layout.gpuYMm);

  return (
    <group>
      {/* 底板＋腳座 */}
      <mesh position={[depth / 2, -panel / 2, zCenter]}>
        <boxGeometry args={[depth, panel, totalZ]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.5} />
      </mesh>
      {[
        [depth * 0.12, zMin + totalZ * 0.18],
        [depth * 0.12, zMax - totalZ * 0.18],
        [depth * 0.88, zMin + totalZ * 0.18],
        [depth * 0.88, zMax - totalZ * 0.18],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -panel - toUnits(9), z]}>
          <boxGeometry args={[toUnits(46), toUnits(18), toUnits(24)]} />
          <meshStandardMaterial color={STEEL_DARK} roughness={0.7} />
        </mesh>
      ))}

      {/* 頂板 */}
      <mesh position={[depth / 2, height + panel / 2, zCenter]}>
        <boxGeometry args={[depth, panel, totalZ]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.5} />
      </mesh>

      {/* 前面板（網孔進氣風格：深色面板＋細橫柵） */}
      <mesh position={[-panel / 2, height / 2, zCenter]}>
        <boxGeometry args={[panel, height + panel * 2, totalZ]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.4} roughness={0.6} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} position={[0.004, ((i + 1) / 15) * height, zCenter]}>
          <boxGeometry args={[0.008, toUnits(3), totalZ * 0.86]} />
          <meshStandardMaterial color="#2a323d" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}

      {/* 後壁 */}
      <mesh position={[depth + panel / 2, height / 2, zCenter]}>
        <boxGeometry args={[panel, height + panel * 2, totalZ]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.5} />
      </mesh>

      {/* 後方 I/O 開口（主機板上緣、貼近 tray 側的直立長方形凹槽） */}
      <mesh
        position={[
          depth - 0.004,
          toUnits(layout.boardTopMm - 78),
          toUnits(TRAY_THICKNESS_MM + 12),
        ]}
      >
        <boxGeometry args={[0.012, toUnits(158), toUnits(46)]} />
        <meshStandardMaterial color="#05070a" />
      </mesh>

      {/* 後方擴充槽擋板（PCIe 插槽線以下，水平條狀、垂直堆疊 7 條） */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            depth - 0.004,
            slotY - toUnits(6 + i * 20.32),
            toUnits(TRAY_THICKNESS_MM + 8) + toUnits(110) / 2,
          ]}
        >
          <boxGeometry args={[0.01, toUnits(16), toUnits(110)]} />
          <meshStandardMaterial color="#2a323d" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* 後方 120mm 排風扇（I/O 旁、CPU 散熱器後方） */}
      <group
        position={[
          depth - toUnits(12),
          toUnits(layout.coolerBaseYMm),
          toUnits(TRAY_THICKNESS_MM + 75),
        ]}
      >
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[toUnits(56), toUnits(5), 8, 24]} />
          <meshStandardMaterial color={STEEL_DARK} roughness={0.6} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[toUnits(52), toUnits(52), 0.02, 24]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* 主機板 tray 背板（z=0 平面，分隔走線側） */}
      <mesh position={[depth / 2, shroudH + (height - shroudH) / 2, -0.002]}>
        <boxGeometry args={[depth * 0.98, height - shroudH, 0.01]} />
        <meshStandardMaterial color={STEEL} metalness={0.55} roughness={0.5} />
      </mesh>
      {/* tray 前緣走線孔（橡膠 grommet 示意） */}
      {[0.35, 0.55, 0.75].map((f, i) => (
        <mesh key={i} position={[depth * 0.18, shroudH + (height - shroudH) * f, 0.006]}>
          <boxGeometry args={[toUnits(28), toUnits(80), 0.006]} />
          <meshStandardMaterial color="#05070a" />
        </mesh>
      ))}

      {/* 走線側鋼板（依走線空間狀態上色提示） */}
      <mesh position={[depth / 2, height / 2, zMin]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial
          color={STATUS_COLOR[cableStatus]}
          transparent
          opacity={0.28}
          metalness={0.4}
          roughness={0.5}
          side={DoubleSide}
        />
      </mesh>

      {/* 玻璃側板（元件側）＋上下邊框 */}
      <mesh position={[depth / 2, height / 2, zMax]}>
        <planeGeometry args={[depth, height]} />
        <meshPhysicalMaterial
          color="#8fd6ff"
          transparent
          opacity={0.07}
          roughness={0.05}
          metalness={0.1}
          side={DoubleSide}
        />
      </mesh>
      {[toUnits(9), height - toUnits(9)].map((y, i) => (
        <mesh key={i} position={[depth / 2, y, zMax + 0.002]}>
          <boxGeometry args={[depth, toUnits(18), 0.008]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* 底部電源分艙（PSU shroud）：半透明外殼，內部可見電源長度 */}
      <mesh position={[depth / 2, shroudH / 2, zCenter]}>
        <boxGeometry args={[depth, shroudH, totalZ * 0.96]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* 分艙頂板 */}
      <mesh position={[depth / 2, shroudH, zCenter]}>
        <boxGeometry args={[depth, toUnits(4), totalZ * 0.96]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.45} />
      </mesh>
    </group>
  );
}
