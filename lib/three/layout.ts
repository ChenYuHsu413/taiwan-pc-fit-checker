// 3D 場景座標換算
// 座標慣例（機殼內部空間，單位 mm，之後統一乘上 MM_TO_UNIT 換算成 three.js 場景單位）：
//   X 軸：前後（機殼前方 x=0 → 主機板背板 tray 面）
//   Y 軸：上下（機殼底部 y=0 → 頂部）
//   Z 軸：左右（tray 背後走線側為負值，元件／玻璃側板側為正值）
// 以下視覺常數（機殼高度、電源分艙高度、PSU 視覺尺寸、tray 厚度）非可檢查尺寸欄位，
// 僅用於讓 3D 示意圖比例合理，不影響 compatibility 判斷邏輯。

import type { BuildSelection, CompatibilityResult } from "@/types/parts";
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
 * 使用時畫面必須標示「示意尺寸」（見 SceneLayout.fallbacks 與各元件）。
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
  /** 16-pin 供電線彎折示意長度（純視覺，R12 尚未檢查） */
  cableBendVisual: 10,
} as const;

/** 視覺預設尺寸的中文名稱（畫面標示「示意尺寸」用） */
export const FALLBACK_LABEL = {
  caseMaxGpuLength: "機殼顯卡長度上限",
  caseMaxCpuCoolerHeight: "機殼塔散高度上限",
  caseMaxPsuLength: "機殼電源長度上限",
  caseCableSpace: "背板走線空間",
  motherboardHeight: "主機板高度",
  motherboardDepth: "主機板寬度",
  gpuLength: "顯卡長度",
  gpuHeight: "顯卡高度",
  gpuThickness: "顯卡厚度",
  coolerHeight: "散熱器高度",
  coolerWidth: "散熱器寬度",
  coolerDepth: "散熱器深度",
  radiatorLength: "水冷排長度",
  radiatorWidth: "水冷排寬度",
  radiatorThickness: "水冷排厚度",
  fanThickness: "水冷風扇厚度",
  psuLength: "電源長度",
} as const;
export type FallbackKey = keyof typeof FALLBACK_LABEL;

/** 取值；缺值時用視覺預設尺寸並記錄到 used（用於畫面標示「示意尺寸」） */
export function visualMm(value: number | undefined, key: FallbackKey, used: Set<FallbackKey>): number {
  if (value !== undefined) return value;
  used.add(key);
  return VISUAL_FALLBACK_MM[key];
}

/** 整個選擇中，繪圖會用到視覺預設尺寸的項目 */
export function collectFallbacks(selection: BuildSelection, results: CompatibilityResult[]): FallbackKey[] {
  const used = new Set<FallbackKey>();
  const { case: c, motherboard: mb, gpu, cooler, psu, overrides } = selection;
  if (c) {
    visualMm(overrides.caseMaxGpuLengthMm ?? caseGpuLimitMm(selection, results), "caseMaxGpuLength", used);
    visualMm(overrides.caseMaxCpuCoolerHeightMm ?? defaultMm(c.cpuCoolerHeightLimits), "caseMaxCpuCoolerHeight", used);
    visualMm(defaultMm(c.psu.lengthLimits), "caseMaxPsuLength", used);
    visualMm(overrides.caseCableManagementSpaceMm ?? c.cableSpaceMm, "caseCableSpace", used);
  }
  if (mb) {
    visualMm(mb.dimensions.heightMm, "motherboardHeight", used);
    visualMm(mb.dimensions.depthMm, "motherboardDepth", used);
  }
  if (gpu) {
    visualMm(overrides.gpuLengthMm ?? gpu.lengthMm, "gpuLength", used);
    visualMm(gpu.heightMm, "gpuHeight", used);
    visualMm(overrides.gpuThicknessMm ?? gpu.thicknessMm, "gpuThickness", used);
  }
  if (cooler.kind === "air") {
    visualMm(overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm, "coolerHeight", used);
    visualMm(cooler.cooler.widthMm, "coolerWidth", used);
    visualMm(cooler.cooler.depthMm, "coolerDepth", used);
  }
  if (cooler.kind === "aio") {
    visualMm(cooler.cooler.radiatorLengthMm, "radiatorLength", used);
    visualMm(cooler.cooler.radiatorWidthMm, "radiatorWidth", used);
    visualMm(cooler.cooler.radiatorThicknessMm, "radiatorThickness", used);
    visualMm(cooler.cooler.fanThicknessMm, "fanThickness", used);
  }
  if (psu) visualMm(overrides.psuLengthMm ?? psu.lengthMm, "psuLength", used);
  return [...used];
}

/**
 * 繪圖用的機殼顯卡長度上限：優先用 R02 實際採用的官方上限（與報告一致），
 * 否則依序取 noFrontMm / withFrontFanMm / unspecifiedMm。
 */
export function caseGpuLimitMm(selection: BuildSelection, results: CompatibilityResult[]): number | undefined {
  const c = selection.case;
  if (!c) return undefined;
  const r02 = results.find((r) => r.ruleId === "R02");
  return r02?.limitValue ?? c.gpuLength.noFrontMm ?? c.gpuLength.withFrontFanMm ?? c.gpuLength.unspecifiedMm;
}

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

export function computeLayout(selection: BuildSelection, results: CompatibilityResult[] = []): SceneLayout | null {
  const { case: pcCase, motherboard, overrides } = selection;
  if (!pcCase) return null;

  const maxGpu =
    overrides.caseMaxGpuLengthMm ?? caseGpuLimitMm(selection, results) ?? VISUAL_FALLBACK_MM.caseMaxGpuLength;
  const maxPsu = defaultMm(pcCase.psu.lengthLimits) ?? VISUAL_FALLBACK_MM.caseMaxPsuLength;
  const compSideMm =
    overrides.caseMaxCpuCoolerHeightMm ?? defaultMm(pcCase.cpuCoolerHeightLimits) ?? VISUAL_FALLBACK_MM.caseMaxCpuCoolerHeight;
  const cableSideMm =
    overrides.caseCableManagementSpaceMm ?? pcCase.cableSpaceMm ?? VISUAL_FALLBACK_MM.caseCableSpace;

  const caseDepthMm = Math.max(maxGpu, maxPsu) + TRAY_THICKNESS_MM + FRONT_BUFFER_MM;
  const trayXMm = caseDepthMm - TRAY_THICKNESS_MM;

  // 主機板坐落於電源分艙上方，尺寸照實際數值繪製（不截短；超出機殼時會畫出超出的樣子）
  const boardBottomMm = PSU_SHROUD_HEIGHT_MM + 5;
  const boardVerticalMm = motherboard?.dimensions.heightMm ?? VISUAL_FALLBACK_MM.motherboardHeight;
  const boardTopMm = boardBottomMm + boardVerticalMm;
  const boardDepthMm = motherboard?.dimensions.depthMm ?? VISUAL_FALLBACK_MM.motherboardDepth;

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
