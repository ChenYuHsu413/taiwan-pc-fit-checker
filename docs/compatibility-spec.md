# 相容性規則規格（v2，Phase 3 已實作）

- 狀態：**v2（Phase 3，2026-11-10）**。§P 為現行實作，§0 之後是 Phase 0–1 的草案與背景說明（門檻提案已不採用）
- 程式：`lib/compatibility/index.ts`（判斷）、`rules.ts`（清單、分組、尚未檢查原因）、`messages.ts`（文案）；測試 `tests/rules.test.ts`、`tests/real-builds.test.ts`

## §P Phase 3 現行實作

### P.1 狀態判定原則

| 狀態 | 何時使用 |
|---|---|
| `incompatible` | 官方數值明確顯示裝不下或插不上 |
| `safe` | 官方數值明確顯示裝得下；報告附「餘裕 X mm」 |
| `tight` | **本輪不實作**（門檻沒有可靠依據），報告在「尚未檢查的項目」說明 |
| `warning` | 只用在有明確官方依據的情況：需要更新 BIOS（R27）、需要轉接線（R33）、電源低於顯卡官方建議（R15） |
| `info` | 能用但會降速（PCIe、記憶體速度），或官方另有條件（conditionText / 條件值的其他條件不是空的） |
| `unknown` | 需要的資料缺值，或只選了一側零件（原本誤報 warning 的 R01 / R02 / R05 / R10 四處已全部改成 unknown） |

- 條件值欄位：用 `isDefault` 那筆判斷，其他條件列在結果的 `conditions`（有其他條件時 safe → info）
- 沒有可靠判斷依據的規則**不產生結果**，固定列在報告最下方「尚未檢查的項目」，附原因

### P.2 規則實作表

| 規則 | 狀態 | 實作重點 |
|---|---|---|
| R01 | 實作 | 板型清單；E-ATX 且雙方都有寬度時比較 `dimensions.depthMm ≤ maxMotherboardDepthMm` |
| R02 | 實作 | 依前置實際裝的東西選官方上限：使用者選前置水冷 → `withFrontRadiator` 中同尺寸那筆；機殼內附前置風扇 → `withFrontFanMm`；都沒有 → `noFrontMm`。**不再扣厚度**。對應條件沒有數字時用 `unspecifiedMm` 並加 Info；也沒有 → Unknown。官方沒說是否內附風扇且兩個數字都有時取較嚴格者 |
| R03 | 部分 | 有 `maxGpuSlotWidth` 時比較槽數；槽數 > 擴充槽總數 → incompatible；只能直立裝 → info。其餘（第一條 x16 槽位置官方不公開）列為尚未檢查 |
| R04 | 實作 | `gpu.heightMm` vs `gpuHeightLimits`（isDefault） |
| R05 | 實作 | `airCooler.heightMm` vs `cpuCoolerHeightLimits`（isDefault） |
| R06 | 實作 | `ram.moduleHeightMm` vs `ramClearance.defaultMm`（出廠風扇位置）；超過 → incompatible，建議參考官方上移風扇做法 |
| R07 | 尚未檢查 | 鰭片離板高度與 VRM 散熱片高度官方不公開 |
| R08 | 實作 | 所選位置（前 / 上）的 sizes；有厚度上限且水冷厚度有值時比較；沒有厚度上限 → unknown |
| R09 | 尚未檢查 | 頂部排與主機板 / RAM 的幾何資料官方不公開（排的尺寸與厚度仍由 R08 檢查） |
| R10 | 實作 | 電源規格清單（ATX 進 SFX 機殼 → incompatible；SFX 進只列 ATX 的機殼 → unknown，轉接架官方未說明）＋ `psu.lengthLimits`（isDefault） |
| R11 | 尚未檢查 | 走線空間沒有可靠門檻（舊版 20 mm 沒有出處） |
| R12 | 尚未檢查 | 供電接頭直線段長度沒有可查證的官方數字 |
| R13 | 尚未檢查 | PCIe 槽高度與顯卡背板距離官方不公開 |
| R14 | 實作 | 主機板（沒有則 CPU）腳位 ∈ 散熱器 `supportedSockets` |
| R15 | 實作 | **只比對**電源瓦數 vs 顯卡官方建議電源（板卡廠沒寫用 `gpu-chips.json`）；不足 → warning。不估算整機功耗 |
| R17 / R20 / R21 | 尚未檢查 | 機殼內部距離、直立支架、底部風扇距離官方不公開 |
| R22–R25 | 實作 | 依 §4 |
| R26 | 實作 | 有 `memorySpeedTable` 且 RAM 有 rank 時依「每通道條數 × rank」查表，否則用 `officialMemorySpeedMts`；超出 CPU / 主機板或需 XMP/EXPO → info |
| R27 | 實作 | 依 BIOS 表（晶片組 × 世代）；`biosUpdate` 訊息依 `biosFlashback` true / false / 缺值不同；`boardOverrides` 有最低版本時列出；有 `cpuSupportListUrl` 時附連結 |
| R28 | 實作 | 依 §4 |
| R29 | 實作 | 預設顯卡插 `pcieX16Slots[0]`；套用 laneSharing（CPU 世代觸發、M.2 佔用觸發，含 allOf）；顯卡 PCIe 缺值用晶片表；世代或通道數不同一律 info |
| R30–R32 | 實作 | M.2 貪婪分配（世代高的 SSD 先挑；先挑能全速的最低世代槽）；CPU 世代停用的槽不列入可用槽 |
| R33 | 實作 | 16-pin：PSU 原生 0 個 → warning（需轉接線）；8-pin 不足 → incompatible；缺值 → unknown |

### P.3 已移除

- `TIGHT_THRESHOLD_MM`（10 mm）、走線 20 mm、顯卡剩餘 20 mm 等沒有出處的門檻
- 走線建議只保留不需要門檻的提醒（16-pin 接頭、非模組化電源）
- R12 原本的假檢查（一律 warning）

---

# 以下為 Phase 0–1 草案（背景）

- 狀態：草案 v1（Phase 1 已加入 `info` / `unknown` 狀態、規則分組，以及平台規則 R22–R33）
- 單位：全部為 mm；功率單位為 W
- 「已實作」欄對照的是 commit `6c30241` 的 `lib/compatibility.ts`

---

## 0. 共通約定

### 0.1 狀態定義

| 狀態 | 意義 |
|---|---|
| `safe` | 有足夠餘裕 |
| `tight` | 物理上放得下，但餘裕低於緩衝值，需要實際確認 |
| `warning` | 無法用尺寸確定、或已知有風險（例如需要拆硬碟籠、需要調整風扇位置） |
| `incompatible` | 確定裝不下或不相容 |
| `info` | 可以用，但效能會打折，或有使用者需要知道的事（例如 PCIe 降速、需開 XMP/EXPO） |
| `unknown` | 資料不足、零件未選齊，**不計入**整體警示 |

嚴重度由高到低：`incompatible` > `warning` > `tight` > `info` > `safe`；`unknown` 獨立，不參與排序。

> Phase 1 已加入型別與 UI 樣式，但**判斷邏輯未改**。零件未選齊時誤報 `warning` 的地方共有**四處**（Phase 0 盤點只寫了兩處，實際上 R02、R10 也是同樣的寫法）：R01（只選機殼或只選主機板）、R02（只選機殼或只選顯卡）、R05（尚未選擇散熱器）、R10（只選機殼或只選電源）。程式中統一經過 `legacyMissingSelection()`，留到 Phase 3 改回傳 `unknown`。
>
> Phase 1 新增的部分：新 schema 允許缺值，**官方規格缺值**時會回傳 `unknown`（`missingSpec()`）。mock 資料全部有值，所以實際結果與 Phase 0 相同。

### 0.2 門檻參數（提案）

所有「剩餘空間型」規則共用同一個分類函式，各規則只需要提供 `tightBelowMm`：

```
remaining = limit − measured
remaining < 0               → incompatible
0 ≤ remaining < tightBelow  → tight
其他                        → safe
（資料欄位缺漏或量測條件不明 → unknown 或 warning，視規則而定）
```

各規則的 `tightBelowMm` 都是**提案值，待確認**。業界沒有統一標準，這些數字屬於產品決策，要由你拍板。現行程式一律使用 10 mm。

### 0.3 `ruleId` 與分組

- 每個檢查結果都帶固定的 `ruleId`（`R01`…`R33`），定義於 `lib/compatibility/rules.ts`；2D/3D/走線建議一律用 `ruleId` 找結果（Phase 1 已完成）
- 每條規則都有 `group`：`spatial`（空間）或 `platform`（平台），報告 UI 依分組顯示（Phase 3）
- 下文各規則標題中的 `gpu.length` 等是語意標籤，程式中使用 `ruleId`

---

## 1. 規則清單

> 欄位名稱是 **Phase 1 型別提案**，現行型別中沒有的會標註 *(新)*。

### R01 主機板板型 vs 機殼 — `mb.formFactor`
- **檢查**：機殼是否支援此板型
- **欄位**：`case.supportedFormFactors[]`、`case.maxMbWidthMm` *(新，E-ATX 用)*、`mb.formFactor`、`mb.shortEdgeMm` *(新，取代 heightMm)*
- **邏輯**：板型 ∈ 支援清單 → safe；若為 E-ATX 且機殼有 `maxMbWidthMm`，再比 `mb.shortEdgeMm ≤ maxMbWidthMm`
- **門檻**：布林判斷；E-ATX 寬度超出 → incompatible；E-ATX 但機殼沒有寬度資料 → warning（可能會遮住走線孔）
- **已實作**：✅ 部分（只做集合判斷）

### R02 顯卡長度 — `gpu.length`
- **檢查**：顯卡長度 vs 機殼前方障礙物
- **欄位**：`gpu.lengthMm`（需標註是否含擋板，見 data-strategy）、`case.gpuLength` *(新，結構化)*：
  ```
  { noFrontFanMm?, withFrontFanMm?, withFrontRadiatorMm?, notes? }
  ```
  前置配置：`frontFanThicknessMm`（使用者可選，預設 25）、AIO `radiatorThicknessMm` + `fanThicknessMm`
- **邏輯**：依實際前置配置挑選**最接近的官方條件值**：
  1. 前置有水冷排，且官方有 `withFrontRadiatorMm` → 直接使用（**不再扣厚度**）
  2. 前置有水冷排，但只有 `noFrontFanMm` → `noFrontFanMm − (排厚 + 扇厚)`，並標成 warning 等級的說明「推算值」
  3. 前置只有風扇 → `withFrontFanMm`，或 `noFrontFanMm − 扇厚`
  4. 都沒有 → `noFrontFanMm`
  
  `remaining = limit − gpu.lengthMm`
- **門檻**：`tightBelowMm` = 10（提案，**待確認**）；使用了推算值時，結果最高只能是 `tight`（提案，**待確認**）
- **已實作**：⚠️ 錯誤。目前一律以單一上限扣除前置排厚，可能**重複扣除**；也沒考慮水冷排在垂直方向是否與顯卡重疊（例如 360 排只擋住上半部的機殼）。是否需要做垂直重疊判斷：**待確認**（需要機殼內部幾何資料，第一版可以不做）

### R03 顯卡厚度／槽數 vs 機殼擴充槽與電源倉 — `gpu.thickness`
- **檢查**：(a) 顯卡佔用的槽數 ≤ 機殼擴充槽數（從主機板第一條 x16 槽算起）；(b) 卡身下緣不撞到電源倉或底部風扇
- **欄位**：`gpu.thicknessMm`、`gpu.slotCount`（可能是 2.5/3.5 這種小數）、`case.expansionSlots` *(新)*、`mb.pcieX16TopOffsetMm` *(新，第一條 x16 距板上緣)*、`mb.pcieX16SlotIndex` *(新，主機板第幾槽位)*、`case.shroudTopToMbTopMm` *(新)* 或由主機板安裝孔位推算
- **邏輯**：
  - (a) `ceil(slotCount) + (x16 槽位 index − 1) ≤ case.expansionSlots`
  - (b) `gapToShroud = (主機板上緣到電源倉頂的距離) − pcieX16TopOffsetMm − gpu.thicknessMm`
- **門檻**：(a) 超出 → incompatible；(b) `tightBelowMm` = 5（提案，**待確認**），< 0 → incompatible
- **已實作**：❌ 缺漏（`slotCount`、`thicknessMm` 只在 3D 使用）
- **註**：ATX 擴充槽間距是 20.32 mm（0.8 吋，ATX 規範值）

### R04 顯卡高度（寬度）vs 側板 — `gpu.height`
- **檢查**：顯卡由 PCIe 槽往側板方向的突出量
- **欄位**：`gpu.heightMm`、`case.gpuMaxHeightMm` *(新，若官方有提供)* 或 `case.mbToSidePanelMm` *(新)*
- **邏輯**：`remaining = 上限 − gpu.heightMm`；R12（供電彎折）會再扣一次
- **門檻**：`tightBelowMm` = 10（提案，**待確認**）
- **已實作**：❌ 缺漏

### R05 塔散高度 — `cooler.height`
- **欄位**：`case.maxCpuCoolerHeightMm`、`airCooler.heightMm`（官方值通常含風扇）
- **邏輯**：`remaining = 上限 − heightMm`
- **門檻**：`tightBelowMm` = 5（提案，**待確認**；現行是 10）
- **已實作**：✅

### R06 塔散 vs RAM 高度 — `cooler.ram`
- **欄位**：`airCooler.ramClearanceMm` *(語意需重新定義)*：
  ```
  ramClearance: { defaultMm, withFanRaisedMm?, maxFanRaiseMm? }
  ```
  `ram.moduleHeightMm` *(新)*；`airCooler.overhangsRam: boolean` *(新，單塔或偏移式散熱器可能完全不覆蓋 RAM)*
- **邏輯**：
  - 不覆蓋 RAM → safe
  - `ram.moduleHeightMm ≤ defaultMm` → 依剩餘值分類
  - 超過 `defaultMm`，但 ≤ `withFanRaisedMm` → warning（需要上移風扇，接著 R05 要以 `heightMm + 上移量` 重算）
  - 都超過 → incompatible
- **門檻**：`tightBelowMm` = 2（提案，**待確認**）
- **前置需求**：需要新增 RAM 類別
- **已實作**：❌ 缺漏（`ramClearanceMm` 有存但沒有使用）

### R07 塔散 vs 主機板 VRM 散熱片／I/O 蓋 — `cooler.vrm`
- **欄位**：`mb.vrmHeatsinkHeightMm` *(新)*、`mb.socketToVrmTopMm` / `socketToIoCoverMm` *(新)*、`airCooler.baseToFinBottomMm` *(新)*、鰭片的投影尺寸與偏移
- **邏輯**：散熱器鰭片下緣高度 > VRM 散熱片高度 → safe；否則依投影是否重疊判斷
- **門檻**：資料完整時才做；資料不完整 → `unknown`
- **待確認**：官方很少公開「鰭片下緣離板高度」與 VRM 散熱片高度。這一條**可能只能做成提醒**，或依賴使用者回報／實測。建議列為 Phase 3 之後的選做項目
- **已實作**：❌ 缺漏

### R08 水冷排位置與尺寸支援 — `aio.mount`
- **欄位**：`case.radiatorMounts` *(新)*：
  ```
  { position: "front" | "top" | "side" | "bottom" | "rear",
    sizes: (120|140|240|280|360|420)[],
    maxThicknessMm? }[]
  ```
  `aio.radiatorSizeMm`、`aio.radiatorThicknessMm`、`aio.fanThicknessMm`
- **邏輯**：所選位置的 `sizes` 包含此排 → 再比厚度 `排厚 + 扇厚 ≤ maxThicknessMm`
- **門檻**：尺寸不支援 → incompatible；超出厚度 → incompatible；`maxThicknessMm` 未知 → warning
- **已實作**：⚠️ 只有 front 的尺寸檢查，而且**必須選了顯卡才會執行**（bug）；top 完全沒有檢查（`topRadiatorSupport` 未使用）

### R09 上置水冷排 vs 主機板上緣與 RAM — `aio.top`
- **欄位**：`case.topRadiatorClearanceMm` *(新，頂部安裝面到主機板上緣的距離；部分官方規格會寫成「top radiator + fan max thickness」)*、`ram.moduleHeightMm`、`mb.dimmTopOffsetMm` *(新)*、`mb.ioCoverHeightMm` *(新)*
- **邏輯**：`排厚 + 扇厚 ≤ topRadiatorClearanceMm`；若沒有偏移支架，再檢查與 RAM、I/O 蓋、8-pin CPU 供電接頭的垂直重疊
- **門檻**：`tightBelowMm` = 3（提案，**待確認**）
- **待確認**：多數機殼官方只提供「頂部最大厚度」這類單一數字。是否需要做與 RAM 的幾何判斷，取決於資料能否取得
- **已實作**：❌ 缺漏

### R10 PSU 長度 vs 電源倉／硬碟籠 — `psu.length`
- **欄位**：`case.psu` *(新)*：
  ```
  { formFactors: ("ATX"|"SFX"|"SFX-L")[],
    maxLengthMm, maxLengthWithDriveCageMm?, driveCageRemovable }
  ```
  `psu.formFactor`、`psu.lengthMm`
- **邏輯**：
  - 規格不支援（例如 SFX-only 的機殼裝 ATX）→ incompatible
  - ATX 機殼裝 SFX → warning（需要轉接架）
  - 有保留硬碟籠的上限 → 先比；放不下但拆掉硬碟籠可以 → warning「需拆除硬碟籠」
- **門檻**：`tightBelowMm` = 15（提案，**待確認**；理由是模組化 PSU 背後還需要插線空間，但具體數字沒有出處）
- **已實作**：⚠️ 只比單一長度

### R11 背板走線深度 — `cable.depth`
- **欄位**：`case.cableSpace` *(新)*：`{ minMm, typicalMm? }`（官方常只給一個值，需要標註量測位置）、`psu.modularType`
- **邏輯**：這是**風險提示型**規則，沒有硬性的物理門檻。以 `minMm` 對照建議值，非模組化 PSU 時提高建議值
- **門檻**：建議值（現行 20 mm）**待確認**；永遠不會是 incompatible
- **已實作**：✅ 部分（固定 20 mm）

### R12 12V-2x6 / 12VHPWR 彎折空間 vs 側板 — `gpu.powerBend`
- **欄位**：`gpu.powerConnector` *(新)*：`{ type, location: "top-edge"|"rear-edge"|"pcb-end", count }`；`gpu.heightMm`；`case.gpuMaxHeightMm` / `mbToSidePanelMm`；`connectorStraightMm` *(全域常數)*
- **邏輯**：`location = top-edge` 時，`available = 側板上限 − gpu.heightMm`，`need = connectorStraightMm`（接頭本體 + 彎折前的直線段）。使用 90° 轉接頭的情況可以讓使用者自行勾選
- **門檻**：`available < need` → warning（**不是** incompatible，因為有 90° 線材可以解決）；`available ≥ need` → safe
- **待確認**：`connectorStraightMm` 的數值。業界常見的說法是「接頭後需保留一段直線再彎折」（印象中 NVIDIA/線材廠的指引約 35 mm），但我**無法在本輪查證出處**，不填數字
- 8-pin 也適用相同邏輯（只是風險較低），是否套用：**待確認**
- **已實作**：❌ 錯誤（一律回傳 warning，沒有計算）

### R13 M.2 散熱片 vs 顯卡背面 — `m2.gpu`
- **欄位**：`mb.m2Slots[]` *(新)*：`{ position: "above-x16"|"below-x16"|..., heatsinkHeightMm? }`；`storage.heatsinkHeightMm` *(新)*；`gpu.backplateClearanceMm`（通常沒有資料）
- **邏輯**：M.2 位於 x16 槽下方、且散熱片高度 > PCIe 槽高度 → warning
- **待確認**：PCIe 槽在板面上的高度，以及顯卡背板的實際離板距離，官方幾乎都不會公開。建議只做**提醒型**規則（「此 M.2 位於顯卡下方，請確認散熱片高度」）
- **已實作**：❌ 缺漏

### R14 主機板腳位 vs 散熱器扣具 — `socket.cooler`（分組：**platform**）
> Phase 1 調整：CPU vs 主機板腳位拆到 R22；本條只檢查散熱器
- **欄位**：`motherboard.socket`、`airCooler.supportedSockets[]` / `aio.supportedSockets[]`
- **邏輯**：
  - `supportedSockets` 缺值 → unknown
  - `mb.socket ∈ cooler.supportedSockets`，或屬於同一個「扣具相容群組」→ safe
  - 不在清單內 → incompatible；若需要另購扣具 → warning
- **扣具相容群組**：AM4/AM5 孔距相同、LGA1700/LGA1851 孔距相同，這兩點我有把握；但個別散熱器是否需要額外扣具，**一律以官方支援清單為準**，不靠群組推論
- **已實作**：❌ 缺漏（散熱器沒有 socket 欄位，也沒有 CPU 類別）

### R15 PSU 瓦數估算 — `psu.wattage`（分組：**platform**）
> Phase 1 調整：瓦數屬於電氣相容，改歸 platform
- **欄位**：`cpu.maxPowerW` *(新，AMD PPT / Intel PL2)*、`gpu.tbpW` *(新)*、`gpu.recommendedPsuW` *(新，官方建議)*、`psu.wattage`
- **邏輯（提案）**：
  ```
  estimate = cpu.maxPowerW + gpu.tbpW + otherW
  ```
  另外與官方 `gpu.recommendedPsuW` 比較，取較嚴格者
- **門檻**：`psu.wattage < estimate` → incompatible？還是 warning？；`estimate / wattage` 超過某個比例 → tight。`otherW` 與比例都**待確認**（業界的估算方式各家不同）
- **已實作**：❌ 缺漏（只有 `wattage` 欄位）

---

## 2. 建議補充的規則

| ID | 規則 | 說明 | 優先度 |
|---|---|---|---|
| R16 | ~~RAM 代數 vs 主機板~~ | **已併入 R23** | — |
| R17 | AIO 水管長度 vs 安裝位置 | 前置 360 + 長機殼時水管可能不夠長；資料取得困難 | 低 |
| R18 | ~~顯卡供電接頭數 vs PSU~~ | **已併入 R33** | — |
| R19 | 主機板寬度 vs 走線孔（E-ATX） | 併入 R01 | — |
| R20 | 直立顯卡 | 需要機殼支援與轉接線；之後再做 | 低 |
| R21 | 底部進風風扇 vs 顯卡厚度 | 部分機殼底部可裝風扇，會吃掉 R03 的空間 | 中 |

---

## 3. 統計（對照現行程式）

| 分類 | 數量 | 項目 |
|---|---|---|
| 已實作且正確（含簡化） | 2 | R01（部分）、R05 |
| 已實作但簡化過頭 | 3 | R08（只有 front）、R10、R11 |
| 已實作但錯誤 | 2 | R02（重複扣除）、R12（假檢查） |
| 完全缺漏 | 8 | R03、R04、R06、R07、R09、R13、R14、R15 |
| 新增建議 | 6 | R16–R21 |

另外還有 2 個語意 bug（資料不足時回傳 `warning`），在 §0.1 以 `unknown` 狀態處理。

---

## 4. 平台相容性規則（R22–R33，分組皆為 `platform`）

> 欄位名稱對應 `docs/schema.md`。全部在 Phase 3 實作。任何必要欄位缺值時，一律回傳 `unknown`。

### R22 CPU 腳位 vs 主機板腳位 — `socket.cpu`
- **欄位**：`cpu.socket`、`motherboard.socket`
- **邏輯**：字串完全相等 → safe；否則 → incompatible
- **已實作**：❌

### R23 記憶體類型 — `memory.type`
- **欄位**：`ram.memoryType`、`motherboard.memoryType`、`cpu.memoryTypes[]`
- **邏輯**：`ram.memoryType !== mb.memoryType` → incompatible；`cpu.memoryTypes` 有值且不包含 `mb.memoryType` → incompatible（例如只支援 DDR5 的 CPU 配上 DDR4 主機板）；`cpu.memoryTypes` 缺值 → 只檢查 RAM vs 主機板，CPU 部分附註 unknown
- **已實作**：❌（取代 R16）

### R24 記憶體條數 vs 插槽數 — `memory.slots`
- **欄位**：`ram.moduleCount`、`motherboard.memorySlots`
- **邏輯**：`moduleCount > memorySlots` → incompatible
- **已實作**：❌

### R25 總容量 vs 主機板上限 — `memory.capacity`
- **欄位**：`ram.moduleCapacityGb × ram.moduleCount`、`motherboard.maxMemoryCapacityGb`
- **邏輯**：超過 → incompatible；`maxMemoryCapacityGb` 缺值 → unknown
- **待確認**：是否也要比對 CPU 的最大容量（需要新增 `cpu.maxMemoryCapacityGb` 欄位，目前沒有）
- **已實作**：❌

### R26 記憶體速度 — `memory.speed`
- **欄位**：`ram.speedMts`、`ram.requiresXmpExpo`、`motherboard.maxMemorySpeedMts`、`cpu.officialMemorySpeedMts[ram.memoryType]`
- **邏輯**：
  - `speedMts > cpu 官方速度` → info「超出 CPU 官方支援，需要 XMP/EXPO 超頻，穩定性不保證」
  - `speedMts > mb.maxMemorySpeedMts` → info「超出主機板上限，會降速」
  - 未超出但 `requiresXmpExpo` → info「需在 BIOS 開啟 XMP/EXPO 才能跑到標稱速度」
  - 都沒有 → safe
- **待確認**：主機板的上限常含 `(OC)`，CPU 官方速度也依條數與 rank 而不同（例如 4 條時會更低）。第一版只用單一數字，是否要考慮條數：待確認
- **已實作**：❌

### R27 晶片組 × CPU 世代 BIOS — `bios.support`
- **欄位**：`motherboard.chipset`、`motherboard.id`、`motherboard.biosFlashback`、`cpu.generation`；規則表 `data/rules/bios-support.json`
- **邏輯**：查表（`boardOverrides` 優先）
  - `native` → safe
  - `biosUpdate` 且 `biosFlashback === true` → warning「可能需要更新 BIOS，此主機板支援免 CPU 更新（BIOS Flashback）」
  - `biosUpdate` 且 `biosFlashback !== true` → warning「可能需要更新 BIOS，此主機板無 Flashback，需要舊 CPU 開機更新或請店家代刷」（訊息依 Flashback 有無而不同）
  - `unsupported` → incompatible
  - 查不到 → unknown
- **已實作**：❌（Phase 1 只定規則表格式）

### R28 影像輸出 — `display.output`
- **欄位**：`cpu.hasIntegratedGraphics`、`motherboard.hasVideoOutput`、是否選擇顯卡
- **邏輯**：有顯卡 → safe（不檢查）；沒有顯卡時：
  - `hasIntegratedGraphics === false` → incompatible「沒有任何影像輸出」
  - 有內顯但 `hasVideoOutput === false` → incompatible
  - 任一欄位缺值 → unknown
- **已實作**：❌

### R29 顯卡 PCIe 世代與通道 — `pcie.gpu`
- **欄位**：`gpu.pcieGen`、`gpu.pcieLanes`、`motherboard.pcieX16Slots[0]`（`gen`、`electricalLanes`、`laneSource`）、`cpu.pcieGen.gpu`
- **邏輯**：
  - 有效世代 = `min(slot.gen, laneSource === "cpu" ? cpu.pcieGen.gpu : slot.gen)`
  - `gpu.pcieGen > 有效世代`，或 `gpu.pcieLanes > slot.electricalLanes` → info「向下相容，頻寬降低」
  - 否則 → safe
- **待確認**：顯卡插在哪一個 x16 槽。第一版假設第一條（`pcieX16Slots[0]`），之後是否讓使用者選擇：待確認
- **已實作**：❌

### R30 SSD 介面 vs M.2 槽 — `m2.interface`
- **欄位**：`m2Ssd.interface`、`motherboard.m2Slots[]`（`pcieGen`、`supportsSata`、`laneSource`）、`cpu.pcieGen.m2`
- **邏輯**（對每支 SSD 找出它被分配到的槽）：
  - SATA SSD，但槽位 `supportsSata === false` → incompatible
  - PCIe SSD 插在 SATA-only 槽（`pcieGen === null`）→ incompatible
  - `ssd.gen > 槽位的有效世代` → info「向下相容，速度受限」
- **待確認**：多支 SSD 時如何分配槽位。提案是先依世代由高到低貪婪分配，讓結果對使用者最有利
- **已實作**：❌

### R31 SSD 尺寸規格 — `m2.formFactor`
- **欄位**：`m2Ssd.formFactor`、`motherboard.m2Slots[].formFactors[]`
- **邏輯**：沒有任何槽位支援此尺寸 → incompatible；有支援，但被分配到的槽不支援 → 重新分配（與 R30 共用分配邏輯）
- **已實作**：❌

### R32 SSD 數量 vs M.2 槽數 — `m2.count`
- **欄位**：所選 SSD 數量、`motherboard.m2Slots.length`
- **邏輯**：數量 > 槽數 → incompatible；`m2Slots` 缺值 → unknown
- **待確認**：共用通道（插了某個 M.2 之後 SATA 埠或 PCIe 槽被停用）暫時不處理
- **已實作**：❌

### R33 顯卡供電接頭 vs PSU — `power.connector`
- **欄位**：`gpu.powerConnectors[]`、`psu.native16PinCount`、`psu.pcie8PinCount`
- **邏輯**：
  - 顯卡需要 16-pin（`12V-2x6` / `12VHPWR` / `16-pin`），且 `native16PinCount === 0` → warning「需要使用轉接線（通常由顯卡附贈），請確認 8-pin 數量足夠」
  - 顯卡需要 n 個 8-pin，且 `pcie8PinCount < n` → incompatible
  - PSU 欄位缺值 → unknown
- **待確認**：轉接線需要幾個 8-pin（依顯卡而定，通常寫在顯卡的盒裝內容裡），本條是否要檢查；以及 daisy-chain 線怎麼計數（見 schema.md §3.8）
- **已實作**：❌（取代 R18）

---

## 5. 規則分組總表

| 分組 | 規則 |
|---|---|
| spatial | R01、R02、R03、R04、R05、R06、R07、R08、R09、R10、R11、R12、R13、R17、R20、R21 |
| platform | R14、R15、R22、R23、R24、R25、R26、R27、R28、R29、R30、R31、R32、R33 |
| 已併入其他規則（保留編號，不再使用） | R16 → R23、R18 → R33、R19 → R01 |
