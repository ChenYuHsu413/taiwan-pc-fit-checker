# 資料策略提案

- 狀態：§6 已於 2026-11-09 拍板（見 `CLAUDE.md` 決策紀錄）；檔案結構以 §3 末尾的「Phase 1 定案」為準
- 本輪未抓取任何網站；以下對各官網欄位的描述來自一般經驗，**實際欄位名稱需在 Phase 2 打開官方頁面逐一核對**

---

## 1. 規格來源

### 1.1 優先順序

1. **原廠官方產品規格頁**（必填，作為 `source.url`）
2. 原廠的 PDF 手冊或規格表（機殼的水冷支援、主機板佈局圖通常只有手冊才有）
3. 台灣代理商頁面（例如品牌的台灣子站），**只在原廠沒有提供時**使用
4. 使用者實測（標註 `source.kind = "user-measured"`，UI 上要有明顯區別）

通路頁面（原價屋、PChome 等）**不作為規格來源**，這些頁面的規格常是轉抄，而且沒有版本紀錄。

### 1.2 常見官方欄位與單位陷阱

| 零件 | 官方常見寫法 | 陷阱 | 建議處理 |
|---|---|---|---|
| 機殼 顯卡上限 | `GPU Length`、`VGA Clearance`、`Max GPU Length` | 常會列出多組條件（with/without front fan、with front radiator）；有的條件是「拆掉硬碟架後」才成立 | 結構化存放各條件值（見 compatibility-spec R02），沒有標條件就存 `notes` 並降級為推算 |
| 機殼 塔散上限 | `CPU Cooler Height` | 部分品牌是從主機板表面量到側板內側，部分是量到玻璃；**待確認**各品牌的量法 | 原樣存，`notes` 註明 |
| 機殼 PSU 上限 | `PSU Length` | 常會寫「200mm（拆除硬碟籠）／160mm（保留）」 | 存兩個值 |
| 機殼 水冷支援 | `Radiator Support: Front 360/280/240, Top 360/240` | 頂部厚度上限常放在 FAQ 或手冊；部分 360 支援需要先拆除某些結構 | `radiatorMounts[]` + `notes` |
| 機殼 背板空間 | `Cable Management Space` | 不一定有提供；量測位置不一 | 選填欄位 |
| 主機板 尺寸 | `Form Factor: ATX 30.5cm x 24.4cm` | **單位是 cm**，需要換算；長短邊的順序不固定 | 匯入時統一換算成 mm；命名為 `longEdgeMm/shortEdgeMm` |
| 主機板 佈局 | 官網通常沒有座標 | CPU/PCIe/M.2/DIMM 的位置只能從手冊的佈局圖讀取 | 第一版只存「槽位 index」等離散資訊，座標列為選填 |
| 顯卡 尺寸 | `Dimensions: 304 x 126 x 50 mm`、`L x W x H` | 三個數字的順序與命名各家不同（W 和 H 常常對調）；**長度是否含 PCI 擋板／是否含後方突出各家不一**；槽數常是 2.5 這類小數 | 依「最大值 = 長度」等規則人工核對，`notes` 註明是否含擋板 |
| 顯卡 供電 | `Power Connectors: 1 x 16-pin` | 12VHPWR 與 12V-2x6 常常混寫成「16-pin」 | 型別保留兩者，加一個 `16-pin(unspecified)` 的選項 |
| 顯卡 電源建議 | `Recommended PSU: 750W` | 各品牌的建議值與 NVIDIA/AMD 公版建議可能不同 | 存原廠值 |
| 塔散 高度 | `Height (with fan)` | 有的只列 heatsink 高度（不含風扇） | 存含風扇的值，沒有就 `notes` |
| 塔散 RAM 淨空 | Noctua 等品牌提供「max RAM height」 | 多數品牌沒有提供；有的會給「上移風扇後」的值 | 選填，結構化 |
| AIO | `Radiator Dimensions: 397 x 120 x 27 mm` | 風扇厚度要另外看風扇規格 | 排／扇分開存 |
| PSU | `Dimensions: 150 x 86 x 140 mm` | 長度的位置不固定（有時放在第一個數字） | 依 W=150、H=86 的 ATX 規範辨識 |
| CPU | AMD `Default TDP` / Intel `Processor Base Power`、`Maximum Turbo Power` | AMD 的 TDP 不等於 PPT | 存 `maxPowerW` 並註明是 PPT 還是 PL2 |

### 1.3 欄位級來源

每筆資料至少要有一個 `source`。當不同欄位來自不同來源時（例如水冷厚度上限來自手冊 PDF），可以用 `fieldSources` 覆寫：

```json
"fieldSources": { "radiatorMounts": { "url": "...pdf", "retrievedAt": "2026-11-20" } }
```

---

## 2. 台灣價格

| 方案 | 可行性 | 服務條款／法律風險 | 維護成本 | 評估 |
|---|---|---|---|---|
| A. 手動維護參考價（人工查詢後填入 JSON） | 高 | 低（只是人工記錄公開的價格事實；不複製頁面內容） | 高，價格變動頻繁 | 第一批資料適用 |
| B. 使用者貼上原價屋估價單文字／匯入 CSV，在瀏覽器本地解析 | 高 | 低（是使用者自己的資料，不經過伺服器） | 低 | **推薦作為主要機制** |
| C. 爬蟲定期抓取通路價格 | 技術上可行 | **中～高**：需要逐站確認 ToS 與 robots.txt；原價屋、PChome 等是否允許自動化擷取，我**無法在本輪確認**；IP 封鎖與法律風險都由專案承擔 | 中，網站改版就會壞 | 不建議（至少在取得授權前） |
| D. 通路官方 API／聯盟行銷 feed | 未知 | 低（若有正式授權） | 低 | 值得詢問，但不確定台灣通路是否提供，**待確認** |
| E. 不顯示價格 | 高 | 無 | 無 | 備案 |

**建議**：A + B。
- 內建資料只放「參考價」，而且每筆都要有 `observedAt`。超過 N 天（提案 30 天，**待確認**）就在 UI 上變灰並顯示「價格可能過期」。
- 主要機制是 B：使用者貼上自己的估價單後，以使用者提供的價格覆蓋參考價（只存在 localStorage／分享 URL 中）。
- 規格與價格**分開存放**，因為更新頻率差了兩個數量級。
- 頁面上不要使用通路的 Logo 或品牌名稱作為來源標示；改成「人工查詢 YYYY-MM-DD」。現行的 `sourceName: "原價屋參考"` 應該移除。

---

## 3. 檔案格式與目錄結構

**格式：JSON**（而非 CSV）。理由是需要巢狀結構（`radiatorMounts[]`、`gpuLength{}`），而且 Next.js 可以直接 `import`，不需要額外套件。CSV 只作為使用者**匯入**的格式之一。

```
data/
  schema/                    # 不另外寫 JSON Schema，使用 TS 型別 + 手寫驗證函式（不新增套件）
  parts/
    case.json                # 每個檔案是同一類別的陣列
    motherboard.json
    gpu.json
    cpu-cooler-air.json
    cpu-cooler-aio.json
    psu.json
    cpu.json
    ram.json
    storage.json
  prices/
    tw-reference.json        # { partId, priceTwd, observedAt, note }[]
  CHANGELOG.md               # 資料異動紀錄（新增/修正了哪些型號、依據什麼來源）
lib/data/
  loadParts.ts               # import JSON → 驗證 → 輸出 typed 陣列
  validate.ts                # 與匯入功能共用的驗證邏輯
```

**每筆零件的必要欄位（提案）**

```json
{
  "id": "gpu-asus-tuf-rtx5070ti-oc",
  "category": "gpu",
  "brand": "ASUS",
  "brandZh": "華碩",
  "model": "TUF Gaming GeForce RTX 5070 Ti OC Edition",
  "twName": "華碩 TUF RTX5070Ti O16G GAMING",
  "source": {
    "kind": "official",
    "url": "https://<原廠產品規格頁>",
    "retrievedAt": "2026-11-20"
  },
  "updatedAt": "2026-11-20",
  "verified": true,
  "notes": "長度不含擋板",
  "spec": { "...類別專屬欄位，全部 mm/W..." }
}
```

- `id` 規則：`<category>-<brand>-<model-slug>`，只用小寫英數與 `-`。一旦發布就不再更動（分享 URL 會依賴 id）
- `verified: false` 代表有欄位尚未核對，UI 上要標示
- 所有尺寸欄位以 `Mm` 結尾、功率欄位以 `W` 結尾；驗證函式會拒絕 ≤ 0、NaN，以及超出合理範圍的值（範圍在 Phase 1 定義）
- **Phase 1 定案**：每類一個 JSON，規格與價格分開：`data/parts/<category>.json`、`data/prices/<category>.json`、`data/rules/bios-support.json`；schema 用 zod 定義於 `lib/schema/`，欄位說明見 `docs/schema.md`。上方的 `source{}` / `verified` 提案改為 `sourceUrl` + `specVerifiedAt`
- ~~**待確認**：是否改成每個型號一個檔案（`data/parts/gpu/<id>.json`）。資料量破百筆後比較好做 diff 與 review，但 import 會比較麻煩。建議第一批先用單一檔案~~（已定案：每類一個檔案）

---

## 4. 第一批真實資料建議範圍

目標是「涵蓋各規則的邊界情況」，而不是追求數量。每類大約 6–12 筆，總共約 60–70 筆。

| 類別 | 筆數 | 挑選原則 | 候選方向（實際在架型號**待確認**） |
|---|---|---|---|
| 機殼 | 10 | 中塔 ATX ×5、M-ATX ×3、ITX ×2；要包含「前置 360 + 長顯卡」容易衝突的款式 | Lian Li LANCOOL 216/207、Lian Li A3-mATX、Montech（台灣品牌）AIR 903 / XR、Jonsbo D31/D41、Antec C8 / P20C、Fractal North、NZXT H5 Flow、Cooler Master 小型 ITX |
| 主機板 | 8 | AM5 ×4、LGA1851 ×2、LGA1700 ×2；ATX/M-ATX/ITX 各至少 1 張 | ASUS TUF/PRIME B650/B850、MSI PRO/MAG B650M/B760M/B860、GIGABYTE B650/B850 AORUS ELITE、ASRock B650M PG |
| 顯卡 | 12 | 2 槽短卡 ×3、2.5–3 槽主流 ×5、>340 mm 旗艦長卡 ×4；8-pin 與 12V-2x6 都要有 | RTX 5060 / 5060 Ti / 5070 / 5070 Ti / 5080 / 5090 各品牌主流款，RX 9060 XT / 9070 / 9070 XT |
| 塔散 | 8 | 低於 150 mm ×2、155–160 mm ×4、165 mm 以上 ×2；要包含 RAM 淨空有官方數字的款式 | Thermalright PA120 SE / Phantom Spirit 120、DeepCool AK400/AK620、Noctua NH-D15 G2 / NH-U12A、ID-COOLING |
| AIO | 6 | 240/280/360 各 2；要包含厚排或非 25 mm 風扇 | Thermalright、DeepCool LT/LS、NZXT Kraken、Lian Li Galahad II、Arctic Liquid Freezer III（厚排） |
| PSU | 8 | ATX 140 / 150–160 / 170+ mm、SFX ×1、SFX-L ×1；要包含非模組化 | Seasonic、FSP（台灣品牌）、Cooler Master、Corsair、Super Flower |
| CPU | 6 | R15 瓦數與 R14 腳位用 | Ryzen 5 9600X / 7 9800X3D / 9 9950X、Core Ultra 5/7/9 2xx |
| RAM | 6 | 低高度（約 31–34 mm）與高 RGB 款；DDR4 ×1（測 R16） | Kingston FURY、G.SKILL、Crucial、ADATA XPG（台灣品牌）|

現有的 18 筆 mock 建議**全部替換**，不保留（因為無法追溯來源）。

---

## 5. 匯入功能（與資料策略一起決定）

- 與內建資料使用**同一套驗證**（`lib/data/validate.ts`）
- 支援：(1) JSON（同上述 schema）；(2) CSV（每類一個欄位模板，提供範本下載）；(3) 貼上原價屋估價單文字 → 只抽出「品名 + 價格」，再用 `twName` / 型號比對對應到 `id`，比對不到的就列出來讓使用者手動選
- 匯入的資料只存在使用者本地（localStorage），**不會上傳**
- **待確認**：原價屋估價單的文字格式。需要你提供 2–3 份實際的貼上範例（本輪不抓取網站）

---

## 6. 需要你拍板的決定

1. 價格方案：A + B（推薦）／加入 D 的詢問／E 不顯示價格
2. 是否永久排除爬蟲（C）
3. 價格過期的天數門檻（提案 30 天）
4. 單一 JSON 檔 vs 每個型號一個檔案
5. 第一批資料的品牌與型號清單（我可以先列出草稿，由你刪改）
6. 貼上估價單的範例文字（需要你提供）
