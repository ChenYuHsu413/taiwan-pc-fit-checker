// 共用 zod 基礎型別
// 單位約定：長度 mm、功率 W、價格新台幣整數、記憶體速度 MT/s、容量 GB。
// 尺寸欄位一律 optional：缺值 = 官方未公開，不等於 0。

import { z } from "zod";

/** 穩定可讀 id（slug）：小寫英數與 `-`，例如 `nzxt-h6-flow`。發布後不可更改（分享 URL 依賴）。 */
export const partIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id 只能使用小寫英數與 -，且不能以 - 開頭或結尾");

/** ISO 8601 日期（YYYY-MM-DD） */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必須為 YYYY-MM-DD");

/** 長度（mm）。上限 1000 只用來擋掉單位錯誤（例如誤填 cm×100），並非規格上限。 */
export const mmSchema = z.number().positive().max(1000);

/** 功率（W） */
export const wattSchema = z.number().int().positive().max(3000);

/** 正整數數量 */
export const countSchema = z.number().int().positive();

/** 可為 0 的整數數量（例如原生 12V-2x6 接頭數 = 0 表示確定沒有） */
export const nonNegativeCountSchema = z.number().int().nonnegative();

export const motherboardFormFactorSchema = z.enum(["E-ATX", "ATX", "M-ATX", "ITX"]);
export const psuFormFactorSchema = z.enum(["ATX", "SFX", "SFX-L"]);
export const memoryTypeSchema = z.enum(["DDR4", "DDR5"]);
export const pcieGenSchema = z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
export const pcieLanesSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(4),
  z.literal(8),
  z.literal(16),
]);
export const radiatorSizeSchema = z.union([
  z.literal(120),
  z.literal(140),
  z.literal(240),
  z.literal(280),
  z.literal(360),
  z.literal(420),
]);
export const m2FormFactorSchema = z.enum(["2230", "2242", "2260", "2280", "22110"]);

/**
 * CPU 腳位。用字串而非 enum：新腳位上市時只需加資料、不必改 schema。
 * 格式約定：AMD `AM4`/`AM5`，Intel `LGA1700`/`LGA1851`。
 */
export const socketSchema = z.string().regex(/^[A-Za-z]+\d+$/, "腳位格式不符，例如 AM5、LGA1851");

/**
 * CPU 世代（細分命名，BIOS 規則表以此比對）。每個值包含哪些系列見 docs/schema.md §3.3。
 * X3D 與 APU 另外分，因為它們需要的最低 BIOS 常與同代一般型號不同。
 */
export const CPU_GENERATIONS = [
  "intel-core-12",
  "intel-core-13",
  "intel-core-14",
  "intel-core-ultra-200s",
  "amd-ryzen-7000",
  "amd-ryzen-7000-x3d",
  "amd-ryzen-8000",
  "amd-ryzen-9000",
  "amd-ryzen-9000-x3d",
] as const;
export const cpuGenerationSchema = z.enum(CPU_GENERATIONS);
export type CpuGeneration = z.infer<typeof cpuGenerationSchema>;

/** 所有零件共用欄位 */
export const basePartShape = {
  id: partIdSchema,
  brand: z.string().min(1),
  model: z.string().min(1),
  /** 台灣通路常見品名 */
  twName: z.string().min(1),
  /** 原廠產品規格頁 URL；null = 尚未取得（mock / placeholder），不可填品牌首頁 */
  sourceUrl: z.url().nullable(),
  /** 規格最後一次對照官方頁面的日期；null = 未驗證（mock） */
  specVerifiedAt: isoDateSchema.nullable(),
  notes: z.string().optional(),
};

export type PcieGen = z.infer<typeof pcieGenSchema>;
export type PcieLanes = z.infer<typeof pcieLanesSchema>;
export type MemoryType = z.infer<typeof memoryTypeSchema>;
export type MotherboardFormFactor = z.infer<typeof motherboardFormFactorSchema>;
export type PsuFormFactor = z.infer<typeof psuFormFactorSchema>;
export type RadiatorSize = z.infer<typeof radiatorSizeSchema>;
export type M2FormFactor = z.infer<typeof m2FormFactorSchema>;
