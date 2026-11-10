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

const mm = (v: number) => `${Math.round(v * 10) / 10} mm`;

export const MSG = {
  common: {
    /** 只選了一側零件 */
    needPart: (what: string) => `尚未選擇${what}，無法檢查。`,
    /** 官方未公開欄位 → unknown */
    missingSpec: (what: string) => `官方未公開${what}（或尚未收錄），無法自動判斷。`,
    missingSpecSuggestion: "請查閱官方規格頁，或在「手動覆蓋尺寸」輸入實測值。",
    /** 長度型比較的共用訊息：實際值 / 上限 / 餘裕 */
    fit: (label: string, measured: number, limit: number, limitLabel: string) =>
      measured <= limit
        ? `${label} ${mm(measured)}／${limitLabel} ${mm(limit)}／餘裕 ${mm(limit - measured)}`
        : `${label} ${mm(measured)}／${limitLabel} ${mm(limit)}／超出 ${mm(measured - limit)}`,
    otherCondition: (limit: number, condition: string) => `其他官方條件：${condition} 時上限 ${mm(limit)}`,
    overrideNote: "（含手動覆蓋值）",
  },
  R01: {
    supported: (ff: string) => `機殼官方支援 ${ff} 主機板。`,
    unsupported: (ff: string, list: string[]) => `機殼官方僅支援 ${list.join("、")}，不支援 ${ff} 主機板。`,
    depthOver: (depth: number, limit: number) =>
      `主機板寬度 ${mm(depth)} 超過機殼官方上限 ${mm(limit)}。`,
    depthFit: (ff: string, depth: number, limit: number) =>
      `機殼官方支援 ${ff}；主機板寬度 ${mm(depth)}／上限 ${mm(limit)}／餘裕 ${mm(limit - depth)}`,
    unsupportedSuggestion: "請更換支援此尺寸的機殼，或選擇對應尺寸的主機板。",
  },
  R02: {
    labelGpu: "顯卡長度",
    limitNoFront: "前置未裝風扇或水冷排時的官方上限",
    limitFan: "前置裝風扇時的官方上限",
    limitRadiator: (size: number) => `前置裝 ${size} 水冷排時的官方上限`,
    limitUnspecified: "官方上限",
    limitOverride: "手動輸入的上限",
    unspecifiedInfo: "官方只給一個數字，未註明量測條件（是否已扣除前置風扇或水冷排），請自行確認。",
    frontFanAssumed: (count: number, size: number) => `依官方內附前置風扇（${count} × ${size} mm）判斷。`,
    noRadiatorCondition: (size: number) =>
      `前置裝 ${size} 水冷排：官方沒有列出這個條件下的顯卡長度上限，無法判斷。`,
    noFanCondition: "前置有內附風扇：官方沒有列出裝風扇時的顯卡長度上限，無法判斷。",
    noFrontCondition: "官方沒有列出前置淨空時的顯卡長度上限，無法判斷。",
    incompatibleSuggestion: "顯卡過長，請更換較短顯卡或更換可用長度更大的機殼。",
  },
  R03: {
    overSlotLimit: (slots: number, limit: number) => `顯卡 ${slots} 槽，超過機殼官方顯卡槽數上限 ${limit} 槽。`,
    fitSlotLimit: (slots: number, limit: number) =>
      `顯卡 ${slots} 槽／機殼官方上限 ${limit} 槽／餘裕 ${Math.round((limit - slots) * 100) / 100} 槽`,
    overExpansion: (slots: number, limit: number) => `顯卡佔用 ${slots} 槽，超過機殼擴充槽總數 ${limit}。`,
    verticalOnly: "此機殼官方設計只能直立安裝顯卡，請確認轉接線（riser）與支架是否隨附。",
    missing: "官方未公開顯卡槽數或機殼擴充槽資料，無法判斷。",
    noBasis:
      "機殼沒有公開顯卡槽數上限；主機板第一條 x16 槽的位置官方也未公開，無法確認下方是否有足夠擴充槽與電源倉空間。",
  },
  R04: { label: "顯卡高度", limitLabel: "機殼官方上限" },
  R05: {
    label: "散熱器高度",
    limitLabel: "機殼官方上限",
    incompatibleSuggestion: "散熱器過高，側板可能無法蓋上，請更換較低的散熱器。",
  },
  R06: {
    label: "記憶體高度",
    limitLabel: "散熱器官方 RAM 淨空（出廠風扇位置）",
    overSuggestion: "超出出廠狀態的 RAM 淨空；部分散熱器可上移風扇（總高度會增加），請參考官方說明。",
  },
  R08: {
    position: { front: "前置", top: "上置" } as Record<"front" | "top", string>,
    noSupport: (pos: string) => `機殼官方不支援在${pos}安裝水冷排。`,
    sizeUnsupported: (pos: string, list: number[], size: number) =>
      `機殼${pos}官方支援：${list.join("、")}；不支援 ${size} 水冷排。`,
    thicknessFit: (pos: string, size: number, measured: number, limit: number, kind: string) =>
      `機殼${pos}支援 ${size} 水冷排；${kind} ${mm(measured)}／官方上限 ${mm(limit)}／餘裕 ${mm(limit - measured)}`,
    thicknessOver: (pos: string, measured: number, limit: number, kind: string) =>
      `${kind} ${mm(measured)} 超過機殼${pos}官方上限 ${mm(limit)}。`,
    noThicknessLimit: (pos: string, size: number) =>
      `機殼${pos}支援 ${size} 水冷排，但官方未公開厚度上限（或水冷厚度未公開），無法確認厚度是否裝得下。`,
    positionUnknown: (pos: string) => `官方未說明${pos}是否支援水冷排。`,
    unsupportedSuggestion: "請改用其他安裝位置，或更換支援此水冷排尺寸的機殼。",
  },
  R10: {
    formUnsupported: (ff: string, list: string[]) => `機殼官方電源規格為 ${list.join("、")}，不支援 ${ff} 電源。`,
    sfxInAtx: (ff: string) =>
      `機殼官方只列 ATX 電源；${ff} 電源是否可透過轉接架安裝，官方未說明，請自行確認。`,
    label: "電源長度",
    limitLabel: "機殼官方上限",
    incompatibleSuggestion: "電源供應器過長，請更換較短的電源或調整機殼硬碟架配置（見其他條件）。",
  },
  R14: {
    supported: (socket: string) => `散熱器官方支援 ${socket} 腳位。`,
    unsupported: (socket: string, list: string[]) => `散熱器官方支援清單（${list.join("、")}）沒有 ${socket}。`,
    unsupportedSuggestion: "請確認原廠是否另售扣具，或更換支援此腳位的散熱器。",
  },
  R15: {
    ok: (psu: number, need: number, source: string) => `電源 ${psu} W／顯卡${source} ${need} W／餘裕 ${psu - need} W`,
    under: (psu: number, need: number, source: string) => `電源 ${psu} W 低於顯卡${source} ${need} W。`,
    sourceBoard: "官方建議電源",
    sourceChip: "晶片官方建議系統電源（NVIDIA / AMD 公版）",
    note: "只比對顯卡官方建議電源，不估算整機功耗；高耗電 CPU 或超頻請自行預留。",
    underSuggestion: "建議改用不低於官方建議瓦數的電源。",
  },
  R22: {
    match: (s: string) => `CPU 與主機板皆為 ${s} 腳位。`,
    mismatch: (cpu: string, mb: string) => `CPU 腳位 ${cpu} 與主機板腳位 ${mb} 不同，無法安裝。`,
  },
  R23: {
    ok: (t: string) => `記憶體、主機板皆為 ${t}。`,
    ramMismatch: (ram: string, mb: string) => `記憶體為 ${ram}，主機板只支援 ${mb}，插槽不相容。`,
    cpuMismatch: (mb: string, list: string[]) => `CPU 官方只支援 ${list.join("、")}，不支援主機板的 ${mb}。`,
    cpuUnknown: "CPU 支援的記憶體類型官方未公開，只檢查了記憶體與主機板。",
  },
  R24: {
    ok: (n: number, slots: number) => `記憶體 ${n} 條／主機板插槽 ${slots} 條／剩餘 ${slots - n} 條`,
    over: (n: number, slots: number) => `記憶體 ${n} 條，超過主機板插槽數 ${slots}。`,
  },
  R25: {
    ok: (total: number, limit: number, who: string) => `記憶體總容量 ${total} GB／${who}官方上限 ${limit} GB`,
    over: (total: number, limit: number, who: string) => `記憶體總容量 ${total} GB，超過${who}官方上限 ${limit} GB。`,
  },
  R26: {
    ok: (speed: number, limit: number) => `記憶體 ${speed} MT/s，未超過 CPU 官方支援速度 ${limit} MT/s。`,
    overCpu: (speed: number, limit: number, basis: string) =>
      `記憶體 ${speed} MT/s 超過 CPU 官方支援速度 ${limit} MT/s（${basis}），需要 XMP / EXPO 超頻，穩定性不保證；未開啟時會以較低速度運作。`,
    overMb: (speed: number, limit: number) => `記憶體 ${speed} MT/s 超過主機板官方上限 ${limit} MT/s，會降速。`,
    needProfile: "需在 BIOS 開啟 XMP / EXPO 才能跑到標稱速度。",
    tableBasis: (n: number, rank: number) => `官方表：每通道 ${n} 條、${rank}R`,
    maxBasis: "官方最高值",
    rankUnknown: "記憶體 rank 官方未寫，無法查 CPU 官方速度表；改用 CPU 官方最高值比較。",
  },
  R27: {
    native: (chipset: string) => `${chipset} 晶片組原生支援此 CPU 世代。`,
    /** subject：「B650 晶片組搭配此 CPU 世代」或「依主機板官方 CPU 支援清單，此 CPU」 */
    updateFlashback: (subject: string) =>
      `${subject}可能需要更新 BIOS。此主機板支援免 CPU 更新 BIOS（Flashback 類功能），可在裝 CPU 前用 USB 隨身碟更新。`,
    updateNoFlashback: (subject: string) =>
      `${subject}可能需要更新 BIOS。此主機板沒有免 CPU 更新功能，需要先用舊 CPU 開機更新，或請店家代刷。`,
    updateFlashbackUnknown: (subject: string) =>
      `${subject}可能需要更新 BIOS。官方未說明此主機板是否支援免 CPU 更新，請確認或請店家代刷。`,
    chipsetSubject: (chipset: string) => `${chipset} 晶片組搭配此 CPU 世代`,
    boardSubject: "依主機板官方 CPU 支援清單，此 CPU ",
    boardMinBios: (v: string) => `主機板官方 CPU 支援清單：此 CPU 自 BIOS ${v} 起支援，出廠 BIOS 較舊時需要更新。`,
    boardNative: (v: string) => `主機板官方 CPU 支援清單：此 CPU 自 BIOS「${v}」即支援（不需要更新 BIOS）。`,
    chipsetNotListed: (chipset: string, list: string[]) =>
      `CPU 官方支援晶片組為 ${list.join("、")}，不含 ${chipset}，此主機板不支援這顆 CPU。`,
    unsupported: (chipset: string) => `${chipset} 晶片組官方不支援此 CPU 世代。`,
    notInTable: "BIOS 規則表沒有此晶片組與 CPU 世代的官方依據，無法判斷。",
    linkLabel: "官方 CPU 支援清單",
  },
  R28: {
    hasGpu: "已選擇獨立顯卡。",
    noOutput: "CPU 沒有內建顯示，且未選擇獨立顯卡，沒有任何影像輸出。",
    noBoardOutput: "主機板沒有影像輸出接口，需要獨立顯卡。",
    ok: "使用 CPU 內建顯示，主機板有影像輸出。",
    suggestion: "請加選獨立顯卡，或改用有內建顯示的 CPU。",
  },
  R29: {
    ok: (gen: number, lanes: string) => `顯卡以 PCIe ${gen}.0 ${lanes} 運作。`,
    downgraded: (cardGen: number, gen: number, lanes: string, reasons: string[]) =>
      `顯卡支援 PCIe ${cardGen}.0，實際以 PCIe ${gen}.0 ${lanes} 運作（${reasons.join("；")}）。向下相容，頻寬降低。`,
    reasonSlot: (gen: number) => `主機板第一條 x16 槽為 PCIe ${gen}.0`,
    reasonCpu: (gen: number) => `CPU 提供 PCIe ${gen}.0`,
    reasonSharing: (text: string) => `共用通道：${text}`,
    reasonLanes: (slot: number, card: number) => `槽位電氣 x${slot}，顯卡 x${card}`,
    assumeFirstSlot: "假設顯卡插在主機板第一條 x16 槽。",
    noSlot: "主機板 PCIe x16 槽資料官方未公開，無法判斷。",
  },
  R30: {
    ok: (n: number) => `${n} 支 SSD 都有可用的 M.2 槽，介面相容。`,
    downgraded: (ssd: string, slot: string, ssdGen: number, gen: number) =>
      `${ssd} 為 PCIe ${ssdGen}.0，分配到的 ${slot} 只有 PCIe ${gen}.0，向下相容、速度受限。`,
    noSlot: (ssd: string) => `${ssd} 找不到介面相容的 M.2 槽。`,
    assignment: (pairs: string[]) => `分配：${pairs.join("、")}`,
  },
  R31: {
    ok: "所有 SSD 的尺寸規格都有對應的 M.2 槽。",
    noSlot: (ssd: string, ff: string) => `${ssd}（${ff}）沒有任何 M.2 槽支援這個尺寸。`,
  },
  R32: {
    ok: (n: number, slots: number) => `SSD ${n} 支／可用 M.2 槽 ${slots} 個`,
    over: (n: number, slots: number) => `SSD ${n} 支，超過可用的 M.2 槽數 ${slots}。`,
    disabledNote: (labels: string[]) => `搭配此 CPU 時官方停用：${labels.join("、")}`,
  },
  R33: {
    ok16: (need: number, have: number) => `顯卡需要 ${need} 個 16-pin，電源有 ${have} 個原生接頭。`,
    adapter16:
      "電源沒有原生 16-pin（12V-2x6 / 12VHPWR）接頭，需要使用轉接線（通常由顯卡隨附），請確認電源 8-pin 數量足夠轉接。",
    few16: (need: number, have: number) => `顯卡需要 ${need} 個 16-pin，電源只有 ${have} 個原生接頭。`,
    ok8: (need: number, have: number) => `顯卡需要 ${need} 個 8-pin，電源有 ${have} 個。`,
    few8: (need: number, have: number) => `顯卡需要 ${need} 個 8-pin，電源只有 ${have} 個。`,
    sixPin: "顯卡使用 6-pin 接頭，本工具未檢查 6-pin 數量，請自行確認。",
  },
  cablePlan: {
    highPowerConnector: (connector: string) =>
      `顯卡使用 ${connector} 供電接頭，請確認接頭完全插入，並留意與側板之間的彎折空間。`,
    nonModularPsu: "目前選擇的電源為非模組化，多餘線材需要收納空間，理線前先規劃線材路徑。",
  },
} as const;
