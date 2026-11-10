# 待確認事項（pending）

本輪（2026-11-10 起）遇到無法確定的情況時採保守做法，並記在這裡。分類：資料、規則、其他。

## 資料

| # | 項目 | 目前做法 |
|---|---|---|
| D-01 | Fractal North：官方沒寫出廠附幾個 HDD 架；PSU 長度 `1 HDD tray: 255 / 2 HDD tray: 155` | 預設取較嚴格的 155，255 列為其他條件 |
| D-02 | Fractal North：顯卡高度 178 / 148 與 fan bracket 位置的對應 | 未填 `gpuHeightLimits` |
| D-03 | Fractal North：側面水冷，產品頁寫 `2x 120/140 mm`，手冊不同 | 未填 `radiatorMounts.side` |
| D-04 | Fractal North：前置排寬 / 排厚（手冊 p.33）對應關係要看圖 | 未填 |
| D-05 | ROG STRIX X870E-E：官方 CPU 支援清單只指向 download center 總頁 | 未填 `cpuSupportListUrl` |

## 規則

（第三段填入）

## 其他

