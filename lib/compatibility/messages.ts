// 相容性與走線建議的中文文案集中管理。邏輯檔只負責判斷，不寫文案。

import type { CompatibilityStatus } from "@/types/parts";

export const STATUS_LABEL: Record<CompatibilityStatus, string> = {
  safe: "Safe 安全",
  info: "Info 提示",
  tight: "Tight 緊繃",
  warning: "Warning 注意",
  incompatible: "Incompatible 不相容",
  unknown: "Unknown 資料不足",
};

export const STATUS_SHORT_LABEL: Record<CompatibilityStatus, string> = {
  safe: "Safe",
  info: "Info",
  tight: "Tight",
  warning: "Warning",
  incompatible: "Incompatible",
  unknown: "Unknown",
};

export const MSG = {
  common: {
    /** 舊行為：零件未選齊時回傳 warning（Phase 3 改為 unknown，見 spec §0.1） */
    legacyMissingSelection: "資料不足，無法自動判斷，請手動確認。",
    /** 官方未公開欄位 → unknown */
    missingSpec: "官方未公開此項規格（或尚未收錄），無法自動判斷。",
    missingSpecSuggestion: "請查閱官方規格頁，或在「手動覆蓋尺寸」輸入實測值。",
  },
  R01: {
    needBoth: "請同時選擇機殼與主機板以進行檢查。",
    supported: (ff: string) => `機殼支援 ${ff}，可正常安裝。`,
    unsupported: (ff: string, list: string[]) => `機殼不支援 ${ff} 主機板，僅支援：${list.join("、")}。`,
    unsupportedSuggestion: "請更換支援此尺寸的機殼，或選擇對應尺寸的主機板。",
  },
  R08: {
    supported: (size: number) => `機殼支援前置 ${size}mm 水冷排。`,
    unsupported: (list: number[], size: number) =>
      `機殼前置僅支援：${list.join("、") || "無"} mm，${size}mm 水冷排無法安裝於前置。`,
    unsupportedSuggestion: "請改裝頂置水冷排，或更換支援此水冷排尺寸的機殼。",
  },
  R02: {
    needBoth: "請同時選擇機殼與顯示卡以進行檢查。",
    detail: (gpuLength: number, limit: number, remaining: number, deduction?: number) =>
      `顯卡長度 GPU length：${gpuLength} mm／機殼可用長度 Adjusted clearance：${limit} mm` +
      (deduction !== undefined ? `（已扣除前置水冷排＋風扇厚度 ${deduction} mm）` : "") +
      `／剩餘 Remaining：${remaining} mm`,
    incompatibleSuggestion: "顯卡過長，請更換較短顯卡或更換可用長度更大的機殼。",
    tightSuggestion: "空間非常緊繃，建議安裝前先實際測量機殼與線材空間。",
  },
  R05: {
    needCooler: "請選擇 CPU 散熱器（空冷或水冷）以進行檢查。",
    detail: (height: number, limit: number, remaining: number) =>
      `CPU cooler height：${height} mm／機殼上限 Case limit：${limit} mm／剩餘 Remaining：${remaining} mm`,
    incompatibleSuggestion: "散熱器過高，側板可能無法蓋上，請更換較低的散熱器。",
    tightSuggestion: "側板容錯很低，建議安裝前確認側板玻璃/鋼板厚度。",
  },
  R10: {
    needBoth: "請同時選擇機殼與電源供應器以進行檢查。",
    detail: (length: number, limit: number, remaining: number) =>
      `PSU length：${length} mm／機殼上限 Case limit：${limit} mm／剩餘 Remaining：${remaining} mm`,
    incompatibleSuggestion: "電源供應器過長，可能與前置風扇/硬碟架衝突，請更換較短的電源。",
    tightSuggestion: "電源艙空間偏緊，若前方有風扇或走線，建議再次確認深度。",
  },
  R11: {
    detail: (space: number, threshold: number) => `背板走線空間 Cable space：${space} mm（建議門檻 ${threshold} mm）`,
    warningSuggestion: "走線空間偏窄，建議搭配全模組化電源並使用魔鬼氈整理線材。",
  },
  R12: {
    detail: (connector: string, clearance?: number) =>
      clearance !== undefined
        ? `顯卡使用 ${connector} 供電接頭，建議側板保留至少 ${clearance} mm 彎折空間，避免線材過度彎折。`
        : `顯卡使用 ${connector} 供電接頭，請預留側板彎折空間，避免線材過度彎折。`,
    suggestion: "安裝時確認轉接頭/ 原生線材彎折角度，避免緊貼側板玻璃。",
  },
  cablePlan: {
    lowCableSpace: (space: number, threshold: number) =>
      `背板走線空間僅 ${space} mm，低於建議的 ${threshold} mm，側板可能難以蓋上，建議理線前先規劃線材路徑。`,
    highPowerConnector: (connector: string) =>
      `顯卡使用 ${connector} 供電接頭，請留意側板與電源線的彎折空間，避免安裝後側板頂到線材。`,
    gpuTight: (remaining: number) =>
      `顯卡可用長度剩餘僅 ${remaining} mm，前置風扇、水冷排或硬碟架可能造成安裝困難，建議安裝前先行比對。`,
    coolerTight: (remaining: number) =>
      `CPU 散熱器高度剩餘僅 ${remaining} mm，側板容錯很低，建議安裝前確認側板內側是否有凸起結構。`,
    nonModularPsu: "目前選擇的電源為非模組化，多餘線材可能造成背板整理困難，建議預留更多走線空間或改用模組化電源。",
  },
} as const;
