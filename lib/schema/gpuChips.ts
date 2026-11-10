// 顯示晶片參考表 schema（data/reference/gpu-chips.json）。
// 只收 NVIDIA / AMD 官方頁面的數值；板卡廠規格頁沒寫的欄位，規則改用這張表（R15、R29）。

import { z } from "zod";
import { isoDateSchema, partIdSchema, pcieGenSchema, pcieLanesSchema, wattSchema } from "./common";

export const gpuChipSchema = z.object({
  /** 例如 `nvidia-geforce-rtx-5090`；gpu.gpuChip 以此引用 */
  id: partIdSchema,
  vendor: z.enum(["NVIDIA", "AMD"]),
  name: z.string().min(1),
  pcieGen: pcieGenSchema.optional(),
  /** 官方明寫 x16 / x8 才填 */
  pcieLanes: pcieLanesSchema.optional(),
  /** 官方 Total Graphics Power / Total Board Power */
  tbpW: wattSchema.optional(),
  /** 官方建議（或最低）系統電源瓦數 */
  recommendedPsuW: wattSchema.optional(),
  /** 官方對電源瓦數的用詞原文，例如 `Required System Power`、`Minimum PSU Recommendation` */
  psuWording: z.string().optional(),
  sourceUrl: z.url(),
  verifiedAt: isoDateSchema,
  notes: z.string().optional(),
});

export const gpuChipTableSchema = z.object({
  schemaVersion: z.literal(1),
  chips: z.array(gpuChipSchema),
});

export type GpuChip = z.infer<typeof gpuChipSchema>;
export type GpuChipTable = z.infer<typeof gpuChipTableSchema>;
