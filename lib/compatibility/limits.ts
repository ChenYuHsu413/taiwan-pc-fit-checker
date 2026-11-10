// 規則與 3D / 2D 佈局共用的「官方上限」選擇邏輯，確保畫面與報告採用同一個數值。

import type { BuildSelection } from "@/types/parts";
import { defaultMm } from "@/lib/data/conditional";
import { MSG } from "./messages";

/** R02 採用的條件：前置水冷 / 前置內附風扇 / 前置淨空 / 官方未註明條件 / 手動輸入 */
export type GpuLengthBasis = "radiator" | "fan" | "noFront" | "unspecified" | "override";

export interface GpuLengthLimit {
  /** 採用的上限；undefined = 對應條件官方沒有數字 */
  mm?: number;
  basis?: GpuLengthBasis;
  label: string;
  /** 附加說明（Info 顯示） */
  conditions: string[];
  /** mm 缺值時的訊息 */
  missingMsg: string;
}

/** 依前置實際裝的東西，選出官方顯卡長度上限（R02） */
export function gpuLengthLimit(s: BuildSelection): GpuLengthLimit | undefined {
  const c = s.case;
  if (!c) return undefined;
  const g = c.gpuLength;
  const conditions: string[] = [];
  if (g.conditionText) conditions.push(`官方條件原文：${g.conditionText}`);

  if (s.overrides.caseMaxGpuLengthMm !== undefined)
    return { mm: s.overrides.caseMaxGpuLengthMm, basis: "override", label: MSG.R02.limitOverride, conditions, missingMsg: "" };

  const radiator = s.cooler.kind === "aio" && s.cooler.mountLocation === "front" ? s.cooler.cooler : undefined;
  const frontFan = c.includedFans?.front;
  let specific: number | undefined;
  let basis: GpuLengthBasis;
  let label: string;
  let missingMsg: string;

  if (radiator) {
    specific = g.withFrontRadiator?.find((r) => r.radiatorSize === radiator.radiatorSize)?.maxGpuMm;
    basis = "radiator";
    label = MSG.R02.limitRadiator(radiator.radiatorSize);
    missingMsg = MSG.R02.noRadiatorCondition(radiator.radiatorSize);
  } else if (frontFan) {
    specific = g.withFrontFanMm;
    basis = "fan";
    label = MSG.R02.limitFan;
    missingMsg = MSG.R02.noFanCondition;
    conditions.push(MSG.R02.frontFanAssumed(frontFan.count, frontFan.sizeMm));
  } else if (c.includedFans === undefined && g.noFrontMm !== undefined && g.withFrontFanMm !== undefined) {
    // 官方沒說是否內附前置風扇：取兩者中較嚴格的值
    specific = Math.min(g.noFrontMm, g.withFrontFanMm);
    basis = specific === g.withFrontFanMm ? "fan" : "noFront";
    label = basis === "fan" ? MSG.R02.limitFan : MSG.R02.limitNoFront;
    missingMsg = MSG.R02.noFrontCondition;
  } else {
    specific = g.noFrontMm;
    basis = "noFront";
    label = MSG.R02.limitNoFront;
    missingMsg = MSG.R02.noFrontCondition;
  }

  if (specific !== undefined) return { mm: specific, basis, label, conditions, missingMsg };
  if (g.unspecifiedMm !== undefined) {
    conditions.push(MSG.R02.unspecifiedInfo);
    return { mm: g.unspecifiedMm, basis: "unspecified", label: MSG.R02.limitUnspecified, conditions, missingMsg };
  }
  return { label, conditions, missingMsg };
}

/** R05 採用的塔散高度上限 */
export function coolerHeightLimitMm(s: BuildSelection): number | undefined {
  return s.overrides.caseMaxCpuCoolerHeightMm ?? defaultMm(s.case?.cpuCoolerHeightLimits);
}

/** R10 採用的電源長度上限 */
export function psuLengthLimitMm(s: BuildSelection): number | undefined {
  return defaultMm(s.case?.psu.lengthLimits);
}

/** R04 採用的顯卡高度上限 */
export function gpuHeightLimitMm(s: BuildSelection): number | undefined {
  return defaultMm(s.case?.gpuHeightLimits);
}
