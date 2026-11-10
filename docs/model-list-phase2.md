# 第一批型號清單（Phase 2a 提案，待你核可）

- 調查日期：2026-11-09；依據為原廠官網（產品頁皆已實際開啟確認存在）
- 共 73 筆：機殼 10、主機板 9、CPU 8、RAM 6、顯卡 12、塔散 8、AIO 6、PSU 8、M.2 SSD 6
- ★ = Phase 2a 已試填進 `data/parts/`
- **價位**只是依品牌定位粗分，**沒有查台灣通路與價格**（待確認）
- 限制：MSI、GIGABYTE、ASRock、Seasonic、be quiet!（PSU）、NZXT 官網擋自動讀取（403 / 429 / bot 驗證）。主機板因此全是 ASUS，PSU 只有 Cooler Master / FSP / Lian Li。要提高品牌多樣性，需要用瀏覽器逐頁查（見待確認）

## 機殼（10）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| ★ `fractal-design-north` | Fractal Design North（Mesh） | 中高 | ATX；**內建前置風扇**；**前置 360 壓縮顯卡長度**（355 → 300）；塔散上限隨 fan bracket 改變 | https://www.fractal-design.com/products/cases/north/north/ |
| `lian-li-o11-vision-compact` | Lian Li O11 VISION COMPACT | 中 | **E-ATX**（Under 280mm）；**前面板不能裝水冷排** | https://lian-li.com/product/o11-vision-compact/ |
| `lian-li-lancool-207` | Lian Li LANCOOL 207 | 入門 | ATX；**內建前置風扇** 2×140；前置不能裝排；PSU < 160mm | https://lian-li.com/product/lancool-207/ |
| `lian-li-lancool-217` | Lian Li LANCOOL 217 | 中 | E-ATX / SSI-EEB；內建前置 2×170；PSU 分 Standard / Rotated Mode | https://lian-li.com/product/lancool-217/ |
| `montech-air-903-max` | MONTECH AIR 903 MAX | 入門 | E-ATX；內建前置 3×140；GPU 上限只給 400mm、沒寫條件（測 `unspecifiedMm`） | https://www.montechpc.com/air-903-max |
| `corsair-3500x` | CORSAIR 3500X | 中 | E-ATX；官方明寫 **Front radiator: None**（測 `sizes: []`） | https://www.corsair.com/us/en/p/pc-cases/cc-9011276-ww/3500x-mid-tower-pc-case-cc-9011276-ww |
| `hyte-y70` | HYTE Y70 | 高 | E-ATX；只能直立裝顯卡；有顯卡厚度上限 | https://hyte.com/store/y70/cs-hyte-y70-ww |
| `cooler-master-masterbox-nr200p-v2` | Cooler Master MasterBox NR200P V2 | 中 | **ITX**；SFX / SFX-L；塔散上限 67mm | https://www.coolermaster.com/en-global/products/masterbox-nr200p-v2.html |
| `fractal-design-terra` | Fractal Design Terra | 高 | ITX；塔散上限 48 / 77mm 隨佈局模式改變 | https://www.fractal-design.com/products/cases/terra-series/terra/terra-jade/ |
| `lian-li-a3-matx` | Lian Li A3-mATX | 入門 | **M-ATX**；前置沒有風扇或排位；底部可裝排 | https://lian-li.com/product/a3-matx/ |

## 主機板（9）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| `asus-rog-strix-b850-i-gaming-wifi` | ROG STRIX B850-I GAMING WIFI | 高 | **ITX**（AM5）；2 條 DIMM | https://rog.asus.com/motherboards/rog-strix/rog-strix-b850-i-gaming-wifi/spec/ |
| `asus-tuf-gaming-b650m-plus-wifi` | TUF GAMING B650M-PLUS WIFI | 入門~中 | **M-ATX**；**需更新 BIOS**：官方 CPU 清單上 9600X 等需 BIOS 2613、9850X3D 等需 3263 | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b650m-plus-wifi/techspec/ |
| `asus-tuf-gaming-b850-plus-wifi` | TUF GAMING B850-PLUS WIFI | 中 | ATX；AM5 主流中階 | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b850-plus-wifi/techspec/ |
| ★ `asus-rog-strix-x870e-e-gaming-wifi` | ROG STRIX X870E-E GAMING WIFI | 高 | **ATX**；共用通道；槽位依 CPU 系列改變；USB4 影像輸出 | https://rog.asus.com/motherboards/rog-strix/rog-strix-x870e-e-gaming-wifi/spec/ |
| `asus-rog-crosshair-x870e-extreme` | ROG CROSSHAIR X870E EXTREME | 旗艦 | **E-ATX**（30.5 × 27.7 cm）；DIMM.2 擴充卡上的 M.2 | https://rog.asus.com/motherboards/rog-crosshair/rog-crosshair-x870e-extreme/spec/ |
| `asus-tuf-gaming-b760m-plus-wifi` | TUF GAMING B760M-PLUS WIFI | 入門 | **LGA1700 DDR5 版** | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b760m-plus-wifi/techspec/ |
| `asus-tuf-gaming-b760m-plus-wifi-d4` | TUF GAMING B760M-PLUS WIFI D4 | 入門 | **同型號 DDR4 版** | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b760m-plus-wifi-d4/techspec/ |
| `asus-tuf-gaming-z890-plus-wifi` | TUF GAMING Z890-PLUS WIFI | 中 | LGA1851；M.2_4 支援 PCIe 與 SATA；有 x4 / x1 槽 | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-z890-plus-wifi/techspec/ |
| `asus-tuf-gaming-b860m-plus-wifi` | TUF GAMING B860M-PLUS WIFI | 入門 | LGA1851 入門；支援 CUDIMM | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b860m-plus-wifi/techspec/ |

## CPU（8）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| ★ `intel-core-i5-14400f` | Core i5-14400F | 入門 | **沒有內顯**；LGA1700，DDR4 + DDR5；B760 × 14 代需更新 BIOS | https://www.intel.com/content/www/us/en/products/sku/236777/intel-core-i5-processor-14400f-20m-cache-up-to-4-70-ghz/specifications.html |
| `intel-core-ultra-7-270k-plus` | Core Ultra 7 270K Plus | 中高 | 2026 Q1 新款（`intel-core-ultra-200s-plus`）；DDR5-7200 | https://www.intel.com/content/www/us/en/products/sku/245692/intel-core-ultra-7-processor-270k-plus-36m-cache-up-to-5-50-ghz/specifications.html |
| `intel-core-ultra-9-285k` | Core Ultra 9 285K | 高 | LGA1851 旗艦；Maximum Turbo Power 250W | https://www.intel.com/content/www/us/en/products/sku/241060/intel-core-ultra-9-processor-285k-36m-cache-up-to-5-70-ghz/specifications.html |
| `amd-ryzen-5-9600x` | Ryzen 5 9600X | 入門~中 | **搭早期 B650 需更新 BIOS** | https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-5-9600x.html |
| `amd-ryzen-7-9800x3d` | Ryzen 7 9800X3D | 中高 | X3D 基準 | https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9800x3d.html |
| `amd-ryzen-7-9850x3d` | Ryzen 7 9850X3D | 高 | 2026/1 上市，需要的 BIOS 比 9800X3D 新 | https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9850x3d.html |
| `amd-ryzen-9-9950x3d2-dual-edition` | Ryzen 9 9950X3D2 Dual Edition | 旗艦 | Default TDP 200W（測瓦數） | https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x3d2-dual-edition.html |
| `amd-ryzen-5-8600g` | Ryzen 5 8600G | 入門 | APU；CPU 提供 PCIe 4.0；在 X870E-E 上 M.2_2/3 會停用 | https://www.amd.com/en/products/processors/desktops/ryzen/8000-series/amd-ryzen-5-8600g.html |

## RAM（6）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| ★ `kingston-fury-beast-kf560c30bbek2-32` | FURY Beast DDR5-6000 2×16GB | 中 | EXPO + XMP；高 34.9mm | https://www.kingston.com/datasheets/KF560C30BBEK2-32.pdf |
| `kingston-valueram-kvr56u46bs8-16` | ValueRAM DDR5-5600 16GB | 入門 | **單條**；JEDEC，不用 XMP；31.25mm | https://www.kingston.com/datasheets/KVR56U46BS8-16.pdf |
| `kingston-fury-beast-kf556c40bbk4-128` | FURY Beast DDR5-5600 4×32GB | 高 | **4 條**、2Rx8；只有 XMP 沒有 EXPO；測 AMD 4x2R 降速 | https://www.kingston.com/datasheets/KF556C40BBK4-128.pdf |
| `kingston-fury-beast-kf432c16bbk2-16` | FURY Beast DDR4-3200 2×8GB | 入門 | **DDR4**；高 34mm | https://www.kingston.com/datasheets/KF432C16BBK2_16.pdf |
| `corsair-dominator-titanium-rgb-cmp32gx5m2b6000z30w` | DOMINATOR TITANIUM RGB DDR5-6000 2×16GB | 高 | **高散熱片** 56.75mm（含頂蓋）；測塔散 RAM 淨空 | https://www.corsair.com/us/en/p/memory/cmp32gx5m2b6000z30w/dominator-titanium-rgb-32gb-2x16gb-ddr5-dram-6000mts-cl30-amd-expo-intel-xmp-memory-kit-white-cmp32gx5m2b6000z30w |
| `corsair-vengeance-lpx-cmk32gx4m4b3200c16` | VENGEANCE LPX DDR4-3200 4×8GB | 入門 | DDR4 4 條；**低高度** 33.53mm | https://www.corsair.com/us/en/p/memory/cmk32gx4m4b3200c16/vengeancea-lpx-32gb-4-x-8gb-ddr4-dram-3200mhz-c16-memory-kit-black-cmk32gx4m4b3200c16 |

## 顯卡（12）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| ★ `asus-rog-astral-rtx-5090-oc` | ROG Astral RTX 5090 OC | 高 | **超長卡** 357.6mm、**3.8 槽厚卡**、16-pin | https://rog.asus.com/tw/graphics-cards/graphics-cards/rog-astral/rog-astral-rtx5090-o32g-gaming/spec/ |
| `gigabyte-aorus-rtx-5090-master` | AORUS RTX 5090 MASTER 32G | 高 | 超長卡 L=360；尺寸有 L/W/H 標示 | https://www.gigabyte.com/tw/Graphics-Card/GV-N5090AORUS-M-32GD/sp |
| `msi-rtx-5080-16g-gaming-trio-oc` | RTX 5080 16G GAMING TRIO OC | 高 | 338mm；官方有功耗 360W | https://tw.msi.com/Graphics-Card/GeForce-RTX-5080-16G-GAMING-TRIO-OC/Specification |
| `asus-tuf-gaming-rtx-5070-ti-oc` | TUF Gaming RTX 5070 Ti OC | 中高 | 3.125 槽；16-pin | https://www.asus.com/tw/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx5070ti-o16g-gaming/techspec/ |
| `asus-prime-rtx-5070-oc` | Prime RTX 5070 OC | 中 | 2.5 槽；SFF Ready | https://www.asus.com/tw/motherboards-components/graphics-cards/prime/prime-rtx5070-o12g/techspec/ |
| `msi-rtx-5060-ti-16g-ventus-2x-oc-plus` | RTX 5060 Ti 16G VENTUS 2X OC PLUS | 中低 | **PCIe x8**（官方寫 Gen 5 x16 (uses x8)）；8-pin | https://tw.msi.com/Graphics-Card/GeForce-RTX-5060-Ti-16G-VENTUS-2X-OC-PLUS/Specification |
| `asus-dual-rtx-5060-oc` | Dual RTX 5060 OC | 入門 | 8-pin；2.5 槽 | https://www.asus.com/tw/motherboards-components/graphics-cards/dual/dual-rtx5060-o8g/techspec/ |
| `gigabyte-rtx-5060-windforce-oc-8g` | RTX 5060 WINDFORCE OC 8G | 入門 | 短卡 L=199（ITX 用） | https://www.gigabyte.com/tw/Graphics-Card/GV-N5060WF2OC-8GD/sp |
| `asus-dual-rtx-5050-oc` | Dual RTX 5050 OC | 入門 | **2 槽薄卡** | https://www.asus.com/tw/motherboards-components/graphics-cards/dual/dual-rtx5050-o8g/techspec/ |
| `sapphire-nitro-plus-rx-9070-xt` | NITRO+ RX 9070 XT 16GB | 中高 | AMD 卡用 **12V-2x6**；3.2 槽 | https://www.sapphiretech.com/en/consumer/nitro-radeon-rx-9070-xt-16g-gddr6 |
| `asus-tuf-gaming-rx-9070-xt-oc` | TUF Gaming RX 9070 XT OC | 中高 | **3 × 8-pin** | https://www.asus.com/tw/motherboards-components/graphics-cards/tuf-gaming/tuf-rx9070xt-o16g-gaming/techspec/ |
| `sapphire-pulse-rx-9060-xt-16g` | PULSE RX 9060 XT 16GB | 入門 | 2.3 槽；1 × 8-pin | https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-9060-xt-16g-gddr6 |

## 塔散（8）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| ★ `noctua-nh-d15-g2` | Noctua NH-D15 G2 | 高 | **高塔散** 168mm；RAM 淨空有官方數字 | https://www.noctua.at/en/products/nh-d15-g2/specifications |
| `be-quiet-dark-rock-pro-5` | be quiet! DARK ROCK PRO 5 | 高 | 高塔散 168mm | https://www.bequiet.com/en/cpucooler/4466 |
| `deepcool-ak620-digital` | DeepCool AK620 DIGITAL | 中 | 162mm；官方 W 為氣流方向（與 be quiet! 相反） | https://www.deepcool.com/products/Cooling/cpuaircoolers/AK620-Digital-Performance-CPU-Cooler-With-Status-Display-1851-1700-AM5/2024/17202.shtml |
| `deepcool-ak400` | DeepCool AK400 | 入門 | 155mm 單塔 | https://www.deepcool.com/products/Cooling/cpuaircoolers/AK400-Performance-CPU-Cooler-1851-1700-AM5/2024/15222.shtml |
| `thermalright-peerless-assassin-120-se` | Thermalright Peerless Assassin 120 SE | 入門 | 155mm 雙塔；L/W 無法判斷（測留空規則） | https://www.thermalright.com/product/peerless-assassin-120-se/ |
| `thermalright-phantom-spirit-120-se` | Thermalright Phantom Spirit 120 SE | 入門 | 154mm | https://www.thermalright.com/product/phantom-spirit-120-se/ |
| `noctua-nh-l9a-am5` | Noctua NH-L9a-AM5 | 中 | **矮塔散** 37mm（ITX 用）、下吹式 | https://www.noctua.at/en/products/nh-l9a-am5/specifications |
| `noctua-nh-l12sx77` | Noctua NH-L12Sx77 | 中 | 矮塔散 93mm；放不進 NR200P V2（67）與 Terra（77） | https://www.noctua.at/en/products/nh-l12sx77/specifications |

## AIO（6）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| ★ `arctic-liquid-freezer-iii-pro-360` | ARCTIC Liquid Freezer III Pro 360 | 中 | **360**；38mm 厚排 | https://www.arctic.de/en/Liquid-Freezer-III-Pro-360/ACFRE00180A |
| `arctic-liquid-freezer-iii-pro-420` | ARCTIC Liquid Freezer III Pro 420 | 中高 | **420**；排寬 138 | https://www.arctic.de/en/Liquid-Freezer-III-Pro-420/ACFRE00181A |
| `lian-li-galahad-ii-trinity-360` | Lian Li GA II Trinity 360 | 中 | 360；27mm 排 | https://lian-li.com/product/galahad-ii-trinity/ |
| `lian-li-galahad-ii-trinity-240` | Lian Li GA II Trinity 240 | 中 | 240（NR200P 頂部用） | https://lian-li.com/product/galahad-ii-trinity/ |
| `corsair-icue-link-titan-ii-360-rx-rgb` | CORSAIR iCUE LINK TITAN II 360 RX RGB | 高 | 360；官方沒有排厚（測缺值） | https://www.corsair.com/us/en/p/cpu-coolers/CW-9061037-WW/icue-link-titan-ii-360-rx-rgb-aio-liquid-cpu-cooler-cw-9061037-ww |
| `thermalright-aqua-elite-360-argb-black-v6` | Thermalright Aqua Elite 360 ARGB BLACK V6 | 入門 | 360 入門 | https://www.thermalright.com/product/aqua-elite-360-argb-black-v6/ |

## PSU（8）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| `cooler-master-mwe-gold-650-v3-atx31-white-non-modular` | MWE Gold 650 V3 ATX3.1 White Non Modular | 入門 | **非模組化**；**沒有原生 16-pin 的 ATX** | https://www.coolermaster.com/en-global/products/mwe-gold-v3-atx-3-1-white-edition-non-modular-series.html |
| `fsp-hexa-85-plus-650w` | FSP HEXA 85+ 650W | 入門 | 台灣常見；沒有 16-pin | https://www.fsplifestyle.com/tw/product/HEXA85plus650W.html |
| `fsp-hydro-g-pro-atx31-850w` | FSP Hydro G PRO (ATX3.1) 850W | 中 | **有原生 12V-2x6 的 ATX** | https://www.fsplifestyle.com/en/product/HYDROGPRO850W_12V2X6.html |
| ★ `cooler-master-mwe-gold-850-v4` | MWE Gold 850 V4 | 中 | 有原生 12V-2x6；8-pin「一條線兩個頭」寫法最清楚 | https://www.coolermaster.com/en-global/products/mwe-gold-v4.html |
| `fsp-dagger-pro-atx31-850w` | FSP DAGGER PRO (ATX3.1) 850W | 中 | **SFX** | https://www.fsplifestyle.com/en/product/DAGGERPRO850W_12V2X6.html |
| `lian-li-sp850` | Lian Li SP850 | 中 | SFX；舊規 **12VHPWR** | https://www.lian-li.com/product/sp850/ |
| `cooler-master-v-sfx-platinum-1100` | V SFX Platinum 1100 | 高 | 高瓦數 SFX | https://www.coolermaster.com/en-global/products/v-sfx-platinum-1100-atx-3-1.html |
| `fsp-hydro-ptm-x-pro-atx30-1200w` | FSP Hydro PTM X PRO 1200W | 高 | 高階 ATX；官方只寫「12+4」 | https://www.fsplifestyle.com/tw/product/HydroPTMXPRO1200W_GEN5.html |

## M.2 SSD（6）

| id | 型號 | 價位 | 入選理由 / 覆蓋情境 | 官方頁 |
|---|---|---|---|---|
| ★ `samsung-9100-pro-heatsink-2tb` | Samsung 9100 PRO with Heatsink 2TB | 高 | **Gen5**、**附厚散熱片**（總高 8.88mm） | https://www.samsung.com/tw/memory-storage/nvme-ssd/9100-pro-2tb-nvme-pcie-gen-5-mz-vap2t0cw/ |
| `kingston-fury-renegade-g5` | Kingston FURY Renegade G5 | 中高 | Gen5 無散熱片 | https://www.kingston.com/tw/ssd/gaming/kingston-fury-renegade-g5-nvme-m2-ssd |
| `samsung-990-pro-heatsink-4tb` | Samsung 990 PRO with Heatsink 4TB | 中高 | **Gen4**、附散熱片 | https://www.samsung.com/tw/memory-storage/nvme-ssd/nvme-pcie-gen-4-4tb-mz-v9p4t0cw/ |
| `samsung-990-evo-plus-4tb` | Samsung 990 EVO Plus 4TB | 中 | 介面同時寫 PCIe 4.0 x4 / 5.0 x2 | https://www.samsung.com/tw/memory-storage/nvme-ssd/990-evo-plus-4tb-nvme-pcie-gen-4-mz-v9s4t0bw/ |
| `kingston-nv3-2280` | Kingston NV3（2280） | 入門 | Gen4 入門 | https://www.kingston.com/tw/ssd/nv3-nvme-pcie-ssd |
| `kingston-nv3-2230` | Kingston NV3（2230） | 入門 | **2230**（測尺寸規格） | https://www.kingston.com/tw/ssd/nv3-nvme-pcie-ssd |

（SSD 的 id 尚未包含容量，見 findings S11。）

## 測試情境覆蓋表

| 情境 | 覆蓋的型號 |
|---|---|
| ITX / M-ATX / ATX / E-ATX 機殼 | NR200P V2、Terra / A3-mATX / North、207 / O11 VC、217、903 MAX、3500X、Y70 |
| ITX / M-ATX / ATX / E-ATX 主機板 | B850-I / B650M-PLUS、B760M-PLUS、B860M-PLUS / X870E-E、B850-PLUS、Z890-PLUS / CROSSHAIR X870E EXTREME |
| LGA1700 同型號 DDR4 / DDR5 | TUF GAMING B760M-PLUS WIFI D4 / TUF GAMING B760M-PLUS WIFI |
| 需更新 BIOS 的組合 | TUF B650M-PLUS WIFI × 9600X（2613）/ 9850X3D（3263）；B760M-PLUS × 14400F（依 Intel 通則，該板的最低版本未查） |
| 沒有內顯的 CPU | i5-14400F |
| 超長顯卡（≥ 340mm） | ROG Astral 5090（357.6）、AORUS 5090 MASTER（360） |
| 2 槽薄卡 | Dual RTX 5050（2.0 槽） |
| 3.5 槽以上厚卡 | ROG Astral 5090（3.8 槽） |
| 高塔散（≥ 165mm） | NH-D15 G2、DARK ROCK PRO 5（168） |
| 矮塔散（ITX 用） | NH-L9a-AM5（37）、NH-L12Sx77（93） |
| 360 / 420 水冷 | LF III Pro 360、GA II Trinity 360、TITAN II 360、Aqua Elite 360 / LF III Pro 420 |
| SFX 電源 | DAGGER PRO 850、SP850、V SFX Platinum 1100 |
| ATX 有 / 沒有原生 12V-2x6 | Hydro G PRO 850、MWE Gold 850 V4 / MWE Gold 650 V3 非模組、HEXA 85+ 650 |
| PCIe Gen5 / Gen4 SSD | 9100 PRO HS、Renegade G5 / 990 PRO HS、990 EVO Plus、NV3 |
| 附厚散熱片的 SSD | 9100 PRO with Heatsink、990 PRO with Heatsink |
| 內建前置風扇的機殼 | North、LANCOOL 207、LANCOOL 217、AIR 903 MAX |
| 前面板不能裝水冷排的機殼 | O11 VISION COMPACT、LANCOOL 207、LANCOOL 217、3500X、A3-mATX |
| PCIe x8 顯卡 | RTX 5060 Ti VENTUS 2X（官方明寫 uses x8） |
| AMD 4 條 2R 降速 | FURY Beast 4×32GB 2Rx8 × Ryzen 9000 |

## Phase 2b 實際收錄結果（2026-11-10）

共 71 筆，全部有官方 `sourceUrl` 與 `specVerifiedAt`；mock 資料與價格已全部刪除。

| 類別 | 筆數 | 品牌 | 與清單的差異 |
|---|---|---|---|
| 機殼 | 10 | Lian Li 4、Fractal Design 2、MONTECH、CORSAIR、HYTE、Cooler Master 各 1 | 無 |
| 主機板 | 15 | ASUS 9、MSI 2、GIGABYTE 2、ASRock 2 | 新增 `msi-mag-b650-tomahawk-wifi`、`msi-pro-b760m-a-wifi`、`gigabyte-b650-aorus-elite-ax`、`gigabyte-b760m-aorus-elite-ax`（取代拿不到的 B760M DS3H AX）、`asrock-b850m-pro-rs-wifi`、`asrock-b550m-pro4`（AM4） |
| CPU | 10 | Intel 3、AMD 7 | AMD 7 顆於 2026-11-10 由使用者提供官方規格補上（docs/sources/amd-2026-11-10.md）；AM4 X3D 改收 Ryzen 7 5700X3D（原清單 5800X3D） |
| RAM | 6 | Kingston 4、CORSAIR 2 | 無 |
| 顯卡 | 12 | ASUS 6、MSI 2、SAPPHIRE 2、GIGABYTE 2 | GIGABYTE 2 張於 2026-11-10 由使用者提供官方頁內容補上 |
| 塔散 | 8 | Noctua 3、DeepCool 2、Thermalright 2、be quiet! 1 | be quiet! DARK ROCK PRO 5 於 2026-11-10 由使用者提供官方頁內容補上。NH-L12Sx77 官方高度 77 mm（不是 93），等於 Terra 上限 |
| AIO | 6 | ARCTIC 2、Lian Li 2、CORSAIR、Thermalright 各 1 | 無 |
| PSU | 8 | FSP 4、Cooler Master 3、Lian Li 1 | 無 |
| M.2 SSD | 6 | Samsung 3、Kingston 3 | id 一律含容量：`kingston-fury-renegade-g5-2tb`、`samsung-990-pro-heatsink-4tb`、`samsung-990-evo-plus-4tb`、`kingston-nv3-1tb-2280`、`kingston-nv3-1tb-2230` |

拿不到與待確認的細節見 `docs/pending.md`。

### 資料抽查（獨立 Agent，2026-11-10）

隨機抽 10 筆、由未參與收資料的 Agent 重新開官方頁逐欄比對：**57 個欄位 57 個一致，沒有發現錯誤**。`noctua-nh-d15-g2` 規格頁回 429 無法重開，依規則改抽補位。

| id | 比對欄位 / 一致 |
|---|---|
| intel-core-ultra-7-270k-plus | 8 / 8 |
| deepcool-ak620-digital | 4 / 4 |
| samsung-990-pro-heatsink-4tb | 4 / 4 |
| lian-li-sp850 | 6 / 6 |
| fsp-hexa-85-plus-650w | 5 / 5 |
| noctua-nh-l12sx77 | 2 / 2（只能用官方 infosheet，規格頁 429） |
| kingston-fury-beast-kf432c16bbk2-16 | 7 / 7 |
| sapphire-nitro-plus-rx-9070-xt | 10 / 10 |
| kingston-fury-beast-kf556c40bbk4-128 | 7 / 7 |
| samsung-990-evo-plus-4tb（補抽） | 4 / 4 |

抽查提出的疑點已併入 `docs/pending.md`（D-17、D-24、R-12、D-38）。
