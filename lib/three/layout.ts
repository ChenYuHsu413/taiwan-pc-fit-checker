// 3D 場景座標換算
// 座標慣例（機殼內部空間，單位 mm，之後統一乘上 MM_TO_UNIT 換算成 three.js 場景單位）：
//   X 軸：前後（機殼前方 x=0 → 主機板背板 tray 面）
//   Y 軸：上下（機殼底部 y=0 → 頂部）
//   Z 軸：左右（tray 背後走線側為負值，元件／玻璃側板側為正值）
// 以下視覺常數（機殼高度、電源分艙高度、PSU 視覺尺寸、tray 厚度）非可檢查尺寸欄位，
// 僅用於讓 3D 示意圖比例合理，不影響 compatibility 判斷邏輯。

import type { BuildSelection } from "@/types/parts";

export const MM_TO_UNIT = 0.025;

export const CASE_HEIGHT_MM = 460;
export const TRAY_THICKNESS_MM = 6;
// 底部電源分艙（PSU shroud / basement）高度：顯卡橫躺於其上方
export const PSU_SHROUD_HEIGHT_MM = 110;
export const PSU_VISUAL_HEIGHT_MM = 86;
export const PSU_VISUAL_DEPTH_MM = 150;
export const FRONT_BUFFER_MM = 20;

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
  /** 顯卡底邊 Y（坐落於電源分艙上方，顯卡由此往上延伸） */
  gpuYMm: number;
  coolerBaseXMm: number;
  /** CPU 腳位／散熱器安裝基準 Y（靠近主機板上緣） */
  coolerBaseYMm: number;
  psuYMm: number;
}

export function computeLayout(selection: BuildSelection): SceneLayout | null {
  const { case: pcCase, motherboard, overrides } = selection;
  if (!pcCase) return null;

  const maxGpu = overrides.caseMaxGpuLengthMm ?? pcCase.maxGpuLengthMm;
  const maxPsu = pcCase.maxPsuLengthMm;
  const compSideMm = overrides.caseMaxCpuCoolerHeightMm ?? pcCase.maxCpuCoolerHeightMm;
  const cableSideMm = overrides.caseCableManagementSpaceMm ?? pcCase.cableManagementSpaceMm;

  const caseDepthMm = Math.max(maxGpu, maxPsu) + TRAY_THICKNESS_MM + FRONT_BUFFER_MM;
  const trayXMm = caseDepthMm - TRAY_THICKNESS_MM;

  // 主機板坐落於電源分艙上方，垂直高度依實際板型（widthMm）縮放
  const boardBottomMm = PSU_SHROUD_HEIGHT_MM + 5;
  const boardVerticalMm = Math.min(motherboard?.widthMm ?? 305, CASE_HEIGHT_MM - 18 - boardBottomMm);
  const boardTopMm = boardBottomMm + boardVerticalMm;
  const boardDepthMm = Math.min(motherboard?.heightMm ?? 244, caseDepthMm - 40);

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
    // 顯卡薄帶（厚度＝插槽數的垂直高度）的下緣 Y，坐落於電源分艙上方並留進氣間隙
    gpuYMm: PSU_SHROUD_HEIGHT_MM + 45,
    coolerBaseXMm: trayXMm - 90,
    coolerBaseYMm: boardTopMm - 72,
    psuYMm: PSU_VISUAL_HEIGHT_MM / 2 + 12,
  };
}
