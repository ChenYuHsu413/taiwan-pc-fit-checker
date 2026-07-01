// 空間相容性判斷邏輯
// 本工具為「參考級」估算，非精密 CAD 幾何運算，實際安裝仍建議保留額外容錯空間。

import type {
  BuildSelection,
  CompatibilityResult,
  CompatibilityStatus,
} from "@/types/parts";

const TIGHT_THRESHOLD_MM = 10;
const CABLE_SPACE_WARNING_MM = 20;
const GPU_CLEARANCE_WARNING_MM = 20;

function classifyByRemaining(remaining: number): CompatibilityStatus {
  if (remaining < 0) return "incompatible";
  if (remaining < TIGHT_THRESHOLD_MM) return "tight";
  return "safe";
}

function missingDataResult(item: string, suggestion: string): CompatibilityResult {
  return {
    item,
    status: "warning",
    message: "資料不足，無法自動判斷，請手動確認。",
    suggestion,
  };
}

/** 依使用者選擇的零件與手動覆蓋值，計算所有相容性檢查項目 */
export function evaluateBuild(selection: BuildSelection): CompatibilityResult[] {
  const results: CompatibilityResult[] = [];
  const { case: pcCase, motherboard, gpu, cooler, psu, overrides } = selection;

  // 1. 主機板 Form Factor 是否被機殼支援
  if (pcCase && motherboard) {
    const supported = pcCase.supportedMotherboards.includes(motherboard.formFactor);
    results.push({
      item: "主機板尺寸相容性 Motherboard form factor",
      status: supported ? "safe" : "incompatible",
      message: supported
        ? `機殼支援 ${motherboard.formFactor}，可正常安裝。`
        : `機殼不支援 ${motherboard.formFactor} 主機板，僅支援：${pcCase.supportedMotherboards.join("、")}。`,
      suggestion: supported ? undefined : "請更換支援此尺寸的機殼，或選擇對應尺寸的主機板。",
    });
  } else if (pcCase || motherboard) {
    results.push(missingDataResult("主機板尺寸相容性 Motherboard form factor", "請同時選擇機殼與主機板以進行檢查。"));
  }

  // 2 & 3. 顯卡長度（含前置水冷排扣除）
  if (pcCase && gpu) {
    const gpuLength = overrides.gpuLengthMm ?? gpu.lengthMm;
    const caseMaxGpuLength = overrides.caseMaxGpuLengthMm ?? pcCase.maxGpuLengthMm;

    let effectiveLimit = caseMaxGpuLength;
    let radiatorNote = "";

    if (cooler.kind === "aio" && cooler.mountLocation === "front") {
      const radiatorDeduction = cooler.cooler.radiatorThicknessMm + cooler.cooler.fanThicknessMm;
      const sizeSupported = pcCase.frontRadiatorSupport.includes(cooler.cooler.radiatorSizeMm);

      results.push({
        item: "前置水冷排相容性 Front radiator support",
        status: sizeSupported ? "safe" : "incompatible",
        message: sizeSupported
          ? `機殼支援前置 ${cooler.cooler.radiatorSizeMm}mm 水冷排。`
          : `機殼前置僅支援：${pcCase.frontRadiatorSupport.join("、") || "無"} mm，${cooler.cooler.radiatorSizeMm}mm 水冷排無法安裝於前置。`,
        suggestion: sizeSupported ? undefined : "請改裝頂置水冷排，或更換支援此水冷排尺寸的機殼。",
      });

      effectiveLimit = caseMaxGpuLength - radiatorDeduction;
      radiatorNote = `（已扣除前置水冷排＋風扇厚度 ${radiatorDeduction} mm）`;
    }

    const remaining = effectiveLimit - gpuLength;
    const status = classifyByRemaining(remaining);

    results.push({
      item: "顯卡長度空間 GPU length clearance",
      status,
      message: `顯卡長度 GPU length：${gpuLength} mm／機殼可用長度 Adjusted clearance：${effectiveLimit} mm${radiatorNote}／剩餘 Remaining：${remaining} mm`,
      measuredValue: gpuLength,
      limitValue: effectiveLimit,
      remainingValue: remaining,
      suggestion:
        status === "incompatible"
          ? "顯卡過長，請更換較短顯卡或更換可用長度更大的機殼。"
          : status === "tight"
          ? "空間非常緊繃，建議安裝前先實際測量機殼與線材空間。"
          : undefined,
    });
  } else if (pcCase || gpu) {
    results.push(missingDataResult("顯卡長度空間 GPU length clearance", "請同時選擇機殼與顯示卡以進行檢查。"));
  }

  // 4. CPU 空冷高度
  if (pcCase && cooler.kind === "air") {
    const coolerHeight = overrides.cpuCoolerHeightMm ?? cooler.cooler.heightMm;
    const limit = overrides.caseMaxCpuCoolerHeightMm ?? pcCase.maxCpuCoolerHeightMm;
    const remaining = limit - coolerHeight;
    const status = classifyByRemaining(remaining);

    results.push({
      item: "CPU 空冷高度 CPU cooler height",
      status,
      message: `CPU cooler height：${coolerHeight} mm／機殼上限 Case limit：${limit} mm／剩餘 Remaining：${remaining} mm`,
      measuredValue: coolerHeight,
      limitValue: limit,
      remainingValue: remaining,
      suggestion:
        status === "incompatible"
          ? "散熱器過高，側板可能無法蓋上，請更換較低的散熱器。"
          : status === "tight"
          ? "側板容錯很低，建議安裝前確認側板玻璃/鋼板厚度。"
          : undefined,
    });
  } else if (pcCase && cooler.kind === "none") {
    results.push(missingDataResult("CPU 空冷高度 CPU cooler height", "請選擇 CPU 散熱器（空冷或水冷）以進行檢查。"));
  }

  // 5. PSU 長度
  if (pcCase && psu) {
    const psuLength = overrides.psuLengthMm ?? psu.lengthMm;
    const limit = pcCase.maxPsuLengthMm;
    const remaining = limit - psuLength;
    const status = classifyByRemaining(remaining);

    results.push({
      item: "電源供應器長度 PSU length",
      status,
      message: `PSU length：${psuLength} mm／機殼上限 Case limit：${limit} mm／剩餘 Remaining：${remaining} mm`,
      measuredValue: psuLength,
      limitValue: limit,
      remainingValue: remaining,
      suggestion:
        status === "incompatible"
          ? "電源供應器過長，可能與前置風扇/硬碟架衝突，請更換較短的電源。"
          : status === "tight"
          ? "電源艙空間偏緊，若前方有風扇或走線，建議再次確認深度。"
          : undefined,
    });
  } else if (pcCase || psu) {
    results.push(missingDataResult("電源供應器長度 PSU length", "請同時選擇機殼與電源供應器以進行檢查。"));
  }

  // 6. 背板走線空間
  if (pcCase) {
    const cableSpace = overrides.caseCableManagementSpaceMm ?? pcCase.cableManagementSpaceMm;
    const status: CompatibilityStatus = cableSpace < CABLE_SPACE_WARNING_MM ? "warning" : "safe";

    results.push({
      item: "背板走線空間 Cable management space",
      status,
      message: `背板走線空間 Cable space：${cableSpace} mm（建議門檻 ${CABLE_SPACE_WARNING_MM} mm）`,
      measuredValue: cableSpace,
      limitValue: CABLE_SPACE_WARNING_MM,
      remainingValue: cableSpace - CABLE_SPACE_WARNING_MM,
      suggestion:
        status === "warning" ? "走線空間偏窄，建議搭配全模組化電源並使用魔鬼氈整理線材。" : undefined,
    });
  }

  // 7. 顯卡供電線彎折空間提醒（12VHPWR / 12V-2x6）
  if (gpu && (gpu.powerConnectorType === "12VHPWR" || gpu.powerConnectorType === "12V-2x6")) {
    results.push({
      item: "顯卡供電線彎折空間 Power connector clearance",
      status: "warning",
      message: `顯卡使用 ${gpu.powerConnectorType} 供電接頭，建議側板保留至少 ${gpu.recommendedSideClearanceMm} mm 彎折空間，避免線材過度彎折。`,
      measuredValue: gpu.recommendedSideClearanceMm,
      suggestion: "安裝時確認轉接頭/ 原生線材彎折角度，避免緊貼側板玻璃。",
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
    const cableSpace = overrides.caseCableManagementSpaceMm ?? pcCase.cableManagementSpaceMm;
    if (cableSpace < CABLE_SPACE_WARNING_MM) {
      suggestions.push(
        `背板走線空間僅 ${cableSpace} mm，低於建議的 ${CABLE_SPACE_WARNING_MM} mm，側板可能難以蓋上，建議理線前先規劃線材路徑。`
      );
    }
  }

  if (gpu && (gpu.powerConnectorType === "12VHPWR" || gpu.powerConnectorType === "12V-2x6")) {
    suggestions.push(
      `顯卡使用 ${gpu.powerConnectorType} 供電接頭，請留意側板與電源線的彎折空間，避免安裝後側板頂到線材。`
    );
  }

  const gpuResult = results.find((r) => r.item.startsWith("顯卡長度空間"));
  if (gpuResult?.remainingValue !== undefined && gpuResult.remainingValue < GPU_CLEARANCE_WARNING_MM) {
    suggestions.push(
      `顯卡可用長度剩餘僅 ${gpuResult.remainingValue} mm，前置風扇、水冷排或硬碟架可能造成安裝困難，建議安裝前先行比對。`
    );
  }

  const coolerResult = results.find((r) => r.item.startsWith("CPU 空冷高度"));
  if (coolerResult?.remainingValue !== undefined && coolerResult.remainingValue < TIGHT_THRESHOLD_MM) {
    suggestions.push(
      `CPU 散熱器高度剩餘僅 ${coolerResult.remainingValue} mm，側板容錯很低，建議安裝前確認側板內側是否有凸起結構。`
    );
  }

  if (psu && psu.modularType === "非模組化") {
    suggestions.push("目前選擇的電源為非模組化，多餘線材可能造成背板整理困難，建議預留更多走線空間或改用模組化電源。");
  }

  return suggestions;
}
