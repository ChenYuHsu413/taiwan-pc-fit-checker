# 資料 Schema 說明（v1.1，Phase 2a）

- 原始碼：`lib/schema/common.ts`、`lib/schema/parts.ts`、`lib/schema/biosSupport.ts`
- TS 型別一律由 `z.infer` 推導；`types/parts.ts` 只做 re-export，以及 UI 用的組合型別
- 驗證：`lib/data/validate.ts`（`validateParts` / `validatePrices`），內建資料與使用者匯入共用
- 規則編號對應 `docs/compatibility-spec.md`

## 0. 通則

| 約定 | 內容 |
|---|---|
| 單位 | 長度 mm（`…Mm`）、功率 W（`…W`）、價格新台幣整數（`priceTwd`）、記憶體速度 MT/s（`…Mts`）、容量 GB（`…Gb`） |
| 缺值 | 所有尺寸與大部分規格欄位都是 optional。**缺值 = 官方未公開或尚未查到**，與 0 意義不同。規則遇到缺值時應回傳 `unknown` |
| 「明確不支援」 | 用空陣列或 `false` 表示，例如 `radiatorMounts.top.sizes = []` 表示官方明確寫了「不支援」；`radiatorMounts.top` 整個缺值表示官方沒說 |
| 座標軸 | 一律以「裝進直立機殼後」的方向描述：**height = 上下、depth = 前後、width = 左右（垂直於主機板）** |
| mm 上限 | 驗證時擋掉 > 1000 mm 的值，目的是抓單位錯誤（例如 cm 誤填），不是規格上限 |
| 檔案 | `data/parts/<category>.json`（每類一個陣列）、`data/prices/<category>.json`、`data/rules/bios-support.json` |

## 1. 共同欄位（全部類別）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | slug | 全站唯一，格式 `^[a-z0-9]+(-[a-z0-9]+)*$`，例如 `nzxt-h6-flow`。**發布後不可修改**（分享 URL 依賴）。不加類別前綴 |
| `category` | literal | 9 類之一：`case` `motherboard` `cpu` `ram` `gpu` `airCooler` `aio` `psu` `m2Ssd` |
| `brand` / `model` | string | 原廠品牌與型號 |
| `twName` | string | 台灣通路常見品名 |
| `sourceUrl` | URL \| null | **原廠產品規格頁**，不得填品牌首頁。`null` = 尚未取得（mock） |
| `specVerifiedAt` | `YYYY-MM-DD` \| null | 最後一次對照官方頁面的日期；`null` = 未驗證 |
| `notes` | string? | 量測條件、例外等補充 |

## 2. 價格（`data/prices/<category>.json`）

| 欄位 | 說明 |
|---|---|
| `partId` | 對應零件的 `id`，載入時會檢查是否存在 |
| `priceTwd` | 正整數（新台幣） |
| `updatedAt` | `YYYY-MM-DD`；距今超過 30 天，UI 顯示「可能過時」（仍照常顯示） |
| `source` | `manual`（人工參考價）／`userImport`（使用者貼估價單）／`mock`（Phase 1 搬遷的假資料，Phase 2 全部移除） |
| `note` | 選填 |

## 3. 各類別欄位

### 3.1 Case（`case`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `external.depthMm` / `widthMm` / `heightMm` | mm | `Dimensions (D x W x H)`；三個數字的順序各家不一 | 3D 外殼（Phase 5） |
| `supportedFormFactors[]` | enum | `Motherboard Support: E-ATX / ATX / mATX / Mini-ITX` | R01 |
| `maxMotherboardDepthMm` | mm | `E-ATX (up to 280mm)` | R01 |
| `gpuLength.noFrontMm` | mm | `GPU length (without front fan)` | R02 |
| `gpuLength.withFrontFanMm` | mm | `GPU length (with front fan)` | R02 |
| `gpuLength.withFrontRadiatorMm` | mm | `GPU length (with front radiator)` | R02 |
| `gpuLength.unspecifiedMm` | mm | 官方只給一個 `Max GPU Length`、沒寫條件 | R02 |
| `gpuLength.conditionText` | text | 官方量測條件原文 | R02 |
| `gpuMaxHeightMm` | mm | `GPU height/width`（少數品牌提供） | R04、R12 |
| `maxCpuCoolerHeightMm` | mm | `CPU Cooler Height` | R05 |
| `cpuCoolerHeightConditionText` | text | 量測條件原文（例如是否含側板玻璃）；不拆欄位 | R05 |
| `expansionSlots` | 個 | `Expansion Slots: 7` | R03 |
| `radiatorMounts.{front,top,rear,bottom,side}` | — | `Radiator Support: Front 360/280/240 …` | R08、R09 |
| └ `.sizes[]` | 120/140/240/280/360/420 | | R08 |
| └ `.maxTotalThicknessMm` | mm | 排＋扇合計，例如 `Top radiator + fan max 55mm` | R08、R09 |
| └ `.maxRadiatorThicknessMm` | mm | 只算排，例如 `Radiator thickness max 30mm`。**官方寫哪個就填哪個**，兩者都允許缺值 | R08、R09 |
| └ `.conditionText` | text | 例如「360 需拆除硬碟籠」 | R08 |
| `psu.formFactors[]` | ATX/SFX/SFX-L | `PSU Support: ATX` | R10 |
| `psu.withDriveCageMm` | mm | `PSU length 160mm (with HDD cage)` | R10 |
| `psu.withoutDriveCageMm` | mm | `PSU length 220mm (without HDD cage)` | R10 |
| `psu.unspecifiedMm` | mm | 只給一個數字 | R10 |
| `psu.driveCageRemovable` | bool | | R10 |
| `psu.conditionText` | text | | R10 |
| `cableSpaceMm` | mm | `Cable management space`（不一定有） | R11 |

**顯卡長度條件**用 4 個並列的 optional 數值加上原文來表達，不用單一數字：
- 官方給了多個條件 → 各自填入對應欄位
- 只有一個數字、沒寫條件 → 填 `unspecifiedMm`，不猜測條件
- R02 在 Phase 3 依實際的前置配置挑選對應欄位（見 compatibility-spec R02）

**水冷排位置**用「位置 → 支援尺寸 + 合計厚度上限 + 條件原文」的物件表達，5 個位置各自 optional。

**已決定（Phase 2a）**：水冷厚度分成 `maxTotalThicknessMm`（排＋扇）與 `maxRadiatorThicknessMm`（只算排），照官方寫法填；塔散高度的量測條件寫進 `cpuCoolerHeightConditionText`，不另外拆欄位。

### 3.2 Motherboard（`motherboard`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `formFactor` | enum | `Form Factor: ATX` | R01 |
| `socket` | string | `CPU Socket: AM5` | R14、R22 |
| `chipset` | string | `Chipset: AMD B650` → 存 `B650` | R27 |
| `dimensions.heightMm` | mm | `30.5 cm x 24.4 cm` → **長邊 305**（裝機後上下方向） | 3D、R03 |
| `dimensions.depthMm` | mm | **短邊 244**（前後方向；E-ATX 會比較大） | R01 |
| `memoryType` | DDR4/DDR5（optional） | `Memory: 4 x DIMM, DDR5`；**單選**，同型號有 D4/D5 兩版時拆成兩筆。缺值 = 尚未確認版本 | R23 |
| `memorySlots` | 條 | `4 x DIMM` | R24 |
| `maxMemorySpeedMts` | MT/s | `up to 8000+(OC)` → 取數字，`(OC)` 寫入 notes | R26 |
| `maxMemoryCapacityGb` | GB | `Max. 192GB` | R25 |
| `pcieX16Slots[]` | — | `1 x PCIe 5.0 x16 slot`、`1 x PCIe 4.0 x16 (x4 mode)` | R03、R29 |
| └ `.label` | text | 說明書上的槽位名稱，例如 `PCIEX16_1`（`laneSharing` 以此引用） | R29 |
| └ `.slotIndex` | 第 n 槽 | 通常要看手冊的佈局圖 | R03 |
| └ `.gen` / `.electricalLanes` | 3–6 / 1–16 | 實體 x16 但電氣 x4 時填 4 | R29 |
| └ `.laneSource` | cpu/chipset | | R29 |
| `m2Slots[]` | — | `M.2_1 (PCIe 5.0 x4, 2242/2260/2280)` | R13、R30–R32 |
| └ `.label` | text | 說明書上的槽位名稱，例如 `M2_1` | R30–R32 |
| └ `.pcieGen` | 3–6 \| null | SATA-only 槽填 `null` | R30 |
| └ `.pcieLanes` / `.supportsSata` / `.formFactors[]` / `.laneSource` / `.hasHeatsink` | | | R30、R31、R13 |
| `biosFlashback` | bool | `BIOS FlashBack™`、`Q-Flash Plus`、`Flash BIOS Button` | R27 |
| `hasVideoOutput` | bool | `Display: HDMI / DisplayPort` | R28 |

M.2 數量 = `m2Slots.length`（只在 `m2Slots` 有填時才有意義）。

**已修正**：舊 schema 的 `widthMm`(305) / `heightMm`(244) 命名顛倒，改為 `dimensions.heightMm`（上下，305）/ `dimensions.depthMm`（前後，244）。

**待確認**：
- 各品牌的 BIOS Flashback 名稱很多，Phase 2 需要整理一份對照表
- ~~共用通道無法表達~~ → 已新增 `laneSharing[]`（見下）

**`laneSharing[]`（共用通道）**：一筆描述「`when` 的槽位被使用時，`affects` 的槽位變成 `effect`」。資料來源是說明書的頻寬分配表。

| 欄位 | 說明 |
|---|---|
| `when.kind` / `when.label` | `pcieSlot` / `m2Slot` / `sataPort` + 說明書名稱 |
| `when.condition` | 觸發條件補充，例如「僅在安裝 SATA SSD 時」 |
| `affects.kind` / `affects.label` | 受影響的槽位 |
| `effect` | `{ kind: "disabled" }` 或 `{ kind: "reducedLanes", lanes }` |
| `sourceText` | 說明書原文 |

```json
{ "when": { "kind": "m2Slot", "label": "M2_2" },
  "affects": { "kind": "pcieSlot", "label": "PCIEX16_1" },
  "effect": { "kind": "reducedLanes", "lanes": 8 },
  "sourceText": "說明書原文" }
```

### 3.3 CPU（`cpu`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `socket` | string | AMD `CPU Socket: AM5`；Intel `Sockets Supported: FCLGA1851` → 存 `LGA1851` | R22 |
| `generation` | enum | 沒有官方欄位，由專案定義；可用值見下方命名表 | R27 |
| `hasIntegratedGraphics` | bool | AMD `Graphics Model`；Intel `Processor Graphics`（F 型號沒有內顯） | R28 |
| `memoryTypes[]` | DDR4/DDR5 | Intel `Memory Types: Up to DDR5 5600 MT/s, Up to DDR4 3200 MT/s` | R23 |
| `officialMemorySpeedMts.{DDR4,DDR5}` | MT/s | 取官方標示的**最高值**；這通常是「每通道 1 條（1DPC）」的條件，插滿 4 條時官方支援速度通常更低。原文條件寫進 `notes` | R26 |
| `maxMemoryCapacityGb` | GB | Intel `Max Memory Size`；AMD 官方頁若有就填 | R25 |
| `tdpW` | W | AMD `Default TDP`；Intel `Processor Base Power` | R15 |
| `maxPowerW` | W | **只填官方公開的數字**：Intel `Maximum Turbo Power`；AMD 官方頁沒有 PPT 時留空，**不可用 TDP × 倍率推算** | R15 |
| `maxPowerDefinition` | PPT/PL2/other | | R15 |
| `pcieGen.gpu` / `pcieGen.m2` | 3–6 | `PCI Express Version: PCIe 5.0`；部分 CPU 給顯卡和 M.2 的世代不同 | R29、R30 |

**`generation` 命名表**（`lib/schema/common.ts` 的 `CPU_GENERATIONS`；BIOS 規則表共用）

歸類原則：**依官方型號命名歸類，不依核心微架構**（例如部分 13/14 代 i5 使用上一代核心，仍歸在型號所屬的世代）。13 代與 14 代分開；X3D 與 APU 另外分，因為它們需要的最低 BIOS 常與同代一般型號不同。

| 值 | 包含的系列 | 腳位 |
|---|---|---|
| `intel-core-12` | Core i3/i5/i7/i9 12xxx（含 F / K / KF / T） | LGA1700 |
| `intel-core-13` | Core i3/i5/i7/i9 13xxx | LGA1700 |
| `intel-core-14` | Core i3/i5/i7/i9 14xxx | LGA1700 |
| `intel-core-ultra-200s` | Core Ultra 5/7/9 2xx 桌上型（K / KF / F / 無後綴） | LGA1851 |
| `intel-core-ultra-200s-plus` | Core Ultra 2xx Plus（例：270K Plus、250K/KF Plus，2026 Q1）。官方系列名稱與 200S 相同（Series 2），但記憶體上限不同、BIOS 需求待確認，故分開 | LGA1851 |
| `amd-ryzen-7000` | Ryzen 5/7/9 7xxx 桌上型，**不含** X3D | AM5 |
| `amd-ryzen-7000-x3d` | Ryzen 7xxxX3D | AM5 |
| `amd-ryzen-8000` | Ryzen 8xxxG / 8xxxF（AM5 APU 系列） | AM5 |
| `amd-ryzen-9000` | Ryzen 5/7/9 9xxx 桌上型，**不含** X3D | AM5 |
| `amd-ryzen-9000-x3d` | Ryzen 9xxxX3D | AM5 |

新世代上市時，在 enum 加值並更新此表。

**尚未收錄、待決定是否納入**（Phase 2a 官網調查發現）：Intel Core 5 120/120F（"Series 1"，LGA1700，2025 Q3）、AMD Ryzen AI 400 G/GE（AM5，OEM 供貨，零售與否未知）、AMD Ryzen 5000 / 5000X3D（AM4，官網在推 5800X3D 回歸）。

### 3.4 RAM（`ram`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `memoryType` | DDR4/DDR5 | | R23 |
| `moduleCapacityGb` | GB | `32GB (2x16GB)` → 16 | R25 |
| `moduleCount` | 條 | 同上 → 2 | R24、R25 |
| `speedMts` | MT/s | `DDR5-6000`；部分廠商寫 MHz（實際是 MT/s） | R26 |
| `requiresXmpExpo` | bool | `XMP 3.0 / EXPO Ready`，標稱速度高於 JEDEC 時通常為 true | R26 |
| `moduleHeightMm` | mm | `Height: 44mm`（含散熱片），多數品牌沒寫 | R06、R09 |

### 3.5 GPU（`gpu`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `lengthMm` / `heightMm` / `thicknessMm` | mm | `Dimensions: 304 x 126 x 50 mm`；順序與命名（W/H）各家不同，長度是否含擋板也不一，寫入 notes | R02、R03、R04 |
| `slotWidth` | 槽（可為小數） | `Slot: 2.5` | R03 |
| `powerConnectors[]` | `{type,count}` | `Power Connectors: 1 x 16-pin`；只寫 16-pin 時用 `16-pin` | R12、R33 |
| `tbpW` | W | `Total Board Power`／`Typical Board Power` | R15 |
| `recommendedPsuW` | W | `Recommended PSU: 750W` | R15 |
| `pcieGen` / `pcieLanes` | | `Bus: PCI Express 5.0 x16`；部分入門卡是 x8 | R29 |
| `legacyRecommendedSideClearanceMm` | mm | **mock 遺留，沒有官方來源**；R12 在 Phase 3 改寫後移除 | R12（舊） |

### 3.6 Air cooler（`airCooler`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `heightMm` | mm | `Height (with fan)`；部分品牌只列 heatsink 高度 | R05 |
| `widthMm` / `depthMm` | mm | `Dimensions L x W x H`；換算方式見下方 | R07、3D |
| `supportedSockets[]` | string | `Socket Compatibility: Intel LGA1851/1700, AMD AM5/AM4` | R14 |
| `ramClearance.defaultMm` | mm | Noctua 等品牌提供 `max RAM height` | R06 |
| `ramClearance.withFanRaisedMm` | mm | 上移風扇後的值 | R06 |

**塔散官方 L / W / H 換算（以風扇氣流方向為準，寫死）**

塔散的三個欄位以**散熱器本身**定義，不套用 §0 的機殼座標軸（裝機後 `heightMm` 其實是機殼的左右方向）：

| 本專案欄位 | 定義 | 官方對應 |
|---|---|---|
| `heightMm` | 由 CPU 表面往外（往側板）的高度，含風扇 | 官方 **H**（Height） |
| `depthMm` | **沿風扇氣流方向**的尺寸（含風扇厚度；雙塔就是兩塔加風扇的總厚） | 官方 L 或 W 中「沿氣流」的那個 |
| `widthMm` | **垂直於氣流、平行於主機板**的尺寸（約等於風扇框寬度） | 官方 L 或 W 中的另一個 |

```
          俯視（從側板往主機板看，標準塔散，風由前往後吹）

   機殼前方                                   機殼後方（I/O）
                ┌──────┬──┬──────┬──┐
                │      │F │      │F │   ↑
     氣流 ───▶  │ 鰭片 │a │ 鰭片 │a │   │ widthMm（垂直氣流、平行主機板）
                │      │n │      │n │   ↓
                └──────┴──┴──────┴──┘
                ◀──────── depthMm ────────▶（沿氣流）

          heightMm：垂直於紙面，由主機板往你的方向
```

判斷規則：
1. 官方尺寸圖或文字有標示氣流方向（或標出風扇面）→ 依圖決定 L/W 哪個是 `depthMm`
2. 官方有寫「with fan / without fan」→ `depthMm` 取含風扇的值
3. 官方只給三個數字、沒有圖也沒有說明 → `heightMm` 照填，`widthMm` / `depthMm` **留空**，原文寫進 `notes`（不靠「通常 L 是氣流方向」這類常識推斷）

舊欄位 `ramClearanceMm` 的語意不明，搬遷時暫時放進 `ramClearance.defaultMm`（mock 值，未驗證）。

### 3.7 AIO（`aio`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `radiatorSize` | 120/140/240/280/360/420 | 產品名稱 | R08 |
| `radiatorLengthMm` / `radiatorWidthMm` / `radiatorThicknessMm` | mm | `Radiator Dimensions: 397 x 120 x 27 mm` | R02、R08、R09 |
| `fanThicknessMm` | mm | 看風扇規格，通常是 25 | R02、R08、R09 |
| `supportedSockets[]` | string | 同塔散 | R14 |

舊欄位 `totalThicknessMm` 與「排厚 + 扇厚」重複，已移除；需要時用 `radiatorThicknessMm + fanThicknessMm` 計算（mock 的兩種算法數值一致）。

### 3.8 PSU（`psu`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `formFactor` | ATX/SFX/SFX-L | `Form Factor: ATX 3.1` | R10 |
| `wattage` | W | 產品名稱 | R15 |
| `lengthMm` | mm | `Dimensions: 150 x 86 x 140 mm`（長度的位置不固定） | R10 |
| `modularType` | non/semi/full | `Fully Modular` | R11 |
| `native16PinCount` | 個 | `12V-2x6 (16-pin) x 1`；0 = 確定沒有 | R33 |
| `pcie8PinCount` | 個 | `PCIe 8-pin (6+2) x 4`。定義為**顯卡端可以插的 8-pin 接頭總數**：一條線分兩個頭算 2 | R33 |

**已決定（Phase 2a）**：`pcie8PinCount` 以顯卡端接頭數計算（daisy-chain 一條線兩個頭算 2）。

### 3.9 M.2 SSD（`m2Ssd`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `interface` | `{kind:"pcie",gen,lanes}` \| `{kind:"sata"}` | `Interface: PCIe 4.0 x4 NVMe` | R30 |
| `formFactor` | 2230/2242/2260/2280/22110 | `Form Factor: M.2 2280` | R31 |
| `hasHeatsink` | bool | 型號常有 `with Heatsink` 版本，建議拆成兩筆 | R13 |
| `heatsinkHeightMm` | mm | 少數品牌提供 | R13 |

## 4. BIOS 支援規則表（`data/rules/bios-support.json`）

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "chipset": "B650",
      "cpuGeneration": "ryzen-9000",
      "support": "biosUpdate",
      "minBiosNote": "官方列出的最低 AGESA 版本",
      "boardOverrides": { "<motherboard-id>": "native" },
      "sourceUrl": "https://<官方 CPU 支援清單>",
      "verifiedAt": "YYYY-MM-DD"
    }
  ]
}
```

| 欄位 | 說明 |
|---|---|
| `chipset` | 與 `motherboard.chipset` 完全一致 |
| `cpuGeneration` | 與 `cpu.generation` 完全一致 |
| `support` | `native` / `biosUpdate` / `unsupported` |
| `boardOverrides` | 個別主機板的例外（例如較晚出廠的批次已預載新 BIOS） |
| `sourceUrl` / `verifiedAt` | 必填 |

查不到對應的 entry → R27 回傳 `unknown`。Phase 1 的 `entries` 為空陣列。

**待確認**：實際上 BIOS 支援是「每張主機板一份 CPU 支援清單」，「晶片組 × 世代」只是近似。如果 Phase 2 發現同一個晶片組下的差異太大，可能要改成以主機板為主的表（`boardOverrides` 就是為了這個過渡而設）。
