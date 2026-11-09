# Phase 0 現況盤點（Audit）

- 盤點日期：2026-11-09
- 基準 commit：`6c30241`（Builder UI 精簡與 3D 佈局修正）
- 範圍：全部 tracked 檔案（約 30 個原始碼檔）
- 原則：本文件只記錄現況，不修任何程式。「待確認」代表需要官方資料或使用者拍板，不在此自行假設。

---

## 0. 建置結果

| 指令 | 結果 | 備註 |
|---|---|---|
| `npm install` | ✅ exit 0 | `npm audit` 回報 21 個弱點（11 moderate / 9 high / 1 critical）；`unrs-resolver` 的 postinstall 未被 allowScripts 允許（npm 警告）。本輪依規定不處理。 |
| `npx tsc --noEmit` | ✅ exit 0 | 無型別錯誤 |
| `npm run build` | ✅ exit 0 | 4 個路由全部為靜態（○）；`/builder` First Load JS 97 kB（3D 以 `dynamic(ssr:false)` 拆出去）。`package-lock.json` 沒有變動 |

完整 log 見文末附錄 A。

其他觀察：
- `three@^0.160.1` 搭配 `@types/three@^0.185.0`，型別版本比 runtime 新了 25 個 minor，目前 tsc 能過，但型別描述的 API 可能和實際 runtime 不一致。**待確認**：是否要對齊版本（屬於套件變更，需要你同意）。
- 專案沒有任何測試框架，也沒有 `lint` 以外的檢查腳本；`next lint` 沒有 `.eslintrc`，第一次執行會進入互動式設定。
- Node 版本：本機 v24.22.1；`package.json` 沒有 `engines` 欄位。

---

## 1. 嚴重度排序（最嚴重的排前面）

1. **相容性判斷的資料欄位語意不明，數值也沒有來源**：`maxGpuLengthMm` 沒有區分「有／無前置風扇／水冷排」，程式又一律再扣掉前置水冷排厚度，很可能重複扣除。所有 mock 數值都沒有附上產品頁 URL。
2. **好幾個已宣稱的檢查實際上沒有做**：`topRadiatorSupport`、`ramClearanceMm`、`driveBayRemovable`、`psuFormFactor`、`slotCount`／`thicknessMm`、`wattage`、`socket` 都只存資料、不參與判斷。只要選頂置水冷，就完全沒有任何檢查（3D 也一律顯示綠色）。
3. **前置水冷排的支援檢查必須同時選了顯卡才會執行**（程式寫在 `if (pcCase && gpu)` 區塊內），沒選顯卡時，就算水冷排尺寸不支援也不會報錯。
4. **12VHPWR／12V-2x6 永遠回傳 `warning`**，沒有拿任何尺寸做比較；3D 把接頭畫在顯卡的 +Y 面（背板面），實際上接頭位於朝側板的外緣。
5. **3D 場景幾乎全是寫死的常數**：機殼高度固定 460 mm、深度由「顯卡上限與 PSU 上限取大者 + 26」反推、CPU 腳位／PCIe 槽／RAM 位置也都寫死。水冷排過長時會被**靜默截短**（front 截到機殼高度 85%、top 截到深度 55%），把不相容的狀況藏起來。
6. **2D 視圖的 GPU 與 PSU 使用不同比例尺**（各自除以機殼上限），兩者無法互相比較。
7. **狀態無法保存或分享**：選擇只存在 `useState`，重新整理就消失，沒有 URL 狀態也沒有 localStorage。已選的零件也不能取消（placeholder 是 `disabled`）。
8. **匯入功能只是空殼**：只有 JSON 能用，而且除了 `id`／`category` 以外完全不驗證，UI 也沒有接上。
9. **Jonsbo D31 Mesh 被標為支援 ATX**。依我的認知 D31 是 M-ATX 機殼。**待確認**（需官方規格頁）。
10. 手機版：header 在 375px 寬度下很可能擠壓或溢出；3D canvas 的 OrbitControls 會吃掉觸控捲動（只能從程式碼判斷，本輪未實機測試）。

---

## 2. `types/parts.ts`

**目前做了什麼**：定義 `PartCategory`（9 類）、6 種零件介面、`CompatibilityResult`、`DimensionOverrides`、`CoolerChoice`、`BuildSelection`。

**寫死／假的部分**
- `PartCategory` 包含 `cpu`／`ram`／`storage`，卻沒有對應的介面，`AnyPart` 也不包含這三類，等於宣告了用不到的型別。
- `BasePart.priceTwd` 是必填欄位，規格和價格綁在同一筆資料，無法各自更新、各自標示時間。
- `sourceName` 是自由字串，`sourceUrl` 是選填；整筆零件只有一個 `updatedAt`，沒有辦法追蹤到「哪個欄位來自哪裡」。

**欄位缺口（對照真實相容性需求）**

| 零件 | 現有欄位 | 缺少的欄位 |
|---|---|---|
| Case | `maxGpuLengthMm`（單一值） | 顯卡上限需拆成：無前置風扇／有前置風扇／有前置水冷排（或至少附上量測條件）；顯卡**寬度（高度）**上限（側板方向）；擴充槽數；是否支援直立顯卡 |
| Case | `maxCpuCoolerHeightMm` | OK，但應記錄是否已扣除側板 |
| Case | `frontRadiatorSupport` / `topRadiatorSupport`（只有尺寸） | 每個位置支援的尺寸**以及最大厚度**（排＋扇）、頂部到主機板上緣的間距、側面／底部／後方位置、風扇尺寸支援 |
| Case | `maxPsuLengthMm` | 需拆成「保留硬碟籠／移除硬碟籠」兩個值；支援的 PSU 規格（ATX/SFX）；電源倉高度 |
| Case | `cableManagementSpaceMm` | 量測位置（最窄處 vs 一般處）；外部尺寸 W×H×D（3D 需要）；主機板 tray 與側板的距離 |
| Motherboard | `widthMm`/`heightMm` | **命名顛倒**：ATX 存成 `widthMm: 305, heightMm: 244`，3D 拿 `widthMm` 當垂直方向。建議改成 `longEdgeMm`/`shortEdgeMm` 或 `heightMm`(垂直)/`depthMm` |
| Motherboard | — | CPU 腳位座標、DIMM 槽位置與數量、PCIe x16 槽位置（距離上緣）、M.2 槽位置與是否附散熱片、VRM 散熱片高度與位置、I/O 蓋高度、記憶體類型（DDR4/DDR5）、24-pin／CPU 8-pin 位置 |
| GPU | `lengthMm` / `heightMm` / `thicknessMm` / `slotCount` | 長度是否含擋板（需標註量測條件）；供電接頭位置與朝向；TBP（W）；建議電源瓦數；`recommendedSideClearanceMm` 是自訂欄位，沒有官方來源 |
| Air cooler | `heightMm` / `widthMm` / `depthMm` / `ramClearanceMm` | 支援腳位清單（**目前沒有，無法檢查扣具**）；`ramClearanceMm` 的語意（是風扇下緣離板高度？可不可以把風扇上移？）；向 VRM/I/O 側的偏移量；TDP 等級 |
| AIO | `radiatorSizeMm` 與長寬厚 | 支援腳位；水管長度；冷頭高度；`totalThicknessMm` 與 `radiatorThicknessMm + fanThicknessMm` 重複，compat 用加總、3D 用 `totalThicknessMm`，兩者可能不一致 |
| PSU | `psuFormFactor` / `lengthMm` / `wattage` | 寬／高（SFX 是 125×63.5，目前 3D 寫死成 ATX 150×86）；12V-2x6 原生接頭數；ATX 3.x 版本 |
| CPU / RAM / M.2 | 不存在 | CPU：socket、PPT/PL2；RAM：模組高度、代數；M.2：散熱片厚度 |

**`DimensionOverrides`**：可以覆蓋 PSU 長度，但不能覆蓋機殼 PSU 上限；`gpuThicknessMm` 只影響 3D，沒有任何檢查會使用。

**`CompatibilityResult`**：沒有穩定的 `id`，2D/3D/走線建議全部用 `item.startsWith("顯卡長度空間")` 這種**中文字串前綴**比對狀態，只要改了文案就會壞掉。

---

## 3. `data/taiwanMockParts.ts`

| 類別 | 筆數 |
|---|---|
| Case | 3 |
| Motherboard | 3 |
| GPU | 3 |
| Air cooler | 3 |
| AIO | 3 |
| PSU | 3 |
| CPU / RAM / Storage | 0 |

**共通問題**
- `sourceUrl` 全部是首頁（`https://www.coolpc.com.tw/`、`https://noctua.at/`、`https://nzxt.com/`），不是產品頁，無法查證。
- `sourceName: "原價屋參考"` 但數值並不是從原價屋取得，屬於誤導性標示。
- 價格全部是假的；`updatedAt` 集中在 2026-06-08～25，看起來是一次性填入的。
- GPU 型號是 RTX 40 系／RX 7000 系；以 2026-11 的時間點來看，台灣通路主流應該已經換成 RTX 50 系／RX 9000 系（**待確認**目前實際在架的型號）。

**逐欄觀察**（我依記憶判斷數值是否「看起來合理」；任何數字都要以官方頁核對，這裡不提供替代數字）

| 零件 | 觀察 |
|---|---|
| Antec P20C | 尺寸量級合理；GPU/塔散/PSU/水冷支援是否與官方一致：**待確認** |
| Jonsbo D31 Mesh | `supportedMotherboards` 含 ATX，**疑似錯誤**（D31 應為 M-ATX 機殼）。`cableManagementSpaceMm: 18` 的來源不明 |
| Lian Li LANCOOL 216 | 量級合理；官方可能支援 E-ATX（有寬度限制）；數值 **待確認** |
| 三張主機板 | 板型尺寸 305×244／244×244／170×170 符合板型標準 ✅；其餘相容性需要的欄位都不存在 |
| MSI 4070 SUPER GAMING X SLIM | 長/厚/槽數與我印象中的官方值有出入（印象中厚度更薄、槽數不是整數 2）：**待確認** |
| ASUS TUF 4080 SUPER OC | `thicknessMm: 63`、`slotCount: 3` 與印象中的 3.6 槽級厚度不符：**待確認** |
| GIGABYTE RX 7800 XT GAMING OC | **待確認** |
| 三款塔散 | 高度量級合理（155/160/165）；`ramClearanceMm` 語意未定義，數值 **待確認** |
| 三款 AIO | 水冷排尺寸量級合理；NZXT Kraken 280 `fanThicknessMm: 26` **待確認** |
| PSU | Focus GX-750 140 mm 與 MWE 650 V2 140 mm 量級合理；FSP Hydro PTM PRO 850W 160 mm **待確認** |
| GPU `recommendedSideClearanceMm` | 10/15/10，沒有任何官方依據，屬於隨意填寫 |

---

## 4. `lib/compatibility.ts` 規則逐條評估

`classifyByRemaining`：剩餘 `< 0` → incompatible，`< 10` → tight，其餘 → safe。**永遠不會回傳 `warning`**；10 mm 這個門檻也沒有出處。

| # | 規則 | 判定 | 理由 |
|---|---|---|---|
| 1 | 板型 ∈ 機殼支援清單 | **正確（但簡化）** | 集合判斷正確；E-ATX 寬度差異很大（不同機殼對 E-ATX 有寬度上限），目前無法表達 |
| 1b | 只選了機殼或只選了主機板時回傳 `warning` | **錯誤（語意）** | 「資料不足」被歸成 Warning，會讓報告看起來有問題。應另設 `unknown`／`pending` 狀態 |
| 2 | 前置水冷排尺寸 ∈ `frontRadiatorSupport` | **簡化過頭＋有 bug** | 只比尺寸，不比厚度；而且寫在 `if (pcCase && gpu)` 裡面，沒選顯卡就完全不檢查 |
| 3 | 顯卡長度 ≤ 機殼上限 −（排厚＋扇厚） | **錯誤（很可能重複扣除）** | 多數機殼官方會分別列「有前置風扇」或「有前置水冷排」的上限；如果資料存的是後者，程式再扣一次就是重複扣除。資料欄位沒有標註量測條件，結果無法信任。另外也沒考慮「排+扇」與顯卡在垂直方向是否真的重疊（很多機殼前置排與顯卡只有部分重疊） |
| 4 | 塔散高度 ≤ 機殼上限 | **正確（但簡化）** | 公式正確；門檻 10 mm **待確認** |
| 4b | `cooler.kind === "none"` 時回傳 warning | **語意錯誤** | 同 1b |
| 5 | PSU 長度 ≤ 機殼上限 | **簡化過頭** | 沒有考慮硬碟籠移除前後的差異（`driveBayRemovable` 沒被使用）、沒有比較 PSU 規格（ATX/SFX），也不能覆蓋機殼上限 |
| 6 | 背板走線空間 < 20 mm → warning | **簡化過頭** | 20 mm 沒有出處；沒有和 PSU 模組化程度、24-pin 線厚度關聯；永遠不會是 incompatible |
| 7 | 12VHPWR / 12V-2x6 → 一律 warning | **錯誤（假檢查）** | 沒有任何計算；應比較「側板內距 −（PCIe 槽面 + 顯卡高度）」與接頭加最小直線段／彎折半徑 |
| — | `buildCablePlanningSuggestions` | 簡化 | 依賴字串前綴找結果；GPU 剩餘 < 20 mm 就提示（又是另一個沒出處的門檻） |

**完全缺漏**：顯卡厚度／槽數、顯卡高度 vs 側板、頂置水冷排（尺寸、厚度、與主機板上緣/RAM 的衝突）、塔散 vs RAM、塔散 vs VRM/I/O 蓋、CPU 腳位 vs 散熱器扣具、PSU 規格、PSU 瓦數、M.2 散熱片 vs 顯卡、主機板 vs 背板走線孔、記憶體代數 vs 主機板。詳見 `docs/compatibility-spec.md`。

---

## 5. 3D（`lib/three/layout.ts`、`components/FitPreview3D.tsx`、`components/three/`）

**比例**：`MM_TO_UNIT = 0.025`（1 場景單位 = 40 mm），大部分尺寸都經過 `toUnits(mm)`，比例基本一致 ✅。例外是好幾個未經換算的原始單位常數（例如熱導管半徑 `0.015`、風扇厚度 `0.02`、水管偏移 `0.15/0.05`、`RoundedBox radius 0.02`），屬於裝飾用，但違反「全部用 mm」的約定。

**座標**：X = 前→後（`trayXMm` 實際上是**後壁**的位置，命名容易誤解）、Y = 下→上、Z = 走線側（−）→玻璃側（+）。整個群組用 `scale={[-1,1,1]}` 鏡射，讓前面板在右邊。

| 項目 | 來源 | 問題 |
|---|---|---|
| 機殼高度 | 寫死 460 mm | 與實際機殼無關 |
| 機殼深度 | `max(maxGpu, maxPsu) + 6 + 20` | 由**上限反推**，不是外觀尺寸 |
| 元件側寬度 | `= maxCpuCoolerHeightMm` | 側板剛好貼在塔散上限，沒有考慮玻璃與鈑金 |
| 走線側寬度 | `= cableManagementSpaceMm` | OK（但走線空間本身資料不可信） |
| 電源倉高度 | 寫死 110 mm | 與機殼無關 |
| 主機板 | 位置固定在電源倉上方 +5 mm；尺寸取自資料（但 width/height 命名顛倒，見 §2） | 板子貼後壁，上緣位置取決於寫死的機殼高度 |
| CPU 腳位 | 距後壁 90 mm、距上緣 72 mm（寫死） | 不同主機板差異很大 |
| PCIe x16 | 距上緣 165 mm（寫死），且下限為電源倉 +80 | 同上，ITX/M-ATX 不同 |
| RAM | 4 條固定在 CPU 前方 52 mm、間距 10 mm，高 34 mm（寫死） | ITX 只有 2 條；RAM 高度沒有資料 |
| GPU | 長/厚取自資料（含 override），高度取自資料 | 顯卡高度若超出側板不會被偵測；風扇數由長度 > 285 判斷 |
| 塔散 | 高度取自資料、寬深按比例畫 | 位置寫死 |
| AIO 水冷排 | 尺寸取自資料 | **過長會被靜默截短**（front: ≤ 機殼高 85%；top: ≤ 深度 55%）；頂置一律綠色；front 置中，會與電源倉重疊 |
| PSU | 長度取自資料；寬 150／高 86 寫死 | SFX 被畫成 ATX 尺寸 |
| 12V-2x6 線 | 位置在顯卡長度 55% 處、+Y 面 | 接頭面畫錯（應在朝玻璃側的外緣） |
| 後方 7 條擴充槽 | 間距 20.32 mm ✅ | 數量寫死 |

**結論**：3D 是「以上限值反推出外殼、其他位置寫死」的示意圖，**不能用來呈現真實的空間衝突**。要做到由真實尺寸推導，必須先在型別中加入機殼外觀尺寸與主機板佈局座標（見 roadmap Phase 1、5）。

---

## 6. 2D（`components/FitPreview2D.tsx`）

- 純 SVG，固定 400×200 的機殼外框，不是由機殼尺寸推導的。
- GPU 比例尺 = `(caseW − trayW) / maxGpuLength`；PSU 比例尺 = `(caseW − trayW) / maxPsuLength`，**兩者使用不同比例尺**，所以畫面上 GPU 與 PSU 的長度無法互相比較。
- 前置水冷排厚度以 GPU 比例尺繪製，重疊區（紅色）的計算與 compat 的公式一致。
- 走線空間條的寬度 = `clamp(cableSpace × 1.2, 4, 40)` px，與其他元素的比例都不一致。
- 塔散高度用進度條呈現（`height/limit`，最多 115%）。
- 標題寫「俯視」，但內容是混合了側視概念的示意。
- 沒有呈現頂置水冷排、RAM、主機板。

---

## 7. `lib/importParts.ts`

- `importFromJson`：`JSON.parse` 後只檢查是否為陣列、每筆是否有 `id`/`category`，接著就 `as AnyPart` 強制轉型。**數值欄位、單位、category 合法值都沒有驗證**，錯誤資料會直接讓 compat 算出 `NaN`。
- `importFromCsv` / `importFromPastedText`：直接回傳「尚未實作」。
- **沒有被任何 UI 引用**（全專案 grep 不到 import 的地方）。
- 完成度：大約 10%。

---

## 8. 價格與 `updatedAt`

- 價格存在零件本身的 `priceTwd`，在選單（`NT$ x`）、PartCard 與 PartPicker 總價中顯示。
- 總價只加總 5 類已選零件；沒有 CPU/RAM/SSD。
- `updatedAt` 只是字串，顯示在 PartCard 上；沒有「過期」判斷，也沒有分開記錄價格與規格各自的時間。
- `sourceUrl` 在 PartCard 只顯示「（參考連結）」文字，**不是可以點的連結**。
- 全站有「參考價」的免責文案 ✅。

---

## 9. 路由與狀態管理

| 路由 | 類型 | 內容 |
|---|---|---|
| `/` | Server component | 介紹頁與 6 張功能卡 |
| `/builder` | Server page → `BuilderClient`（client） | 主要工具 |
| `/parts` | Server component | 直接 import mock 陣列，CPU/RAM/SSD 顯示空區塊 |

- 狀態：`BuilderClient` 的 `useState<BuildSelection>`，存放**整個零件物件**（不是 id），無法直接序列化成 URL。
- 沒有 URL query、沒有 localStorage、沒有分享功能、沒有「重設」按鈕、無法取消已選零件。
- 切換散熱器類型時會自動帶入第一筆（`mockCpuCoolers[0]` / `mockAioCoolers[0]`），使用者可能沒注意到。
- Override 輸入沒有防呆（負數、0 都可以輸入）。

---

## 10. 手機版（僅從程式碼判斷，本輪未實機驗證）

- `SiteHeader`：`flex justify-between`，標題 + 副標 + 兩個 nav 連結，且 `px-6`，沒有 `sm:` 斷點。375 px 寬度下**很可能擠壓或換行**。**待確認**（需實機驗證）。
- Builder：`grid-cols-1` → `lg:grid-cols-12`，手機上會依序堆疊成「零件選擇 → 3D（固定 500px 高）→ 報告 → 走線建議」。使用者選完零件後要捲很遠才看得到結果。
- 3D 的 `OrbitControls` 在觸控裝置上會攔截單指拖曳，**頁面捲到 3D 區塊時可能卡住捲動**。
- 2D SVG 使用 `viewBox` + `w-full`，可以縮放 ✅，但文字只有 9–10 px，在手機上會很小。
- 原生 `<select>` 在手機上可以使用 ✅；選項文字很長（品牌·型號·價格）。

---

## 11. `.claude/` 目錄

只有 `.claude/launch.json`：定義一個 `dev` 設定（`npm run dev`、port 3000、`autoPort: true`）。沒有其他筆記、設定或指令。專案原本沒有 `CLAUDE.md`（本輪新增）。

---

## 12. 其他雜項

- `README.md` 宣稱 3D「依真實 ATX 佈局擺放」，與實際（寫死常數）不符，**文件與程式碼互相矛盾**。
- `README.md` 寫「已預留 JSON / CSV / 貼上文字的匯入架構」，實際上只有 JSON 能用。
- `package.json` 的 `name` 是 `3dpcbuild`，與 repo 名稱不一致（無功能影響）。
- `components/PartCard.tsx` 支援 `selected` / `onClick`，但沒有任何呼叫端傳入（屬於既有的未使用程式碼，僅記錄）。
- 首頁功能卡列出的 6 項，與實際有做的檢查大致相符，但「12VHPWR 彎折空間」實際上只是提醒文字，並沒有檢查。

---

## 附錄 A：build log

```
> 3dpcbuild@0.1.0 build
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/6) ...
   Generating static pages (1/6) 
   Generating static pages (2/6) 
   Generating static pages (4/6) 
 ✓ Generating static pages (6/6)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    175 B          96.3 kB
├ ○ /_not-found                          873 B          88.3 kB
├ ○ /builder                             9.53 kB          97 kB
└ ○ /parts                               138 B          87.6 kB
+ First Load JS shared by all            87.4 kB
  ├ chunks/117-d8d2e055095fb05c.js       31.7 kB
  ├ chunks/fd9d1056-6952ca70748862da.js  53.6 kB
  └ other shared chunks (total)          2.05 kB


○  (Static)  prerendered as static content

build exit 0
```
