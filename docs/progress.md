# 進度（main 分支）

收到「請依 docs/progress.md 繼續」時，從「下一步」接續。

## 本輪：補 AMD 資料、BIOS 規則修正、小修正

三段：0 決策紀錄與小修正（L-01 結案、總價顯示）；1 AMD 資料（7 顆 CPU、AMD 晶片表重建）；2 BIOS 規則修正（Z890/B860 × 200S、boardOverrides 優先、支援晶片組 → unsupported、測試）

規則：AMD 數值只用使用者在任務中提供的表（docs/sources/amd-2026-11-10.md），**不可用 WebFetch / curl / 瀏覽器讀取 amd.com**

### 狀態

- 第零段：完成
- 第一段：完成
- 第二段：進行中

### 下一步

1. 第零段 Gate → commit → push main
2. 第一段：docs/sources/amd-2026-11-10.md、cpu.json 新增 7 顆、gpu-chips.json 重建 AMD 兩筆、9060 XT 記憶體版本判斷
3. 第二段：BIOS 表與 R27

### 未 commit 的變更

- 無
