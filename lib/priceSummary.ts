// 零件選擇區的總價摘要：只合計有參考價的零件，並記錄幾項沒有參考價。

import type { PriceEntry } from "@/lib/schema/parts";

export interface PriceSummary {
  /** 有參考價的零件合計；沒有任何價格時為 undefined */
  totalTwd?: number;
  /** 已選但沒有參考價的零件數 */
  missingCount: number;
  selectedCount: number;
}

export function summarizePrices(
  partIds: string[],
  getPrice: (id: string) => PriceEntry | undefined
): PriceSummary {
  const prices = partIds.map((id) => getPrice(id)?.priceTwd);
  const known = prices.filter((p): p is number => p !== undefined);
  return {
    totalTwd: known.length ? known.reduce((a, b) => a + b, 0) : undefined,
    missingCount: prices.length - known.length,
    selectedCount: prices.length,
  };
}
