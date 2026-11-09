// BIOS 支援規則表 schema（R27 使用）。
// 概念：晶片組 + CPU 世代 → 原生支援 / 需更新 BIOS / 不支援。
// Phase 1 只定格式；真實對照關係在 Phase 2 由官方 CPU 支援清單整理，不憑記憶填寫。

import { z } from "zod";
import { cpuGenerationSchema, isoDateSchema, partIdSchema } from "./common";

export const biosSupportLevelSchema = z.enum(["native", "biosUpdate", "unsupported"]);

export const biosSupportEntrySchema = z.object({
  /** 晶片組名稱，需與 motherboard.chipset 完全一致，例如 `B650` */
  chipset: z.string().min(1),
  /** 需與 cpu.generation 一致，例如 `amd-ryzen-9000` */
  cpuGeneration: cpuGenerationSchema,
  support: biosSupportLevelSchema,
  /** 需更新 BIOS 時的補充，例如官方列出的最低 BIOS / AGESA 版本 */
  minBiosNote: z.string().optional(),
  /**
   * 個別主機板的例外（例如某款板子出廠就已經支援）。
   * key = motherboard id；value 覆寫 support。
   */
  boardOverrides: z.record(partIdSchema, biosSupportLevelSchema).optional(),
  sourceUrl: z.url(),
  verifiedAt: isoDateSchema,
});

export const biosSupportTableSchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(biosSupportEntrySchema),
});

export type BiosSupportLevel = z.infer<typeof biosSupportLevelSchema>;
export type BiosSupportEntry = z.infer<typeof biosSupportEntrySchema>;
export type BiosSupportTable = z.infer<typeof biosSupportTableSchema>;
