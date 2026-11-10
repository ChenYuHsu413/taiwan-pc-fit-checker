// 3D / 2D 佈局的所有示意值（單位 mm）。規格見 docs/3d-layout-spec.md。
// 這些都不是官方規格、不參與相容性判斷，只用來決定沒有官方數值的位置；每項註明依據，並列在 docs/pending.md 的 L 段。

import type { MotherboardFormFactor, PsuFormFactor } from "@/lib/schema/common";

/** 機殼每面的壁厚（示意：鈑金加上前面板結構，各機殼差異大，統一取 10 mm） */
export const CASE_WALL_MM = 10;

/** 電源倉高度（示意：常見直立機殼電源倉約 90–110 mm，ATX 電源高 86 mm；ITX 機殼也統一畫） */
export const PSU_SHROUD_HEIGHT_MM = 100;

/** 主機板後緣到機殼後方內壁的距離（示意：I/O 擋板所在位置，取 5 mm） */
export const BOARD_REAR_X_MM = 5;

/** 主機板上緣到機殼內部頂面的距離（示意：直立機殼常見 25–60 mm，取 30 mm） */
export const BOARD_TOP_GAP_MM = 30;

/** 主機板背面到托盤的距離（示意：常見銅柱高度 1/4 吋 ≈ 6.35 mm） */
export const BOARD_STANDOFF_MM = 6.35;

/** 主機板 PCB 厚度（示意：常見 1.6 mm） */
export const PCB_THICKNESS_MM = 1.6;

/** ATX 擴充槽間距（ATX 規格 0.8 吋 = 20.32 mm） */
export const EXPANSION_SLOT_PITCH_MM = 20.32;

/** 板型標準尺寸（官方沒有 dimensions 時用）：height = 上下、depth = 前後 */
export const BOARD_STANDARD_MM: Record<MotherboardFormFactor, { heightMm: number; depthMm: number; basis: string }> = {
  ATX: { heightMm: 305, depthMm: 244, basis: "ATX 規格 12 × 9.6 吋" },
  "M-ATX": { heightMm: 244, depthMm: 244, basis: "microATX 規格 9.6 × 9.6 吋" },
  ITX: { heightMm: 170, depthMm: 170, basis: "Mini-ITX 規格 170 × 170 mm" },
  "E-ATX": { heightMm: 305, depthMm: 277, basis: "常見 E-ATX 12 × 10.9 吋（各廠不一，示意）" },
};

/**
 * 板上元件位置（相對主機板後方上緣：dx 往前、dy 往下）。全部是示意值。
 * 依據：ATX / microATX 共用後方上緣的 I/O 與安裝孔配置；Mini-ITX 對齊 ATX 的後方上緣安裝孔，
 * 唯一擴充槽與 ATX 第一個擴充槽位置相同。實際位置各主機板不同，官方幾乎都不公開。
 */
export interface BoardFeatures {
  /** CPU 插槽中心 */
  socketDx: number;
  socketDy: number;
  /** CPU 插槽邊長（示意：AM5 40 × 40、LGA1700/1851 37.5 × 45，統一 40） */
  socketSizeMm: number;
  /** 第一條 PCIe x16 槽中心線距上緣（示意：現代主機板第一條 x16 多在第 1 個擴充槽位置，約 150 mm） */
  slotDy: number;
  /** PCIe x16 槽長度（PCIe CEM 規格 x16 連接器約 89 mm）與起點 dx */
  slotDx: number;
  slotLengthMm: number;
  /** RAM 槽：第一條中心 dx、間距、上端 dy */
  ramFirstDx: number;
  ramPitchMm: number;
  ramTopDy: number;
}

const ATX_LIKE: BoardFeatures = {
  socketDx: 110,
  socketDy: 85,
  socketSizeMm: 40,
  slotDy: 150,
  slotDx: 20,
  slotLengthMm: 89,
  ramFirstDx: 160,
  ramPitchMm: 9.5,
  ramTopDy: 20,
};

export const BOARD_FEATURES: Record<MotherboardFormFactor, BoardFeatures> = {
  ATX: ATX_LIKE,
  "M-ATX": ATX_LIKE,
  "E-ATX": ATX_LIKE,
  ITX: { ...ATX_LIKE, socketDx: 85, socketDy: 80, ramFirstDx: 140, ramPitchMm: 10, ramTopDy: 18 },
};

/** RAM 槽數（官方 memorySlots 缺值時用；示意：ITX 2、其他 4） */
export const DEFAULT_RAM_SLOTS: Record<MotherboardFormFactor, number> = { ATX: 4, "M-ATX": 4, "E-ATX": 4, ITX: 2 };

/** DIMM 長度（JEDEC UDIMM 標準 133.35 mm） */
export const DIMM_LENGTH_MM = 133.35;
/** DIMM 厚度（示意：含散熱片約 7 mm） */
export const DIMM_THICKNESS_MM = 7;
/** 沒選 RAM 時畫空插槽的高度（示意） */
export const DIMM_SLOT_HEIGHT_MM = 8;

/** 電源外形（高、寬）：ATX12V 150 W × 86 H；SFX12V 125 W × 63.5 H；SFX-L 125 × 63.5 */
export const PSU_FORM_MM: Record<PsuFormFactor, { widthMm: number; heightMm: number; basis: string }> = {
  ATX: { widthMm: 150, heightMm: 86, basis: "ATX12V 規格 150 × 86" },
  SFX: { widthMm: 125, heightMm: 63.5, basis: "SFX12V 規格 125 × 63.5" },
  "SFX-L": { widthMm: 125, heightMm: 63.5, basis: "SFX-L 規格 125 × 63.5" },
};

/** 官方沒寫風扇厚度時（示意：常見 120 / 140 風扇厚 25 mm） */
export const DEFAULT_FAN_THICKNESS_MM = 25;

/** 前置風扇 / 水冷排上緣距內部頂面（示意） */
export const FRONT_COOLING_TOP_GAP_MM = 20;

/** 上置水冷排後端距後方內壁（示意：避開後方排風扇位置） */
export const TOP_RADIATOR_REAR_GAP_MM = 20;

/** 水冷頭外形（示意：60 × 60，厚 50） */
export const PUMP_HEAD_MM = { size: 60, thickness: 50 };

/** 直立顯卡：支架面距托盤（示意 20 mm）；底端距電源倉頂（示意 10 mm） */
export const VERTICAL_GPU_Z_MM = 20;
export const VERTICAL_GPU_BOTTOM_GAP_MM = 10;

/** 官方缺值時的視覺預設尺寸（畫面必須標示「示意尺寸」） */
export const VISUAL_FALLBACK_MM = {
  caseExternalDepth: 450,
  caseExternalHeight: 470,
  caseExternalWidth: 230,
  caseCableSpace: 20,
  gpuLength: 300,
  gpuHeight: 130,
  gpuThickness: 50,
  coolerHeight: 155,
  coolerWidth: 125,
  coolerDepth: 135,
  radiatorLength: 397,
  radiatorWidth: 120,
  radiatorThickness: 27,
  fanThickness: 25,
  psuLength: 150,
  ramHeight: 32,
} as const;

export const FALLBACK_LABEL = {
  caseExternalDepth: "機殼外觀深度",
  caseExternalHeight: "機殼外觀高度",
  caseExternalWidth: "機殼外觀寬度",
  caseCableSpace: "背板走線空間",
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
  ramHeight: "記憶體高度",
  motherboardSize: "主機板尺寸（用板型標準尺寸）",
} as const;
export type FallbackKey = keyof typeof FALLBACK_LABEL;
