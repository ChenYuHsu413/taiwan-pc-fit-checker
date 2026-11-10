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
  conditionalMmSchema,
  cpuGenerationSchema,
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
  /** 水冷排＋風扇合計厚度上限（官方寫合計時填這個） */
  maxTotalThicknessMm: mmSchema.optional(),
  /** 只算水冷排本體的厚度上限（官方只寫排厚時填這個）。兩者都允許缺值 */
  maxRadiatorThicknessMm: mmSchema.optional(),
  /** 官方量測條件原文或補充，例如「360 需拆除硬碟籠」 */
  conditionText: z.string().optional(),
});

/** 機殼出廠內附風扇（單一位置） */
const includedFanSchema = z.object({
  /** 風扇尺寸（mm），例如 120、140、170 */
  sizeMm: mmSchema,
  count: countSchema,
  thicknessMm: mmSchema.optional(),
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
    /** 前置安裝水冷排時的上限，依排的尺寸分開（官方只寫某尺寸時，只填那一筆） */
    withFrontRadiator: z
      .array(z.object({ radiatorSize: radiatorSizeSchema, maxGpuMm: mmSchema }))
      .optional(),
    /** 官方只給一個數字且未註明條件 */
    unspecifiedMm: mmSchema.optional(),
    /** 官方量測條件原文 */
    conditionText: z.string().optional(),
  }),
  /** 顯卡高度（由 PCIe 槽往側板方向）上限，條件值 */
  gpuHeightLimits: conditionalMmSchema.optional(),
  /** 塔散高度上限，條件值（量測條件寫在 condition） */
  cpuCoolerHeightLimits: conditionalMmSchema.optional(),
  expansionSlots: countSchema.optional(),
  /** 顯卡安裝方向：horizontal = 只能一般橫插；vertical = 只能直立；both = 兩者皆可 */
  gpuMountOrientation: z.enum(["horizontal", "vertical", "both"]).optional(),
  /** 官方標示的顯卡最大槽數（例如 3.5 槽） */
  maxGpuSlotWidth: z.number().positive().max(8).optional(),
  /** 出廠內附風扇；整個欄位缺值 = 官方未說明，{} = 官方明寫不附風扇 */
  includedFans: z
    .object({
      front: includedFanSchema.optional(),
      top: includedFanSchema.optional(),
      rear: includedFanSchema.optional(),
      bottom: includedFanSchema.optional(),
      side: includedFanSchema.optional(),
    })
    .optional(),
  radiatorMounts: z.object({
    front: radiatorMountSchema.optional(),
    top: radiatorMountSchema.optional(),
    rear: radiatorMountSchema.optional(),
    bottom: radiatorMountSchema.optional(),
    side: radiatorMountSchema.optional(),
  }),
  psu: z.object({
    formFactors: z.array(psuFormFactorSchema).optional(),
    /** PSU 長度上限，條件值（例如 HDD 架數量、Standard / Rotated 模式） */
    lengthLimits: conditionalMmSchema.optional(),
    conditionText: z.string().optional(),
  }),
  /** 背板走線深度（主機板 tray 到背側板） */
  cableSpaceMm: mmSchema.optional(),
});

// ---------- Motherboard ----------

const pcieX16SlotSchema = z.object({
  /** 說明書上的槽位名稱，例如 `PCIEX16_1`；laneSharing 以此引用 */
  label: z.string().min(1).optional(),
  /** 由上往下第幾個擴充槽位（1 起算） */
  slotIndex: countSchema.optional(),
  gen: pcieGenSchema.optional(),
  /** 實際電氣通道數（實體 x16 但電氣 x4 時填 4） */
  electricalLanes: pcieLanesSchema.optional(),
  /** 通道由 CPU 或晶片組提供 */
  laneSource: z.enum(["cpu", "chipset"]).optional(),
});

const m2SlotSchema = z.object({
  /** 說明書上的槽位名稱，例如 `M2_1`；laneSharing 以此引用 */
  label: z.string().min(1).optional(),
  /** PCIe 世代；SATA-only 槽位填 null */
  pcieGen: pcieGenSchema.nullable().optional(),
  pcieLanes: pcieLanesSchema.optional(),
  supportsSata: z.boolean().optional(),
  formFactors: z.array(m2FormFactorSchema).optional(),
  laneSource: z.enum(["cpu", "chipset"]).optional(),
  /** 主機板是否為該槽附散熱片 */
  hasHeatsink: z.boolean().optional(),
});

/**
 * 共用通道：「when 所指的槽位被使用時，affects 所指的槽位變成 effect」。
 * 例：M2_2 安裝裝置時，PCIEX16_1 降為 x8 →
 *   { when: { kind: "m2Slot", label: "M2_2" }, affects: { kind: "pcieSlot", label: "PCIEX16_1" },
 *     effect: { kind: "reducedLanes", lanes: 8 } }
 */
const slotRefSchema = z.object({
  kind: z.enum(["pcieSlot", "m2Slot", "sataPort"]),
  /** 說明書上的名稱，例如 `PCIEX16_2`、`M2_3`、`SATA6G_1` */
  label: z.string().min(1),
});
const laneSharingSchema = z.object({
  /**
   * 觸發條件：
   * - 單一槽位被使用（pcieSlot / m2Slot / sataPort）
   * - allOf：列出的槽位全部被使用時才觸發
   * - cpuGeneration：CPU 屬於列出的世代時觸發（例如 Ryzen 8000 APU 停用部分 M.2）
   */
  when: z.union([
    slotRefSchema.extend({
      /** 觸發條件補充，例如「僅在安裝 SATA 規格 SSD 時」 */
      condition: z.string().optional(),
    }),
    z.object({
      kind: z.literal("allOf"),
      slots: z.array(slotRefSchema).min(2),
      condition: z.string().optional(),
    }),
    z.object({
      kind: z.literal("cpuGeneration"),
      generations: z.array(cpuGenerationSchema).min(1),
    }),
  ]),
  affects: slotRefSchema,
  effect: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("disabled") }),
    z.object({ kind: z.literal("reducedLanes"), lanes: pcieLanesSchema }),
    /** 世代與（或）通道數改變，例如 Ryzen 8000 時 PCIe 5.0 x16 → 4.0 x8 */
    z.object({ kind: z.literal("downgraded"), gen: pcieGenSchema.optional(), lanes: pcieLanesSchema.optional() }),
  ]),
  /** 說明書原文 */
  sourceText: z.string().optional(),
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
  laneSharing: z.array(laneSharingSchema).optional(),
  biosFlashback: z.boolean().optional(),
  /** 是否有影像輸出（HDMI/DP），給內顯使用 */
  hasVideoOutput: z.boolean().optional(),
  /** PCB 版本（同型號不同 PCB 版本 BIOS 支援不同時填，例如 GIGABYTE `1.3`） */
  pcbRevision: z.string().min(1).optional(),
  /** 官方該主機板的 CPU 支援清單頁面（R27 附上連結） */
  cpuSupportListUrl: z.url().optional(),
});

// ---------- CPU ----------

export const cpuSchema = z.object({
  ...basePartShape,
  category: z.literal("cpu"),
  socket: socketSchema,
  /** 世代（CPU_GENERATIONS 之一），用於 BIOS 規則表比對，例如 `amd-ryzen-9000`、`intel-core-ultra-200s` */
  generation: cpuGenerationSchema,
  hasIntegratedGraphics: z.boolean().optional(),
  /** 支援的記憶體類型（Intel 12–14 代可同時支援兩種） */
  memoryTypes: z.array(memoryTypeSchema).min(1).optional(),
  /** 官方標示的最高記憶體速度（MT/s），依類型分開。通常是「每通道 1 條」的條件 */
  officialMemorySpeedMts: z
    .object({ DDR4: countSchema.optional(), DDR5: countSchema.optional() })
    .optional(),
  /**
   * 官方依條數與 rank 分開列的記憶體速度表（例如 AMD「2x1R DDR5-5600 / 4x2R DDR5-3600」）。
   * 有此表時 R26 以表為準。modulesPerChannel = 總條數 ÷ 2（雙通道）
   */
  memorySpeedTable: z
    .array(
      z.object({
        memoryType: memoryTypeSchema,
        modulesPerChannel: z.union([z.literal(1), z.literal(2)]),
        rank: z.union([z.literal(1), z.literal(2), z.literal(4)]),
        mts: countSchema,
      })
    )
    .optional(),
  /** AMD Default TDP / Intel Processor Base Power */
  tdpW: wattSchema.optional(),
  /** CPU 官方最大支援記憶體容量 */
  maxMemoryCapacityGb: countSchema.optional(),
  /** 官方公開的最大功耗（Intel Maximum Turbo Power / AMD 若有公開 PPT）。不可自行用倍率推算 */
  maxPowerW: wattSchema.optional(),
  /** MTP = Intel ARK「Maximum Turbo Power」；PPT = AMD Package Power Tracking */
  maxPowerDefinition: z.enum(["PPT", "MTP", "other"]).optional(),
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
  /** 每條模組的 rank 數（官方 1Rx8 → 1、2Rx8 → 2）；缺值 = 官方未寫 */
  rank: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
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
  /** 顯示晶片 id，對應 data/reference/gpu-chips.json（板卡廠沒寫的 PCIe / 功耗 / 建議電源由此補） */
  gpuChip: partIdSchema,
  /**
   * 尺寸是否由判讀而來（官方沒標軸向時：最大值 = 長度、最接近「槽數 × 20.32」= 厚度、剩下 = 高度）。
   * true 時 notes 必須說明判讀依據
   */
  dimensionsAxisInferred: z.boolean().optional(),
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
  /** 顯卡端可以插的 PCIe 8-pin（6+2）接頭總數；一條線分兩個頭算 2 */
  pcie8PinCount: nonNegativeCountSchema.optional(),
});

// ---------- M.2 SSD ----------

export const m2SsdSchema = z.object({
  ...basePartShape,
  category: z.literal("m2Ssd"),
  /** pcie.modes 可列多種，例如 990 EVO Plus「PCIe 4.0 x4 / 5.0 x2」；第一筆為主要模式 */
  interface: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("pcie"),
      modes: z.array(z.object({ gen: pcieGenSchema, lanes: pcieLanesSchema })).min(1),
    }),
    z.object({ kind: z.literal("sata") }),
  ]),
  formFactor: m2FormFactorSchema,
  hasHeatsink: z.boolean().optional(),
  /** 模組總高度（含 PCB 與散熱片，官方 datasheet 的高度），不是散熱片本身高度 */
  moduleTotalHeightMm: mmSchema.optional(),
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
  /** manual = 人工查詢的參考價；userImport = 使用者貼估價單覆蓋 */
  source: z.enum(["manual", "userImport"]),
  note: z.string().optional(),
});
export type PriceEntry = z.infer<typeof priceSchema>;
