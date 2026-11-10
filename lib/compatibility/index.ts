// 空間相容性判斷邏輯
// 本工具為「參考級」估算，非精密 CAD 幾何運算，實際安裝仍建議保留額外容錯空間。
//
// Phase 1：判斷流程與門檻沿用 Phase 0，只做三件事：
//   1. 結果帶 ruleId（R01…），文案移到 messages.ts
//   2. 欄位改讀新 schema；機殼上限暫用 `unspecifiedMm`（條件選擇屬於 Phase 3）
//   3. 新 schema 允許缺值：必要數值缺值時回傳 `unknown`（mock 資料全部有值，結果與 Phase 0 相同）

import type {
  BuildSelection,
  CompatibilityResult,
  CompatibilityStatus,
  GpuPart,
} from "@/types/parts";
import { defaultMm } from "@/lib/data/conditional";
import { MSG } from "./messages";
import type { RuleId } from "./rules";

const TIGHT_THRESHOLD_MM = 10;
const CABLE_SPACE_WARNING_MM = 20;
const GPU_CLEARANCE_WARNING_MM = 20;

function classifyByRemaining(remaining: number): CompatibilityStatus {
  if (remaining < 0) return "incompatible";
  if (remaining < TIGHT_THRESHOLD_MM) return "tight";
  return "safe";
}

/** 舊行為：零件未選齊 → warning（spec §0.1 已記錄為誤報，Phase 3 修正） */
function legacyMissingSelection(ruleId: RuleId, suggestion: string): CompatibilityResult {
  return { ruleId, status: "warning", message: MSG.common.legacyMissingSelection, suggestion };
}

function missingSpec(ruleId: RuleId): CompatibilityResult {
  return {
    ruleId,
    status: "unknown",
    message: MSG.common.missingSpec,
    suggestion: MSG.common.missingSpecSuggestion,
  };
}

/** 顯卡使用的 16-pin 接頭類型（12VHPWR / 12V-2x6 / 未區分的 16-pin），沒有則為 undefined */
export function gpuHighPowerConnector(gpu: GpuPart): string | undefined {
  return gpu.powerConnectors?.find((c) => c.type === "12VHPWR" || c.type === "12V-2x6" || c.type === "16-pin")
    ?.type;
}

/** 依使用者選擇的零件與手動覆蓋值，計算所有相容性檢查項目 */
export function evaluateBuild(selection: BuildSelection): CompatibilityResult[] {
  const results: CompatibilityResult[] = [];
  const { case: pcCase, motherboard, gpu, cooler, psu, overrides } = selection;

  // R01 主機板 Form Factor 是否被機殼支援
  if (pcCase && motherboard) {
    const supported = pcCase.supportedFormFactors.includes(motherboard.formFactor);
    results.push({
      ruleId: "R01",
      status: supported ? "safe" : "incompatible",
      message: supported
        ? MSG.R01.supported(motherboard.formFactor)
        : MSG.R01.unsupported(motherboard.formFactor, pcCase.supportedFormFactors),
      suggestion: supported ? undefined : MSG.R01.unsupportedSuggestion,
    });
  } else if (pcCase || motherboard) {
    results.push(legacyMissingSelection("R01", MSG.R01.needBoth));
  }

  // R08（前置）+ R02 顯卡長度（含前置水冷排扣除）
  if (pcCase && gpu) {
    const gpuLength = overrides.gpuLengthMm ?? gpu.lengthMm;
    const caseMaxGpuLength = overrides.caseMaxGpuLengthMm ?? pcCase.gpuLength.unspecifiedMm;

    let effectiveLimit = caseMaxGpuLength;
    let deduction: number | undefined;
    let deductionMissing = false;

    if (cooler.kind === "aio" && cooler.mountLocation === "front") {
      const aio = cooler.cooler;
      const frontSizes = pcCase.radiatorMounts.front?.sizes;

      if (frontSizes === undefined) {
        results.push(missingSpec("R08"));
      } else {
        const sizeSupported = frontSizes.includes(aio.radiatorSize);
        results.push({
          ruleId: "R08",
          status: sizeSupported ? "safe" : "incompatible",
          message: sizeSupported
            ? MSG.R08.supported(aio.radiatorSize)
            : MSG.R08.unsupported(frontSizes, aio.radiatorSize),
          suggestion: sizeSupported ? undefined : MSG.R08.unsupportedSuggestion,
        });
      }

      if (aio.radiatorThicknessMm === undefined || aio.fanThicknessMm === undefined) {
        deductionMissing = true;
      } else {
        deduction = aio.radiatorThicknessMm + aio.fanThicknessMm;
        if (effectiveLimit !== undefined) effectiveLimit -= deduction;
      }
    }

    if (gpuLength === undefined || effectiveLimit === undefined || deductionMissing) {
      results.push(missingSpec("R02"));
    } else {
      const remaining = effectiveLimit - gpuLength;
      const status = classifyByRemaining(remaining);
      results.push({
        ruleId: "R02",
        status,
        message: MSG.R02.detail(gpuLength, effectiveLimit, remaining, deduction),
        measuredValue: gpuLength,
        limitValue: effectiveLimit,
        remainingValue: remaining,
        suggestion:
          status === "incompatible"
            ? MSG.R02.incompatibleSuggestion
            : status === "tight"
            ? MSG.R02.tightSuggestion
            : undefined,
      });
    }
  } else if (pcCase || gpu) {
    results.push(legacyMissingSelection("R02", MSG.R02.needBoth));
  }

  // R05 CPU 空冷高度
  if (pcCase && cooler.kind === "air") {
    const coolerHeight = overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm;
    const limit = overrides.caseMaxCpuCoolerHeightMm ?? defaultMm(pcCase.cpuCoolerHeightLimits);
    if (coolerHeight === undefined || limit === undefined) {
      results.push(missingSpec("R05"));
    } else {
      const remaining = limit - coolerHeight;
      const status = classifyByRemaining(remaining);
      results.push({
        ruleId: "R05",
        status,
        message: MSG.R05.detail(coolerHeight, limit, remaining),
        measuredValue: coolerHeight,
        limitValue: limit,
        remainingValue: remaining,
        suggestion:
          status === "incompatible"
            ? MSG.R05.incompatibleSuggestion
            : status === "tight"
            ? MSG.R05.tightSuggestion
            : undefined,
      });
    }
  } else if (pcCase && cooler.kind === "none") {
    results.push(legacyMissingSelection("R05", MSG.R05.needCooler));
  }

  // R10 PSU 長度（硬碟籠條件屬於 Phase 3，暫用 unspecifiedMm）
  if (pcCase && psu) {
    const psuLength = overrides.psuLengthMm ?? psu.lengthMm;
    const limit = defaultMm(pcCase.psu.lengthLimits);
    if (psuLength === undefined || limit === undefined) {
      results.push(missingSpec("R10"));
    } else {
      const remaining = limit - psuLength;
      const status = classifyByRemaining(remaining);
      results.push({
        ruleId: "R10",
        status,
        message: MSG.R10.detail(psuLength, limit, remaining),
        measuredValue: psuLength,
        limitValue: limit,
        remainingValue: remaining,
        suggestion:
          status === "incompatible"
            ? MSG.R10.incompatibleSuggestion
            : status === "tight"
            ? MSG.R10.tightSuggestion
            : undefined,
      });
    }
  } else if (pcCase || psu) {
    results.push(legacyMissingSelection("R10", MSG.R10.needBoth));
  }

  // R11 背板走線空間
  if (pcCase) {
    const cableSpace = overrides.caseCableManagementSpaceMm ?? pcCase.cableSpaceMm;
    if (cableSpace === undefined) {
      results.push(missingSpec("R11"));
    } else {
      const status: CompatibilityStatus = cableSpace < CABLE_SPACE_WARNING_MM ? "warning" : "safe";
      results.push({
        ruleId: "R11",
        status,
        message: MSG.R11.detail(cableSpace, CABLE_SPACE_WARNING_MM),
        measuredValue: cableSpace,
        limitValue: CABLE_SPACE_WARNING_MM,
        remainingValue: cableSpace - CABLE_SPACE_WARNING_MM,
        suggestion: status === "warning" ? MSG.R11.warningSuggestion : undefined,
      });
    }
  }

  // R12 顯卡供電線彎折空間提醒（12VHPWR / 12V-2x6）
  const connector = gpu ? gpuHighPowerConnector(gpu) : undefined;
  if (gpu && connector) {
    const clearance = gpu.legacyRecommendedSideClearanceMm;
    results.push({
      ruleId: "R12",
      status: "warning",
      message: MSG.R12.detail(connector, clearance),
      measuredValue: clearance,
      suggestion: MSG.R12.suggestion,
    });
  }

  return results;
}

/** 依相容性結果自動產生走線建議（Cable Planning Suggestions） */
export function buildCablePlanningSuggestions(
  selection: BuildSelection,
  results: CompatibilityResult[]
): string[] {
  const suggestions: string[] = [];
  const { gpu, psu, overrides, case: pcCase } = selection;

  if (pcCase) {
    const cableSpace = overrides.caseCableManagementSpaceMm ?? pcCase.cableSpaceMm;
    if (cableSpace !== undefined && cableSpace < CABLE_SPACE_WARNING_MM) {
      suggestions.push(MSG.cablePlan.lowCableSpace(cableSpace, CABLE_SPACE_WARNING_MM));
    }
  }

  const connector = gpu ? gpuHighPowerConnector(gpu) : undefined;
  if (connector) suggestions.push(MSG.cablePlan.highPowerConnector(connector));

  const gpuResult = findResult(results, "R02");
  if (gpuResult?.remainingValue !== undefined && gpuResult.remainingValue < GPU_CLEARANCE_WARNING_MM) {
    suggestions.push(MSG.cablePlan.gpuTight(gpuResult.remainingValue));
  }

  const coolerResult = findResult(results, "R05");
  if (coolerResult?.remainingValue !== undefined && coolerResult.remainingValue < TIGHT_THRESHOLD_MM) {
    suggestions.push(MSG.cablePlan.coolerTight(coolerResult.remainingValue));
  }

  if (psu && psu.modularType === "non") suggestions.push(MSG.cablePlan.nonModularPsu);

  return suggestions;
}

/** 依 ruleId 取得檢查結果（2D / 3D / 報告共用） */
export function findResult(results: CompatibilityResult[], ruleId: RuleId): CompatibilityResult | undefined {
  return results.find((r) => r.ruleId === ruleId);
}

export function statusOf(results: CompatibilityResult[], ruleId: RuleId): CompatibilityStatus | undefined {
  return findResult(results, ruleId)?.status;
}
