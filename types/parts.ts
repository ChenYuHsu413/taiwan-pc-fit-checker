// 台灣版 PC 組裝空間模擬器 - 核心資料型別
// 注意：所有價格皆為「參考價」，實際價格與貨況請以通路現場公告為準。

export type PartCategory =
  | "case"
  | "motherboard"
  | "gpu"
  | "cpuCooler"
  | "aioCooler"
  | "psu"
  | "cpu"
  | "ram"
  | "storage";

export type MotherboardFormFactor = "E-ATX" | "ATX" | "M-ATX" | "ITX";

export type GpuPowerConnectorType =
  | "12VHPWR"
  | "12V-2x6"
  | "8pin x1"
  | "8pin x2"
  | "8pin x3"
  | "6pin";

export type PsuFormFactor = "ATX" | "SFX" | "SFX-L";

export type PsuModularType = "非模組化" | "半模組化" | "全模組化";

export type CompatibilityStatus = "safe" | "tight" | "warning" | "incompatible";

/** 所有零件共用的基礎欄位 */
export interface BasePart {
  id: string;
  category: PartCategory;
  brand: string;
  model: string;
  /** 台灣通路常見的商品名稱，例如原價屋列表上的品名 */
  twName: string;
  /** 參考價格（新台幣），非即時報價 */
  priceTwd: number;
  /** 此筆資料最後更新時間 (ISO 8601) */
  updatedAt: string;
  /** 資料來源名稱，例如「原價屋參考」「品牌官網」「手動輸入」 */
  sourceName: string;
  /** 資料來源連結（若有） */
  sourceUrl?: string;
  /** 備註，例如資料不確定或需使用者自行確認的項目 */
  notes?: string;
}

export interface CasePart extends BasePart {
  category: "case";
  supportedMotherboards: MotherboardFormFactor[];
  maxGpuLengthMm: number;
  maxCpuCoolerHeightMm: number;
  maxPsuLengthMm: number;
  cableManagementSpaceMm: number;
  /** 前置水冷排支援尺寸，例如 [240, 280, 360]，空陣列代表不支援 */
  frontRadiatorSupport: number[];
  /** 頂置水冷排支援尺寸 */
  topRadiatorSupport: number[];
  driveBayRemovable: boolean;
}

export interface MotherboardPart extends BasePart {
  category: "motherboard";
  formFactor: MotherboardFormFactor;
  widthMm: number;
  heightMm: number;
  socket: string;
  chipset: string;
}

export interface GpuPart extends BasePart {
  category: "gpu";
  lengthMm: number;
  heightMm: number;
  thicknessMm: number;
  slotCount: number;
  powerConnectorType: GpuPowerConnectorType;
  recommendedSideClearanceMm: number;
}

export interface CpuCoolerPart extends BasePart {
  category: "cpuCooler";
  coolerType: "air";
  heightMm: number;
  widthMm: number;
  depthMm: number;
  ramClearanceMm: number;
}

export interface AioCoolerPart extends BasePart {
  category: "aioCooler";
  coolerType: "aio";
  radiatorSizeMm: number;
  radiatorLengthMm: number;
  radiatorWidthMm: number;
  radiatorThicknessMm: number;
  fanThicknessMm: number;
  totalThicknessMm: number;
}

export interface PsuPart extends BasePart {
  category: "psu";
  psuFormFactor: PsuFormFactor;
  lengthMm: number;
  modularType: PsuModularType;
  wattage: number;
}

export type AnyPart =
  | CasePart
  | MotherboardPart
  | GpuPart
  | CpuCoolerPart
  | AioCoolerPart
  | PsuPart;

export interface CompatibilityResult {
  item: string;
  status: CompatibilityStatus;
  message: string;
  measuredValue?: number;
  limitValue?: number;
  remainingValue?: number;
  suggestion?: string;
}

/** 使用者可手動覆蓋的尺寸欄位（第一版支援的子集） */
export interface DimensionOverrides {
  gpuLengthMm?: number;
  gpuThicknessMm?: number;
  cpuCoolerHeightMm?: number;
  caseMaxGpuLengthMm?: number;
  caseMaxCpuCoolerHeightMm?: number;
  caseCableManagementSpaceMm?: number;
  psuLengthMm?: number;
}

export type CoolerChoice =
  | { kind: "none" }
  | { kind: "air"; cooler: CpuCoolerPart }
  | { kind: "aio"; cooler: AioCoolerPart; mountLocation: "front" | "top" };

export interface BuildSelection {
  case?: CasePart;
  motherboard?: MotherboardPart;
  gpu?: GpuPart;
  cooler: CoolerChoice;
  psu?: PsuPart;
  overrides: DimensionOverrides;
}
