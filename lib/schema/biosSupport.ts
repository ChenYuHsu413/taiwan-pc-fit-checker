// BIOS 支援規則表 schema（R27 使用）。
// 概念：晶片組 + CPU 世代 → 原生支援 / 需更新 BIOS / 不支援。
// 支援等級以「晶片組 × 世代」為準（AMD / Intel 官方通則）；個別主機板的最低版本放 boardOverrides。
// 不做逐顆 CPU 的最低版本表。

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
   * 個別主機板的最低 BIOS 版本（出自主機板廠的 CPU 支援清單）。不覆寫 support 等級。
   * key = motherboard id。
   */
  boardOverrides: z
    .record(partIdSchema, z.object({ minBios: z.string().min(1), sourceUrl: z.url() }))
    .optional(),
  sourceUrl: z.url(),
  verifiedAt: isoDateSchema,
});

export const biosSupportTableSchema = z.object({
  schemaVersion: z.literal(2),
  entries: z.array(biosSupportEntrySchema),
});

export type BiosSupportLevel = z.infer<typeof biosSupportLevelSchema>;
export type BiosSupportEntry = z.infer<typeof biosSupportEntrySchema>;
export type BiosSupportTable = z.infer<typeof biosSupportTableSchema>;
