// 零件型別：一律由 zod schema 推導（lib/schema/parts.ts），此處只做 re-export，
// 並定義 UI 組合用的型別（選擇狀態、手動覆蓋、相容性結果）。

export type {
  AioPart,
  AirCoolerPart,
  AnyPart,
  CasePart,
  CpuPart,
  GpuPart,
  GpuPowerConnectorType,
  M2SsdPart,
  MotherboardPart,
  PartByCategory,
  PartCategory,
  PriceEntry,
  PsuPart,
  RamPart,
} from "@/lib/schema/parts";
export type { MotherboardFormFactor, PsuFormFactor } from "@/lib/schema/common";

import type { RuleId } from "@/lib/compatibility/rules";
import type {
  AioPart,
  AirCoolerPart,
  CasePart,
  CpuPart,
  GpuPart,
  M2SsdPart,
  MotherboardPart,
  PsuPart,
  RamPart,
} from "@/lib/schema/parts";

/**
 * info = 能用但效能打折或需要知道的事；unknown = 資料不足無法判斷。
 * 嚴重度：incompatible > warning > tight > info > safe；unknown 不參與排序。
 */
export type CompatibilityStatus = "safe" | "info" | "tight" | "warning" | "incompatible" | "unknown";

export interface CompatibilityResult {
  /** 對應 docs/compatibility-spec.md；分組與標題見 RULES[ruleId] */
  ruleId: RuleId;
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
  | { kind: "air"; cooler: AirCoolerPart }
  | { kind: "aio"; cooler: AioPart; mountLocation: "front" | "top" };

export interface BuildSelection {
  case?: CasePart;
  motherboard?: MotherboardPart;
  cpu?: CpuPart;
  ram?: RamPart;
  gpu?: GpuPart;
  cooler: CoolerChoice;
  psu?: PsuPart;
  m2Ssds: M2SsdPart[];
  overrides: DimensionOverrides;
}
