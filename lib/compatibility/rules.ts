// 相容性規則清單：ruleId 與 docs/compatibility-spec.md 的 R01–R33 一一對應。
// R16 / R18 / R19 已併入其他規則，不在此列。

export type RuleGroup = "spatial" | "platform";

export const RULES = {
  R01: { group: "spatial", title: "主機板尺寸相容性 Motherboard form factor" },
  R02: { group: "spatial", title: "顯卡長度空間 GPU length clearance" },
  R03: { group: "spatial", title: "顯卡厚度與槽數 GPU thickness / slots" },
  R04: { group: "spatial", title: "顯卡高度 vs 側板 GPU height" },
  R05: { group: "spatial", title: "CPU 空冷高度 CPU cooler height" },
  R06: { group: "spatial", title: "塔散 vs 記憶體高度 Cooler RAM clearance" },
  R07: { group: "spatial", title: "塔散 vs VRM 散熱片 Cooler VRM clearance" },
  R08: { group: "spatial", title: "水冷排安裝位置 Radiator support" },
  R09: { group: "spatial", title: "上置水冷排 vs 主機板 Top radiator clearance" },
  R10: { group: "spatial", title: "電源供應器長度 PSU length" },
  R11: { group: "spatial", title: "背板走線空間 Cable management space" },
  R12: { group: "spatial", title: "顯卡供電線彎折空間 Power connector clearance" },
  R13: { group: "spatial", title: "M.2 散熱片 vs 顯卡 M.2 heatsink clearance" },
  R14: { group: "platform", title: "散熱器扣具腳位 Cooler socket support" },
  R15: { group: "platform", title: "電源瓦數 PSU wattage" },
  R17: { group: "spatial", title: "水冷管長度 AIO tube length" },
  R20: { group: "spatial", title: "直立顯卡 Vertical GPU" },
  R21: { group: "spatial", title: "底部風扇 vs 顯卡 Bottom fan clearance" },
  R22: { group: "platform", title: "CPU 腳位 CPU socket" },
  R23: { group: "platform", title: "記憶體類型 Memory type" },
  R24: { group: "platform", title: "記憶體條數 Memory slots" },
  R25: { group: "platform", title: "記憶體總容量 Memory capacity" },
  R26: { group: "platform", title: "記憶體速度 Memory speed" },
  R27: { group: "platform", title: "BIOS 支援 BIOS support" },
  R28: { group: "platform", title: "影像輸出 Display output" },
  R29: { group: "platform", title: "顯卡 PCIe 頻寬 GPU PCIe link" },
  R30: { group: "platform", title: "SSD 介面 M.2 interface" },
  R31: { group: "platform", title: "SSD 尺寸規格 M.2 form factor" },
  R32: { group: "platform", title: "SSD 數量 M.2 slot count" },
  R33: { group: "platform", title: "顯卡供電接頭 GPU power connectors" },
} as const satisfies Record<string, { group: RuleGroup; title: string }>;

export type RuleId = keyof typeof RULES;
