// 零件 zod schema（單一真相來源）：TS 型別一律由 z.infer 推導，不另外手寫 interface。
// 欄位逐一說明見 docs/schema.md。
//
// 座標軸約定（零件以「裝進直立機殼後」的方向描述）：
//   height = 上下、depth = 前後、width = 左右（垂直於主機板）

import { z } from "zod";
import {
  basePartShape,
  countSchema,
  isoDateSchema,
  m2FormFactorSchema,
  memoryTypeSchema,
  mmSchema,
  motherboardFormFactorSchema,
  nonNegativeCountSchema,
  partIdSchema,
  pcieGenSchema,
  pcieLanesSchema,
  psuFormFactorSchema,
  radiatorSizeSchema,
  socketSchema,
  wattSchema,
} from "./common";

export const PART_CATEGORIES = [
  "case",
  "motherboard",
  "cpu",
  "ram",
  "gpu",
  "airCooler",
  "aio",
  "psu",
  "m2Ssd",
] as const;
export const partCategorySchema = z.enum(PART_CATEGORIES);
export type PartCategory = z.infer<typeof partCategorySchema>;

// ---------- Case ----------

/** 單一水冷排安裝位置。sizes = [] 表示官方明確不支援；整個位置缺值表示官方未說明。 */
const radiatorMountSchema = z.object({
  sizes: z.array(radiatorSizeSchema),
  /** 水冷排＋風扇合計厚度上限（mm） */
  maxTotalThicknessMm: mmSchema.optional(),
  /** 官方量測條件原文或補充，例如「360 需拆除硬碟籠」 */
  conditionText: z.string().optional(),
});

export const caseSchema = z.object({
  ...basePartShape,
  category: z.literal("case"),
  /** 外觀尺寸 */
  external: z.object({
    depthMm: mmSchema.optional(),
    widthMm: mmSchema.optional(),
    heightMm: mmSchema.optional(),
  }),
  supportedFormFactors: z.array(motherboardFormFactorSchema).min(1),
  /** 支援 E-ATX 時的主機板最大寬度（前後方向，mm） */
  maxMotherboardDepthMm: mmSchema.optional(),
  /** 顯卡長度上限，依前置條件分開記錄 */
  gpuLength: z.object({
    /** 前置未安裝風扇或水冷排 */
    noFrontMm: mmSchema.optional(),
    /** 前置安裝風扇（通常 25mm） */
    withFrontFanMm: mmSchema.optional(),
    /** 前置安裝水冷排＋風扇 */
    withFrontRadiatorMm: mmSchema.optional(),
    /** 官方只給一個數字且未註明條件 */
    unspecifiedMm: mmSchema.optional(),
    /** 官方量測條件原文 */
    conditionText: z.string().optional(),
  }),
  /** 顯卡高度（由 PCIe 槽往側板方向）上限 */
  gpuMaxHeightMm: mmSchema.optional(),
  maxCpuCoolerHeightMm: mmSchema.optional(),
  expansionSlots: countSchema.optional(),
  radiatorMounts: z.object({
    front: radiatorMountSchema.optional(),
    top: radiatorMountSchema.optional(),
    rear: radiatorMountSchema.optional(),
    bottom: radiatorMountSchema.optional(),
    side: radiatorMountSchema.optional(),
  }),
  psu: z.object({
    formFactors: z.array(psuFormFactorSchema).optional(),
    /** 保留硬碟籠時的 PSU 長度上限 */
    withDriveCageMm: mmSchema.optional(),
    /** 拆除硬碟籠後的 PSU 長度上限 */
    withoutDriveCageMm: mmSchema.optional(),
    /** 官方只給一個數字且未註明條件 */
    unspecifiedMm: mmSchema.optional(),
    driveCageRemovable: z.boolean().optional(),
    conditionText: z.string().optional(),
  }),
  /** 背板走線深度（主機板 tray 到背側板） */
  cableSpaceMm: mmSchema.optional(),
});

// ---------- Motherboard ----------

const pcieX16SlotSchema = z.object({
  /** 由上往下第幾個擴充槽位（1 起算） */
  slotIndex: countSchema.optional(),
  gen: pcieGenSchema.optional(),
  /** 實際電氣通道數（實體 x16 但電氣 x4 時填 4） */
  electricalLanes: pcieLanesSchema.optional(),
  /** 通道由 CPU 或晶片組提供 */
  laneSource: z.enum(["cpu", "chipset"]).optional(),
});

const m2SlotSchema = z.object({
  /** PCIe 世代；SATA-only 槽位填 null */
  pcieGen: pcieGenSchema.nullable().optional(),
  pcieLanes: pcieLanesSchema.optional(),
  supportsSata: z.boolean().optional(),
  formFactors: z.array(m2FormFactorSchema).optional(),
  laneSource: z.enum(["cpu", "chipset"]).optional(),
  /** 主機板是否為該槽附散熱片 */
  hasHeatsink: z.boolean().optional(),
});

export const motherboardSchema = z.object({
  ...basePartShape,
  category: z.literal("motherboard"),
  formFactor: motherboardFormFactorSchema,
  socket: socketSchema,
  chipset: z.string().min(1),
  /** 板子尺寸。heightMm = 裝機後上下方向（ATX 305）；depthMm = 前後方向（ATX 244） */
  dimensions: z.object({
    heightMm: mmSchema.optional(),
    depthMm: mmSchema.optional(),
  }),
  /** 單選：LGA1700 的 DDR4 / DDR5 版本請拆成兩筆資料。缺值 = 尚未確認是哪個版本 */
  memoryType: memoryTypeSchema.optional(),
  memorySlots: countSchema.optional(),
  maxMemorySpeedMts: countSchema.optional(),
  maxMemoryCapacityGb: countSchema.optional(),
  pcieX16Slots: z.array(pcieX16SlotSchema).optional(),
  m2Slots: z.array(m2SlotSchema).optional(),
  biosFlashback: z.boolean().optional(),
  /** 是否有影像輸出（HDMI/DP），給內顯使用 */
  hasVideoOutput: z.boolean().optional(),
});

// ---------- CPU ----------

export const cpuSchema = z.object({
  ...basePartShape,
  category: z.literal("cpu"),
  socket: socketSchema,
  /** 世代／系列 slug，用於 BIOS 規則表比對，例如 `ryzen-9000`、`core-ultra-200s` */
  generation: partIdSchema,
  hasIntegratedGraphics: z.boolean().optional(),
  /** 支援的記憶體類型（Intel 12–14 代可同時支援兩種） */
  memoryTypes: z.array(memoryTypeSchema).min(1).optional(),
  /** 官方支援的記憶體速度（MT/s），依類型分開 */
  officialMemorySpeedMts: z
    .object({ DDR4: countSchema.optional(), DDR5: countSchema.optional() })
    .optional(),
  /** AMD Default TDP / Intel Processor Base Power */
  tdpW: wattSchema.optional(),
  /** AMD PPT / Intel Maximum Turbo Power (PL2) */
  maxPowerW: wattSchema.optional(),
  maxPowerDefinition: z.enum(["PPT", "PL2", "other"]).optional(),
  /** CPU 直接提供的 PCIe 世代 */
  pcieGen: z
    .object({ gpu: pcieGenSchema.optional(), m2: pcieGenSchema.optional() })
    .optional(),
});

// ---------- RAM ----------

export const ramSchema = z.object({
  ...basePartShape,
  category: z.literal("ram"),
  memoryType: memoryTypeSchema,
  moduleCapacityGb: countSchema,
  /** 套裝條數 */
  moduleCount: countSchema,
  speedMts: countSchema,
  /** 標稱速度是否需要開 XMP / EXPO */
  requiresXmpExpo: z.boolean().optional(),
  /** 模組高度（含散熱片） */
  moduleHeightMm: mmSchema.optional(),
});

// ---------- GPU ----------

export const gpuPowerConnectorTypeSchema = z.enum([
  "12V-2x6",
  "12VHPWR",
  /** 官方只寫 16-pin，無法區分 12VHPWR / 12V-2x6 */
  "16-pin",
  "8-pin",
  "6-pin",
]);

export const gpuSchema = z.object({
  ...basePartShape,
  category: z.literal("gpu"),
  /** 長度（前後方向）。是否含擋板請寫在 notes */
  lengthMm: mmSchema.optional(),
  /** 高度（由 PCIe 槽往側板方向） */
  heightMm: mmSchema.optional(),
  /** 厚度（垂直於 PCB） */
  thicknessMm: mmSchema.optional(),
  /** 佔用槽數，可為小數，例如 2.5 */
  slotWidth: z.number().positive().max(6).optional(),
  powerConnectors: z
    .array(z.object({ type: gpuPowerConnectorTypeSchema, count: countSchema }))
    .optional(),
  tbpW: wattSchema.optional(),
  recommendedPsuW: wattSchema.optional(),
  pcieGen: pcieGenSchema.optional(),
  pcieLanes: pcieLanesSchema.optional(),
  /**
   * [mock 遺留欄位] 建議側板彎折淨空。沒有官方來源，Phase 3 的 R12 改寫後會移除。
   */
  legacyRecommendedSideClearanceMm: mmSchema.optional(),
});

// ---------- Air cooler ----------

export const airCoolerSchema = z.object({
  ...basePartShape,
  category: z.literal("airCooler"),
  /** 高度（含風扇，由 CPU 表面起算） */
  heightMm: mmSchema.optional(),
  widthMm: mmSchema.optional(),
  depthMm: mmSchema.optional(),
  supportedSockets: z.array(socketSchema).optional(),
  ramClearance: z
    .object({
      /** 風扇在預設位置時可容納的 RAM 最大高度 */
      defaultMm: mmSchema.optional(),
      /** 風扇上移後可容納的 RAM 最大高度 */
      withFanRaisedMm: mmSchema.optional(),
    })
    .optional(),
});

// ---------- AIO ----------

export const aioSchema = z.object({
  ...basePartShape,
  category: z.literal("aio"),
  radiatorSize: radiatorSizeSchema,
  radiatorLengthMm: mmSchema.optional(),
  radiatorWidthMm: mmSchema.optional(),
  radiatorThicknessMm: mmSchema.optional(),
  fanThicknessMm: mmSchema.optional(),
  supportedSockets: z.array(socketSchema).optional(),
});

// ---------- PSU ----------

export const psuSchema = z.object({
  ...basePartShape,
  category: z.literal("psu"),
  formFactor: psuFormFactorSchema,
  wattage: wattSchema,
  lengthMm: mmSchema.optional(),
  modularType: z.enum(["non", "semi", "full"]).optional(),
  /** 原生 12V-2x6 / 12VHPWR 接頭數；0 = 確定沒有，缺值 = 未知 */
  native16PinCount: nonNegativeCountSchema.optional(),
  pcie8PinCount: nonNegativeCountSchema.optional(),
});

// ---------- M.2 SSD ----------

export const m2SsdSchema = z.object({
  ...basePartShape,
  category: z.literal("m2Ssd"),
  interface: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("pcie"), gen: pcieGenSchema, lanes: pcieLanesSchema }),
    z.object({ kind: z.literal("sata") }),
  ]),
  formFactor: m2FormFactorSchema,
  hasHeatsink: z.boolean().optional(),
  heatsinkHeightMm: mmSchema.optional(),
});

// ---------- 彙整 ----------

export const partSchemas = {
  case: caseSchema,
  motherboard: motherboardSchema,
  cpu: cpuSchema,
  ram: ramSchema,
  gpu: gpuSchema,
  airCooler: airCoolerSchema,
  aio: aioSchema,
  psu: psuSchema,
  m2Ssd: m2SsdSchema,
} as const;

export type CasePart = z.infer<typeof caseSchema>;
export type MotherboardPart = z.infer<typeof motherboardSchema>;
export type CpuPart = z.infer<typeof cpuSchema>;
export type RamPart = z.infer<typeof ramSchema>;
export type GpuPart = z.infer<typeof gpuSchema>;
export type AirCoolerPart = z.infer<typeof airCoolerSchema>;
export type AioPart = z.infer<typeof aioSchema>;
export type PsuPart = z.infer<typeof psuSchema>;
export type M2SsdPart = z.infer<typeof m2SsdSchema>;
export type GpuPowerConnectorType = z.infer<typeof gpuPowerConnectorTypeSchema>;

export type PartByCategory = { [K in PartCategory]: z.infer<(typeof partSchemas)[K]> };
export type AnyPart = PartByCategory[PartCategory];

// ---------- 價格（與規格分開存放） ----------

export const priceSchema = z.object({
  partId: partIdSchema,
  priceTwd: z.number().int().positive(),
  updatedAt: isoDateSchema,
  /**
   * manual = 人工查詢的參考價；userImport = 使用者貼估價單覆蓋；
   * mock = Phase 1 搬遷的假資料（Phase 2 全部換掉）
   */
  source: z.enum(["manual", "userImport", "mock"]),
  note: z.string().optional(),
});
export type PriceEntry = z.infer<typeof priceSchema>;
