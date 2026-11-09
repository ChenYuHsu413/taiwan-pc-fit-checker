# Phase 2a 發現：官方寫法 vs schema、BIOS 來源調查

- 日期：2026-11-09
- 依據：9 類各 1 筆試填（`data/parts/*.json` 中 `specVerifiedAt` 有值的資料），加上清單調查時讀過的約 70 個官方頁面
- 本文件**只記錄問題與建議**，schema 尚未依此修改（需要你決定）

## 1. 試填結果摘要

| 類別 | id | 已填 | 留空（原因） |
|---|---|---|---|
| case | `fractal-design-north` | 外觀、板型、gpuLength 三種條件、塔散上限 145 + 條件原文、擴充槽、前/上/後/底水冷尺寸、PSU 規格、走線 30mm | `gpuMaxHeightMm`（178/148 隨 fan bracket 位置而變）；前置排厚（手冊圖表的數值對應不明）；側面水冷（產品頁與手冊矛盾）；PSU 長度三個欄位（官方條件是「HDD tray 數量與位置」，不是有/無硬碟籠）；`driveCageRemovable`（官方只說可移位） |
| motherboard | `asus-rog-strix-x870e-e-gaming-wifi` | 板型、腳位、晶片組、尺寸、DDR5 / 4 槽 / 256GB、2 個 PCIe x16 槽、5 個 M.2 槽（含 label）、2 筆 laneSharing、Flashback、影像輸出 | `maxMemorySpeedMts`（依 CPU 系列不同且是 OC 值）；`slotIndex`（官方沒有）；`supportsSata`、`hasHeatsink`（官方沒有逐槽說明） |
| cpu | `intel-core-i5-14400f` | 腳位、世代、DDR4/DDR5 與速度、TDP 65、MTP 148、最大容量 192GB | `hasIntegratedGraphics`（ARK 只是「沒有內顯區塊」，沒有明文）；`pcieGen.gpu/m2`（ARK 沒有分開寫） |
| ram | `kingston-fury-beast-kf560c30bbek2-32` | 全部欄位 | — |
| gpu | `asus-rog-astral-rtx-5090-oc` | 槽數 3.8、16-pin ×1、建議電源 1000W、PCIe 5 | **長 / 高 / 厚**（原文 `357.6 x 149.3 x 76 mm` 沒標軸向，依規則不推斷）；`tbpW`（只有 NVIDIA 公版頁有，與 sourceUrl 不同來源）；`pcieLanes`（官方沒寫） |
| airCooler | `noctua-nh-d15-g2` | 高 168 / 寬 150 / 深 152（Depth 是氣流方向，由有無風扇的差異確認）、10 種腳位、RAM 淨空 32 | `withFanRaisedMm`（官方是「上移幾 mm、總高加幾 mm」的關係，沒有單一值） |
| aio | `arctic-liquid-freezer-iii-pro-360` | 全部欄位（風扇厚度 25 取自官方 Spec Sheet 尺寸圖） | — |
| psu | `cooler-master-mwe-gold-850-v4` | 全部欄位 | — |
| m2Ssd | `samsung-9100-pro-heatsink-2tb` | Gen5 x4、2280、附散熱片 | `heatsinkHeightMm`（官方只有含 PCB 的總高 8.88mm，與欄位定義不同） |

另外：mock 的 `intel-core-i5-14400f` 與真實資料 id 衝突，已改名為 `mock-intel-core-i5-14400f`（mock 在 Phase 2b 刪除）。

## 2. 官方寫法與 schema 對不上的地方

依影響程度排序。**粗體**標示會讓相容性規則直接失效的問題。

### 2.1 共通

| # | 問題 | 官方實例 | 建議 |
|---|---|---|---|
| X1 | **一筆資料只能放一個 `sourceUrl`**，但實際上常常需要產品頁 + 手冊 + FAQ（例如 Noctua 的 RAM 淨空在 FAQ、Fractal 的 PSU 對照表在手冊、Samsung 台灣頁沒有完整規格） | 9 筆試填裡有 6 筆用了 2 個以上的來源，目前寫在 notes 裡 | 新增 `additionalSources?: [{ url, page?, fields: string[] }]` |
| X2 | 官方各頁之間互相矛盾 | Corsair 3500X 的 GPU 上限 425 / 410；North 塔散上限 145 / 170；Arctic 頁面篩選標籤與規格表的腳位不同 | 定優先順序：規格頁 > PDF 手冊 > 行銷文案；矛盾寫進 notes |
| X3 | 腳位寫法不一，有些過不了 `socketSchema` | `LGA115X`、`115x`、`Intel 1851`、`LGA 1851` | 填資料時正規化（115X 展開成 1150/1151/1155/1156，是否含 1156 依各家而定） |

### 2.2 機殼

| # | 問題 | 官方實例 | 建議 |
|---|---|---|---|
| C1 | **沒有「內建風扇」欄位**，R02 不知道前面預設有沒有風扇 | `Fans included: 2x Aspect 14 PWM (front)` | 新增 `includedFans: { front?/top?/rear?/bottom?/side?: { size, count, thicknessMm? } }` |
| C2 | **`withFrontRadiatorMm` 只對某個尺寸成立** | North `300 mm with 360 mm front mounted radiator`（240/280 未寫） | 改成 `withFrontRadiator: [{ radiatorSize, maxGpuMm }]` |
| C3 | GPU 長度的條件不是「前置配置」 | NR200P V2 `Exceed front bracket 357 / Not exceed 334 (incl. power connector)`；A3-mATX 依 PSU 位置而定 | 新增 `gpuLength.otherConditions: [{ maxMm, conditionText }]` |
| C4 | **多個限制互相連動**（同一個設定同時改變好幾個上限） | North 的 fan bracket 位置 → 塔散 145/170、顯卡寬 178/148；Terra 塔散 48/77、擴充槽 3/2；A3 底部裝風扇 → 顯卡厚 ≤ 61 | 新增 `layoutModes: [{ name, maxCpuCoolerHeightMm?, gpuMaxHeightMm?, gpuMaxThicknessMm?, expansionSlots? }]`；R02–R05 依使用者選的模式判斷 |
| C5 | **沒有顯卡厚度上限欄位**；沒有「只能直立裝顯卡」 | `GPU max thickness 72 mm`、HYTE `Max Video Card Thickness 105 mm` | 新增 `gpuMaxThicknessMm`、`gpuMountType: "horizontal" \| "verticalOnly" \| "both"` |
| C6 | 水冷排厚度上限依尺寸而不同；看不出是排還是排＋扇 | North 手冊 55 / 35mm 分兩組；HYTE `@ 68 mm thick` | `radiatorMount` 改成 `limits: [{ sizes, maxRadiatorThicknessMm?, maxTotalThicknessMm?, maxRadiatorWidthMm? }]` |
| C7 | 沒有排寬、水箱（end tank）限制（420 排寬 138） | North `Radiator width up to 125 mm`、`End tank 30 mm max` | 併入 C6 的 `maxRadiatorWidthMm`，另加 `maxEndTankMm` |
| C8 | **規格表沒列的位置算不算「不支援」** | Lian Li 只列 Top；Corsair 寫 `None`；Fractal 寫 `N/A` | 二選一：(a) 新增 `radiatorMountsExhaustive: true`（來源是完整規格表時，沒列的位置視為 `[]`）；(b) 人工判斷後直接填 `[]`。**需要你決定**；不決定的話，LANCOOL 207/217、O11 VC 的前置會一律 Unknown |
| C9 | PSU 長度的條件不是「有 / 無硬碟籠」 | North `1 HDD tray: 255 / 2 HDD tray: 155` + 位置對照表；217 `Standard 220 / Rotated 180` | `psu` 改成 `lengthLimits: [{ maxMm, conditionText, maxFrontRadiatorSize? }]` |
| C10 | 板型 enum 不夠 | `SSI-EEB (Width Max 330mm)`、`Back-Connect ATX`、`Mini-ITX Max. 170 x 180mm` | enum 加 `SSI-EEB`；新增 `backConnectSupport: boolean` |
| C11 | 擴充槽不是單一整數 | `6+1`、`7 Horizontal (or 4 Vertical)` | 改成 `expansionSlots: { horizontal, vertical? }` |
| C12 | 外觀尺寸有不同基準 | 含 / 不含凸出物、含 / 不含腳座；Montech 沒標軸向 | 新增 `external.basisText` |
| C13 | 同一機殼不同版本規格不同 | North Mesh 145/170 vs TG 170 | 規則：一律拆成不同 id |

### 2.3 主機板

| # | 問題 | 官方實例 | 建議 |
|---|---|---|---|
| M1 | **槽位規格會隨 CPU 系列改變** | X870E-E：Ryzen 8000 時 PCIEX16(G5) 變 PCIe 4.0 x8、M.2_2/M.2_3 停用 | 槽位加 `cpuOverrides: [{ cpuGenerations, gen?, lanes?, disabled? }]`，或在 `laneSharing.when` 加 `kind: "cpuGeneration"` |
| M2 | 共用通道有 AND 條件，而且官方來源互相矛盾 | 規格頁：M.2_2 **或** M.2_3 就降 x8；手冊：兩者**都**使用才降。手冊 p.14 的表是整組設定 | `when` 改成 `{ anyOf \| allOf: slotRef[] }`；試填暫用規格頁寫法 |
| M3 | 記憶體上限依 CPU 系列不同，還混了 OC 值 | `8000+MT/s(OC) with Ryzen 9000, 8400+MT/s(OC) with Ryzen 8000`；B760M `7200+(OC)/…/5600` | 拆成 `maxMemorySpeedJedecMts` + `maxMemorySpeedOcMts`，選填 `byCpuGeneration` |
| M4 | 非 x16 的實體槽沒地方放 | Z890-PLUS `1 x PCIe 4.0 x4`、`2 x PCIe 4.0 x1` | `pcieX16Slots` 改名 `pcieSlots` 並加 `physicalLanes` |
| M5 | `slotIndex` 官方幾乎不提供 | 手冊只有圖示編號 | 允許依手冊佈局圖判讀並在 notes 記錄依據，或接受留空 |
| M6 | 槽位名稱寫法不一 | `PCIEX16(G5)`、`PCIEX16(G5)_1`、`PCIEX16_(G5)` | 規定 `label` 以手冊佈局圖為準，可加 `aliases[]` |
| M7 | M.2 的 SATA 支援只有「有寫」與「沒寫」 | 只有 Z890-PLUS 的 M.2_4 明寫 `& SATA modes` | 規則：官方逐槽列出支援模式時，沒列 SATA 是否可視為 false——**需要你決定** |
| M8 | 擴充卡上的 M.2 | `DIMM.2 slot supports 2 x M.2 slots` | `m2Slots[]` 加 `location: "onboard" \| "dimm2" \| "bundledCard"` |
| M9 | 沒有 CPU 供電接頭 | `2 x 8-pin +12V CPU Power connectors` | 主機板加 `cpuPowerConnectors`；PSU 加 `eps8PinCount` |

### 2.4 CPU / RAM

| # | 問題 | 官方實例 | 建議 |
|---|---|---|---|
| P1 | **AMD 記憶體速度依條數 × rank 分四個值** | `2x1R DDR5-5600 2x2R DDR5-5600 4x1R DDR5-3600 4x2R DDR5-3600` | 新增 `memorySpeedTable: [{ type, modules, ranks, mts }]`；`officialMemorySpeedMts` 保留為 2 條時的最高值 |
| P2 | RAM 沒有 rank 欄位（P1 需要） | Kingston `1Rx8`、`2Rx8` | 新增 `ranksPerModule?` |
| P3 | XMP / EXPO 不一定都有；JEDEC 與多組設定檔並列 | KF556C40BBK4-128 只有 XMP；KF560C30 有 EXPO #0/#1 與 XMP #1/#2 | 新增 `jedecSpeedMts`、`profiles: [{ kind: "XMP" \| "EXPO", speedMts }]`，`requiresXmpExpo` 可由此導出 |
| P4 | RAM 高度可能是系列值，或有可拆頂蓋 | Corsair 只在 help 文章有系列表：含頂蓋 56.75 / 不含 41.4 | 新增 `moduleHeightAltMm` + 條件原文 |
| P5 | 內顯有無沒有明文 | Intel F 型號只是沒有內顯區塊；AMD 寫 `Discrete Graphics Card Required` | 定判定規則：Intel ARK 沒有 Processor Graphics 區塊是否可填 false——**需要你決定** |
| P6 | CPU PCIe 只有總數與配置字串 | `5.0 and 4.0`、`Up to 1x16+4, 2x8+4`；AMD `28 , 24` | 新增 `pcieRevisionText`、`pcieConfigurationsText`；`pcieGen.gpu/m2` 只在明寫時填 |
| P7 | AMD 官方有 Supporting Chipsets | `A620, X670E, X670, B650E, B650, X870E, X870, B840, B850` | 新增 `supportedChipsets?: string[]`（可補強 R22/R27） |
| P8 | `maxPowerDefinition` 的 `PL2` 不是 Intel 官方用詞；AMD 全部沒有 PPT | ARK `Maximum Turbo Power` | enum 改 `MTP` 或在文件註明對應；R15 需要定義 AMD 缺值時怎麼辦 |
| P9 | RAM 模組類型 | 200S Plus 的 4-Rank CUDIMM 只在特定主機板支援 | RAM 新增 `moduleFormat?: "UDIMM" \| "CUDIMM"` |

### 2.5 顯卡

| # | 問題 | 官方實例 | 建議 |
|---|---|---|---|
| G1 | **尺寸三個數字的標示與本專案命名相反，或沒有標示** | ASUS / MSI 沒標；GIGABYTE `L=360 W=150 H=75`、Sapphire `(L)(W)(H)` 的 W 是本專案的 height、H 是 thickness | 在 docs 定「品牌 → 欄位對應表」；沒標示時是否允許依「最大 = 長、與槽數相符者 = 厚」判讀——**需要你決定**（不允許的話，ASUS / MSI 的卡長度都是 Unknown） |
| G2 | 長度是否含擋板，看過的頁面都沒寫 | — | 新增 `lengthIncludesBracket?` |
| G3 | GIGABYTE、MSI 規格頁沒有槽數 | — | R03 允許由 `thicknessMm` 換算並標示「推算」 |
| G4 | 隨附轉接線沒地方放 | `12V-2x6 to 4x PCIe 8pin adapter`、Sapphire 附 3×8-pin | 新增 `includedAdapter?: { to, fromType, fromCount }` |
| G5 | **PCIe 通道數多數沒寫**；實體 x16 / 電氣 x8 | MSI `Gen 5 x16 (uses x8)`；其他只寫 `PCI Express 5.0` | 新增 `pcieSlotLanes`（實體）；R29 的 x8 判斷會常常是 Unknown |
| G6 | TBP 常只有公版值；與 sourceUrl 不同來源 | NVIDIA `繪圖卡總功率 575W` | 搭配 X1 的 `additionalSources`，加 `tbpBasis: "aib" \| "reference"` |
| G7 | 電源建議的語意不同 | ASUS `Recommended`（全超頻條件）、AMD / Sapphire `Minimum` | 新增 `psuRequirementKind: "recommended" \| "minimum"` |

### 2.6 塔散 / AIO

| # | 問題 | 官方實例 | 建議 |
|---|---|---|---|
| A1 | 各品牌 L/W 對氣流的意思不一樣 | Noctua Depth = 氣流；be quiet! L = 氣流；DeepCool W = 氣流；Thermalright 同品牌就對調、沒有圖 | 現行規則（判斷不了就留空）可行；建議另存 `officialDimensionsText` |
| A2 | RAM 淨空是一組取捨 | Noctua：32@168、換 120 扇 52、拆前扇 59、上移 1mm 總高 +1mm | `ramClearance.options: [{ conditionText, ramMaxMm, coolerHeightMm }]` |
| A3 | 下吹式散熱器不適用「depth = 氣流」 | NH-L9a、NH-L12Sx77 | 新增 `coolerType: "tower" \| "topDown"` |
| A4 | 沒有 offset / 懸伸欄位 | NH-D15 G2 offset 可讓開第一條 PCIe | 先記 notes（R07 是選做規則） |
| A5 | AIO 排厚有時沒有，只有合計值 | Corsair TITAN II 只有長寬高；Arctic 寫 `at least 63 mm of clearance` | 新增 `totalThicknessMm`（官方明寫合計時用） |
| A6 | 沒有管長 | `Tube Length 450 mm` | 選填 `tubeLengthMm`（R17） |

### 2.7 PSU / SSD

| # | 問題 | 官方實例 | 建議 |
|---|---|---|---|
| S1 | 16-pin 類型沒地方記 | `12V-2x6(12+4 Pin)`、`12VHPWR`、`PCIe 12+4` | 新增 `native16PinType`，沿用 `gpuPowerConnectorTypeSchema` |
| S2 | `lengthMm` 的軸向各家不同 | SFX：FSP `125 × 100 × 63.5`、CM `100 x 125 x 63.5`、Lian Li `(D)100` | 在 docs 定義 `lengthMm` = 伸入機殼方向的深度（SFX 取 100），不照官方的「L」字樣 |
| S3 | 一頁多個瓦數；「沒列在括號內」能不能算 0 | `12V-2x6 … 1 (850/750W)` | 規則：系列頁沒列該瓦數時填 0 還是留空——**需要你決定** |
| S4 | ATX 版本、輸入電壓沒欄位 | `ATX 12V Ver. 3.1`；部分型號只支援 200–240V | 新增 `atxVersion`；收錄規則「台灣 110V 不可用者不收」 |
| S5 | 8-pin 頭數與線數 | CM `x4 = 2x (600+120mm)`；FSP 只寫 `6` | 已定義 `pcie8PinCount` = 頭數；FSP 這類分不出來時留空 |
| D1 | 一個 SSD 介面寫兩種模式 | 990 EVO Plus `PCIe 4.0 x4 / 5.0 x2` | `interface` 改成 `modes: [{gen, lanes}]` |
| D2 | **`heatsinkHeightMm` 語意與官方不符** | Samsung 只給總高 `Max 8.88`（含 PCB）、寬 25mm | 改名 `totalHeightMm`，選填 `widthMm`、`pciSigHeightClass` |
| D3 | 尺寸依容量不同 | 9100 PRO HS 1–4TB 8.88 / 8TB 11.25 | 新增 `capacityGb`，一個容量一筆，id 含容量 |

## 3. BIOS 規則表來源調查

### 3.1 來源

| 來源 | 粒度 | 可信度與限制 |
|---|---|---|
| AMD AM5 晶片組頁 https://www.amd.com/en/products/processors/chipsets/am5.html | 晶片組系列 | 官方；只寫 600 系列「**may**」需要更新，沒有版本號；800 系列沒有明寫 native |
| AMD FAQ CPU-99 https://www.amd.com/en/resources/support-articles/faqs/cpu-99.html | 通則 | 官方；版本要問主機板廠 |
| AMD CPU 規格頁的 `Supporting Chipsets` | CPU × 晶片組 | 只說明晶片組層級支援，沒有 BIOS 資訊 |
| Intel 000092294 https://www.intel.com/content/www/us/en/support/articles/000092294/processors.html | 晶片組系列 | 官方；措辭比實際寬（說 700 系列跑 13 代也要更新，但 B760 板子清單的 13 代從第一版 BIOS 就支援） |
| Intel 000096847 https://www.intel.com/content/www/us/en/support/articles/000096847/processors.html | 晶片組系列 | 官方；14 代可用 600/700 系列 |
| ASUS / MSI / GIGABYTE 各板 CPU 支援清單 | **單一主機板 × 單一 CPU** | 有最低 BIOS 版本；ASUS 有 `Validated since PCB`；GIGABYTE 每個 PCB 版本一頁；MSI 用 BIOS 檔名；都要瀏覽器才能讀 |
| ASRock CPU Support List | 單一 CPU × 全系列主機板 | 最容易整批整理 |

AMD / Intel 都**沒有**「晶片組 × 世代 × 最低 BIOS」的官方對照表；最低版本只存在主機板廠的頁面。

### 3.2 試填（已寫入 `data/rules/bios-support.json`）

| chipset | cpuGeneration | support | 來源 |
|---|---|---|---|
| B650 | amd-ryzen-9000 | biosUpdate | AMD AM5 頁 |
| B650 | amd-ryzen-9000-x3d | biosUpdate | AMD AM5 頁（AMD 沒有把 X3D 分開講） |
| B760 | intel-core-14 | biosUpdate | Intel 000092294 |
| B660 | intel-core-14 | biosUpdate | Intel 000092294 |

`minBiosNote` 只放官方通則原文。各主機板的版本號出自主機板廠頁面，跟該筆的 `sourceUrl` 不是同一來源，所以沒有寫進資料，只記在下表。

### 3.3 同一晶片組下各板的差異

| 晶片組 | 主機板 | 新世代最低 BIOS |
|---|---|---|
| B650 | ASUS ROG STRIX B650-A GAMING WIFI | 9000 / 9000X3D：2613；9500F、9700F、9850X3D、9950X3D2：3263 |
| B650 | ASUS TUF GAMING B650M-PLUS WIFI | 9600X 等：2613；9850X3D 等：3263 |
| B650 | MSI MAG B650 TOMAHAWK WIFI | 9600X：1H；9800X3D：1L；9950X3D：1M；9700F：1O；9850X3D：1P |
| B650 | GIGABYTE B650 AORUS ELITE AX rev1.0/1.1 | 9000：F30；9950X3D2：F40 |
| B650 | GIGABYTE B650I AORUS ULTRA **rev1.3** | 9000 / 9000X3D：**F1**（後期 PCB 出廠就支援） |
| B760 | ASUS PRIME B760M-A WIFI | 14 代：1205 |
| B760 | GIGABYTE B760M DS3H AX rev1.x | 14 代：F15 |
| B760 | MSI PRO B760M-A WIFI | 非 K：A4；K：A5；14900KS：A7 |

### 3.4 判斷：以晶片組為主的表夠不夠用

**支援等級（native / biosUpdate / unsupported）：夠用。** 比對的 9 張板子沒有一張翻轉等級；R27 只需要「是否可能要更新 BIOS」與 Flashback 有無。

**「需要哪個版本」：不夠用。** 依你的指示，我停在這裡，**沒有改表結構**。不夠用的原因：
1. 最低版本因廠牌、型號而異，同一張板同一世代內，不同 CPU 型號要的版本也不同（例如 MSI 的 9800X3D 比 9700X 晚；後出的 9850X3D、9950X3D2 都更晚）。晶片組層級的 `minBiosNote` 寫不出正確值
2. `boardOverrides` 的值只能是等級，放不下版本號與來源
3. 主機板 id 沒有 PCB 版本：GIGABYTE B650I AORUS ULTRA 的 rev1.3 出廠就支援，舊版需要更新，現在分不出來
4. ASUS / GIGABYTE 清單本身有疑點（較新的 CPU 寫 `all`；GIGABYTE 的 `Since BIOS Version` 可能是重新驗證的版本，而非真正的最低版本）

**建議（只是建議，未實作）**
- 晶片組表保留，只拿來判斷等級
- `boardOverrides` 的值改成物件：`{ support, minBios?, sourceUrl, verifiedAt, note? }`
- 需要精確到 CPU 型號時，另開 `boardCpuSupport` 表（key = 主機板 id + CPU id）
- 主機板加 `pcbRevision`，或不同 PCB 版本拆成不同 id

## 4. 待確認（需要你決定或人工核對）

需要你決定的規則：
1. C8：規格表沒列的水冷位置要不要直接當 `[]`
2. M7：官方逐槽列出模式時，沒列 SATA 是否視為不支援
3. P5：Intel ARK 沒有 Processor Graphics 區塊，能不能填 `hasIntegratedGraphics: false`
4. G1：顯卡尺寸沒標軸向時，能不能依「最大 = 長、與槽數相符者 = 厚」判讀
5. S3：PSU 系列頁沒列出該瓦數的 16-pin 時，填 0 還是留空
6. 是否納入 AM4（Ryzen 5000）、Intel Core 5 120（Series 1）、Ryzen AI 400
7. BIOS 表結構是否依 §3.4 的建議修改
8. 第 2 節的 schema 修改要做哪些（建議 Phase 2b 開始收資料前一次改完）

需要人工核對的資料：
9. North 手冊 p.33 的前置排寬 / 排厚對應（要看 PDF 圖）；產品頁的「Side radiator 2x 120/140」是否誤植
10. X870E-E 的共用通道到底是 AND 還是 OR（規格頁與手冊矛盾）
11. X870 / X870E / B850 / B840 × Ryzen 9000 是否 native（AMD 沒有明文）
12. Ultra 200S Plus 搭早期 800 系列主機板是否需要更新 BIOS
13. RTX 5060 / 5050 是否為 PCIe x8（只有 MSI 5060 Ti 明寫）
14. 晶片組字串：`B650E` / `B650`、`X870E` / `X870` 要分開存還是合併（目前試填用 `X870E`）
15. 品牌多樣性：MSI、GIGABYTE、ASRock、Seasonic、be quiet!、NZXT 官網擋自動讀取，要用瀏覽器逐頁查
16. 全部型號的台灣通路販售狀況與價格（沒查）
17. Crucial 消費級產品線是否已停止（有印象但沒查證，所以沒有選 Crucial）
