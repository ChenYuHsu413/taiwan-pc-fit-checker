# 進度（revamp 分支）

收到「請依 docs/progress.md 繼續」時，從「下一步」接續。四段：1 schema 定案、2 收完整批資料、3 改寫相容性規則、4 上線前收尾。

## 已完成

- 第一段（schema 定案）：Gate 通過，已 commit 並 push revamp

## 下一步：第二段（收完整批資料）

依 docs/model-list-phase2.md 收，另加：ASUS 以外主機板 ≥4 張（MSI、GIGABYTE、ASRock 都要有）、AM4（B550 ×1、Ryzen 5000 ×2 含 1 顆 X3D）。只用官方網頁 / PDF。BIOS 表補齊所有晶片組 × 世代。收完刪 mock 與價格 `mock` 選項；開抽查 Agent 抽 10 筆。

- 讀取規則：只用 WebFetch / WebSearch 與官方 PDF；**不用瀏覽器自動化**（被權限檢查判定為繞過防爬，也違反任務要求）。amd.com 用 WebFetch 會逾時
- 進行方式：3 個背景 Agent 把結果寫到 scratchpad/collect/*.json（主機板+BIOS / 機殼+散熱+PSU / CPU+RAM+GPU+SSD），完成後合併進 data/parts；暫時驗證檔 tests/zz-collect-validate.test.ts 不 commit，Gate 前刪除
- 等待期間先寫第三段規則程式（未 commit）

各類進度：（收完一類就更新）

## 未 commit 的變更

- 第三段（先寫，等第二段 commit 後再 commit）：lib/compatibility/{index,rules,messages}.ts 重寫、types/parts.ts（conditions、link、UncheckedItem）、components/CompatibilityReport.tsx（分組 + 尚未檢查）、components/BuilderClient.tsx、tests/rules.test.ts（88 個合成資料測試，已通過）
- 第三段還沒做：真實資料組合測試（≥5 組）、compatibility-spec.md 更新、pending.md 規則段
- 第二段 commit 時只加 data/、docs/ 等資料相關檔案；Gate 時先 git stash 第三段檔案驗證
- 第四段（先寫，未 commit）：lib/three/layout.ts（示意尺寸 collectFallbacks、caseGpuLimitMm 與 R02 一致、移除主機板截短）、components/three/AioCoolerMesh.tsx（不截短水冷排）、CableBend.tsx、CaseFrame.tsx、FitPreview2D.tsx（改為尺寸比較條）、FitPreview3D.tsx（示意尺寸標示）
- 第四段：Next.js 已是 14.2.x 最新 patch（14.2.35），不需升級
- 第四段還沒做：README、build + next start + curl 驗證、CLAUDE.md 狀態更新、移除 gpu.legacyRecommendedSideClearanceMm（刪 mock 後）
