// 內建資料載入：import JSON → 共用驗證 → 匯出 typed 資料。
// 驗證失敗直接 throw，讓 `next build`（預先渲染時會載入本模組）與 vitest 失敗。

import caseData from "@/data/parts/case.json";
import motherboardData from "@/data/parts/motherboard.json";
import cpuData from "@/data/parts/cpu.json";
import ramData from "@/data/parts/ram.json";
import gpuData from "@/data/parts/gpu.json";
import airCoolerData from "@/data/parts/airCooler.json";
import aioData from "@/data/parts/aio.json";
import psuData from "@/data/parts/psu.json";
import m2SsdData from "@/data/parts/m2Ssd.json";
import casePrices from "@/data/prices/case.json";
import motherboardPrices from "@/data/prices/motherboard.json";
import cpuPrices from "@/data/prices/cpu.json";
import ramPrices from "@/data/prices/ram.json";
import gpuPrices from "@/data/prices/gpu.json";
import airCoolerPrices from "@/data/prices/airCooler.json";
import aioPrices from "@/data/prices/aio.json";
import psuPrices from "@/data/prices/psu.json";
import m2SsdPrices from "@/data/prices/m2Ssd.json";
import biosSupportData from "@/data/rules/bios-support.json";
import { biosSupportTableSchema } from "@/lib/schema/biosSupport";
import type { PartByCategory, PartCategory, PriceEntry } from "@/lib/schema/parts";
import {
  findDuplicateIdsAcrossCategories,
  formatIssues,
  validateParts,
  validatePrices,
} from "./validate";

/** 原始 JSON（未驗證）。測試也從這裡取，確保與實際載入的是同一批檔案。 */
export const RAW_PARTS: Record<PartCategory, unknown> = {
  case: caseData,
  motherboard: motherboardData,
  cpu: cpuData,
  ram: ramData,
  gpu: gpuData,
  airCooler: airCoolerData,
  aio: aioData,
  psu: psuData,
  m2Ssd: m2SsdData,
};

export const RAW_PRICES: Record<PartCategory, unknown> = {
  case: casePrices,
  motherboard: motherboardPrices,
  cpu: cpuPrices,
  ram: ramPrices,
  gpu: gpuPrices,
  airCooler: airCoolerPrices,
  aio: aioPrices,
  psu: psuPrices,
  m2Ssd: m2SsdPrices,
};

export const RAW_BIOS_SUPPORT: unknown = biosSupportData;

type Catalog = { [K in PartCategory]: PartByCategory[K][] };

function load(): { parts: Catalog; prices: Map<string, PriceEntry> } {
  const problems: string[] = [];
  const parts = {} as Catalog;

  (Object.keys(RAW_PARTS) as PartCategory[]).forEach(<C extends PartCategory>(category: C) => {
    const result = validateParts(category, RAW_PARTS[category]);
    if (result.errors.length) problems.push(formatIssues(`parts/${category}`, result.errors));
    parts[category] = result.items as Catalog[C];
  });

  const duplicates = findDuplicateIdsAcrossCategories(Object.values(parts));
  if (duplicates.length) problems.push(`跨類別 id 重複：${duplicates.join(", ")}`);

  const knownIds = new Set(Object.values(parts).flat().map((p) => p.id));
  const prices = new Map<string, PriceEntry>();
  (Object.keys(RAW_PRICES) as PartCategory[]).forEach((category) => {
    const result = validatePrices(RAW_PRICES[category], knownIds);
    if (result.errors.length) problems.push(formatIssues(`prices/${category}`, result.errors));
    result.items.forEach((p) => prices.set(p.partId, p));
  });

  const bios = biosSupportTableSchema.safeParse(RAW_BIOS_SUPPORT);
  if (!bios.success) problems.push(`[rules/bios-support] ${bios.error.message}`);

  if (problems.length) {
    throw new Error(`內建資料驗證失敗：\n${problems.join("\n")}`);
  }
  return { parts, prices };
}

const loaded = load();

export const catalog: Catalog = loaded.parts;

export function getPrice(partId: string): PriceEntry | undefined {
  return loaded.prices.get(partId);
}

export const PRICE_STALE_DAYS = 30;

/** 參考價是否超過 30 天（仍照常顯示，只加標示） */
export function isPriceStale(updatedAt: string, now: Date = new Date()): boolean {
  const ageMs = now.getTime() - new Date(`${updatedAt}T00:00:00Z`).getTime();
  return ageMs > PRICE_STALE_DAYS * 24 * 60 * 60 * 1000;
}
