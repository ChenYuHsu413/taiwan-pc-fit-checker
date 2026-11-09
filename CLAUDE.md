# CLAUDE.md — taiwan-pc-fit-checker

## 專案目標

台灣版 PC 組裝空間模擬器：使用者選擇機殼、主機板、顯卡、散熱器、電源等零件後，依據**真實官方規格**判斷能否放得下（Safe / Tight / Warning / Incompatible），並以 3D/2D 呈現空間關係。目前正從 MVP 骨架（mock 資料）改版為真正可用的工具，進度請見 `docs/roadmap.md`。

## 技術棧

- Next.js 14（App Router）+ TypeScript（strict）
- Tailwind CSS 3
- three.js + @react-three/fiber + @react-three/drei（3D，`dynamic(ssr:false)` 載入）
- 部署：Vercel
- 沒有後端與資料庫；資料是 repo 內的靜態檔案

## 文件

- `docs/audit-phase0.md` — 現況盤點（基準 commit `6c30241`）
- `docs/compatibility-spec.md` — 相容性規則規格（R01–R21）
- `docs/data-strategy.md` — 資料來源、價格、檔案格式
- `docs/roadmap.md` — 分階段計畫

## 單位約定

- **全專案的長度一律使用 mm**，欄位名稱以 `Mm` 結尾；功率使用 W，以 `W` 結尾；價格使用新台幣，以 `Twd` 結尾。
- 來源是 cm 或 inch 的數值，在**資料進入 repo 時**就換算成 mm，原始值記在 `notes`。
- 3D 場景只能在最後一步使用 `toUnits(mm)` 換算；元件內不得出現未換算的魔術數字。
- 日期使用 ISO 8601（`YYYY-MM-DD`）。

## Gate 規則

每個 Phase 結束時，以下兩個指令都必須通過，才能 push：

```bash
npx tsc --noEmit
npm run build
```

Phase 3 之後還要加上規則測試（測試方式待定，見 roadmap）。沒通過就不要 push，並回報錯誤內容。

## 工作原則

- **遇到不確定的狀況就停下來回報，不要自行假設。** 包括：規格數值、業界門檻、欄位語意、使用者意圖。文件裡標成「待確認」並列入回報。
- 不要編造規格數字或價格。每筆零件資料都必須有產品頁 `source.url` 與 `retrievedAt`。
- 不要在未經同意的情況下抓取網站、寫爬蟲、新增或升級套件。
- 只修改當前 Phase 範圍內的檔案；發現範圍外的問題就記錄下來，不要順手修。
- commit 訊息使用繁體中文或 conventional 前綴（例如 `docs:`），未經要求不要 push。

## 決策紀錄

| 日期 | 決策 | 理由 / 備註 |
|---|---|---|
| 2026-11-09 | 全專案長度單位統一為 mm | 避免 cm/inch 混用；3D 換算集中在 `toUnits` |
| 2026-11-09 | 每個 Phase 都以 `tsc --noEmit` + `build` 作為 Gate | — |
| 2026-11-09 | Phase 0 只做盤點，不修改功能程式碼 | 先確認現況再規劃 |
| （待定） | 價格策略（提案：手動參考價 + 使用者匯入，不做爬蟲） | 見 `docs/data-strategy.md` §6 |
| （待定） | 相容性門檻數值 | 見 `docs/compatibility-spec.md` §0.2 |
| （待定） | 測試方式（vitest vs `node --test`） | 見 `docs/roadmap.md` Phase 3 |
