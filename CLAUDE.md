# CLAUDE.md — taiwan-pc-fit-checker

## 專案目標

台灣版 PC 組裝空間模擬器：使用者選擇機殼、主機板、顯卡、散熱器、電源等零件後，依據**真實官方規格**判斷空間與平台相容性（Safe / Info / Tight / Warning / Incompatible / Unknown），並以 3D/2D 呈現空間關係。目前正從 MVP 骨架（mock 資料）改版為真正可用的工具，進度請見 `docs/roadmap.md`。

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

## 單位約定

- **全專案的長度一律使用 mm**，欄位名稱以 `Mm` 結尾；功率使用 W，以 `W` 結尾；價格使用新台幣**整數**，以 `Twd` 結尾；記憶體速度 MT/s（`Mts`）、容量 GB（`Gb`）。
- 規格缺值（optional）= 官方未公開，與 0 意義不同；規則遇到缺值應回傳 `unknown`。
- 來源是 cm 或 inch 的數值，在**資料進入 repo 時**就換算成 mm，原始值記在 `notes`。
- 3D 場景只能在最後一步使用 `toUnits(mm)` 換算；元件內不得出現未換算的魔術數字。
- 日期使用 ISO 8601（`YYYY-MM-DD`）。

## Gate 規則

每個 Phase 結束時（Phase 1 起每個 commit 前），以下三個指令都必須通過，才能 commit / push：

```bash
npx tsc --noEmit
npm run build
npm test
```

沒通過就不要 commit，並回報錯誤內容。

**Phase 3 完成之前一律不要 push。** 真實資料只填有條件的欄位（例如機殼的 `gpuLength.noFrontMm`）時，現行規則只讀 `unspecifiedMm`，會顯示 Unknown；必須等 Phase 3 改完規則才能部署。

## 工作原則

- **遇到不確定的狀況就停下來回報，不要自行假設。** 包括：規格數值、業界門檻、欄位語意、使用者意圖。文件裡標成「待確認」並列入回報。
- 不要編造規格數字或價格。每筆真實零件資料都必須有產品頁 `sourceUrl` 與 `specVerifiedAt`（mock 為 `null`）。
- 不要在未經同意的情況下抓取網站、寫爬蟲、新增或升級套件。
- 只修改當前 Phase 範圍內的檔案；發現範圍外的問題就記錄下來，不要順手修。
- commit 訊息使用繁體中文或 conventional 前綴（例如 `docs:`），未經要求不要 push。

## 決策紀錄

| 日期 | 決策 | 理由 / 備註 |
|---|---|---|
| 2026-11-09 | 全專案長度單位統一為 mm | 避免 cm/inch 混用；3D 換算集中在 `toUnits` |
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
| 2026-11-09 | Phase 3 完成前不 push | 真實資料與現行規則不相容（會顯示 Unknown） |
| 2026-11-09 | 機殼水冷厚度分 `maxTotalThicknessMm`（排＋扇）與 `maxRadiatorThicknessMm`（只算排），官方寫哪個填哪個 | schema.md §3.1 |
| 2026-11-09 | 塔散高度上限的量測條件寫進 `cpuCoolerHeightConditionText`，不拆欄位 | |
| 2026-11-09 | 主機板新增 `laneSharing[]`，以及 PCIe / M.2 槽的 `label` | schema.md §3.2 |
| 2026-11-09 | CPU `generation` 採細分命名 enum（13/14 代分開，X3D 與 APU 另外分），BIOS 規則表共用 | schema.md §3.3 |
| 2026-11-09 | CPU 新增 `maxMemoryCapacityGb`；`maxPowerW` 只填官方公開數字；`officialMemorySpeedMts` 取官方最高值（通常是 1DPC 條件） | |
| 2026-11-09 | PSU `pcie8PinCount` = 顯卡端可插的 8-pin 接頭總數（一線兩頭算 2） | |
| 2026-11-09 | 塔散 L/W/H 換算以風扇氣流方向為準；無法判斷時 width/depth 留空 | schema.md §3.6 |
| （待定） | 相容性門檻數值 | 見 `docs/compatibility-spec.md` §0.2 |
