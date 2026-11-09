# 改版路線圖

依據：`docs/audit-phase0.md`、`docs/compatibility-spec.md`、`docs/data-strategy.md`

每個 Phase 結束時都必須通過 Gate：`npx tsc --noEmit` 與 `npm run build`，通過後才能 push（見 `CLAUDE.md`）。

## 總覽

| Phase | 名稱 | 依賴 |
|---|---|---|
| 1 | 型別與資料 schema 定案、驗證層、結果 `ruleId` | Phase 0 的拍板事項 |
| 2 | 第一批真實資料（規格 + 參考價分開存放） | 1 |
| 3 | 相容性引擎重寫（R01–R16）+ 規則測試 | 1（資料可以先用測試 fixture），2 |
| 4 | 匯入功能（JSON / CSV / 貼上估價單）接上 UI | 1、3 |
| 5 | 3D / 2D 由真實尺寸推導 | 1、2、3 |
| 6 | UX：狀態保存、分享 URL、手機版、取消選擇 | 2（id 穩定）、3 |
| 7 | 收尾：README 對齊、免責文案、部署檢查 | 全部 |

### 順序說明
大致依照你提的原則（型別 → 資料 → 邏輯 → 3D/2D → UX），我做了兩處調整：
- **匯入（Phase 4）排在相容性之後、3D 之前**：匯入與內建資料共用 Phase 1 的驗證層，做起來主要是 UI 工作；放在 3D 之前，可以讓你早點用自己的估價單測試相容性結果。
- **分享 URL 不能提前**：分享 URL 依賴穩定的零件 `id`，必須等 Phase 2 的 id 規則定案、資料落地之後才能做；它的成本很低，Phase 3 完成後也可以視需要提前插隊。
- 3D 排在 UX 之前的理由：手機版的排版高度受 3D 區塊影響，3D 先定型，手機版只需要調整一次。

---

## Phase 1 — 型別與 schema 定案

- **目標**：型別能完整表達 `compatibility-spec.md` 需要的欄位；資料與匯入共用同一個驗證函式；結果改用 `ruleId`
- **範圍**
  - `types/parts.ts`（重寫：新增 CPU/RAM/Storage；結構化 `gpuLength`、`radiatorMounts`、`psu`；主機板長/短邊改名；`source` 物件；規格與價格分離；新增 `unknown` 狀態；`CompatibilityResult.ruleId`）
  - 新增 `lib/data/validate.ts`、`lib/data/loadParts.ts`
  - 把現有 mock 轉成新的型別（只做機械式轉換，數值不變，並標註 `verified: false`），讓 UI 維持可以運作
  - 配合新型別調整 `lib/compatibility.ts`、`components/*` 的引用（**不改判斷邏輯**），把字串前綴比對改成 `ruleId`
- **驗收**
  - Gate 通過
  - 現有頁面行為與 Phase 0 相同（人工檢查 `/builder` 三種散熱組合）
  - 驗證函式能拒絕：缺少 `source.url`、尺寸 ≤ 0、未知 category
- **依賴**：`data-strategy.md` §6 的第 1、4 項（價格方案、檔案切分）

## Phase 2 — 第一批真實資料

- **目標**：用約 60–70 筆有官方來源的資料替換 mock
- **範圍**：`data/parts/*.json`、`data/prices/tw-reference.json`、`data/CHANGELOG.md`；刪除 `data/taiwanMockParts.ts`；`/parts` 頁面改成讀取新資料，並把 `source.url` 做成可點擊的連結
- **驗收**
  - Gate 通過
  - 每筆資料都有產品頁 URL 與 `retrievedAt`
  - 驗證函式全部通過
  - 抽查 10% 與官方頁面一致（由你抽查）
- **依賴**：Phase 1；型號清單需要你核可
- **注意**：資料收集需要開啟官方網頁，這一步要在你同意後才進行（Phase 0 禁止抓取網站）

## Phase 3 — 相容性引擎重寫

- **目標**：實作 `compatibility-spec.md` 的 R01–R16（R07、R13 只做提醒型），門檻集中在同一個設定檔
- **範圍**：`lib/compatibility/`（拆成每條規則一個函式 + 共用分類函式 + `thresholds.ts`）、`buildCablePlanningSuggestions`、`CompatibilityReport`（顯示 `unknown`）、`PartPicker`（新增 CPU/RAM 選擇）
- **驗收**
  - Gate 通過
  - 每條規則至少有 safe / tight / incompatible / unknown 各一個 fixture 案例
  - 修正 audit 中列出的 bug：前置水冷排檢查不再依賴顯卡、頂置水冷排有檢查、不再重複扣除厚度
- **依賴**：Phase 1、Phase 2；門檻數值需要你拍板
- **待決**：測試方式。專案目前沒有測試框架；可選擇 (a) 新增 `vitest`（新套件，需要你同意）或 (b) 用 Node 內建的 `node --test`，並依賴 Node 原生的 TS type stripping（不需要新增套件，但要指定 Node 版本）

## Phase 4 — 匯入功能

- **目標**：使用者可以匯入 JSON / CSV / 貼上的估價單，並用自己的價格覆蓋參考價
- **範圍**：`lib/importParts.ts`（改為使用 `validate.ts`）、新增 CSV 解析（不使用套件，自己寫簡單的 RFC4180 子集）、估價單文字解析、匯入 UI（新元件）、localStorage 儲存
- **驗收**
  - Gate 通過
  - 錯誤資料會逐筆列出原因，不會讓 compat 產生 `NaN`
  - 貼上你提供的 3 份範例後，比對成功率可以接受（由你判定）
- **依賴**：Phase 1、Phase 3；需要你提供估價單範例

## Phase 5 — 3D / 2D 由真實尺寸推導

- **目標**：場景中所有位置與尺寸都來自資料或規範常數；超出範圍時顯示衝突，不再靜默截短
- **範圍**：`lib/three/layout.ts`（重寫，改用機殼外觀尺寸與主機板佈局欄位，沒有資料時退回 ATX 規範的預設值並標示）、`components/three/*`、`components/FitPreview2D.tsx`（統一比例尺、改用與 3D 相同的 layout 輸出）
- **驗收**
  - Gate 通過
  - 程式中不再有裝飾用的無單位常數（全部以 mm 表達再換算）
  - 前置 360 + 長顯卡、頂置厚排 + 高 RAM 等衝突案例在 3D/2D 上都能看出紅色重疊
  - 2D 與 3D 的數值一致
- **依賴**：Phase 1–3；主機板佈局資料不完整時的退回規則需要先定案

## Phase 6 — UX

- **目標**：可以保存、分享、在手機上使用
- **範圍**：`BuilderClient`（狀態改存 id）、URL query 編碼／解碼、localStorage、取消選擇與重設、`SiteHeader` 響應式、手機版的結果摘要（固定在底部的狀態列）、3D 觸控捲動處理
- **驗收**
  - Gate 通過
  - 複製 URL 到無痕視窗可以還原同一組選擇
  - 在 375 px 寬度下沒有水平捲動，3D 區塊不會卡住頁面捲動（實機或 DevTools 驗證）
- **依賴**：Phase 2（id 穩定）、Phase 3、Phase 5

## Phase 7 — 收尾

- **範圍**：`README.md` 對齊實際功能、免責文案、`npm audit` 結果評估（是否升級套件需要你同意）、`@types/three` 版本對齊、Vercel 部署檢查
- **驗收**：Gate 通過；README 不再有與程式碼矛盾的描述

---

## 跨 Phase 的已知 bug 歸屬

| Bug（見 audit） | 修正於 |
|---|---|
| 字串前綴比對狀態 | 1 |
| 主機板 width/height 命名顛倒 | 1 |
| Jonsbo D31 板型疑似錯誤、mock 沒有來源 | 2 |
| 前置水冷排檢查依賴顯卡、頂置沒有檢查、重複扣除、12V-2x6 假檢查、資料不足回傳 warning | 3 |
| `importFromJson` 不驗證 | 4 |
| 3D 寫死常數、水冷排靜默截短、PSU 規格寫死、接頭面畫錯、2D 比例尺不一致 | 5 |
| 狀態不保存、不能取消選擇、header 手機版 | 6 |
| README 與程式碼不符、`sourceUrl` 不可點 | 2 / 7 |
