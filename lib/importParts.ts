// 資料匯入架構（預留）
// 第一版僅實作 JSON 匯入；CSV / 原價屋貼上文字解析留待後續版本擴充。

import type { AnyPart } from "@/types/parts";

export type ImportSource = "json" | "csv" | "pastedText" | "manual";

export interface ImportResult {
  parts: AnyPart[];
  errors: string[];
}

/** 匯入 JSON 格式的零件資料（陣列），第一版僅做基本欄位檢查 */
export function importFromJson(jsonText: string): ImportResult {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { parts: [], errors: ["JSON 格式錯誤，請確認內容是否為合法 JSON。"] };
  }

  if (!Array.isArray(parsed)) {
    return { parts: [], errors: ["JSON 內容必須是零件陣列。"] };
  }

  const parts: AnyPart[] = [];
  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || !("id" in entry) || !("category" in entry)) {
      errors.push(`第 ${index + 1} 筆資料缺少必要欄位（id / category），已略過。`);
      return;
    }
    parts.push(entry as AnyPart);
  });

  return { parts, errors };
}

/** CSV 匯入，尚未實作 */
export function importFromCsv(_csvText: string): ImportResult {
  return { parts: [], errors: ["CSV 匯入尚未實作，敬請期待後續版本。"] };
}

/** 貼上原價屋商品文字後半自動解析，尚未實作 */
export function importFromPastedText(_pastedText: string): ImportResult {
  return { parts: [], errors: ["貼上文字解析尚未實作，敬請期待後續版本。"] };
}
