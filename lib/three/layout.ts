// 3D 場景座標換算
// 座標慣例（機殼內部空間，單位 mm，之後統一乘上 MM_TO_UNIT 換算成 three.js 場景單位）：
//   X 軸：前後（機殼前方 x=0 → 主機板背板 tray 面）
//   Y 軸：上下（機殼底部 y=0 → 頂部）
//   Z 軸：左右（tray 背後走線側為負值，元件／玻璃側板側為正值）
// 以下視覺常數（機殼高度、電源分艙高度、PSU 視覺尺寸、tray 厚度）非可檢查尺寸欄位，
// 僅用於讓 3D 示意圖比例合理，不影響 compatibility 判斷邏輯。

import type { BuildSelection } from "@/types/parts";
import { defaultMm } from "@/lib/data/conditional";

export const MM_TO_UNIT = 0.025;

export const CASE_HEIGHT_MM = 460;
export const TRAY_THICKNESS_MM = 6;
// 底部電源分艙（PSU shroud / basement）高度：顯卡橫躺於其上方
export const PSU_SHROUD_HEIGHT_MM = 110;
export const PSU_VISUAL_HEIGHT_MM = 86;
export const PSU_VISUAL_DEPTH_MM = 150;
export const FRONT_BUFFER_MM = 20;

/**
 * 官方規格缺值時，僅供 3D/2D 繪圖用的視覺預設尺寸（不是規格、不參與相容性判斷）。
 * Phase 1 的 mock 資料全部有值，不會用到；Phase 5 改為「缺值時以虛線/灰色標示」。
 */
export const VISUAL_FALLBACK_MM = {
  caseMaxGpuLength: 380,
  caseMaxCpuCoolerHeight: 165,
  caseMaxPsuLength: 180,
  caseCableSpace: 20,
  motherboardHeight: 305,
  motherboardDepth: 244,
  gpuLength: 300,
  gpuHeight: 130,
  gpuThickness: 50,
  coolerHeight: 155,
  coolerWidth: 125,
  coolerDepth: 135,
  radiatorLength: 277,
  radiatorWidth: 120,
  radiatorThickness: 27,
  fanThickness: 25,
  psuLength: 150,
} as const;

export function toUnits(mm: number): number {
  return mm * MM_TO_UNIT;
}

export interface SceneLayout {
  caseDepthMm: number;
  caseHeightMm: number;
  compSideMm: number;
  cableSideMm: number;
  trayXMm: number;
  /** 底部電源分艙高度 */
  shroudHeightMm: number;
  /** 主機板下緣 Y（緊貼電源分艙上方） */
  boardBottomMm: number;
  /** 主機板上緣 Y */
  boardTopMm: number;
  /** 主機板前後方向深度 */
  boardDepthMm: number;
  /** PCIe x16 插槽線 Y（顯卡上緣＝PCB 面，卡身由此往下延伸，風扇朝下） */
  gpuYMm: number;
  coolerBaseXMm: number;
  /** CPU 腳位／散熱器安裝基準 Y（靠近主機板上緣） */
  coolerBaseYMm: number;
  psuYMm: number;
}

export function computeLayout(selection: BuildSelection): SceneLayout | null {
  const { case: pcCase, motherboard, overrides } = selection;
  if (!pcCase) return null;

  const maxGpu =
    overrides.caseMaxGpuLengthMm ?? pcCase.gpuLength.unspecifiedMm ?? pcCase.gpuLength.noFrontMm ?? VISUAL_FALLBACK_MM.caseMaxGpuLength;
  const maxPsu = defaultMm(pcCase.psu.lengthLimits) ?? VISUAL_FALLBACK_MM.caseMaxPsuLength;
  const compSideMm =
    overrides.caseMaxCpuCoolerHeightMm ?? defaultMm(pcCase.cpuCoolerHeightLimits) ?? VISUAL_FALLBACK_MM.caseMaxCpuCoolerHeight;
  const cableSideMm =
    overrides.caseCableManagementSpaceMm ?? pcCase.cableSpaceMm ?? VISUAL_FALLBACK_MM.caseCableSpace;

  const caseDepthMm = Math.max(maxGpu, maxPsu) + TRAY_THICKNESS_MM + FRONT_BUFFER_MM;
  const trayXMm = caseDepthMm - TRAY_THICKNESS_MM;

  // 主機板坐落於電源分艙上方，垂直高度依實際板型（dimensions.heightMm，上下方向）縮放
  const boardBottomMm = PSU_SHROUD_HEIGHT_MM + 5;
  const boardVerticalMm = Math.min(
    motherboard?.dimensions.heightMm ?? VISUAL_FALLBACK_MM.motherboardHeight,
    CASE_HEIGHT_MM - 18 - boardBottomMm
  );
  const boardTopMm = boardBottomMm + boardVerticalMm;
  const boardDepthMm = Math.min(
    motherboard?.dimensions.depthMm ?? VISUAL_FALLBACK_MM.motherboardDepth,
    caseDepthMm - 40
  );

  return {
    caseDepthMm,
    caseHeightMm: CASE_HEIGHT_MM,
    compSideMm,
    cableSideMm,
    trayXMm,
    shroudHeightMm: PSU_SHROUD_HEIGHT_MM,
    boardBottomMm,
    boardTopMm,
    boardDepthMm,
    // PCIe x16 插槽線：真實 ATX 佈局中第一條 x16 槽約在主機板上緣往下 165mm
    // （上方為 I/O 區），顯卡由插槽線往下延伸，與電源分艙之間留有明顯間隙
    gpuYMm: Math.max(boardTopMm - 165, PSU_SHROUD_HEIGHT_MM + 80),
    coolerBaseXMm: trayXMm - 90,
    coolerBaseYMm: boardTopMm - 72,
    psuYMm: PSU_VISUAL_HEIGHT_MM / 2 + 12,
  };
}
