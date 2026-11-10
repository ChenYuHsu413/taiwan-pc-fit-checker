# 資料 Schema 說明（v2，Phase 2b）

- 原始碼：`lib/schema/common.ts`、`lib/schema/parts.ts`、`lib/schema/biosSupport.ts`、`lib/schema/gpuChips.ts`
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
| 檔案 | `data/parts/<category>.json`（每類一個陣列）、`data/prices/<category>.json`、`data/rules/bios-support.json`、`data/reference/gpu-chips.json` |
| 來源 | 只用原廠官方網頁或官方 PDF。優先順序：規格頁 > PDF 手冊 > 行銷文案；矛盾寫進 notes |
| 腳位寫法 | 填資料時正規化：`LGA 1851` / `Intel 1851` → `LGA1851`；`LGA115X` 展開成各家官方列出的 1150/1151/1155/1156 |
| 版本 | 同一型號不同版本（玻璃/網孔、容量造成尺寸不同）一律拆成不同 id |

### 0.1 條件值（`conditionalMmSchema`）

同一個上限依安裝條件不同而有多個官方數值時使用：

```json
[{ "mm": 145, "condition": "With Fan Bracket（出廠狀態）", "isDefault": true },
 { "mm": 170, "condition": "Without Fan Bracket", "isDefault": false }]
```

- **必須剛好一筆 `isDefault: true`**（驗證會擋）。預設 = 出廠狀態；官方沒寫出廠狀態時取較嚴格的值，並在 condition 說明
- 規則用 isDefault 判斷，其他條件以 Info 顯示
- 欄位之間的連動（同一個支架位置同時改變多個上限）只寫在 condition 文字裡，不做 layoutModes
- 只有一個數字、沒寫條件時：一筆 `isDefault: true`，condition 寫「官方未註明條件」
- 使用欄位：`case.cpuCoolerHeightLimits`、`case.gpuHeightLimits`、`case.psu.lengthLimits`

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
| `additionalSources` | `[{url, fields[]}]`? | sourceUrl 以外的官方來源（手冊、FAQ、datasheet）；`fields` 列出由該頁取得的欄位路徑 |

## 2. 價格（`data/prices/<category>.json`）

| 欄位 | 說明 |
|---|---|
| `partId` | 對應零件的 `id`，載入時會檢查是否存在 |
| `priceTwd` | 正整數（新台幣） |
| `updatedAt` | `YYYY-MM-DD`；距今超過 30 天，UI 顯示「可能過時」（仍照常顯示） |
| `source` | `manual`（人工參考價）／`userImport`（使用者貼估價單）。本輪不填價格，UI 顯示「無參考價」 |
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
| `gpuLength.withFrontRadiator[]` | `{radiatorSize, maxGpuMm}` | `300 mm with 360 mm front mounted radiator` → 只填 360 那筆 | R02 |
| `gpuLength.unspecifiedMm` | mm | 官方只給一個 `Max GPU Length`、沒寫條件 | R02 |
| `gpuLength.conditionText` | text | 官方量測條件原文 | R02 |
| `gpuHeightLimits` | 條件值 | `GPU height/width`（少數品牌提供） | R04 |
| `cpuCoolerHeightLimits` | 條件值 | `CPU Cooler Height`；量測條件寫在 condition | R05 |
| `expansionSlots` | 個 | `Expansion Slots: 7`（`7+2 vertical` 只填水平數，其餘寫 notes） | R03 |
| `gpuMountOrientation` | horizontal / vertical / both | 只能直立裝 = `vertical` | R03 |
| `maxGpuSlotWidth` | 槽 | `Supports up to 3.5-slot GPU` | R03 |
| `includedFans.{front,top,rear,bottom,side}` | `{sizeMm, count, thicknessMm?}` | `Fans included: 2x Aspect 14 PWM (front)`；整個欄位缺值 = 官方沒說，`{}` = 明寫不附 | R02 |
| `radiatorMounts.{front,top,rear,bottom,side}` | — | `Radiator Support: Front 360/280/240 …` | R08、R09 |
| └ `.sizes[]` | 120/140/240/280/360/420 | | R08 |
| └ `.maxTotalThicknessMm` | mm | 排＋扇合計，例如 `Top radiator + fan max 55mm` | R08、R09 |
| └ `.maxRadiatorThicknessMm` | mm | 只算排，例如 `Radiator thickness max 30mm`。**官方寫哪個就填哪個**，兩者都允許缺值 | R08、R09 |
| └ `.conditionText` | text | 例如「360 需拆除硬碟籠」 | R08 |
| `psu.formFactors[]` | ATX/SFX/SFX-L | `PSU Support: ATX` | R10 |
| `psu.lengthLimits` | 條件值 | `1 HDD tray: 255 / 2 HDD tray: 155`、`Standard 220 / Rotated 180` | R10 |
| `psu.conditionText` | text | 長度以外的條件 | R10 |
| `cableSpaceMm` | mm | `Cable management space`（不一定有） | R11 |

**顯卡長度條件**用並列的 optional 數值加上原文來表達，不用單一數字：
- 官方給了多個條件 → 各自填入對應欄位
- 只有一個數字、沒寫條件 → 填 `unspecifiedMm`，不猜測條件
- R02 在 Phase 3 依實際的前置配置挑選對應欄位（見 compatibility-spec R02）

**水冷排位置**用「位置 → 支援尺寸 + 合計厚度上限 + 條件原文」的物件表達，5 個位置各自 optional。

**已決定（Phase 2a）**：水冷厚度分成 `maxTotalThicknessMm`（排＋扇）與 `maxRadiatorThicknessMm`（只算排），照官方寫法填。

**已決定（Phase 2b）**：官方有列水冷支援表時，沒列到的位置填 `sizes: []`，conditionText 寫「官方支援表未列出」。依尺寸不同的厚度上限、排寬、水箱限制寫進 conditionText。

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
| `pcbRevision` | text? | GIGABYTE `rev 1.3` 等；同型號不同 PCB 版本 BIOS 支援不同時填 | R27 |
| `cpuSupportListUrl` | URL? | 該主機板的官方 CPU 支援清單頁 | R27（附連結） |

- `chipset`：B650E 與 B650、X870E 與 X870 **分開記錄**
- M.2 `supportsSata`：官方逐槽列出支援模式時，沒列 SATA = `false`
- `slotIndex`：官方沒有時留空
- `label`：以手冊佈局圖 / 規格頁寫法為準

M.2 數量 = `m2Slots.length`（只在 `m2Slots` 有填時才有意義）。

**已修正**：舊 schema 的 `widthMm`(305) / `heightMm`(244) 命名顛倒，改為 `dimensions.heightMm`（上下，305）/ `dimensions.depthMm`（前後，244）。

**待確認**：
- 各品牌的 BIOS Flashback 名稱很多，Phase 2 需要整理一份對照表
- ~~共用通道無法表達~~ → 已新增 `laneSharing[]`（見下）

**`laneSharing[]`（共用通道）**：一筆描述「`when` 的槽位被使用時，`affects` 的槽位變成 `effect`」。資料來源是說明書的頻寬分配表。

| 欄位 | 說明 |
|---|---|
| `when.kind` / `when.label` | `pcieSlot` / `m2Slot` / `sataPort` + 說明書名稱 |
| `when.kind = "allOf"` + `when.slots[]` | 列出的槽位**全部**被使用才觸發 |
| `when.kind = "cpuGeneration"` + `when.generations[]` | CPU 屬於這些世代時觸發（例如 Ryzen 8000 停用 M.2_2） |
| `when.condition` | 觸發條件補充，例如「僅在安裝 SATA SSD 時」 |
| `affects.kind` / `affects.label` | 受影響的槽位 |
| `effect` | `{ kind: "disabled" }`、`{ kind: "reducedLanes", lanes }` 或 `{ kind: "downgraded", gen?, lanes? }` |
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
| `hasIntegratedGraphics` | bool | AMD `Graphics Model`；Intel `Processor Graphics`。ARK 沒有內顯區塊且型號帶 F / KF → `false` | R28 |
| `memoryTypes[]` | DDR4/DDR5 | Intel `Memory Types: Up to DDR5 5600 MT/s, Up to DDR4 3200 MT/s` | R23 |
| `officialMemorySpeedMts.{DDR4,DDR5}` | MT/s | 取官方標示的**最高值**；這通常是「每通道 1 條（1DPC）」的條件，插滿 4 條時官方支援速度通常更低。原文條件寫進 `notes` | R26 |
| `memorySpeedTable[]` | `{memoryType, modulesPerChannel, rank, mts}` | AMD `2x1R DDR5-5600 / 4x2R DDR5-3600`；總條數 2 → modulesPerChannel 1。**有表時 R26 以表為準** | R26 |
| `maxMemoryCapacityGb` | GB | Intel `Max Memory Size`；AMD 官方頁若有就填 | R25 |
| `tdpW` | W | AMD `Default TDP`；Intel `Processor Base Power` | R15 |
| `maxPowerW` | W | **只填官方公開的數字**：Intel `Maximum Turbo Power`；AMD 官方頁沒有 PPT 時留空，**不可用 TDP × 倍率推算** | R15 |
| `maxPowerDefinition` | PPT / MTP / other | MTP = Intel `Maximum Turbo Power` | （R15 不估算整機功耗，目前不使用） |
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
| `amd-ryzen-5000` | Ryzen 5/7/9 5xxx 桌上型，**不含** X3D | AM4 |
| `amd-ryzen-5000-x3d` | Ryzen 5xxxX3D | AM4 |
| `amd-ryzen-7000` | Ryzen 5/7/9 7xxx 桌上型，**不含** X3D | AM5 |
| `amd-ryzen-7000-x3d` | Ryzen 7xxxX3D | AM5 |
| `amd-ryzen-8000` | Ryzen 8xxxG / 8xxxF（AM5 APU 系列） | AM5 |
| `amd-ryzen-9000` | Ryzen 5/7/9 9xxx 桌上型，**不含** X3D | AM5 |
| `amd-ryzen-9000-x3d` | Ryzen 9xxxX3D | AM5 |

新世代上市時，在 enum 加值並更新此表。

**不收錄**（2026-11-10 決定）：Intel Core 5 120/120F、AMD Ryzen AI 400。AM4（Ryzen 5000 / 5000X3D）已納入。

### 3.4 RAM（`ram`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `memoryType` | DDR4/DDR5 | | R23 |
| `moduleCapacityGb` | GB | `32GB (2x16GB)` → 16 | R25 |
| `moduleCount` | 條 | 同上 → 2 | R24、R25 |
| `speedMts` | MT/s | `DDR5-6000`；部分廠商寫 MHz（實際是 MT/s） | R26 |
| `rank` | 1 / 2 / 4? | `1Rx8` → 1、`2Rx8` → 2；官方沒寫就留空 | R26 |
| `requiresXmpExpo` | bool | `XMP 3.0 / EXPO Ready`，標稱速度高於 JEDEC 時通常為 true | R26 |
| `moduleHeightMm` | mm | `Height: 44mm`（含散熱片），多數品牌沒寫 | R06、R09 |

### 3.5 GPU（`gpu`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `gpuChip` | id | 對應 `data/reference/gpu-chips.json`，例如 `nvidia-geforce-rtx-5090` | R15、R29 |
| `lengthMm` / `heightMm` / `thicknessMm` | mm | `Dimensions: 304 x 126 x 50 mm`；順序與命名（W/H）各家不同，長度是否含擋板也不一，寫入 notes | R02、R03、R04 |
| `dimensionsAxisInferred` | bool? | 官方沒標軸向時判讀：最大值 = 長度、最接近「槽數 × 20.32 mm」= 厚度、剩下 = 高度。true 時 notes 必須說明 | R02–R04 |
| `slotWidth` | 槽（可為小數） | `Slot: 2.5` | R03 |
| `powerConnectors[]` | `{type,count}` | `Power Connectors: 1 x 16-pin`；只寫 16-pin 時用 `16-pin` | R12、R33 |
| `tbpW` | W | `Total Board Power`／`Typical Board Power` | R15 |
| `recommendedPsuW` | W | `Recommended PSU: 750W` | R15 |
| `pcieGen` / `pcieLanes` | | `Bus: PCI Express 5.0 x16`；部分入門卡是 x8。板卡廠沒寫時，規則用晶片參考表 | R29 |

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
| `lengthMm` | mm | `Dimensions: 150 x 86 x 140 mm`（長度的位置不固定）。**定義 = 伸入機殼的深度**（ATX 不取 150 寬；SFX 取 100），不照官方的「L」字樣 | R10 |
| `modularType` | non/semi/full | `Fully Modular` | R11 |
| `native16PinCount` | 個 | `12V-2x6 (16-pin) x 1`；0 = 確定沒有。系列頁沒列出某瓦數的數量時**留空**，不填 0 | R33 |
| `pcie8PinCount` | 個 | `PCIe 8-pin (6+2) x 4`。定義為**顯卡端可以插的 8-pin 接頭總數**：一條線分兩個頭算 2 | R33 |

**已決定（Phase 2a）**：`pcie8PinCount` 以顯卡端接頭數計算（daisy-chain 一條線兩個頭算 2）。

### 3.9 M.2 SSD（`m2Ssd`）

| 欄位 | 單位 | 官方常見寫法 | 規則 |
|---|---|---|---|
| `interface` | `{kind:"pcie", modes:[{gen,lanes}]}` \| `{kind:"sata"}` | `Interface: PCIe 4.0 x4 NVMe`；990 EVO Plus `PCIe 4.0 x4 / 5.0 x2` → 兩筆 modes | R30 |
| `formFactor` | 2230/2242/2260/2280/22110 | `Form Factor: M.2 2280` | R31 |
| `hasHeatsink` | bool | 型號常有 `with Heatsink` 版本，拆成兩筆 | — |
| `moduleTotalHeightMm` | mm | 官方 datasheet 的模組總高（含 PCB 與散熱片），例如 Samsung `Max 8.88` | （R13 尚未檢查） |

同型號不同容量尺寸不同時，**id 要包含容量**（例如 `samsung-9100-pro-heatsink-2tb`）。

## 4. BIOS 支援規則表（`data/rules/bios-support.json`，schemaVersion 2）

```json
{
  "schemaVersion": 2,
  "entries": [
    {
      "chipset": "B650",
      "cpuGeneration": "amd-ryzen-9000",
      "support": "biosUpdate",
      "minBiosNote": "官方通則原文",
      "boardOverrides": { "<motherboard-id>": { "minBios": "2613", "sourceUrl": "https://<該板 CPU 支援清單>" } },
      "sourceUrl": "https://<AMD / Intel 官方頁>",
      "verifiedAt": "YYYY-MM-DD"
    }
  ]
}
```

| 欄位 | 說明 |
|---|---|
| `chipset` | 與 `motherboard.chipset` 完全一致（B650E ≠ B650） |
| `cpuGeneration` | 與 `cpu.generation` 完全一致 |
| `support` | `native` / `biosUpdate` / `unsupported`，**以晶片組為準**（AMD / Intel 官方通則） |
| `minBiosNote` | 官方通則原文或判斷依據 |
| `boardOverrides` | 個別主機板的最低 BIOS 版本 `{minBios, sourceUrl}`，出自主機板廠 CPU 支援清單；**不覆寫等級**。同世代內不同 CPU 型號要的版本不同時，minBios 寫成文字（例：`9600X 等 2613；9850X3D 3263`） |
| `sourceUrl` / `verifiedAt` | 必填 |

查不到對應的 entry → R27 回傳 `unknown`。不做逐顆 CPU 的最低版本表。

## 5. 顯示晶片參考表（`data/reference/gpu-chips.json`）

| 欄位 | 說明 |
|---|---|
| `id` | 例如 `nvidia-geforce-rtx-5090`，`gpu.gpuChip` 引用 |
| `vendor` / `name` | NVIDIA / AMD |
| `pcieGen` / `pcieLanes` | 官方明寫才填 |
| `tbpW` | 官方 Total Graphics Power / Total Board Power |
| `recommendedPsuW` / `psuWording` | 官方系統電源建議與用詞原文 |
| `sourceUrl` / `verifiedAt` | 必填，只用 nvidia.com / amd.com |

板卡廠規格頁沒寫的值，規則改用這張表（R15 建議電源、R29 PCIe）。載入時檢查：已驗證的顯卡 `gpuChip` 必須存在於此表。
