# 相容性規則規格（草案 v0）

- 狀態：草案，Phase 1 定型別時會再修訂
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
| `unknown`（**新增提案**） | 資料不足、零件未選齊，**不計入**整體警示。現行程式把這種情況歸成 `warning`，造成誤報 |

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

### 0.3 結果必須帶穩定的 `ruleId`

例如 `gpu.length`。2D/3D/走線建議改用 `ruleId` 對應，不再比對中文字串前綴。

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

### R14 CPU 腳位 vs 主機板／散熱器扣具 — `socket`
- **欄位**：`cpu.socket` *(新)*、`mb.socket`、`cooler.supportedSockets[]` *(新)*
- **邏輯**：
  - `cpu.socket === mb.socket`，否則 incompatible
  - `mb.socket ∈ cooler.supportedSockets`，或屬於同一個「扣具相容群組」→ safe
  - 不在清單內 → incompatible；若需要另購扣具 → warning
- **扣具相容群組**：AM4/AM5 孔距相同、LGA1700/LGA1851 孔距相同，這兩點我有把握；但個別散熱器是否需要額外扣具，**一律以官方支援清單為準**，不靠群組推論
- **已實作**：❌ 缺漏（散熱器沒有 socket 欄位，也沒有 CPU 類別）

### R15 PSU 瓦數估算 — `psu.wattage`
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
| R16 | RAM 代數 vs 主機板 | DDR4/DDR5 不能混用 → incompatible | 高（簡單） |
| R17 | AIO 水管長度 vs 安裝位置 | 前置 360 + 長機殼時水管可能不夠長；資料取得困難 | 低 |
| R18 | 顯卡供電接頭數 vs PSU | 原生 12V-2x6 接頭或 8-pin 的數量 | 中 |
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
