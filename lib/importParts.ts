// 資料匯入（使用者匯入）：與內建 JSON 共用 lib/data/validate.ts 的驗證。
// 目前尚未接上 UI；CSV / 原價屋貼上文字解析在 Phase 4 實作。

import type { PartByCategory, PartCategory } from "@/types/parts";
import { validateParts, type ValidationIssue } from "@/lib/data/validate";

export type ImportSource = "json" | "csv" | "pastedText" | "manual";

export interface ImportResult<C extends PartCategory> {
  parts: PartByCategory[C][];
  errors: ValidationIssue[];
}

/** 匯入某一類別的 JSON 零件陣列，逐筆驗證 */
export function importFromJson<C extends PartCategory>(category: C, jsonText: string): ImportResult<C> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { parts: [], errors: [{ index: null, field: "(root)", message: "JSON 格式錯誤，請確認內容是否為合法 JSON。" }] };
  }
  const { items, errors } = validateParts(category, parsed);
  return { parts: items, errors };
}

/** CSV 匯入，尚未實作（Phase 4） */
export function importFromCsv<C extends PartCategory>(_category: C, _csvText: string): ImportResult<C> {
  return { parts: [], errors: [{ index: null, field: "(root)", message: "CSV 匯入尚未實作，敬請期待後續版本。" }] };
}

/** 貼上原價屋估價單文字後半自動解析，尚未實作（Phase 4） */
export function importFromPastedText(_pastedText: string): { errors: ValidationIssue[] } {
  return { errors: [{ index: null, field: "(root)", message: "貼上文字解析尚未實作，敬請期待後續版本。" }] };
}
