# 進度（revamp 分支）

收到「請依 docs/progress.md 繼續」時，從「下一步」接續。

## 前一輪（Phase 2b / 3 / 上線前收尾）

已完成，commit `9c152ca`、`c6addd7`、`80496ef`、`6776df0`；使用者已把 revamp fast-forward 合併到 main（`6776df0`）。

## 本輪：3D / 2D 改由真實尺寸推導（原 Phase 5）

兩段：1 座標規格與佈局重寫（docs/3d-layout-spec.md → lib/three → 3D/2D 元件 → 佈局測試）；2 Playwright 截圖驗證（URL query 預選零件、5 組截圖、docs/screenshots/README.md）

重要決定：任務原文「橫插顯卡：高度沿上下、大平面與主機板平行、厚度朝玻璃」與實際裝機及 schema（R04 高度 = 由 PCIe 槽往側板）不符，且與「風扇朝下」矛盾 → 橫插依物理方向（長 = 前後、厚 = 由插槽往下、高 = 朝玻璃、風扇朝下）；直立安裝才是大平面朝玻璃。記在 pending L-01。

### 狀態

- 第一段：完成（Gate 通過），commit 見 git log
- 第二段：完成（Gate 通過；5 組 10 張截圖在 docs/screenshots/）

### 下一步

- 等使用者確認 pending L-01（顯卡軸向）與其他 L 段示意值

### 未 commit 的變更

- 無
