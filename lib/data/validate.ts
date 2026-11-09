// 共用驗證：內建 JSON 與使用者匯入都走這裡。
// 逐筆驗證、回傳結構化錯誤，不整批 throw。

import type { z } from "zod";
import {
  partSchemas,
  priceSchema,
  type PartByCategory,
  type PartCategory,
  type PriceEntry,
} from "@/lib/schema/parts";

export interface ValidationIssue {
  /** 陣列中的第幾筆（0 起算）；整批錯誤（例如不是陣列）為 null */
  index: number | null;
  /** 該筆的 id（若讀得到） */
  id?: string;
  /** 欄位路徑，例如 `gpuLength.noFrontMm` */
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  items: T[];
  errors: ValidationIssue[];
}

function readId(entry: unknown, key: "id" | "partId"): string | undefined {
  if (entry && typeof entry === "object" && key in entry) {
    const v = (entry as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

function validateArray<T>(
  schema: z.ZodType<T>,
  data: unknown,
  idKey: "id" | "partId"
): ValidationResult<T> {
  if (!Array.isArray(data)) {
    return { items: [], errors: [{ index: null, field: "(root)", message: "資料必須是陣列" }] };
  }

  const items: T[] = [];
  const errors: ValidationIssue[] = [];
  const seen = new Map<string, number>();

  data.forEach((entry, index) => {
    const id = readId(entry, idKey);
    const parsed = schema.safeParse(entry);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          index,
          id,
          field: issue.path.length ? issue.path.map(String).join(".") : "(entry)",
          message: issue.message,
        });
      }
      return;
    }
    if (id !== undefined) {
      const first = seen.get(id);
      if (first !== undefined) {
        errors.push({ index, id, field: idKey, message: `${idKey} 重複（與第 ${first} 筆相同）` });
        return;
      }
      seen.set(id, index);
    }
    items.push(parsed.data);
  });

  return { items, errors };
}

/** 驗證某一類別的零件陣列；category 欄位不符也會被 schema 擋下 */
export function validateParts<C extends PartCategory>(
  category: C,
  data: unknown
): ValidationResult<PartByCategory[C]> {
  return validateArray(partSchemas[category] as unknown as z.ZodType<PartByCategory[C]>, data, "id");
}

/** 驗證價格陣列；knownPartIds 有傳入時，會檢查 partId 是否存在 */
export function validatePrices(data: unknown, knownPartIds?: ReadonlySet<string>): ValidationResult<PriceEntry> {
  const result = validateArray(priceSchema, data, "partId");
  if (!knownPartIds) return result;

  const items: PriceEntry[] = [];
  result.items.forEach((p) => {
    if (knownPartIds.has(p.partId)) items.push(p);
    else
      result.errors.push({
        index: null,
        id: p.partId,
        field: "partId",
        message: "找不到對應的零件 id",
      });
  });
  return { items, errors: result.errors };
}

/** 跨類別檢查 id 是否重複（id 在全站必須唯一，分享 URL 會用到） */
export function findDuplicateIdsAcrossCategories(
  lists: ReadonlyArray<ReadonlyArray<{ id: string }>>
): string[] {
  const counts = new Map<string, number>();
  lists.flat().forEach((p) => counts.set(p.id, (counts.get(p.id) ?? 0) + 1));
  return [...counts].filter(([, n]) => n > 1).map(([id]) => id);
}

export function formatIssues(label: string, issues: ValidationIssue[]): string {
  return issues
    .map((e) => `[${label}] #${e.index ?? "-"}${e.id ? ` (${e.id})` : ""} ${e.field}: ${e.message}`)
    .join("\n");
}
