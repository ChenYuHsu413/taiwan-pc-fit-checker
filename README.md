# 台灣版 PC 組裝空間模擬器 / Taiwan PC Fit Checker

**Build before you build.** 先檢查顯卡、塔散、水冷、機殼與走線空間，再決定怎麼裝。

一個偏台灣市場的 PC「空間相容性」參考級工具。使用者選擇機殼、主機板、顯卡、CPU 散熱器 / 水冷、電源等零件，系統依簡化尺寸資料判斷是否放得下，並提供 3D / 2D 視覺化與走線建議。

> ⚠️ 本工具為**參考級**估算，非精密 CAD。價格皆為「參考價」並標示 `updatedAt`，實際價格、貨況與安裝仍請以通路現場公告與官方規格為準。

## 功能

- **首頁**：工具說明與 Start Building CTA。
- **Builder**：左側零件選擇（下拉選單，選定後零件詳細資訊可收合、底部顯示預估總價）＋中間 3D / 2D 空間示意（可切換）＋右側相容性報告＋下方走線建議。
- **零件資料庫**：分類瀏覽本地零件卡片（含來源與更新時間）。
- **3D Fit Preview**：以 Three.js / React Three Fiber 畫出簡化擬真的機殼（實體鈑金外殼、前面板網孔、後方 I/O 開口與擴充槽擋板、電源分艙、側透玻璃），並依真實 ATX 佈局擺放主機板、顯卡（插於 PCIe 槽、風扇朝下）、散熱器、電源等。採標準側透視角（前面板在右、後方 I/O 在左），零件依相容性狀態上色。
- **相容性判斷**：主機板板型、顯卡長度（含前置水冷排扣除）、塔散高度、電源長度、背板走線空間、12VHPWR / 12V-2x6 彎折空間等，狀態分為 Safe / Tight / Warning / Incompatible。

## 技術

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS（深色科技風）
- Three.js / @react-three/fiber / @react-three/drei（3D 視圖）

## 開發

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 產出正式版
```

## 專案結構

| 路徑 | 說明 |
|------|------|
| `app/` | 頁面路由（首頁 / builder / parts） |
| `components/` | UI 元件（PartPicker、報告、走線建議等） |
| `components/three/` | 3D 場景零件網格 |
| `data/taiwanMockParts.ts` | 台灣化本地 mock data（機殼／主機板／顯卡／散熱器／AIO／PSU） |
| `lib/compatibility.ts` | 相容性判斷邏輯 |
| `lib/three/layout.ts` | 3D 場景座標換算 |
| `types/parts.ts` | 核心 TypeScript 型別 |

## 資料策略

第一版使用本地 mock / 參考級資料，不含即時爬蟲。已於 `lib/importParts.ts` 預留 JSON / CSV / 貼上文字的匯入架構，未來可擴充手動輸入與（在尊重網站條款、robots.txt 與合理頻率的前提下）公開資料匯入。

## 免責

本專案僅參考 BuildCores、原價屋 CoolPC 等網站的**產品邏輯與資訊架構**，未使用其品牌、Logo、文字、圖片或 UI。零件資料與價格為假資料 / 參考級資料，僅供空間評估參考。
