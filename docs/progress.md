# 進度（revamp 分支）

收到「請依 docs/progress.md 繼續」時，從「下一步」接續。四段：1 schema 定案、2 收完整批資料、3 改寫相容性規則、4 上線前收尾。

## 已完成

- 第一段（schema 定案）：Gate 通過，已 commit 並 push revamp

## 下一步：第二段（收完整批資料）

依 docs/model-list-phase2.md 收，另加：ASUS 以外主機板 ≥4 張（MSI、GIGABYTE、ASRock 都要有）、AM4（B550 ×1、Ryzen 5000 ×2 含 1 顆 X3D）。只用官方網頁 / PDF。BIOS 表補齊所有晶片組 × 世代。收完刪 mock 與價格 `mock` 選項；開抽查 Agent 抽 10 筆。

- 讀取注意：amd.com 用 WebFetch 會逾時，改用瀏覽器（Claude in Chrome）讀取正常

各類進度：（收完一類就更新）

## 未 commit 的變更

- 無
