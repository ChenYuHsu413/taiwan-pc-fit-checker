import { describe, expect, it } from "vitest";
import { PART_CATEGORIES } from "@/lib/schema/parts";
import { biosSupportTableSchema } from "@/lib/schema/biosSupport";
import {
  findDuplicateIdsAcrossCategories,
  formatIssues,
  validateParts,
  validatePrices,
} from "@/lib/data/validate";
import { RAW_BIOS_SUPPORT, RAW_PARTS, RAW_PRICES } from "@/lib/data/catalog";

describe("內建資料 smoke test", () => {
  const validated = PART_CATEGORIES.map((category) => ({
    category,
    result: validateParts(category, RAW_PARTS[category]),
  }));

  it.each(validated)("parts/$category.json 全部通過驗證", ({ category, result }) => {
    expect(formatIssues(category, result.errors)).toBe("");
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("id 在所有類別間不重複", () => {
    expect(findDuplicateIdsAcrossCategories(validated.map((v) => v.result.items))).toEqual([]);
  });

  it("價格檔全部通過驗證，且 partId 都對應到零件", () => {
    const ids = new Set(validated.flatMap((v) => v.result.items.map((p) => p.id)));
    for (const category of PART_CATEGORIES) {
      const result = validatePrices(RAW_PRICES[category], ids);
      expect(formatIssues(`prices/${category}`, result.errors)).toBe("");
    }
  });

  it("BIOS 規則表格式正確", () => {
    expect(biosSupportTableSchema.safeParse(RAW_BIOS_SUPPORT).success).toBe(true);
  });
});

describe("驗證函式會逐筆回報錯誤", () => {
  it("缺欄位、單位錯誤與重複 id 都會被抓出，且不影響其他筆", () => {
    const good = (RAW_PARTS.psu as unknown[])[0] as Record<string, unknown>;
    const result = validateParts("psu", [
      good,
      { ...good },
      { ...good, id: "bad-length", lengthMm: -1 },
      { ...good, id: "Bad Id" },
    ]);
    expect(result.items.map((p) => p.id)).toEqual([good.id]);
    expect(result.errors.map((e) => [e.index, e.field])).toEqual([
      [1, "id"],
      [2, "lengthMm"],
      [3, "id"],
    ]);
  });

  it("非陣列輸入回傳整批錯誤而不是 throw", () => {
    expect(validateParts("gpu", { not: "array" }).errors[0].index).toBeNull();
  });
});
