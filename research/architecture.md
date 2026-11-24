# K-Arena Yokohama (Kアリーナ横浜) — Architecture & Engineering Research

Research angle: architecture / engineering sources (designer, contractor, developer, trade press, planning documents, construction blogs reproducing official drawings).
Research date: 2026-11-23. All dimensions in metres unless noted.

Confidence tags used throughout:

- **CONFIRMED** — stated by an official / primary source (developer, designer, contractor, government document, official statutory notice board).
- **REPORTED** — stated by a credible secondary source (trade press, Wikipedia, blog reproducing an official document, machine-summarised primary page).
- **ESTIMATED** — derived by me (scaled from a drawing, counted in a photo, computed from OSM coordinates). Derivation is given. Typical accuracy is stated.

Important caveat about drawings: every published orthographic drawing I could find is a **design-stage drawing (2019–2020)**, not an as-built drawing. Overall massing matches the finished building very well (checked against completion photos), but details (row counts, exact levels, VIP level) may differ by 1–2 m from as-built.

---

## 0. Quick summary for modelers (the 30-second version)

| Item | Value | Confidence |
|---|---|---|
| Complex | "Music Terrace" (ミュージックテラス) = K-Arena Yokohama (arena) + Hilton Yokohama (hotel) + K Tower Yokohama (office) on one 31,793.97 m2 site, 3 buildings in an E–W row: office (west) – hotel (centre) – arena (east) | CONFIRMED |
| Arena plan shape | Irregular, nearly symmetric **hexagon ("fan with chamfered back")**: short stage-end wall (~47 m), two long diverging flank walls (~100–112 m, opening angle ~61–66 deg), two chamfer facades (~43–55 m) and a rear facade (~79 m) | ESTIMATED (Kajima 2F plan + site plan + OSM) |
| Stage end | **South-east end** (toward Tochinoki-dori curve / Minato Mirai Ohashi side). Audience looks toward azimuth ~122–123 deg (ESE). | ESTIMATED (drawings + aerial photos + OSM) |
| Rear (main) facade | Faces azimuth ~302–303 deg (WNW–NW) toward Katabira River / Yokohama Station; 24 giant columns + 9 m deep curved eave ("大庇") on the three rear facets | ESTIMATED / CONFIRMED (eave 9.0 m, columns 1.2 m sq x 30 m) |
| Overall arena extent | 153.6 m (E–W, eave tip to east vertex) x ~152 m (N–S); ~140 m along main axis incl. eave; ~160 m max width perpendicular to axis | 153.6 CONFIRMED (Kajima), rest ESTIMATED |
| Height | ~45 m (ridge above the rear colonnade); roof slopes down ~4.8 deg toward the stage to ~35 m; stage-end block parapet ~31 m | 45 m CONFIRMED, rest ESTIMATED |
| Floors | 9 above ground, no basement; public levels 1 (arena floor), 3 (main entrance / lower stand), 5 (middle stand, Lounge 5), 6 (VIP), 7 (upper stand, Arena Bar 7) | CONFIRMED |
| Seats | 20,033 | CONFIRMED |
| Structure | S (steel) with partial RC + SRC; roof steel trusses spanning >110 m ("120 m large span"), 18 trusses, ~3,400 t roof steel, column-free bowl | CONFIRMED / REPORTED |
| Stands | Arena floor + 3 stacked tiers (lower / middle / upper), all seats facing the stage in a fan | CONFIRMED |
| Furthest seat | ~110 m (horizontal) from the stage rear wall; ~95 m from the stage front; ~100 m line of sight | ESTIMATED from section |

---

## 1. Sources (all opened and read; drawings / photos studied visually)

| # | Source | URL | What it gave |
|---|---|---|---|
| S1 | Statutory notice board "建築計画のお知らせ" (photo reproduced by blog "超高層マンション・超高層ビル") | https://bluestyle.livedoor.biz/archives/52541757.html , image https://livedoor.blogimg.jp/bluestylecom/imgs/9/b/9bd54ed4.jpg | Official plan-stage figures (site/building/floor areas, height 99.87 m, structure, floors, dates, designers) |
| S2 | skyskysky.net "ミュージックテラス" (reproduces official elevations and site plan from the notice board) | https://skyskysky.net/construction/202140.html ; drawings: https://skyskysky.net/photo2/202140/202012/03-1.jpg (north elevation), https://skyskysky.net/photo2/202140/202012/04-1.jpg (south elevation), https://skyskysky.net/photo2/202140/202012/05-1.jpg (site plan / 配置図) | Elevations with grid dimensions and TP levels; roof-plan site plan with grid; final area figures |
| S3 | Ken Corporation press release 2020-08-20 "Kアリーナプロジェクト着工のお知らせ" (PDF, contains a true orthographic **section** "断面イメージ", location map, renders) | https://www.kencorp.co.jp/news/20200820/20200820_k-arena.pdf | Section through arena + hotel + office (best geometric source); site data |
| S4 | Ken Corporation press release 2021-11-16 (naming, facility table) | https://www.kencorp.co.jp/news/20211116/20211116_k-arena.pdf | Facility table per building, K Tower specs, VIP lounge "40 m wide" |
| S5 | Ken Corporation development case page | https://www.kencorp.co.jp/pro/development/case/example/k-arena/ | Final floor areas per building |
| S6 | Ken Corporation story Vol.18 | https://www.kencorp.co.jp/company/about/story/18.html | "120 m large-span roof", construction sequence, entrance on 3F, bars at 5F/7F |
| S7 | KAJIMA monthly (月報KAJIMA) Oct 2021 feature "発展！みなとみらい21×鹿島 — Project 3 Kアリーナプロジェクト" | https://www.kajima.co.jp/news/digest/oct_2021/feature/05/index.html ; images img_03.jpg (2F layout plan with dimensions), img_09.jpg (BIM of 18 trusses), img_04.jpg (aerial) under https://www.kajima.co.jp/news/digest/oct_2021/feature/05/images/ | Truss span >110 m, 18 trusses, 3,400 t, 120 t rigging, 80 m stage width, deck heights, dimensioned site layout (285.0 / 284.5 / 163.3 / 153.6 / 64.8 / 43.4 / 32.0 m) |
| S8 | KAJIMA monthly Sep 2024 "K works" | https://www.kajima.co.jp/news/digest/202409/p22.html | Final credits and structure per building, total floor area 118,385 m2 |
| S9 | KAJIMA monthly Apr 2026 | https://www.kajima.co.jp/news/digest/202604/p35.html | Pollstar world No.1 (context only) |
| S10 | Azusa Sekkei (梓設計) work page | https://www.azusasekkei.co.jp/work/view/683 | Structure, floor area, awards, design-concept statements |
| S11 | Shinkenchiku (新建築) 2023-10 data page (free part) | https://data.shinkenchiku.online/projects/articles/SK_2023_10_166-0 | Eave projection 9,000 mm, SRC columns 1,200 mm sq x 30 m, credits (野沢誠 = general creator) |
| S12 | Nikkei xTECH 2023-08-01 (completion) | https://xtech.nikkei.com/atcl/nxt/column/18/00585/080100198/ ; perspective section https://cdn-xtech.nikkei.com/atcl/nxt/column/18/00585/080100198/k5.jpg ; exterior photo .../k1.jpg | Structure, stage dimensions, tier naming, completion photo |
| S13 | Nikkei xTECH 2022-04-08 (site visit; page 2 paywalled) | https://xtech.nikkei.com/atcl/nxt/column/18/00585/040800138/ ; aerial .../air.jpg, section render .../7.jpg | Site/building areas at that date, 80 m stage width, white exterior |
| S14 | MLIT press release 2019-02-22 "民間都市再生事業計画（Kアリーナプロジェクト）を認定" | https://www.mlit.go.jp/common/001273962.pdf | Early-scheme areas, structure wording, plaza and green areas, schematic section |
| S15 | Shotenkenchiku (商店建築) 2024-01 credits page | https://shotenkenchiku.com/products/detailp.php?itemid=4367 | Full design credits incl. lighting designer of the big eave |
| S16 | Kanagawa Architecture Concours No.66 (award + official photos by SS Co.) | https://www.pref.kanagawa.jp/osirase/0721/kanagawa-architecture-concours/gallery/66/general.html ; photo .../gallery/66/images/general/musicterrace/musicterrace1.jpg | Best clean exterior photo (column count, facade composition) |
| S17 | Kotobuki Seating case page | https://www.kotobuki-seating.co.jp/projects/list/detail.html?pdid1=01155 | Seat products, colours, balcony seats 3 rows / 235, VIP box count |
| S18 | atpress completion release 2023-08-01 | https://www.atpress.ne.jp/news/363680 ; section render https://www.atpress.ne.jp/releases/363680/img_363680_8.png | Stage, rigging, ribbon vision sizes |
| S19 | Impress Watch 2023-08-01 | https://www.watch.impress.co.jp/docs/news/1520699.html | Vision sizes, lockers, concessions |
| S20 | Oricon preview report | https://www.oricon.co.jp/news/2296012/full/ | Level naming, lounge seat counts |
| S21 | Wikipedia ja / en | https://ja.wikipedia.org/wiki/Kアリーナ横浜 , https://en.wikipedia.org/wiki/K-Arena_Yokohama | Cross-check; coordinates 35d27'52"N 139d37'50"E |
| S22 | OpenStreetMap ways 934667675 (arena), 934667674 (Hilton), 934667673 (K Tower) (ODbL) | https://www.openstreetmap.org/way/934667675 etc. | Georeferenced footprints |
| S23 | Yokohama City: Takashima Suisaisen Deck press / evaluation documents | https://www.city.yokohama.lg.jp/city-info/koho-kocho/press/toshi/2024/20250314.html ; https://www.city.yokohama.lg.jp/kurashi/machizukuri-kankyo/toshiseibi/mm21/takasima-nr.html | Deck length 130.4 m, width 6.0 m, structure |
| S24 | Daiko lighting case (VIP lounge) | https://www2.lighting-daiko.co.jp/case/public/case296.html | VIP lounge lighting credits |
| S25 | IEIJ "照明施設賞 2025 No.09 Kアリーナ横浜" (search-result snippet only; page has a broken TLS certificate) | (listed in search results as .../atarashii-shomei/2025/pg_09.html) | Lighting facility award 2025 (recipients Ken Corporation + Azusa Sekkei), DMX-controlled lighting |

Searched without useful result (so modelers know these are not hidden somewhere obvious): Yokohama City 都市美対策審議会 景観審査部会 meetings No.41–50 (2018–2019) — the 60/61 block project is not on any agenda; BCS Prize / Good Design Award (no listing found); 鉄構技術 / 建築技術 / JSCA structural articles (none found online); roofing / cladding manufacturer case studies (none found); Nikkei xTECH page 2 "会場設備と屋根トラス" is paywalled; Shinkenchiku data sheet (areas, finishes, floor heights) is paywalled; Kokken (国建) web page for the hotel not found.

---

## 2. Project facts (hard numbers)

### 2.1 Whole complex

| Item | Value | Confidence | Source |
|---|---|---|---|
| Project name | Kアリーナプロジェクト; block name ミュージックテラス (Music Terrace) | CONFIRMED | S4 |
| Address (lot) | 横浜市西区みなとみらい六丁目2番2 ほか2筆 (postal: arena 6-2-14, Hilton 6-2-13, K Tower 6-2-12) | CONFIRMED | S1, S5, S22 |
| Blocks | MM21 Central District blocks 60 / 61 (part) | CONFIRMED | S7, S11 |
| Site area (敷地面積) | 31,793.97 m2 | CONFIRMED | S1, S3, S4, S14 |
| Building area (建築面積), whole complex | 27,600.00 m2 (2020 notice) / 27,695.58 (2019 MLIT) / 27,333.01 (Nikkei 2022) / 26,892.64 (skyskysky, final figure) | CONFIRMED (notice) / REPORTED | S1, S14, S13, S2 |
| Total floor area (延べ面積) | 119,300.00 m2 (2020 notice) → **118,384.78 m2 final** (Azusa: 118,384; Ken/Kajima: 118,385) | CONFIRMED | S1, S2, S5, S8, S10 |
| Height (建築物の高さ) | 99.87 m (towers) | CONFIRMED | S1 |
| Floors (complex, statutory) | 地上28階 地下0階 1棟 (2020 notice; one building in the statutory sense) | CONFIRMED | S1, S10 |
| Structure | S造（一部RC造+SRC造） | CONFIRMED | S1, S10 |
| Parking | 372 cars (notice) | CONFIRMED | S1 |
| Public open space (2019 plan) | Plaza (広場) 12,104.65 m2; green (緑地) 272.54 m2 | CONFIRMED (plan stage) | S14 |
| Client | 株式会社ケン・コーポレーション | CONFIRMED | S1 |
| Design | 梓設計 (arena; representative designer 永廣正邦), 国建 (hotel), 鹿島建設 横浜支店 (hotel + office) ; general creator 野沢誠 (Ken Corporation) | CONFIRMED | S1, S2, S11, S15 |
| Interior / signage / art | イリア (ILYA) | CONFIRMED | S8, S15 |
| Construction | 鹿島建設 横浜支店 | CONFIRMED | S1, S8 |
| Construction period | start 2020-08-01; completion 2023-07-31 (notice planned 2023-10-31) | CONFIRMED | S1, S6, S8 |
| Openings | K Tower 2023-08-01; Hilton 2023-09-24; K-Arena 2023-09-29 | CONFIRMED / REPORTED | S2, S15 |
| Awards | 66th Kanagawa Architecture Concours, Excellence Award (優秀賞, FY2024); FY2024 Fire and Disaster Management Agency Commissioner commendation for fire equipment; IEIJ Lighting Facility Award 2025 (照明施設賞) | CONFIRMED / REPORTED | S10, S16, S25 |

### 2.2 Per building

| Item | K-Arena Yokohama (アリーナ棟) | Hilton Yokohama (ホテル棟) | K Tower Yokohama (オフィス棟) | Confidence / Source |
|---|---|---|---|---|
| Use | Music arena (観覧場), parking etc. | Hotel, shops, parking | Offices, shops, parking | CONFIRMED S4, S5 |
| Floors | 9 above ground, 0 basement | 26 above, 1 basement | 21 above, 1 basement | CONFIRMED S4, S5 |
| Height | ~45 m | ~100 m (99.87 m) | ~100 m (99.87 m) | CONFIRMED S4, S1 |
| Floor area (final) | 53,853 m2 | 34,816 m2 | 29,716 m2 | CONFIRMED S5 |
| Floor area (2021 release) | ~54,090 m2 | ~34,850 m2 | ~29,740 m2 | CONFIRMED S4 |
| Floor area (2019 scheme) | 48,982.13 m2, 7 floors | 35,272.40 m2, 25F+B1+PH1 | 27,853.12 m2, 21F+PH1 | CONFIRMED (superseded) S14 |
| Structure | S造 (Kajima 2024); 2019 wording: RC + SRC, roof S | S造 一部RC・SRC造 | S造 (oil-damper seismic control per skyskysky) | CONFIRMED S8, S14 / REPORTED S2 |
| Key numbers | 20,033 seats (20,030 in 2021 release); ~22,000 standing configuration (Oricon) | 339 rooms | ~15,000 m2 leasable; typical floor ~200+ tsubo net, ceiling 2,800 mm, 500 kg/m2, 70 VA/m2 | CONFIRMED S4, S5 |
| Footprint (OSM bounding box) | ~150 x 150 m (roof outline) | 62.6 (E–W) x 33.0 (N–S) incl. podium | 41.7 (E–W) x 32.0 (N–S) | ESTIMATED from S22 |
| Footprint (Kajima plan labels) | 153.6 m E–W | 64.8 m E–W | 43.4 m E–W x 32.0 m N–S | CONFIRMED S7 |

Note on "arena building area": not published separately. ESTIMATED ~16,000 m2 (OSM roof polygon area 15,961 m2; my hexagon 13,350 m2 at the 2F wall line + ~2,700 m2 of rear eave/colonnade band).

---

## 3. Site, orientation and georeference

### 3.1 Site dimensions (Kajima 2F layout plan, S7 img_03 — labels are printed on the drawing)

| Dimension | Value | Confidence |
|---|---|---|
| Overall E–W extent of the complex | 284.5 m | CONFIRMED |
| Overall N–S extent | 163.3 m | CONFIRMED |
| Length of the NW (river / railway side) boundary | 285.0 m | CONFIRMED |
| Office (K Tower) | 43.4 m (E–W) x 32.0 m (N–S) | CONFIRMED |
| Hotel (Hilton) | 64.8 m (E–W) | CONFIRMED |
| Arena | 153.6 m (E–W) | CONFIRMED |
| Drawing scale check | Labels 284.5 / 163.3 / 43.4 / 32.0 all give 1.37–1.39 px/m on the 600 px image, so the graphic is to scale. The 153.6 m arrow is drawn only across the 2F wall outline (which measures 138.1 m at that scale); 153.6 m equals 2F wall outline + ~15.5 m (colonnade set-out ~6.3 m + 9.0 m eave), i.e. it is the **maximum roof extent**. | ESTIMATED |

The site is a rounded triangle: straight south boundary running almost exactly E–W (site plan S2 notes the angle between true north and the south boundary as ~87d52'55", i.e. the south boundary is within ~2 deg of true E–W; OSM building edges are within 0.3 deg of E–W), a long diagonal NW boundary along the JR freight line / Takashima Suisaisen Park / Katabira River, and a curved east boundary following the road toward Minato Mirai Ohashi. South-boundary length ~260 m (site plan dimension chain ~137.6 + ~122.33 m; low-resolution reading, ESTIMATED).

Neighbours (from the location map in S3): Anpanman Children's Museum directly south (across the street), Fujifilm BI (ex Fuji Xerox) south-west, OK Minato Mirai building south-east, Takashima Suisaisen Park + Katabira River north-west, Yokohama Bay Quarter across the river to the north-west, Yokohama Station ~9 min walk west-north-west.

### 3.2 OSM footprints (ODbL; S22) — use for georeferencing

Arena way 934667675 (7 nodes, traces the **roof outline incl. rear eave**, slightly generous on the NE side where a perimeter deck exists):

| Node | Lat | Lon | Local x east (m) | Local y north (m) |
|---|---|---|---|---|
| SE corner | 35.4640348 | 139.6312794 | 125.7 | -0.8 |
| SW corner | 35.4640420 | 139.6298944 | 0.0 | 0.0 |
| W vertex | 35.4645730 | 139.6298922 | -0.2 | 58.9 |
| NW vertex | 35.4651599 | 139.6303466 | 41.0 | 124.0 |
| N tip | 35.4653841 | 139.6309827 | 98.8 | 148.9 |
| NE mid | 35.4651458 | 139.6311131 | 110.6 | 122.5 |
| E vertex | 35.4643403 | 139.6315448 | 149.8 | 33.1 |

(local metres computed with 110,949 m/deg lat and 90,769 m/deg lon at 35.4645 N). Side lengths: S 125.7 m (az 270), W chamfer 58.9 m (az 0), rear facade 77.1 m (az 32.4), N chamfer 62.9 m (az 66.7), NE flank 126.6 m (az 156), stage end 41.6 m (az 215). Polygon area 15,961 m2. Centroid ~35.46467 N, 139.63072 E. OSM tags: building:levels=9, height=45.

Hilton way 934667674 (L-shaped podium+tower outline): corners 35.4643673/139.6291247, 35.4643691/139.6298137, 35.4640727/139.6298148, 35.4640720/139.6295211, 35.4641192/139.6295210, 35.4641182/139.6291256. OSM height 99.87, levels 26.

K Tower way 934667673: corners 35.4643297/139.6285828, 35.4640433/139.6285853, 35.4640481/139.6290421, 35.4643314/139.6290412. OSM height 99.87, levels 21.

Gaps (OSM): K Tower – Hilton 7.5 m; Hilton east face – arena roof edge 7.2 m. Kajima plan: Hilton east face – arena **2F wall** 16.3 m (ESTIMATED from pixels), so the arena roof/eave overhangs ~9 m toward the hotel at the SW corner.

### 3.3 Main axis / compass orientation

| Item | Value | Confidence |
|---|---|---|
| Rear facade line azimuth | ~32–33 deg (runs SSW→NNE) | ESTIMATED (OSM 32.4; Kajima plan 33.0) |
| Rear facade faces (outward normal) | azimuth ~302–303 deg (WNW–NW), toward the plaza, Katabira River and Yokohama Station | ESTIMATED |
| Main axis, audience viewing direction (rear → stage) | azimuth ~122–123 deg (ESE–SE) | ESTIMATED |
| Stage end | South-east short wall of the hexagon | ESTIMATED; consistent in section S3, elevations S2, aerial photos S7/S13 (stands on the NW side, flat low roof end at SE) |
| South flank wall | runs true E–W (the site's south boundary side), contains the truck doors | ESTIMATED from S2 south elevation |

---

## 4. Arena plan geometry

### 4.1 Recommended local frames

Frame P (plan frame, metres): x = east, y = north, origin O = intersection of the arena's 2F west wall line and south wall line. Georeference of O: ~35.46409 N, 139.63000 E (ESTIMATED, +-3 m; derived by matching hotel/arena gaps between the Kajima plan and OSM: O is ~9.1 m east and ~5.0 m north of OSM's SW node).

Frame A (axis frame, metres): u = distance from the **hall-side face of the stage rear wall** toward the audience rear, v = lateral (positive toward the NE flank), z = height above arena floor (1FL). Axis unit vector in frame P (stage → rear) = (-0.839, +0.544). The stage rear wall inner face midpoint is at P ≈ (109.6, 29.7); the stage-end outer wall midpoint at P ≈ (125.3, 19.6).

### 4.2 Hexagon vertices at the 2F wall line (ESTIMATED, +-2 m; scaled from Kajima 2F plan at 1.38 px/m)

| Vertex | Frame P (x, y) | Note |
|---|---|---|
| SW corner | (0, 0) | actual plan has a small notch here: wall steps in to x = 12.5 for the southern 10.9 m |
| SE corner | (112.5, 0) | south flank wall = 100–112 m long |
| E vertex | (138.1, 39.1) | stage-end wall SE→E is 46.8 m long, parallel to rear facade |
| N tip | (83.8, 137.0) | NE flank wall E→N is ~112 m long |
| NW vertex | (43.2, 121.7) | N chamfer N→NW ~43 m (plan shows a notch near the N tip; OSM gives 63 m to the roof corner) |
| W vertex | (0, 55.1) | rear facade NW→W 79.4 m; W chamfer W→SW 55.1 m (true N–S) |

Derived: polygon area ~13,350 m2; opening angle between the two flank walls ~61–66 deg (half-angles ~33 deg south side, ~28–33 deg north side); virtual fan apex ~41 m behind (SE of) the stage-end outer wall on the axis, i.e. at u ≈ -60 m; interior angles rear-facade/chamfer ~144–147 deg.

In frame A (symmetrised, recommended for procedural modelling):

| Element | u (m) | v (m) |
|---|---|---|
| Stage-end outer wall | -18.7 | -23.4 … +23.4 (46.8 m wide) |
| Stage rear wall (hall side) | 0 | hall clear width here ~65–70 m |
| Flank walls | from (-18.7, +-23.4) diverging at ~30.5 deg half-angle | outer width W(u) ≈ 1.18 x (u + 59.7) |
| Widest point (flank/chamfer corner) | ~76–80 | +-76 … +-85 (max width ~160 m) |
| Rear facade at 2F wall line | 105.7 | -39.7 … +39.7 (79.4 m) |
| Rear colonnade (column centre line) | ~112 | columns parallel to the three rear facets, ~6.3 m outside the 2F wall |
| Rear eave tip | ~121.5 | 9.0 m beyond the column line (CONFIRMED 9,000 mm) |

Kajima states the "stage is 80 m wide" (ステージ幅80m; S7, S13 — REPORTED via page summary): this matches the building width at u ≈ 8–10 m in the formula above, i.e. the clear width of the stage zone.

### 4.3 Structural grid readings (site plan / elevations S2; small text, low-res — ESTIMATED readings)

- Grid AA along the south wall, from east (AA1) to west (AA14), spacing in mm: 8,500 / 8,500 / 8,500 / 12,000 / 8,500 / 8,000 / 7,000 / 7,000 / 5,500 / 6,000 / 5,500 / 11,000 / 10,000 (AA1→AA13 = 96.5 m; AA13 is the rear column line at the SW corner; AA13→AA14 = 10.0 m lies under the west eave / plaza side).
- East vertex of the building is ~46 m east of AA1 (two extra grid lines there, ~15.7 m and ~13.6 m).
- Perimeter grid along the W chamfer and N chamfer (rear colonnade): ~8,000 mm bays.
- Pile caps / column lines in the section under the stands: ~8–9 m spacing along the axis.

### 4.4 Bowl in plan (from the Kajima 2F plan, which shows seating blocks)

- Seating blocks are straight-row segments arranged concentrically around the stage, filling the whole wedge between the two flank walls. Rows of the outermost south-wing blocks run N–S (seats face east) and rows of the outermost north-wing blocks run E–W (seats face south), i.e. both wings face the stage centre at about +-33 deg off the axis. The bowl is a **pure fan of ~65–70 deg**, not a horseshoe. (ESTIMATED)
- Radial aisles divide each tier into roughly 9–11 wedge blocks (count on low-res plan; ESTIMATED).
- The stage zone is the empty quadrilateral in front of the SE wall; backstage rooms line the stage-end wall (stairs/lift cores visible as rectangles in the 13 m deep strip between the high roof and the outer wall).

---

## 5. Arena section geometry (stacking of tiers)

Source: orthographic section in S3 (Ken Corporation 2020-08-20; image 1566 px wide). Calibration: roof ridge = 45 m above 1FL (official "約45 m"; north elevation S2 gives 44.9 m using its +100 m reference line) → **5.77 px/m**. Cross-checks at this scale: eave projection measures 9.5 m (official 9.0 m), hall clear span 110–117 m (official ">110 m" / "120 m"), column from deck to soffit 27.7 m (official column 30 m), hotel tower width ~62 m (OSM 62.6 m), whole arena length incl. eave 140.1 m (MLIT schematic section gives ~141 m at its own scale). Accuracy of values below ≈ +-0.5 m vertical, +-1 m horizontal; design-stage drawing.

### 5.1 Levels (z above arena 1FL)

| Level | z (m) | Notes | Confidence |
|---|---|---|---|
| 1F / arena floor | 0.0 | Flat floor; trucks (11 t) drive in; equals design GL. 1FL ≈ TP+3.65 m (label on elevation, hard to read; could be TP+2.65) | ESTIMATED |
| 2F | ~3 (partial) | Not visible as a continuous slab in the section; back-of-house mezzanine under the lower stand | ESTIMATED (weak) |
| 3F = deck / main entrance / lower-stand concourse ("LEVEL 3") | +6.2 | Same level as the plaza deck ("人工地盤"); Kajima says decks at 6 m and 4.5 m | ESTIMATED; deck heights REPORTED S7 |
| 4F | +11.6 (rear block); slab under middle-stand front at +9.3 | middle-stand vomitory level | ESTIMATED |
| 5F ("LEVEL 5", middle-stand concourse, Lounge 5) | +17.0 | | ESTIMATED |
| 6F ("LEVEL 6", VIP lounge / VIP boxes) | +22.5 | VIP boxes sit behind the middle stand under the upper-stand front | ESTIMATED |
| 7F ("LEVEL 7", upper-stand concourse, Arena Bar 7) | +27.6 | outdoor-looking terrace strip behind the upper stand under the inclined soffit | ESTIMATED |
| 8F / 9F | ~+31 / ~+35 | inside / top of the upper stand (top rear walkway at +35.0) | ESTIMATED (weak) |
| Stage-end block floors | +6.1, +11.6, +16.8, +22.6, +29.5 | 5 backstage levels, each with a ~2 m technical gallery projecting into the hall | ESTIMATED |
| Stage-end block parapet | +31.0 | matches the "average ground +31 m" line drawn on the elevations | ESTIMATED |

Typical floor-to-floor: 5.2–5.8 m above 3F.

### 5.2 Tiers along the main axis (u from stage rear wall)

| Tier | Front row (u, z) | Back row (u, z) | Horizontal depth | Rise | Rake | Rows (count of steps in drawing) | Notes |
|---|---|---|---|---|---|---|---|
| Arena floor (アリーナ) | 0 … 52.6, z = 0 | — | 52.6 m from stage rear wall to lower-stand front | 0 | flat | movable seats | base stage 22 x 13 x 1.8 m sits in the first ~15 m |
| Lower stand (ロアースタンド, LEVEL 3) | (52.6, 0) | (73.6, +5.9); concourse +6.2 | 21.0 m | 5.9 m | 15.4 deg (front 9 m, drawn as a telescopic/retractable unit) then 16.1 deg | ~24 | front ~9 m is retractable seating (Kotobuki "移動観覧席"), consistent with the drawing |
| Middle stand (ミドルスタンド, LEVEL 5) | (71.3, +9.7) | (86.2, +16.9); concourse +17.1 | 14.9 m | 7.2 m | 25.8 deg | ~18 | front overhangs lower-stand rear by ~2.3 m; front-centre has the red balcony seats (3 rows, 235 seats) |
| Upper stand (アッパースタンド, LEVEL 7) | (86.4, +22.1) | (109.7, +35.5) | 23.4 m | 13.4 m | 29.8 deg | ~27–28 | front edge is directly above the middle-stand rear; front fascia carries the 62.5 m x 1 m ribbon LED |

Row tread measured ~0.83–0.86 m (ESTIMATED). Stand rows are staggered seat-by-seat (千鳥配置) so heads do not block views (CONFIRMED S17).

Distances: furthest seat (upper stand top row, axis) is u ≈ 109.7 m from the stage rear wall at z ≈ +35.5 m. From a stage front edge at u ≈ 15 m, z = 1.8 m: horizontal ≈ 95 m, line of sight ≈ 100 m (ESTIMATED). No official "max distance to furthest seat" figure was found.

### 5.3 Roof profile

| Item | Value | Confidence |
|---|---|---|
| Roof type | Single large mono-pitch plane, **high at the rear (audience back), low at the stage end**, carried by deep steel trusses spanning stage-end → rear; not curved, not domed | ESTIMATED (section, elevations, photos) |
| Top-of-roof at stage end | +35.0 m (starts ~13.4 m inboard of the stage-end outer wall, above a +31.0 m lower block) | ESTIMATED |
| Ridge | +44.9 m (≈ official 45 m), located above the rear column line; follows the three rear facets | ESTIMATED / CONFIRMED height |
| Slope | ~4.8 deg (9.8 m over ~118 m) | ESTIMATED |
| Outer side of ridge | Short steep slope (~55 deg, ~3.5 m horizontal) down to a gutter, then the eave edge at ~+40.0 m | ESTIMATED |
| Eave ("大庇") | Projects 9,000 mm beyond the columns (CONFIRMED S11); soffit is a concave curve rising from ~+33.9 m at the column line to ~+40 m at the tip (ESTIMATED); wraps the rear facade and both chamfers; ends as pointed "prows" at the two flank corners | mixed |
| Flank fascia | Along the S and NE flanks the roof edge is a tapering inclined fascia: ~4.5 m tall at the rear corner (44.5 → 40 m) narrowing to ~1.5–2 m at the stage end (≈35 → 33 m); wall parapet below it descends from ~+33 to +31 m | ESTIMATED from S2 south elevation |
| Main truss (axis section) | Warren truss, ~14–15 panels; top chord straight (35.0 → 44.9 m); bottom chord horizontal at +29.5 m for the first ~36 m from the stage wall then rising to +38.5 m at the rear; depth 5.5 m (stage end), ~9.0 m (max, at the kink ~36 m from stage wall), ~6.4 m (rear) | ESTIMATED |
| Clear height floor → truss bottom chord | 29.5 m over the stage / front arena; hung catwalks / lifting grids drop ~3 m below | ESTIMATED |
| Span | ">110 m" (Kajima, S7); "120 m 大スパン" (Ken Corp, S6); measured 110 m clear (stage rear wall → last row), ~117 m between truss supports | CONFIRMED / ESTIMATED |
| Number of trusses | 18 truss lines (S7) ; BIM image shows them running stage-end → rear with cross trusses | CONFIRMED (count) |
| Roof steel weight | ~3,400 t | CONFIRMED S7 |
| Rigging | 480 points, total 120 t incl. house equipment; 8 lifting grids (昇降グリッド) that lower to floor; mesh "sunoko" walking surface at ceiling; sound-absorbing panels inside the truss depth | CONFIRMED S10, S18 |

---

## 6. Structure

| Item | Value | Confidence | Source |
|---|---|---|---|
| System | Steel frame (S) with partial RC and SRC; 2019 description: stands RC + SRC, roof steel | CONFIRMED | S1, S10, S14 |
| Rear columns | 1,200 mm square SRC columns, 30 m tall, carrying the 9,000 mm eave | CONFIRMED | S11 |
| Column count on rear colonnade | 24 (10 across the central rear facet incl. corners at ~8.0–8.8 m pitch, 7 more on each chamfer) | ESTIMATED (counted in S16 photo; grid ~8 m from S2) |
| Bowl | Column-free; upper and middle stands are raked frames cantilevering forward (middle front overhang ~2.3 m, upper front aligned over middle rear) | ESTIMATED |
| Roof | 18 long-span steel trusses, >110 m, 3,400 t, erected Aug 2021 → mid 2022 with construction-stage analysis and BIM; the roof took about one year of the three-year programme | CONFIRMED | S7, S6 |
| Foundations | Piles + pile caps (visible in section); piling and excavated-soil handling took the first ~year | REPORTED | S6, S3 |
| Seismic system (arena) | Not published. Assume conventional seismic-resistant frame (no base isolation visible in section) | ESTIMATED (gap) |
| Seismic system (K Tower) | Oil-damper seismic control (制震構造) | REPORTED | S2 |
| Sound insulation | "Double" enclosure for sound insulation is mentioned in the Kajima feature (via page summary) | REPORTED (weak) | S7 |
| Loading | Multiple large doors for 11 t trucks; one-way route; trucks drive onto the arena floor without floor protection | CONFIRMED | S10, S18 |

---

## 7. Facade, roof finishes, signage, lighting

No source naming cladding products or manufacturers was found (Shinkenchiku finish schedule is paywalled). The description below is from official photos (S12 k1.jpg, S16 musicterrace1.jpg) and the elevations (S2) — all ESTIMATED unless tagged.

### 7.1 Rear (NW) facade and chamfers — the "front" of the building

- **Composition, bottom to top:** plaza deck at +6.2 m → fully glazed foyer band (3F) → white wall with dark horizontal slot windows / recessed terrace bands (5F bar, 7F Arena Bar) → inclined white soffit of the upper stand → giant curved white eave → grey metal roof.
- **Colonnade:** 24 square columns (1.2 m), pale warm-white / light-grey stone-or-precast look, free-standing in front of the wall, ~8 m pitch, rising ~28 m from the deck to the eave soffit (30 m total, CONFIRMED). The design reference is clearly a classical / temple-like portico under a deep eave.
- **Central curtain wall:** dark glass with fine vertical mullions (~1.1 m module) and 3 horizontal spandrel lines (4 tiers), ~45 m wide (≈5.5 column bays) x ~18 m tall (≈ +6 m to +24.5 m), centred on the axis; main entrance doors at deck level below it. Inside is the main foyer with the red grand stair and "K-ARENA" wall art (Oricon, REPORTED).
- **Eave soffit:** smooth white panels (metal-panel look) with radial joints at roughly column spacing, concave in section; thin white edge.
- **Roof:** mid-grey standing-seam metal roofing (visible on the short outer slope above the eave and on the main plane).
- **Logo:** white channel letters "K-Arena" (serif logotype) on a frame standing on the roof slope above the eave, on the building axis; ~18 m wide x ~3.3 m tall (scaled from column pitch in S16). The 2020 render showed "K-ARENA" in capitals on the fascia instead.
- **Colours for texturing (eyeballed from sunlit photos):** walls/soffit white ~#EEEEEA; columns ~#D9D6CF; roof grey ~#9A9DA0; glazing dark blue-grey ~#2E3A46; brick-red accents (stair towers, podium piers) ~#8C4A3A.

### 7.2 Flank walls (south and NE) and stage end

- Flat white panel cladding on a regular grid: vertical joints every ~2.1–2.3 m, horizontal joints at floor levels (~+8.7, +11.8, +17.2, +23.4, +29.7 m). Panel type unknown (ALC / ECP / metal sandwich are all plausible) — gap.
- Three long horizontal dark slot elements on each flank elevation (louvre or window bands): one ~40 m long at ~+24 m and two ~12.5 m long at ~+19 m and ~+13.5 m.
- Base (1F–2F, ~9 m high) is a darker plinth with service openings. South elevation shows three large vehicle doors: two between grids AA6–AA5 (≈5.5 m and ≈8.3 m wide) and one ~10–16 m east of AA1 (≈6 m wide), each ~3.7–4 m high.
- A dark triangular area on each flank near the rear is the exposed inclined soffit of the upper stand where the chamfer facade is recessed.
- Stage-end (SE) wall: plain white panel wall ~31 m high, 46.8 m wide, with a vertical recess / stair slot near its south corner; perimeter service road and a low perimeter deck on the NE side.

### 7.3 Lighting

| Item | Value | Confidence | Source |
|---|---|---|---|
| Exterior light-up designer | Colour light-up of the arena's big eave (アリーナ棟大庇) and the hotel's "tree columns" (ホテル棟ツリー柱): Color Kinetics Japan, 森慎吾 | CONFIRMED | S15 |
| Behaviour | RGB colour-changing wash of the eave soffit and columns; foyer lighting can be set to the artist's colour; DMX control links stage and arena lighting | REPORTED | S20, S25 |
| Night image | 2020 render shows warm-white uplit columns and soffit, warm interior glow through the central curtain wall, white outline lighting on the tower crowns | CONFIRMED as design intent | S3 |
| Hotel lighting plan | Daiko Electric (諏訪誠, 河野佐知, 藤井幸恵) | CONFIRMED | S15 |
| VIP lounge lighting | TACT Tokyo (Daiko) 河野佐知・藤井幸恵; custom fixtures, indirect lighting, downlights, lighting control | CONFIRMED | S24 |
| Award | IEIJ Lighting Facility Award 2025 (照明施設賞) to Ken Corporation + Azusa Sekkei | REPORTED | S25 |

---

## 8. Plaza, decks and bridges

| Item | Value | Confidence | Source |
|---|---|---|---|
| Concept | Pedestrian deck (人工地盤) links all three buildings; music-event plaza and restaurants on the deck; parking and service roads below | CONFIRMED | S10, S14 |
| Deck level | Arena forecourt +6.2 m above arena 1FL (≈ TP+9.9); Kajima: decks at "6 m and 4.5 m" | ESTIMATED / REPORTED | S3, S7 |
| Plaza between arena and hotel | Trapezoid ~16 m wide at the south (hotel east face to arena 2F wall) widening northward to ~60 m; ~100 m long N–S; arena's rear colonnade and 9 m eave overhang its east side | ESTIMATED | S7 plan |
| Grand stair | "中央ペデストリアンデッキ棟": two parallel stair/ramp bands running NNE down from the plaza to the north-side road (visible in plan and photos as a wide stair with landings) | ESTIMATED | S2, S7, S12 |
| Entrance pavilion | "エントランス棟": 3-storey pavilion NW of the hotel on the deck; white pilasters, dark glass, dark hipped roof | ESTIMATED | S2, S3 render, S16 photo |
| West deck | "西ペデストリアンデッキ棟" + curved "跨線橋（道路施設）" at the west tip = Takashima Suisaisen Deck landing | CONFIRMED labels | S2 |
| Takashima Suisaisen Deck (高島水際線デッキ) | City-built footbridge linking the site with Minato Mirai Ohashi / Minato Mirai Odori toward Yokohama Station; length 130.4 m; effective width 6.0 m; 3-span continuous steel-deck box girder; max span 69.4 m; crosses the JR freight line; provisional opening 2025-03-27; permanent stairs/slopes later | CONFIRMED | S23 |
| East bridge | "62街区側ブリッジ（道路施設）" lands at the arena's north tip (link toward block 62) | CONFIRMED label | S2 |
| Outdoor elements | White folded tensile canopy on the low wing north of the arena, 500-inch outdoor vision, Arena tent (goods), BAYDECK beer restaurant (138 seats), wood deck facing the water | REPORTED | S6, S18 |
| TP levels on site plan | Spot levels around TP+3.7 (north side), +4.1 to +5.1 (hotel/office side); average ground ≈ TP+4.1 (derived: eave height TP+98.89 minus 94.77 m) | ESTIMATED (small text) | S2 |

---

## 9. Hilton Yokohama and K Tower Yokohama (context massing)

| Item | Hilton Yokohama | K Tower Yokohama | Confidence |
|---|---|---|---|
| Floors | 26F + B1 | 21F + B1 | CONFIRMED |
| Height | 99.87 m (statutory); 近代建築 quotes 99.2 m top / 94.77 m eave; rooftop equipment to TP+110.876 (~107 m above ground) | same envelope (twin towers of equal height) | CONFIRMED / REPORTED (S1, S2) |
| Tower plan | ~50 m (E–W) x ~24 m (N–S) slab on a wider podium; podium + tower bounding box 62.6 x 33.0 m (OSM), 64.8 m (Kajima) | 43.4 m (E–W) x 32.0 m (N–S) | ESTIMATED (tower width from elevations at 4.3 px/m) / CONFIRMED |
| Typical storey height | ~3.4 m (ESTIMATED: (94.8 − ~17 m podium)/23) | ~4.2–4.3 m (ESTIMATED; ceiling 2.8 m CONFIRMED) | ESTIMATED |
| Special floors | 3-storey podium with restaurants, banquet; design concept "YOKOHAMA Déco" (Art Deco motifs, harbour blue) | 2F main entrance hall ceiling 5.8 m; 3F column-free special floor ceiling 4.5 m | REPORTED |
| Facade | White vertical fins / pilasters with dark blue-grey glass, strong vertical stripes, white crown band, "Hilton" sign at the top of the north and south faces; podium: white frame, dark glass, brick-red piers, dark hipped roofs | Dark blue glass curtain wall with white vertical mullion fins at ~7.2 m grid, white corner frames and cornice; 2-storey base with brick-red piers | ESTIMATED from photos; grid 7,200 / 7,800 mm read from elevations |
| Structure | S with partial RC/SRC | S, oil dampers | CONFIRMED / REPORTED |
| Grid (elevation reading) | 7,800 mm bays | 7,200 mm bays (6,000 end bays) | ESTIMATED |

---

## 10. Interior facts relevant to the building model (cross-check with the interior researcher)

| Item | Value | Confidence | Source |
|---|---|---|---|
| Concept | "すべては『音楽』を楽しむために"; end-stage fan, every seat faces the stage | CONFIRMED | S10 |
| Base stage (常設) | ~22 m wide (12 ken) x ~13 m deep (7 ken) x 1.8 m high; optional runways ~14.5 m (8 ken) each side | CONFIRMED | S12, S18 |
| Stage zone width | 80 m | REPORTED | S7, S13 |
| LED | Ribbon vision ~62.5 m x 1 m on the upper-stand front; upper service vision ~3.5 x 2 m x 4 at the rear | CONFIRMED | S18, S19 |
| Speakers | L-Acoustics, ~200 units, radially arranged; mains 16 K1 + 4 K2 per side, 12 KS28 | CONFIRMED / REPORTED | S10, S20 |
| Seats | Kotobuki "Lux" fabric seats, deep "Yokohama sea" blue, 2 cup holders each; red fabric balcony seats (Cadenza TS-71, wood side panels) 3 rows / 235 seats at the middle-stand front centre; VIP boxes (11 rooms per Kotobuki; "5 per side" per Wikipedia) | CONFIRMED | S17 |
| Lounges | Lounge 5 ~400 seats (408); Arena Bar 7 ~120 seats; VIP lounge "40 m wide" | CONFIRMED / REPORTED | S4, S20 |
| Other | 11 concession stands, ~6,200 lockers | CONFIRMED | S18, S19 |

---

## 11. Drawings and images index (what exists, how it was scaled)

| Drawing | URL | Type | Scale used | Notes |
|---|---|---|---|---|
| Section through arena / hotel / office ("断面イメージ") | embedded image in https://www.kencorp.co.jp/news/20200820/20200820_k-arena.pdf | True orthographic section, 2020 | 5.77 px/m (ridge = 45 m) | Stage end at left; best source for tier stacking, truss, eave |
| Schematic section ("概要図") | embedded in https://www.mlit.go.jp/common/001273962.pdf | Coloured section, 2019 scheme, towers full height | 2.54 px/m (towers = 100 m) | Confirms arena ~46 m high, ~141 m long incl. eave; parking under the plaza |
| Perspective section render | https://cdn-xtech.nikkei.com/atcl/nxt/column/18/00585/080100198/k5.jpg ; https://www.atpress.ne.jp/releases/363680/img_363680_8.png | 3D cutaway (final design) | not to scale | Shows tier names, VIP box row between middle and upper stands, hung grids and speaker arrays |
| North elevation ("立面図（北側）") | https://skyskysky.net/photo2/202140/202012/03-1.jpg | Photo of notice-board drawing | vertical 4.16 px/m (+100 m line), horizontal ~4.33 px/m | Left = east. Photo of a board: +-4 % anisotropy |
| South elevation ("立面図（南側）") | https://skyskysky.net/photo2/202140/202012/04-1.jpg | same | vertical 4.12, horizontal 4.29 px/m | Left = west. Shows truck doors, slot bands, tapering roof fascia |
| Site plan / roof plan ("配置図") | https://skyskysky.net/photo2/202140/202012/05-1.jpg | same | ~3.86 px/m | Grid AA1–AA14, north arrow, labels of deck buildings and bridges |
| 2F layout plan with dimensions | https://www.kajima.co.jp/news/digest/oct_2021/feature/05/images/img_03.jpg | Vector graphic (600 px) | 1.38 px/m | Labelled 285.0 / 284.5 / 163.3 / 153.6 / 64.8 / 43.4 / 32.0 m; shows seating blocks |
| BIM of roof trusses | https://www.kajima.co.jp/news/digest/oct_2021/feature/05/images/img_09.jpg | 3D | — | 18 trusses, erection sequence |
| Aerials during construction | https://www.kajima.co.jp/news/digest/oct_2021/feature/05/images/img_04.jpg ; https://cdn-xtech.nikkei.com/atcl/nxt/column/18/00585/040800138/air.jpg | Photos | — | Bowl open: stands on NW, stage end SE; rear columns visible |
| Completion photos | https://cdn-xtech.nikkei.com/atcl/nxt/column/18/00585/080100198/k1.jpg ; https://www.pref.kanagawa.jp/osirase/0721/kanagawa-architecture-concours/gallery/66/images/general/musicterrace/musicterrace1.jpg | Photos | column pitch ~8 m as ruler | Facade composition, column count, logo size |
| Location / access map | embedded in S3 PDF; https://livedoor.blogimg.jp/bluestylecom/imgs/4/8/4840c318.jpg | Diagram | — | Pedestrian and vehicle routes (vehicles from Tochinoki-dori on the east/south) |

Elevation label readings (small text, treat as approximate): 建物最高高さ ▽TP+110.876; 平均地盤面+100 m and +31 m reference lines; 軒高 ▽TP+98.89; オフィス棟 1FL = TP+4.65; 設計GL = アリーナ棟 1FL = TP+3.65 (uncertain digit); road-setback envelope lines starting at 25 m with 1:1.5 slope.

---

## 12. Design-concept statements that imply geometry

- Arena is an **end-stage fan** ("エンドステージ型の扇形"); all seats face the stage; three-tier stands plus flat arena floor (Azusa, Ken Corp). → wedge plan, single focal stage at the narrow end.
- "Stage feels close from every seat" (Kajima) → steep stacked tiers (16 / 26 / 30 deg) with overlapping fronts instead of one long rake.
- Speakers arranged radially and sound-absorbing panels inside the ceiling truss (Azusa) → exposed black truss ceiling, no suspended architectural ceiling.
- Lifting grids workable at floor level, mesh walkway over the whole ceiling, 120 t rigging (Azusa) → dense grid of catwalks/trusses at ~+26 to +30 m.
- Deck over the whole block with plaza and restaurants so that "music liveliness spreads" (Azusa); terraces look down to the water and hide car traffic (Ken Corp) → raised forecourt at +6 m facing NW, cars and trucks at grade behind/under.
- Arena canopy projecting 9 m on 30 m columns (Shinkenchiku) → monumental portico toward the river and Yokohama Station; landmark for the Yokohama Station east-exit side.
- Hotel "YOKOHAMA Déco" Art Deco reinterpretation; brick-red and white podium language shared across the three buildings.

---

## 13. Ready-to-use parameter block (ESTIMATED unless marked; metres)

```
site:
  area_m2: 31793.97            # CONFIRMED
  overall_EW: 284.5            # CONFIRMED (Kajima)
  overall_NS: 163.3            # CONFIRMED (Kajima)
  south_boundary_azimuth_deg: 90 (+-2)
arena:
  origin_O_latlon: [35.46409, 139.63000]   # 2F W-wall x S-wall intersection, +-3 m
  hexagon_2F_wall_xy:          # x east, y north from O
    - [0, 0]        # SW (notch: wall steps to x=12.5 for y<10.9)
    - [112.5, 0]    # SE
    - [138.1, 39.1] # E vertex
    - [83.8, 137.0] # N tip
    - [43.2, 121.7] # NW vertex
    - [0, 55.1]     # W vertex
  stage_end_wall: SE->E, length 46.8
  rear_facade: NW->W, length 79.4, outward normal azimuth 302.5
  axis_unit_stage_to_rear_xy: [-0.839, 0.544]
  colonnade_offset_from_2F_wall: 6.3     # on rear facade + both chamfers
  eave_projection_beyond_columns: 9.0    # CONFIRMED
  columns: {count: 24, section: 1.2, height: 30, pitch: ~8.0}   # section/height CONFIRMED
  max_extent_EW_incl_eave: 153.6         # CONFIRMED
  height_ridge: 45.0                     # CONFIRMED (~45 m)
  roof: {z_stage_end: 35.0, z_ridge: 44.9, slope_deg: 4.8, eave_tip_z: 40.0,
         soffit_z_at_column: 33.9, stage_block_parapet_z: 31.0, high_roof_starts_inboard: 13.4}
  truss: {count: 18, span: ">110", bottom_chord_z_stage: 29.5, bottom_chord_z_rear: 38.5,
          depth_stage: 5.5, depth_max: 9.0, depth_rear: 6.4, steel_t: 3400}  # count/span/steel CONFIRMED
  levels_z: {L1: 0.0, L3_deck: 6.2, L4: 11.6, L5: 17.0, L6_VIP: 22.5, L7: 27.6, top_walk: 35.0}
  backstage_block: {depth: 18.7, floors_z: [6.1, 11.6, 16.8, 22.6, 29.5]}
  tiers_axis_u_z:              # u from stage rear wall
    floor:  {u: [0, 52.6], z: 0}
    lower:  {front: [52.6, 0.0],  back: [73.6, 5.9],   rake_deg: 16, rows: ~24}
    middle: {front: [71.3, 9.7],  back: [86.2, 16.9],  rake_deg: 26, rows: ~18}
    upper:  {front: [86.4, 22.1], back: [109.7, 35.5], rake_deg: 30, rows: ~27}
  fan: {total_angle_deg: ~65, apex_u: -60}
  base_stage: {w: 22, d: 13, h: 1.8}     # CONFIRMED
towers:
  hilton: {floors: 26, height: 99.87, tower_EW: ~50, tower_NS: ~24, podium_bbox: [62.6, 33.0]}
  k_tower: {floors: 21, height: 99.87, plan: [43.4, 32.0]}
deck:
  plaza_z: 6.2
  takashima_suisaisen_deck: {length: 130.4, width: 6.0, max_span: 69.4}  # CONFIRMED
```

---

## 14. Gaps and uncertainties

1. **As-built drawings**: no as-built plan/section with dimensions is public. All tier geometry comes from a 2020 press-release section (design stage). Row counts and exact levels should be reconciled with the official seat map (other researcher).
2. **Facade materials**: cladding type, panel module, manufacturer, exact colours and roofing product are unpublished online (Shinkenchiku 2023-10 data sheet and Shotenkenchiku 2024-01 would have them). Values in section 7 are photo-based estimates.
3. **Floor heights 2F / 8F / 9F**: not identifiable in the section; estimates only.
4. **Arena seismic system**, roof truss member sizes, truss plan layout (parallel vs fanned) — not published; Nikkei xTECH page 2 (paywalled) likely describes the truss.
5. **Maximum stage-to-furthest-seat distance**: no official figure; ~95–110 m estimated.
6. **Exact plan vertices**: the three independent sources (Kajima vector plan, notice-board photos, OSM) agree only to about +-3 m; the notice-board photos have ~4 % perspective anisotropy. The N chamfer length is the least certain side (43 m at 2F wall vs 63 m at the roof in OSM).
7. **Arena-only building area** not published (estimate ~16,000 m2).
8. **TP datum readings** (1FL = TP+3.65?) are from very small text.
9. **Exterior lighting**: fixture types, colour temperatures and the IEIJ award citation could not be read (award page has a broken certificate).
10. **Hilton / K Tower**: storey heights, tower plan depth and facade modules are estimates; Kokken's own project data not found.
11. Yokohama City landscape-review (都市景観協議) documents for this block were not found in the public 景観審査部会 archive.
