# 進度（revamp 分支）

收到「請依 docs/progress.md 繼續」時，從「下一步」接續。四段：1 schema 定案、2 收完整批資料、3 改寫相容性規則、4 上線前收尾。

## 已完成（全部已 commit 並 push 到 revamp）

| 段 | commit | 內容 |
|---|---|---|
| 1 | `9c152ca` | schema 定案、9 筆試填重填、gpu-chips.json |
| 2 | `c6addd7` | 71 筆官方資料、刪除 mock 與價格、BIOS 表 10 筆、獨立抽查 10 筆（57/57 一致） |
| 3 | `80496ef` | 相容性規則重寫、報告 UI、規則測試 |
| 4 | （本段） | 3D / 2D 改讀新資料與示意尺寸、README、CLAUDE.md 狀態、渲染測試、build + next start + curl 驗證 |

## 下一步

- 等使用者確認後合併 `revamp` → `main`（未經確認不可合併）
- 待確認事項見 `docs/pending.md`（最重要：AMD CPU 7 顆、Intel 800 系列 BIOS 等級、晶片表 AMD 兩筆的讀取方式）

## 未 commit 的變更

- 無
