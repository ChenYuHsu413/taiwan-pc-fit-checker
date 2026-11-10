# CLAUDE.md — taiwan-pc-fit-checker

## 專案目標

台灣版 PC 組裝空間模擬器：使用者選擇機殼、主機板、顯卡、散熱器、電源等零件後，依據**真實官方規格**判斷空間與平台相容性（Safe / Info / Tight / Warning / Incompatible / Unknown），並以 3D/2D 呈現空間關係。

## 目前狀態（2026-11-10）

- `revamp` 分支已達可上線狀態，**待使用者確認後合併到 `main`**
- 已完成：Phase 0（盤點）、Phase 1（schema / 資料搬遷）、Phase 2a（試填）、Phase 2b（schema 定案 + 71 筆官方資料、刪除 mock）、Phase 3（相容性規則重寫 + 測試）、上線前收尾（3D/2D 改讀新資料、README、build 驗證）
- 價格：本輪不填，UI 顯示「無參考價」
- 所有待確認事項：`docs/pending.md`；長任務進度：`docs/progress.md`；原計畫：`docs/roadmap.md`

## 最高原則

1. **本工具是參考級，不是 CAD。** 只有規則實際會用到的條件，才做成結構化欄位；其餘官方條件寫進 `conditionText`、`condition` 或 `notes`。
2. **沒有辦法確定的一律不做、不猜。** 資料沒有官方來源就留空；規則的門檻沒有可靠依據就不實作，改列為「尚未檢查」，並寫進 `docs/pending.md`。

## 技術棧

- Next.js 14（App Router）+ TypeScript（strict）
- Tailwind CSS 3
- three.js + @react-three/fiber + @react-three/drei（3D，`dynamic(ssr:false)` 載入）
- zod 4（schema 與驗證，型別由 `z.infer` 推導）
- vitest 3.1（測試；vitest 5 需要 `@types/node ≥20.19`，與現有版本衝突，見決策紀錄）
- 部署：Vercel
- 沒有後端與資料庫；資料是 repo 內的靜態 JSON（`data/`），載入時經過 `lib/data/validate.ts` 驗證，失敗會讓 build 中斷

## 文件

- `docs/audit-phase0.md` — 現況盤點（基準 commit `6c30241`）
- `docs/compatibility-spec.md` — 相容性規則規格（空間 R01–R21、平台 R22–R33）
- `docs/data-strategy.md` — 資料來源、價格、檔案格式
- `docs/schema.md` — 資料 schema 逐欄說明（zod，`lib/schema/`）
- `docs/roadmap.md` — 分階段計畫
- `docs/3d-layout-spec.md` — 3D / 2D 座標與佈局規格（示意值在 `lib/three/constants.ts`）
- `docs/pending.md` — 待確認事項（資料、規則、BIOS 表、3D 佈局、其他）
- `docs/progress.md` — 長任務進度

## 單位約定

- **全專案的長度一律使用 mm**，欄位名稱以 `Mm` 結尾；功率使用 W，以 `W` 結尾；價格使用新台幣**整數**，以 `Twd` 結尾；記憶體速度 MT/s（`Mts`）、容量 GB（`Gb`）。
- 規格缺值（optional）= 官方未公開，與 0 意義不同；規則遇到缺值應回傳 `unknown`。
- 來源是 cm 或 inch 的數值，在**資料進入 repo 時**就換算成 mm，原始值記在 `notes`。
- 3D 場景只能在最後一步使用 `toSceneUnits(mm)` 換算；佈局一律用 mm 計算（`lib/three/layout.ts`），示意值集中在 `lib/three/constants.ts`。
- 日期使用 ISO 8601（`YYYY-MM-DD`）。

## Gate 規則

每個 Phase 結束時（Phase 1 起每個 commit 前），以下三個指令都必須通過，才能 commit / push：

```bash
npx tsc --noEmit
npm run build
npm test
```

沒通過就不要 commit，並回報錯誤內容。

**push 規則**：`revamp` 已達可上線狀態，待使用者確認後合併到 `main`。在使用者確認前，commit 只 push 到 `revamp`，不可 push 或 merge 進 `main`。

## 工作原則

- **遇到不確定的狀況不要自行假設**，包括規格數值、業界門檻、欄位語意、使用者意圖。採取保守做法（欄位留空、規則顯示 Unknown 或列為尚未檢查），記錄在 `docs/pending.md`。
- 長任務的進度記在 `docs/progress.md`，收到「請依 docs/progress.md 繼續」時從那裡接續。
- 不要編造規格數字或價格。每筆真實零件資料都必須有產品頁 `sourceUrl` 與 `specVerifiedAt`（mock 為 `null`）。
- 不要在未經同意的情況下抓取網站、寫爬蟲、新增或升級套件。
- 只修改當前 Phase 範圍內的檔案；發現範圍外的問題就記錄下來，不要順手修。
- commit 訊息使用繁體中文或 conventional 前綴（例如 `docs:`），未經要求不要 push。

## 決策紀錄

| 日期 | 決策 | 理由 / 備註 |
|---|---|---|
| 2026-11-09 | 全專案長度單位統一為 mm | 避免 cm/inch 混用；3D 換算集中在 `toSceneUnits`（原 `toUnits`） |
| 2026-11-09 | 每個 Phase 都以 `tsc --noEmit` + `build` 作為 Gate | Phase 1 起加上 `npm test` |
| 2026-11-09 | Phase 0 只做盤點，不修改功能程式碼 | 先確認現況再規劃 |
| 2026-11-09 | 價格：人工維護參考價（必附 `updatedAt`）＋使用者貼估價單覆蓋，兩者並用 | data-strategy §2 方案 A + B |
| 2026-11-09 | 不寫任何爬蟲；規格由 Agent 逐頁查原廠官方規格頁，人工整理 | 避免 ToS 風險 |
| 2026-11-09 | 參考價超過 30 天標示「可能過時」，不隱藏 | `isPriceStale()`；靜態頁面在 build 時計算 |
| 2026-11-09 | 資料檔：每類一個 JSON，規格和價格分開存 | `data/parts/`、`data/prices/` |
| 2026-11-09 | 測試框架：vitest | Phase 1 只有 smoke test，Phase 3 正式使用 |
| 2026-11-09 | vitest 版本固定在 `~3.1.4`（不用最新的 5.x） | vitest 5 → vite 8 要求 `@types/node ≥20.19`；不升級 `@types/node` 的前提下，改用 vite 6 系列的 3.1.4（已確認可安裝；3.2 是否可行未測）。Phase 7 對齊 `@types/node` 後可以升級 |
| 2026-11-09 | Schema 驗證：zod，型別由 `z.infer` 推導，不另外手寫 interface | `lib/schema/` |
| 2026-11-09 | 零件 `id` 為全站唯一的 slug（不加類別前綴），發布後不可修改 | 分享 URL 依賴 |
| 2026-11-09 | 相容性狀態 6 級：safe / info / tight / warning / incompatible / unknown；規則分組 spatial / platform | compatibility-spec §0 |
| 2026-11-09 | 價格 `source` 多一個 `mock` 值 | 避免把 mock 假價格標成「人工參考價」；Phase 2 移除 |
| 2026-11-09 | ~~Phase 3 完成前不 push~~ | 2026-11-10 改為：每段完成後 push 到 `revamp`，不碰 `main` |
| 2026-11-09 | 機殼水冷厚度分 `maxTotalThicknessMm`（排＋扇）與 `maxRadiatorThicknessMm`（只算排），官方寫哪個填哪個 | schema.md §3.1 |
| 2026-11-09 | ~~塔散高度上限的量測條件寫進 `cpuCoolerHeightConditionText`~~ | 2026-11-10 改用條件值 `cpuCoolerHeightLimits` |
| 2026-11-09 | 主機板新增 `laneSharing[]`，以及 PCIe / M.2 槽的 `label` | schema.md §3.2 |
| 2026-11-09 | CPU `generation` 採細分命名 enum（13/14 代分開，X3D 與 APU 另外分），BIOS 規則表共用 | schema.md §3.3 |
| 2026-11-09 | CPU 新增 `maxMemoryCapacityGb`；`maxPowerW` 只填官方公開數字；`officialMemorySpeedMts` 取官方最高值（通常是 1DPC 條件） | |
| 2026-11-09 | PSU `pcie8PinCount` = 顯卡端可插的 8-pin 接頭總數（一線兩頭算 2） | |
| 2026-11-09 | 塔散 L/W/H 換算以風扇氣流方向為準；無法判斷時 width/depth 留空 | schema.md §3.6 |
| 2026-11-10 | 官方有列水冷支援表的機殼，沒列到的位置視為不支援（`sizes: []`），`conditionText` 寫「官方支援表未列出」 | phase2a-findings C8 |
| 2026-11-10 | 主機板官方逐槽列出支援模式時，沒列 SATA 就是不支援（`supportsSata: false`） | M7 |
| 2026-11-10 | Intel ARK 沒有內顯區塊、且型號帶 F 或 KF 時，可填 `hasIntegratedGraphics: false` | P5 |
| 2026-11-10 | 顯卡尺寸沒標軸向時允許判讀：最大值 = 長度；最接近「槽數 × 20.32 mm」= 厚度；剩下 = 高度。`dimensionsAxisInferred: true`，notes 必須說明 | G1 |
| 2026-11-10 | PSU 系列頁沒列出某瓦數的 16-pin 數量時留空，不填 0 | S3 |
| 2026-11-10 | 平台範圍新增 AM4（B550 主機板 1 張、Ryzen 5000 CPU 2 顆，其中 1 顆 X3D）；不收 Core 5 120 與 Ryzen AI 400 | 世代新增 `amd-ryzen-5000`、`amd-ryzen-5000-x3d` |
| 2026-11-10 | BIOS 規則表：支援等級以晶片組為主；`boardOverrides` 的值改成 `{minBios, sourceUrl}`（不覆寫等級）；主機板新增 optional `pcbRevision`、`cpuSupportListUrl`；不做逐顆 CPU 的最低版本表 | `schemaVersion: 2` |
| 2026-11-10 | 晶片組字串：B650E 與 B650、X870E 與 X870 分開記錄 | |
| 2026-11-10 | X870 / B850 搭 Ryzen 9000 記為原生支援，`minBiosNote` 註明「AMD 未明文，依 800 系列為 Ryzen 9000 同期平台判斷」 | |
| 2026-11-10 | 本輪不填價格，UI 顯示「無參考價」；價格之後由估價單匯入功能提供 | |
| 2026-11-10 | 新增通用「條件值」`[{mm, condition, isDefault}]`（剛好一個 isDefault）：機殼塔散高度、顯卡高度、PSU 長度上限使用。不做 layoutModes，欄位連動只寫在 condition | 規則用 isDefault，其他條件以 Info 顯示 |
| 2026-11-10 | 新增顯示晶片參考表 `data/reference/gpu-chips.json`（只用 NVIDIA / AMD 官方頁），板卡廠沒寫的 PCIe / 功耗 / 建議電源由此補 | |
| 2026-11-10 | 共同欄位新增 `additionalSources[{url, fields[]}]`；官方頁互相矛盾時，規格頁 > PDF 手冊 > 行銷文案，矛盾寫 notes | X1、X2 |
| 2026-11-10 | 規則狀態：Tight 本輪不實作；Warning 只用在有官方依據時；沒有可靠依據的規則不產生結果，列在「尚未檢查的項目」 | 見 compatibility-spec |
| 2026-11-10 | 官網擋自動讀取時只改找同原廠的官方 PDF / 下載頁（可用一般 curl 下載），不用瀏覽器自動化、不偽裝 User-Agent | 拿不到就不收，列進 pending |
| 2026-11-10 | Next.js 維持 14.2.35（已是 14.2.x 最新 patch，無需升級） | |
| （待定） | 相容性門檻數值 | 見 `docs/compatibility-spec.md` §0.2 |
