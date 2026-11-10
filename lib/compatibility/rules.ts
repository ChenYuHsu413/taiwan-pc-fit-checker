// 相容性規則清單：ruleId 與 docs/compatibility-spec.md 的 R01–R33 一一對應。
// R16 / R18 / R19 已併入其他規則，不在此列。
// implemented = false 的規則不產生判斷結果，改列在報告最下方「尚未檢查的項目」（uncheckedReason 為原因）。

export type RuleGroup = "spatial" | "platform";

interface RuleDef {
  group: RuleGroup;
  title: string;
  implemented: boolean;
  uncheckedReason?: string;
}

export const RULES = {
  R01: { group: "spatial", title: "主機板尺寸相容性 Motherboard form factor", implemented: true },
  R02: { group: "spatial", title: "顯卡長度空間 GPU length clearance", implemented: true },
  R03: { group: "spatial", title: "顯卡槽數與安裝方向 GPU slots / orientation", implemented: true },
  R04: { group: "spatial", title: "顯卡高度 vs 側板 GPU height", implemented: true },
  R05: { group: "spatial", title: "CPU 空冷高度 CPU cooler height", implemented: true },
  R06: { group: "spatial", title: "塔散 vs 記憶體高度 Cooler RAM clearance", implemented: true },
  R07: {
    group: "spatial",
    title: "塔散 vs VRM 散熱片 Cooler VRM clearance",
    implemented: false,
    uncheckedReason: "官方幾乎不公開散熱器鰭片離板高度與主機板 VRM 散熱片高度，無法判斷是否干涉。",
  },
  R08: { group: "spatial", title: "水冷排安裝位置 Radiator support", implemented: true },
  R09: {
    group: "spatial",
    title: "上置水冷排 vs 主機板與記憶體 Top radiator vs RAM",
    implemented: false,
    uncheckedReason:
      "需要機殼頂部到主機板上緣、記憶體位置等幾何資料，官方多半沒有公開。上置排的尺寸與厚度上限仍由「水冷排安裝位置」檢查。",
  },
  R10: { group: "spatial", title: "電源供應器規格與長度 PSU form factor / length", implemented: true },
  R11: {
    group: "spatial",
    title: "背板走線空間 Cable management space",
    implemented: false,
    uncheckedReason: "走線空間需要多少沒有可靠的業界門檻，只顯示官方數值，不做判斷。",
  },
  R12: {
    group: "spatial",
    title: "顯卡供電線彎折空間 Power connector clearance",
    implemented: false,
    uncheckedReason: "供電接頭需要保留多少直線段沒有可查證的官方數字，機殼也很少公開顯卡到側板的距離。",
  },
  R13: {
    group: "spatial",
    title: "M.2 散熱片 vs 顯卡 M.2 heatsink clearance",
    implemented: false,
    uncheckedReason: "PCIe 槽高度與顯卡背板離板距離官方不公開，無法判斷 M.2 散熱片是否頂到顯卡。",
  },
  R14: { group: "platform", title: "散熱器扣具腳位 Cooler socket support", implemented: true },
  R15: { group: "platform", title: "電源瓦數 PSU wattage", implemented: true },
  R17: {
    group: "spatial",
    title: "水冷管長度 AIO tube length",
    implemented: false,
    uncheckedReason: "需要機殼內部 CPU 到各安裝位置的距離，官方沒有公開。",
  },
  R20: {
    group: "spatial",
    title: "直立顯卡 Vertical GPU",
    implemented: false,
    uncheckedReason: "直立安裝需要的轉接線與支架尺寸各家不同；只能直立安裝的機殼會在「顯卡槽數與安裝方向」提示。",
  },
  R21: {
    group: "spatial",
    title: "底部風扇 vs 顯卡 Bottom fan clearance",
    implemented: false,
    uncheckedReason: "底部風扇與顯卡之間的距離官方沒有公開。",
  },
  R22: { group: "platform", title: "CPU 腳位 CPU socket", implemented: true },
  R23: { group: "platform", title: "記憶體類型 Memory type", implemented: true },
  R24: { group: "platform", title: "記憶體條數 Memory slots", implemented: true },
  R25: { group: "platform", title: "記憶體總容量 Memory capacity", implemented: true },
  R26: { group: "platform", title: "記憶體速度 Memory speed", implemented: true },
  R27: { group: "platform", title: "BIOS 支援 BIOS support", implemented: true },
  R28: { group: "platform", title: "影像輸出 Display output", implemented: true },
  R29: { group: "platform", title: "顯卡 PCIe 頻寬 GPU PCIe link", implemented: true },
  R30: { group: "platform", title: "SSD 介面 M.2 interface", implemented: true },
  R31: { group: "platform", title: "SSD 尺寸規格 M.2 form factor", implemented: true },
  R32: { group: "platform", title: "SSD 數量 M.2 slot count", implemented: true },
  R33: { group: "platform", title: "顯卡供電接頭 GPU power connectors", implemented: true },
} as const satisfies Record<string, RuleDef>;

export type RuleId = keyof typeof RULES;

/** 本輪不產生結果的規則（固定列在「尚未檢查的項目」） */
export const UNCHECKED_RULES = (Object.keys(RULES) as RuleId[]).filter((id) => !RULES[id].implemented);

/** 「Tight 緊繃」狀態本輪不實作（門檻沒有可靠依據），在報告中說明 */
export const TIGHT_NOT_IMPLEMENTED_REASON =
  "「緊繃（Tight）」需要餘裕門檻，業界沒有可靠的統一數字，本輪不判斷；請自行參考報告中的「餘裕」數值。";
