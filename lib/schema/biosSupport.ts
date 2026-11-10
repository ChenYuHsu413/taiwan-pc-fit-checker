// BIOS 支援規則表 schema（R27 使用，schemaVersion 3）。
// R27 判斷順序：
//   1. boardOverrides：主機板官方 CPU 支援清單明確寫了這顆 CPU 的最低 BIOS → 以它為準
//   2. CPU 的 supportedChipsets（AMD Supporting Chipsets）：主機板晶片組不在清單內 → 不支援
//   3. entries：晶片組 × CPU 世代的官方通則（AMD / Intel）
//   4. 都沒有 → unknown

import { z } from "zod";
import { cpuGenerationSchema, isoDateSchema, partIdSchema } from "./common";

export const biosSupportLevelSchema = z.enum(["native", "biosUpdate", "unsupported"]);

/** 晶片組層級：晶片組 + CPU 世代 → 原生支援 / 需更新 BIOS / 不支援 */
export const biosSupportEntrySchema = z.object({
  /** 晶片組名稱，需與 motherboard.chipset 完全一致，例如 `B650` */
  chipset: z.string().min(1),
  /** 需與 cpu.generation 一致，例如 `amd-ryzen-9000` */
  cpuGeneration: cpuGenerationSchema,
  support: biosSupportLevelSchema,
  /** 官方通則原文或判斷依據 */
  minBiosNote: z.string().optional(),
  sourceUrl: z.url(),
  verifiedAt: isoDateSchema,
});

/** 主機板層級：主機板官方 CPU 支援清單上，某顆 CPU 需要的最低 BIOS（優先於晶片組層級） */
export const boardOverrideSchema = z.object({
  motherboardId: partIdSchema,
  cpuId: partIdSchema,
  /** native = 清單寫 all / 第一版 BIOS 即支援；biosUpdate = 需要 minBios 以上的版本 */
  support: z.enum(["native", "biosUpdate"]),
  /** 清單上的版本原文，例如 `2613`、`all` */
  minBios: z.string().min(1),
  /** 這顆 CPU 從哪一版 BIOS 開始可以開機（只有 ASRock 清單有這一欄）；比 minBios 舊時，可裝上後自行更新 */
  bootableSinceBios: z.string().min(1).optional(),
  sourceUrl: z.url(),
  verifiedAt: isoDateSchema,
});

export const biosSupportTableSchema = z.object({
  schemaVersion: z.literal(3),
  entries: z.array(biosSupportEntrySchema),
  boardOverrides: z.array(boardOverrideSchema),
});

export type BiosSupportLevel = z.infer<typeof biosSupportLevelSchema>;
export type BiosSupportEntry = z.infer<typeof biosSupportEntrySchema>;
export type BoardOverride = z.infer<typeof boardOverrideSchema>;
export type BiosSupportTable = z.infer<typeof biosSupportTableSchema>;
