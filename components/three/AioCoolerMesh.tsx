import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { CatmullRomCurve3, Vector3 } from "three";
import { toUnits, TRAY_THICKNESS_MM, type SceneLayout } from "@/lib/three/layout";
import type { AioCoolerPart } from "@/types/parts";

function hosePoints(from: Vector3, to: Vector3): Vector3[] {
  const mid1 = new Vector3(from.x, from.y * 0.4 + to.y * 0.6, from.z + 0.15);
  const mid2 = new Vector3(to.x * 0.4 + from.x * 0.6, to.y, to.z + 0.05);
  const curve = new CatmullRomCurve3([from, mid1, mid2, to]);
  return curve.getPoints(20);
}

export function AioCoolerMesh({
  cooler,
  mountLocation,
  layout,
  color,
}: {
  cooler: AioCoolerPart;
  mountLocation: "front" | "top";
  layout: SceneLayout;
  color: string;
}) {
  const fanCount = Math.max(1, Math.round(cooler.radiatorSizeMm / 120));

  const pumpPos = new Vector3(
    toUnits(layout.coolerBaseXMm),
    toUnits(layout.coolerBaseYMm),
    toUnits(TRAY_THICKNESS_MM + 15)
  );

  const radiator = useMemo(() => {
    if (mountLocation === "front") {
      const lengthMm = Math.min(cooler.radiatorLengthMm, layout.caseHeightMm * 0.85);
      const args: [number, number, number] = [
        toUnits(cooler.totalThicknessMm),
        toUnits(lengthMm),
        toUnits(cooler.radiatorWidthMm),
      ];
      const position: [number, number, number] = [
        toUnits(cooler.totalThicknessMm) / 2 + toUnits(10),
        toUnits(layout.caseHeightMm / 2),
        toUnits(TRAY_THICKNESS_MM) + toUnits(cooler.radiatorWidthMm) / 2,
      ];
      return { args, position, axis: "x" as const };
    }
    const lengthMm = Math.min(cooler.radiatorLengthMm, layout.caseDepthMm * 0.55);
    const args: [number, number, number] = [
      toUnits(lengthMm),
      toUnits(cooler.totalThicknessMm),
      toUnits(cooler.radiatorWidthMm),
    ];
    const position: [number, number, number] = [
      toUnits(layout.trayXMm - lengthMm / 2 - 20),
      toUnits(layout.caseHeightMm) - toUnits(cooler.totalThicknessMm) / 2 - toUnits(10),
      toUnits(TRAY_THICKNESS_MM) + toUnits(cooler.radiatorWidthMm) / 2,
    ];
    return { args, position, axis: "y" as const };
  }, [cooler, mountLocation, layout]);

  const fanSpacing = radiator.args[radiator.axis === "x" ? 1 : 0] / fanCount;
  const fanRadius = Math.min(toUnits(cooler.radiatorWidthMm) * 0.42, fanSpacing * 0.42);

  const hoseInletPos = new Vector3(
    radiator.position[0] - (radiator.axis === "x" ? toUnits(cooler.totalThicknessMm) / 2 : 0),
    radiator.position[1] - (radiator.axis === "y" ? toUnits(cooler.totalThicknessMm) / 2 : radiator.args[1] * 0.3),
    radiator.position[2]
  );

  const hosePathA = useMemo(() => hosePoints(pumpPos, hoseInletPos), [pumpPos, hoseInletPos]);
  const hosePathB = useMemo(
    () =>
      hosePoints(
        new Vector3(pumpPos.x + 0.05, pumpPos.y, pumpPos.z),
        new Vector3(hoseInletPos.x + 0.05, hoseInletPos.y + 0.1, hoseInletPos.z)
      ),
    [pumpPos, hoseInletPos]
  );

  return (
    <group>
      {/* 冷頭 / 幫浦 */}
      <mesh position={pumpPos} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[toUnits(28), toUnits(28), toUnits(30), 24]} />
        <meshStandardMaterial color={color} opacity={0.85} transparent />
      </mesh>

      {/* 水冷排 */}
      <mesh position={radiator.position}>
        <boxGeometry args={radiator.args} />
        <meshStandardMaterial color={color} opacity={0.85} transparent />
      </mesh>

      {/* 水冷排風扇 */}
      {Array.from({ length: fanCount }).map((_, i) => {
        const offset = (i - (fanCount - 1) / 2) * fanSpacing;
        const pos: [number, number, number] =
          radiator.axis === "x"
            ? [radiator.position[0] - toUnits(cooler.totalThicknessMm) / 2 - 0.01, radiator.position[1] + offset, radiator.position[2]]
            : [radiator.position[0] + offset, radiator.position[1] - toUnits(cooler.totalThicknessMm) / 2 - 0.01, radiator.position[2]];
        const rotation: [number, number, number] = radiator.axis === "x" ? [0, Math.PI / 2, 0] : [Math.PI / 2, 0, 0];
        return (
          <mesh key={i} position={pos} rotation={rotation}>
            <cylinderGeometry args={[fanRadius, fanRadius, 0.02, 20]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        );
      })}

      {/* 水冷管線 */}
      <Line points={hosePathA} color="#1e293b" lineWidth={3} />
      <Line points={hosePathB} color="#1e293b" lineWidth={3} />
    </group>
  );
}
