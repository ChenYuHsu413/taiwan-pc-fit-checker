# 台灣版 PC 組裝空間模擬器 / Taiwan PC Fit Checker

**Build before you build.** 先檢查顯卡、塔散、水冷、機殼與平台相容性，再決定怎麼裝。

一個偏台灣市場的 PC 相容性**參考級**工具：選擇機殼、主機板、CPU、記憶體、顯卡、散熱器 / 水冷、電源與 M.2 SSD，系統依**原廠官方規格**判斷空間與平台相容性，並以 3D / 2D 示意圖呈現。

> ⚠️ 本工具是參考級，不是 CAD。判斷只用官方公開的數值；官方沒有公開的就不猜，會顯示「資料不足」或列入「尚未檢查的項目」。實際安裝前仍請以原廠規格與實物為準。

## 功能

- **Builder**：左側零件選擇（下拉選單，可手動覆蓋部分尺寸）、中間 3D / 2D 示意圖、右側相容性報告、下方走線提醒
- **相容性報告**：分「空間」與「平台」兩組，每項有 6 級狀態之一
  - Safe 安全（附「餘裕 X mm」）／Info 提示（能用但降速，或官方另有條件）／Warning 注意（有官方依據的風險，例如需要更新 BIOS、需要轉接線）／Incompatible 不相容／Unknown 資料不足（Tight 緊繃本版不使用，因為沒有可靠的門檻）
  - 空間：主機板板型、顯卡長度（依前置實際裝的風扇或水冷排選對應的官方上限）、顯卡槽數與安裝方向、顯卡高度、塔散高度、塔散 vs 記憶體、水冷排位置與厚度、電源規格與長度
  - 平台：CPU 腳位、散熱器扣具、記憶體類型 / 條數 / 容量 / 速度（AMD 依條數與 rank 查官方速度表）、BIOS 支援（依晶片組 × CPU 世代，附主機板官方 CPU 清單連結）、影像輸出、顯卡 PCIe 頻寬（考慮共用通道）、M.2 介面 / 尺寸 / 數量、電源瓦數（只比對顯卡官方建議電源，不估算整機功耗）、顯卡供電接頭
- **尚未檢查的項目**：報告最下方列出沒有可靠官方數據或門檻、所以不判斷的項目（例如塔散 vs VRM 散熱片、上置水冷排 vs 記憶體、背板走線空間、供電線彎折空間、M.2 散熱片 vs 顯卡），並說明原因，提醒使用者自行確認
- **3D / 2D 示意**：3D 為簡化造型，**沒有依真實主機板佈局精確擺位**；2D 為尺寸比較條（零件尺寸 vs 機殼官方上限）。官方沒有公開的尺寸會用預設值繪製，並在畫面上標「示意尺寸」
- **零件資料庫**：分類瀏覽所有零件，附官方規格來源連結與查證日期
- **價格**：目前沒有價格資料，一律顯示「無參考價」

## 資料來源

- 每筆零件都出自**原廠官方**規格頁、說明書 PDF 或 datasheet，附 `sourceUrl`（必要時 `additionalSources`）與 `specVerifiedAt` 查證日期；不使用通路、評測或第三方資料庫
- 官方沒寫的欄位留空（不推算）；官方給的是條件值（例如「含支架 145 mm / 不含 170 mm」）時，以出廠狀態判斷，其他條件以 Info 顯示
- 顯示晶片的 PCIe、功耗與建議電源另有 NVIDIA / AMD 官方參考表（`data/reference/gpu-chips.json`），板卡廠沒寫時才使用
- BIOS 支援以 AMD / Intel 官方的晶片組通則為準，個別主機板的最低 BIOS 版本取自主機板廠的 CPU 支援清單
- 不寫爬蟲；規格逐頁人工整理。目前收錄 71 筆（拿不到官方資料的型號與所有待確認事項見 `docs/pending.md`）

## 技術

- Next.js 14（App Router）+ TypeScript（strict）、Tailwind CSS
- three.js / @react-three/fiber / @react-three/drei（3D 視圖）
- zod（資料 schema 與驗證；build 時驗證失敗會中斷）
- vitest（規則與資料測試）

## 開發

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 產出正式版（同時驗證 data/ 內所有 JSON）
npm test         # 規則與資料測試
npx tsc --noEmit # 型別檢查
```

## 專案結構

| 路徑 | 說明 |
|------|------|
| `app/` | 頁面路由（首頁 / builder / parts） |
| `components/`、`components/three/` | UI 元件、3D 場景零件 |
| `data/parts/` | 零件規格（每類一個 JSON） |
| `data/prices/` | 參考價（目前為空） |
| `data/rules/bios-support.json` | BIOS 支援規則表（晶片組 × CPU 世代） |
| `data/reference/gpu-chips.json` | 顯示晶片官方參考表 |
| `lib/schema/` | zod schema（型別由此推導），欄位說明見 `docs/schema.md` |
| `lib/data/` | 資料載入與共用驗證 |
| `lib/compatibility/` | 相容性規則（判斷、規則清單、文案），規格見 `docs/compatibility-spec.md` |
| `lib/three/layout.ts` | 3D / 2D 尺寸換算與示意尺寸 |
| `tests/` | vitest 測試（合成資料規則測試、真實資料組合測試、資料驗證） |
| `docs/` | 規格、schema、資料策略、待確認事項（`pending.md`）與進度 |

## 免責

本專案僅參考 BuildCores、原價屋 CoolPC 等網站的產品邏輯與資訊架構，未使用其品牌、Logo、文字、圖片或 UI。零件規格整理自各原廠官方公開資料，僅供相容性評估參考；各品牌名稱與商標屬於其所有者。
