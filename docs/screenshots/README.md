# 3D / 2D 截圖驗證（2026-11-10）

- 產生方式：`npm run build && npm run screenshot`（`scripts/screenshot-3d.ts`：啟動 `next start`，以 URL query 預選零件，1600 × 1000 視窗，3D 與 2D 各一張）
- WebGL：Playwright Chromium 加 `--use-angle=swiftshader --enable-unsafe-swiftshader`（軟體繪製）**可用**；截圖過程沒有頁面錯誤
- 對照規格：`docs/3d-layout-spec.md`。每組都用 Read 逐張看過；下表是最後一版截圖的檢查結果

| # | 組合 | 檔案 | 檢查結果 |
|---|---|---|---|
| 1 | CORSAIR 3500X + ROG STRIX B850-I（ITX）+ ROG Astral 5090 + DOMINATOR TITANIUM + AK620 DIGITAL（使用者回報的那組） | `1-3500x-b850i-astral-3d.png` / `-2d.png` | ✅ ITX 主機板在後方上緣（不再位於中間高度）。✅ 顯卡平躺（PCB 與主機板垂直）、上緣在 ITX 唯一的 x16 槽、由主機板往玻璃突出 149 mm，往下 76 mm、往前 357.6 mm。✅ 顯卡 Info（官方只給 425 mm 未註明條件），前端與白色上限面的距離 = 報告餘裕 67.4 mm。✅ 塔散底座在 CPU 插槽上、高度往玻璃，Safe 8 mm。⚠ 塔散（狀態 Unknown，灰色半透明）蓋住 ITX 板與 RAM，從預設角度看不到 RAM（可旋轉查看） |
| 2 | Fractal North（Mesh）+ TUF B850-PLUS（ATX）+ Astral 5090 | `2-north-atx-astral-*.png` | ✅ ATX 板後方上緣與第 1 組同一基準點。✅ 顯卡插在 ATX 第一條 x16 槽。✅ 出廠前置風扇 2 × 140 畫在 355 mm 上限面（R02 採用「前置裝風扇」條件）。✅ 報告 Incompatible（超出 2.6 mm）：顯卡本體淺灰紅框，超出部分紅色。⚠ 超出只有 2.6 mm，3D 預設角度下紅色衝突區很薄，2D 的尺寸比較條較清楚 |
| 3 | Fractal North + 前置 ARCTIC LF III Pro 360 + Astral 5090 | `3-north-front360-astral-*.png` | ✅ 360 水冷排貼在 300 mm 上限面（排長沿上下、厚度沿前後）。✅ 顯卡前端穿過水冷排，衝突區（57.6 mm）以紅色清楚標出，未截短。✅ 換成水冷排後不再畫出廠前置風扇。✅ 水冷頭在 CPU 插槽上 |
| 4 | Cooler Master NR200P V2 + ROG STRIX B850-I + FSP DAGGER PRO 850W（SFX）+ Dual RTX 5050（2 槽） | `4-nr200p-itx-sfx-5050-*.png` | ✅ 只支援 ITX 的機殼不畫電源倉，SFX 電源畫在前上方（示意），與顯卡不重疊。✅ 2 槽薄卡插在 ITX 的 x16 槽。✅ 報告：顯卡 Info（餘裕 131 mm）、R03 Safe、R04 Safe 39.8 mm。修正前曾發現：示意電源倉讓顯卡落進電源倉、SFX 電源與顯卡重疊 → 已修正 |
| 5 | HYTE Y70 + TUF B850-PLUS + SAPPHIRE NITRO+ RX 9070 XT（直立） | `5-y70-vertical-9070xt-*.png` | ✅ `gpuMountOrientation = vertical`：顯卡大平面與 3 顆風扇朝玻璃，位於主機板下半部前方（示意位置）。✅ 報告 R03 Info（只能直立）。✅ Y70 官方外觀尺寸沒標軸向 → 畫面標「示意尺寸：機殼外觀深度 / 高度 / 寬度」。修正前曾發現：R03 餘裕顯示 0.7999999999999998 槽 → 已改為四捨五入 |

## 截圖過程中修正的問題

1. 鏡頭幾乎正對玻璃，看不出深度 → 改成由前上方斜看，並拉遠到看得到整個機殼
2. 不相容零件整個塗紅，超出的衝突區看不出來 → 零件本體改淺灰紅框，只有衝突區是實心紅
3. 只支援 ITX 的機殼套用了示意電源倉 → 不畫電源倉，電源移到前上方
4. Fractal Terra（三明治結構，官方沒寫顯卡方向）橫插會超出機殼底面 → 改以直立示意，畫面標「示意尺寸：顯卡安裝方向」
5. 出廠前置風扇、電源倉顏色太暗 → 調亮
6. R03 餘裕浮點數顯示

## 還沒解決的視覺問題

- 塔散 / 水冷頭從預設角度會擋住 RAM 與部分主機板（需要旋轉才看得到）
- 小幅超出（例如 2.6 mm）在 3D 中幾乎看不到紅色衝突區，要看 2D 尺寸比較條
- 板上元件（插槽、RAM、x16 槽）位置是示意值，與實際主機板不同
- 側透玻璃位置由外觀寬度推算，與官方塔散上限面可能不一致（見 pending L-15）
- 只畫出廠「前置」風扇；上 / 後 / 底部內附風扇沒有畫
