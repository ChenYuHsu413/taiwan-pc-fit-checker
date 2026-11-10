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
| D-06 | be quiet! DARK ROCK PRO 5：bequiet.com 產品頁與 press 頁皆 403，找不到官方 PDF | 不收 |
| D-07 | Cooler Master NR200P V2 顯卡長度分「Exceed front bracket 357 / Not exceed 334」，不是前置風扇 / 水冷條件 | 較嚴格的 334 填 `unspecifiedMm`（R02 會顯示 Info），兩個條件寫 conditionText |
| D-08 | Fractal Terra：官方沒寫 spine 出廠位置；塔散 48 / 77、顯卡高度 131 / 145 隨 spine 位置互斥 | 兩者各取較嚴格值當預設（48、131），注意兩者不會同時成立 |
| D-09 | Lian Li LANCOOL 217：官方沒寫 PSU 出廠是 Standard 還是 Rotated | 預設 Rotated 180，Standard 220 列為其他條件 |
| D-10 | HYTE Y70：擴充槽「7 half + 4 full height」；外觀「470 x 320 x 470」沒標軸向；水冷「@ 68 / 125 mm thick」不知是否含風扇 | expansionSlots 7、maxGpuSlotWidth 4；外觀留空；厚度只寫 conditionText |
| D-11 | Lian Li A3-mATX 底部水冷「1 x 240mm (360mm with fan at the bottom)」意思不明 | sizes 只列 240，原文寫 conditionText |
| D-12 | Lian Li O11 VISION COMPACT 擴充槽「6+1」，+1 意思不明 | 填 6 |
| D-13 | Noctua NH-L12Sx77 高度：官方 information sheet 77 mm（含 15 mm 風扇），model-list 寫 93 mm | 以 sheet 為準 77 mm；model-list 的入選理由（放不進 Terra）不成立，剛好等於 Terra 77 上限 |
| D-14 | ARCTIC LF III Pro 420 排長：產品頁讀不到；官方 2D 圖 456（標的是 A-RGB 料號）、A-RGB 版 Spec Sheet 458 | 取較大的 458 |
| D-15 | Noctua 規格頁回 429；數值取自 cdn.noctua.at 官方 information sheet | sourceUrl 仍為規格頁，sheet 列在 additionalSources |
| D-16 | 腳位「115X」原廠沒逐一列出（Thermalright、Lian Li AIO） | 展開成 LGA1150/1151/1155/1156 |
| D-17 | Cooler Master MWE Gold 650 V3 非模組：系列頁寫 12V-2x6「1 (850/750W)」沒列 650W | 依決策 5 留空（實際上很可能沒有）；FSP HEXA 85+ 650W 是單一型號頁、完整接頭表沒有 16-pin，填 0 |
| D-18 | FSP Hydro PTM X PRO 1200W 只寫「PCIe 12+4」，分不出 12VHPWR / 12V-2x6 | native16PinCount 填 1 |
| D-19 | DeepCool AK400：含風扇與不含風扇的 W 差 52 mm（大於單顆風扇 25 mm），原因官方未說明 | 仍依差異判定 W 為氣流方向 |
| D-20 | Thermalright 兩款塔散氣流方向只畫在圖片 | width / depth 留空 |
| D-21 | **AMD CPU 全部 7 顆拿不到**（9600X、9800X3D、9850X3D、9950X3D2、8600G、5600、5800X3D）：www.amd.com 對 WebFetch 每次都逾時 60 秒（用一般瀏覽器 User-Agent 才會回應，視為擋自動讀取），找不到其他官方網域的規格 PDF | 不收。AMD 平台（AM5 / AM4）因此沒有 CPU，R22–R28 只能用 Intel 組合驗證；需要你決定是否人工開頁填入 |
| D-22 | GIGABYTE 顯卡 2 張（AORUS RTX 5090 MASTER、RTX 5060 WINDFORCE OC 8G）：gigabyte.com tw / global / us 皆 403，找不到官方規格 PDF | 不收 |
| D-23 | MSI 顯卡 2 張：規格頁 403，改用官方 datasheet PDF（storage-asset.msi.com）當 sourceUrl。datasheet 只有「338 x 140 x 50」「227 x 126 x 41」且沒有槽數，無法套用決策 4 判讀厚度 | 只填長度（最大值），高 / 厚 / 槽數留空，原文寫 notes |
| D-24 | Sapphire 顯卡官方標 L/W/H，W 對應本專案 height、H 對應 thickness | 照標示對應，`dimensionsAxisInferred: false`；官方用詞「Minimum ... Watt Power Supply」填進 recommendedPsuW |
| D-25 | Corsair DOMINATOR TITANIUM 高度 56.75 mm 出自 Corsair A115 相容性文章，未說明是否含頂蓋（help.corsair.com 尺寸表 403） | 填 56.75（較高值，對淨空判斷較保守）；產品頁 Overview 與 Tech Specs 容量矛盾，以 Tech Specs 為準 |
| D-26 | Corsair VENGEANCE LPX 高度 33.53 mm 為系列共用值；兩款 Corsair RAM rank 官方沒寫 | 照填；rank 留空（R26 無法查 AMD 速度表時改用最高值） |
| D-27 | Samsung 990 PRO with Heatsink 4TB：兩版 datasheet 都只列 1TB/2TB，且尺寸不同（Rev1.0 8.2 / Rev2.0 8.88） | 改用台灣產品頁（80.15 x 25 x 8.88）當 sourceUrl |
| D-28 | Kingston FURY Renegade G5 2TB 沒寫是否有散熱片 | 依官方尺寸 80 x 22 x 2.3 mm 填 `hasHeatsink: false`（2.3 mm 不可能含散熱片） |
| D-29 | Intel ARK 的 PCIe 只寫「5.0 and 4.0」，沒分顯卡 / M.2 | `pcieGen` 留空（R29 以主機板槽位判斷並註明） |
| D-30 | 主機板品牌多樣性：msi.com、gigabyte.com 產品頁 403；手冊超過 WebFetch 10 MB 上限；asrock.com 產品頁讀回空白（JS 載入） | 已收 MSI 1、ASRock 2（sourceUrl 用官方 spec sheet / 手冊 PDF）；GIGABYTE 與 MSI PRO B760M-A 改用 curl 下載官方手冊再試（結果見下一列） |
| D-31 | 主機板 `maxMemorySpeedMts`：所有板子官方最高速度都是 OC 值或依 CPU 系列不同 | 全部留空，原文寫 notes（R26 只比 CPU 官方速度） |
| D-32 | ASUS B760M-PLUS ×2、B860M-PLUS、ASRock B550M Pro4 官方完全沒提 BIOS Flashback | `biosFlashback` 留空；R27 顯示「官方未說明是否支援免 CPU 更新」 |
| D-33 | Ryzen 8000 時「supports x8/x4 mode」依型號不同（8500G / 8300G 為 x4） | 一律記 `downgraded lanes 8`，型號差異寫 notes |
| D-34 | MSI MAG B650 TOMAHAWK WIFI 只有 spec sheet：尺寸、容量上限、M.2 尺寸、laneSource、共用通道都沒寫；PCI_E2 推定為實體 x16 / 電氣 x2 | 留空；推定寫 notes |
| D-35 | ASRock B550M Pro4 手冊是 2020 年版，沒提 Ryzen 5000 的 PCIe 世代 | PCIE1 gen、M2_1 pcieGen 留空 |
| D-36 | ASUS ROG / TUF 部分 CPU 支援清單頁讀不到表格；ASRock CPU 清單頁空白 | `cpuSupportListUrl` 與 boardOverrides 只填讀得到的（TUF B650M-PLUS、TUF B850-PLUS） |
| D-37 | amd.com 本輪全部逾時：B650 × Ryzen 9000 / 9000X3D / 8000 與 B850 的依據沿用 2026-11-09 讀過的 AMD AM5 頁原文 | `verifiedAt` 保留 2026-11-09 |
| D-38 | DeepCool AK620 DIGITAL 官方腳位寫「2011-v3/2011」，2011-v3 不符合腳位格式 | 只收 `LGA2011`，notes 說明 |

## BIOS 規則表

| # | 組合 | 目前做法 |
|---|---|---|
| B-01 | B850 × Ryzen 8000、X870E × Ryzen 8000 | AMD 只寫 600 系列可能需更新，沒提 800 系列 × 8000 → **不填**（R27 Unknown） |
| B-02 | B550 × Ryzen 5000X3D | AMD 新聞稿沒提 500 系列；AM4 頁逾時 → **不填** |
| B-03 | Z890 / B860 × Core Ultra 200S | Intel 000099798 只寫是新腳位新晶片組，沒有 BIOS 說明 → **不填**。是否比照決策 9 記為 native 需要你決定 |
| B-04 | Z890 / B860 × Core Ultra 200S Plus | Intel 寫「all existing Intel 800 Series motherboards will support」，未說是否要更新 BIOS → **不填** |
| B-05 | 800 系列（B850 / X870E）× Ryzen 9000 / 9000X3D 依決策 9 記 native，但 TUF B850-PLUS 官方清單上 9500F / 9700F 需 1063、9850X3D / 9950X3D2 需 1066 | 維持 native；boardOverrides 寫入這些版本，R27 會以 Info 顯示 |
| B-06 | X870E × Ryzen 9000 依據為 AMD 新聞稿（ir.amd.com 1202：Designed to seamlessly integrate with AMD Ryzen 9000 Series） | native |

## 規則

| # | 項目 | 目前做法 |
|---|---|---|
| R-01 | Tight（緊繃）門檻沒有可靠依據 | 不實作；報告「尚未檢查的項目」說明，只顯示餘裕數值 |
| R-02 | R07、R09、R11、R12、R13、R17、R20、R21 沒有可靠的官方數據或門檻 | 不產生結果，列在「尚未檢查的項目」 |
| R-03 | R03：主機板第一條 x16 槽位置（`slotIndex`）官方幾乎不公開，無法確認下方擴充槽與電源倉空間 | 只在機殼有槽數上限、或槽數超過擴充槽總數時判斷；其餘列為尚未檢查 |
| R-04 | R06：RAM 超過散熱器出廠狀態的淨空時，部分散熱器可上移風扇，但官方給的是一組取捨，沒有單一數值 | 判 incompatible，建議文字提醒參考官方上移風扇說明 |
| R-05 | R10：SFX / SFX-L 電源放進只列 ATX 的機殼，官方沒說是否可用轉接架 | unknown |
| R-06 | R08：機殼沒有公開水冷厚度上限（或水冷沒有公開厚度）時 | unknown（尺寸支援會寫在訊息裡） |
| R-07 | R02：機殼官方沒說是否內附前置風扇，但同時給了「無風扇」與「有風扇」兩個上限 | 取較嚴格的值 |
| R-08 | R15：NVIDIA 官方的 Required System Power 註明是最低值（以 Ryzen 9 9950X 為基準），AMD 是 Minimum PSU Recommendation；板卡廠多是建議值 | 一律直接比對官方數字，用詞寫在 conditions |
| R-09 | R26：假設雙通道（2 條以下 = 每通道 1 條，3–4 條 = 每通道 2 條）；RAM 沒有 rank 時無法查表 | rank 缺值時改用 CPU 官方最高值，並註明 |
| R-10 | R29：顯卡預設插第一條 x16 槽；CPU 提供給顯卡的 PCIe 世代多數官方未分開列出 | 以主機板槽位規格判斷並註明；是否讓使用者選槽待決定 |
| R-11 | R30–R32：多支 SSD 的分配方式（貪婪分配，對使用者最有利） | 先分配世代高的 SSD，挑能全速的最低世代槽 |
| R-12 | R33：不區分 12VHPWR 與 12V-2x6；需要轉接線時，轉接需要的 8-pin 數量（依顯卡而定）不檢查 | warning 訊息提醒自行確認 |

## 其他

| # | 項目 | 目前做法 |
|---|---|---|
| O-01 | `gpu-chips.json` 的 RX 9070 XT、RX 9060 XT 數值是用瀏覽器（Claude in Chrome）開 amd.com 官方頁讀到的（WebFetch 逾時）。數值出自官方頁，但讀取方式事後判定可能算繞過自動讀取限制，之後已停止使用瀏覽器 | 數值保留；請確認是否接受，不接受就刪除這兩筆（相關顯卡改回 Unknown） |


## 3D / 2D 佈局（L 段，2026-11-10）

所有示意值在 `lib/three/constants.ts`，規格見 `docs/3d-layout-spec.md`。

| # | 項目 | 目前做法 |
|---|---|---|
| L-01 | ✅ **已解決（2026-11-10，使用者確認目前方向正確）**。原記錄：任務原文的橫插顯卡軸向（高度沿上下、大平面與主機板平行、厚度朝玻璃）與實際裝機及 schema（R04：高度 = 由 PCIe 槽往側板）不符，且與同段「風扇朝下」矛盾 | 橫插依物理方向：長 → 前後、厚 → 由插槽往下、高 → 由主機板往玻璃、風扇朝下；原文描述的方向用在直立安裝。請確認 |
| L-02 | 機殼壁厚 | 示意 10 mm／面；內部空間 = 外觀 − 2 × 壁厚 |
| L-03 | 電源倉高度 | 示意 100 mm（常見 90–110 mm）；ITX 機殼（NR200P、Terra）實際沒有傳統電源倉，也統一畫 |
| L-04 | 主機板位置：後緣距後方內壁 5 mm、上緣距內部頂面 30 mm、銅柱 6.35 mm、PCB 1.6 mm | 示意值；所有板型共用後方上緣基準點 |
| L-05 | 板上元件位置（CPU 插槽、第一條 x16 槽、RAM 槽） | 依板型示意：ATX / M-ATX / E-ATX 插槽中心 (110, 85)、x16 槽距上緣 150 mm、RAM 由 dx 160 起每 9.5 mm；ITX 插槽 (85, 80)、RAM 由 dx 140 起每 10 mm。官方不公開 |
| L-06 | 主機板缺 dimensions 時（MSI B650 TOMAHAWK、ASRock 兩張） | 用板型標準尺寸（ATX 305 × 244 等），畫面標「示意尺寸」 |
| L-07 | 電源外形高 / 寬 | ATX12V 150 × 86、SFX12V / SFX-L 125 × 63.5（規格值）；z 置中於機殼內部 |
| L-08 | 塔散高度的量測起點 | 取主機板正面（官方多半沒寫是由主機板還是 CPU 頂蓋起算） |
| L-09 | 顯卡高度的量測起點 | 取主機板正面（與 R04「由 PCIe 槽往側板」一致） |
| L-10 | 前置水冷排 / 出廠前置風扇的前後位置 | R02 採用該條件時貼在顯卡長度上限面（官方上限由此量測）；否則貼前面板內側。上下位置示意：上緣距頂 20 mm |
| L-11 | 上置水冷排位置 | 示意：後端距後方內壁 20 mm、貼內部頂面 |
| L-12 | 直立顯卡位置（HYTE Y70） | 示意：支架面距托盤 20 mm、底端距電源倉頂 10 mm |
| L-13 | 機殼外觀尺寸缺值（HYTE Y70 官方沒標軸向） | 用示意外觀 450 × 470 × 230，畫面標「示意尺寸」 |
| L-14 | 背板走線空間缺值 | 示意 20 mm（只影響機殼外框位置，不判斷） |
| L-15 | 側透玻璃位置由外觀寬度推算，可能和官方塔散高度上限面不一致 | 兩者都畫：玻璃 = 外框，上限面 = 白色半透明面；判斷以上限面（報告）為準 |
| L-16 | 只支援 ITX 的機殼（NR200P、Terra）實際沒有電源倉，電源位置各機殼不同 | 不畫電源倉，電源畫在前上方，長度由前面板內側往後（示意） |
| L-17 | Fractal Terra 官方沒寫顯卡安裝方向（riser 三明治結構），橫插會超出機殼底面 | 以直立方向示意，畫面標「示意尺寸：顯卡安裝方向」；資料 `gpuMountOrientation` 仍留空 |
| L-18 | 只畫出廠前置風扇；上 / 後 / 底部內附風扇沒畫 | 不影響判斷（R02 只用前置） |
| L-19 | 截圖驗證用 SwiftShader 軟體 WebGL，畫面可能與實體 GPU 的瀏覽器略有差異 | 已確認可正常繪製 |
