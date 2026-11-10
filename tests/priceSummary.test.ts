import { describe, expect, it } from "vitest";
import { summarizePrices } from "@/lib/priceSummary";
import type { PriceEntry } from "@/lib/schema/parts";

const price = (partId: string, priceTwd: number): PriceEntry => ({ partId, priceTwd, updatedAt: "2026-11-10", source: "manual" });

describe("總價摘要", () => {
  it("沒有任何價格 → 無參考價（totalTwd undefined）", () => {
    expect(summarizePrices(["a", "b"], () => undefined)).toEqual({ totalTwd: undefined, missingCount: 2, selectedCount: 2 });
  });
  it("部分有價格 → 只合計已知零件，記錄缺幾項", () => {
    const table = new Map([["a", price("a", 1000)], ["c", price("c", 2500)]]);
    expect(summarizePrices(["a", "b", "c"], (id) => table.get(id))).toEqual({ totalTwd: 3500, missingCount: 1, selectedCount: 3 });
  });
  it("沒選零件 → 無參考價", () => {
    expect(summarizePrices([], () => undefined).totalTwd).toBeUndefined();
  });
});
