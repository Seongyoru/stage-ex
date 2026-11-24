# K-Arena Yokohama (Kアリーナ横浜) — Official-site research report

Angle: exhaustive crawl of the official website `https://k-arena.com/` (Japanese + English versions), every floor-map / seat-map image and PDF read visually, plus the official press releases that the site's news items link to. Research date: 2026-11-23.

## 0. How to read this report

Confidence tags used on every fact:

| Tag | Meaning |
|---|---|
| **CONFIRMED** | Stated by the official site (k-arena.com), an official press release linked from it, or a government filing. |
| **REPORTED** | Credible secondary source (trade magazine, architecture journal, news). |
| **ESTIMATED** | Derived by me. The derivation is given (measured on an official drawing, counted in an official vector PDF, scaled from a known dimension). Treat as +-10-15 % unless a tighter figure is stated. |

Conventions:

- "House-left / house-right" = audience's left / right when facing the stage. On every official plan the **stage is at the top**, so house-left is the left side of the drawing.
- "Axis" = centre line of the hall, running from the Main Entrance (rear) to the stage.
- Official level naming is `LEVEL n`; the FAQ states that the number is the storey above ground (LEVEL1 = 1F ... LEVEL5 = 5F) and that **the Main Entrance floor is LEVEL3**.
- Three official graphics families were read: (a) floor maps `floor/img_floor_map_lv{1,3,4,5,7}.jpg` (1200 x 975 px, all on the same canvas), (b) seat maps `seat/img_seat-map_level{1,3,5,7}.png` + 12 zoom images + the vector PDF `assets/pdf/seat-map.pdf`, (c) the Music Terrace map `shopguide/terrace_map_sp.png`. All are **schematic** (not dimensioned). The vector PDF is the most precise: every seat row and its seat-number range could be parsed exactly.

## 1. Pages crawled

| Page | URL | What it gives |
|---|---|---|
| Top | https://k-arena.com/ (EN: https://k-arena.com/en/) | Concept copy (STRUCTURE / SOUND / SEAT), menu |
| Floor guide (フロアガイド) | https://k-arena.com/floor/ (`?l=1,3,5,7` selects a level; EN /en/floor/) | Level names, 5 floor maps, cross-section, "Details" (seats, floors, height), VIP note |
| Seat map (シートマップ) | https://k-arena.com/seat/ (EN /en/seat/) | 4 level seat maps, 12 zoom maps, 12 stage-view photos, kiosk names, seat-map PDF |
| Access (アクセス・駐車場) | https://k-arena.com/access/ | Address, walking times, parking limits, 2 access maps |
| Shop guide (ショップガイド) | https://k-arena.com/shopguide/ (`?tab=mt` = Music Terrace tab) | Kiosks, Lounge 5, Arena Bar 7, Music Terrace shops, precinct map with gates |
| FAQ (よくあるご質問) | https://k-arena.com/faq/ | Level definition, escalators, elevators, wheelchair route, lockers, balcony seats |
| News (ニュース) | https://k-arena.com/news/ (37 items, also via `/wp-json/wp/v2/news`) | Facility-related items listed in section 15 |
| Company (会社概要) | https://k-arena.com/company/ | Operator outline (no building outline) |
| K-Arena Club | https://k-arena.com/k-arena-club/ | Balcony-seat description, 11 kiosks |
| Ad / media contact | https://k-arena.com/ad-contact/ , https://k-arena.com/media-contact/ | Ad-menu PDF (Terrace Vision), location-photo PDF |
| Organizer site (主催者の方はこちら) | https://document.k-arena.com/ | **HTTP 401, password protected - not readable** |

The site has **no dedicated "施設概要" (facility outline) page**; the only outline numbers on k-arena.com are the three "Details" lines on the floor guide. The English pages are a translation of the Japanese ones and use the same images (no English-only drawings).

## 2. Official facility outline

| Item | Value | Conf. | Source |
|---|---|---|---|
| Name | Kアリーナ横浜 / K-Arena Yokohama | CONFIRMED | https://k-arena.com/ |
| Type | Music-only arena ("音楽のために造られた世界最大級の音楽アリーナ") | CONFIRMED | https://k-arena.com/ |
| Address | 〒220-8507 神奈川県横浜市西区みなとみらい6-2-14 (6-2-14 Minatomirai, Nishi-ku, Yokohama) | CONFIRMED | https://k-arena.com/access/ |
| District / block | Minato Mirai 21, blocks 60/61, precinct name ミュージックテラス (Music Terrace); project name Kアリーナプロジェクト | CONFIRMED | https://www.atpress.ne.jp/news/363680 (linked from https://k-arena.com/news/20230801-1/) |
| Seats (座席数) | **20,033** | CONFIRMED | https://k-arena.com/floor/ ("座席数：20,033席") |
| Floors (階数) | **9 above ground** (地上9階) | CONFIRMED | https://k-arena.com/floor/ |
| Height (高さ) | **about 45 m** (約45m) | CONFIRMED | https://k-arena.com/floor/ |
| Stand structure | Arena floor + **three-tier stand** (三層構造), all seats in a **fan shape (扇型)** facing the stage | CONFIRMED | https://www.atpress.ne.jp/news/363680 |
| Completion (竣工) | 2023-07-31 | CONFIRMED | https://k-arena.com/news/20230801-1/ |
| Opening (開業) | **2023-09-29** (opening act: ゆず) | CONFIRMED | https://k-arena.com/news/20230126-1/ , https://www.kencorp.co.jp/uploads/20230126_k-arena.pdf |
| Developer / owner (事業主体) | 株式会社ケン・コーポレーション (Ken Corporation Ltd.) | CONFIRMED | atpress 363680; REPORTED as 事業主体 in https://www.sogo-unicom.co.jp/leisure/mag/ararenasample.pdf |
| Operator (運営) | 株式会社Kアリーナマネジメント (K Arena Management, Ltd.), founded 2022-05-02, capital 20 M yen (Ken Corporation 50 % / KN Holdings 50 %), HQ at the arena address | CONFIRMED | https://k-arena.com/company/ |
| Total floor area, arena (延床面積) | **53,853 m2** | REPORTED | Leisure-industry magazine 2023.11, data credited to the operator: https://www.sogo-unicom.co.jp/leisure/mag/ararenasample.pdf (an earlier 2021 figure was "about 54,090 m2": https://www.watch.impress.co.jp/docs/news/1366863.html) |
| Site area, whole Music Terrace (敷地面積 / 事業区域) | **31,793.97 m2** (arena + Hilton + K-Tower share one site) | CONFIRMED | MLIT certified plan https://www.mlit.go.jp/common/001273962.pdf |
| Building area (建築面積), whole precinct | 27,695.58 m2 (plan stage 2019; coverage 87.11 %) | CONFIRMED (plan stage) | same MLIT document |
| Building area, arena only | not published. **ESTIMATE ~19,000-21,000 m2** (hexagonal footprint of section 4.3: ~141 m long x up to ~170-190 m wide, area factor ~0.75) | ESTIMATED | derivation in 4.3 |
| Structure (構造) | 鉄筋コンクリート造 + 鉄骨鉄筋コンクリート造, roof 鉄骨造 (RC + SRC, steel roof) | CONFIRMED (plan stage) | MLIT document (building 1-1, use: 観覧場(音楽アリーナ)) |
| Perimeter columns | 1,200 mm square SRC columns, **30 m high**, carrying a roof eave (庇) that projects **9,000 mm** | REPORTED | https://data.shinkenchiku.online/projects/articles/SK_2023_10_166-0 |
| Design / construction credits | 野沢誠 (総合クリエイター), 梓設計, 国建, 鹿島建設 (roles not itemised on the page read; 鹿島建設 is also named as a sponsor on the official illumination news) | REPORTED | Shinkenchiku 2023:10 data page above; https://k-arena.com/news/20251020-1/ |
| Seat maker | コトブキシーティング (Kotobuki Seating) | REPORTED | sogo-unicom PDF |
| VIP boxes | **11 rooms** (VIP BOX 全11室), plus VIP lounge and dedicated lobby | REPORTED (count) / CONFIRMED (existence) | sogo-unicom PDF; https://k-arena.com/floor/ |
| Kiosks (売店) | **11**, on LEVEL 1/3/5/7 | CONFIRMED | https://k-arena.com/shopguide/ |
| Coin lockers | max **6,240** inside + outside (press release at completion said 6,200) | CONFIRMED | https://k-arena.com/faq/ |
| Neighbours on the same site | Hilton Yokohama (B1 + 26F, about 100 m, 339 rooms, 34,815 m2, opened 2023-09-24); K-Tower Yokohama (B1 + 21F, about 100 m, 29,716 m2) | REPORTED | sogo-unicom PDF; Hilton date/rooms CONFIRMED in kencorp PDF |

Capacity by level is **not published** anywhere on the official site. Counted from the official seat-map PDF (section 8.1): L1 3,964 / L3 4,978 / L5 4,372 / L7 6,579 (ESTIMATED, sum 19,893).

## 3. Official concept statements (every number given)

| Theme | Official statement | Conf. | Source |
|---|---|---|---|
| Concept | "すべては『音楽』を楽しむために" - an arena specialised for music | CONFIRMED | atpress 363680 |
| STRUCTURE "全席が『音の正面』" | Every seat is placed in a **fan (扇形) facing the front of the stage**, so the performance reaches every seat head-on | CONFIRMED | https://k-arena.com/ |
| SOUND "全身を『鼓膜』に" | High-class loudspeakers deliver good, powerful sound to all seats. Maker **L-Acoustics**; mains **K1 / K2**; out-fill speakers and upper-stand follow (delay) speakers permanently installed | CONFIRMED | https://k-arena.com/ ; atpress 363680 |
| SEAT "全幅の『心地良さ』" | **All seats are fabric seats** (ファブリックシート); **2 cup holders per seat** (some seats excepted) | CONFIRMED | https://k-arena.com/ ; atpress 363680 |
| Balcony seats (バルコニー席) | LEVEL 5 front block, **rows 1-3**; custom-made: taller backrest, thicker cushion, wider, larger front-back spacing than standard seats | CONFIRMED | https://k-arena.com/news/20260831-1/ ; https://k-arena.com/faq/ |
| Permanent base stage (基礎ステージ) | Proscenium width **12 ken (about 22 m)** x depth **7 ken (about 13 m)** x height **1.8 m**; a **hanamichi 8 ken (about 14.5 m) long can be added on each wing** | CONFIRMED | atpress 363680 |
| Rigging | **8 lifting grids (昇降グリッド)** above the stage; **480 rigging points**; total rigging load **120 t** (including house equipment) | CONFIRMED | atpress 363680 |
| Video | Upper service visions **about 3.5 m wide x about 2 m high, 4 screens** (for the rear audience); **ribbon vision about 62.5 m x about 1 m** on the front edge of the upper stand; high-definition main LED screens (size not stated) | CONFIRMED | atpress 363680 |
| Load-in | One-way truck route; large trucks drive **directly onto the arena floor without floor protection** | CONFIRMED | atpress 363680 |
| Food and drink | Lounge 5 about **400 seats**; Arena Bar 7 **120 seats**; 11 cashless kiosks | CONFIRMED | https://k-arena.com/shopguide/ |
| Environment | Aims at effectively 100 % renewable electricity for shows; rainwater reuse | CONFIRMED | atpress 363680 |
| Popularity | About 7.2 million cumulative visitors by 2026-09-29; Pollstar no.1 arena worldwide by tickets sold | CONFIRMED | https://k-arena.com/news/20260929-1/ |

Not stated officially: maximum viewing distance, seat width / row pitch, arena floor dimensions, ceiling (grid) height, main LED size. Best estimates are in sections 8.6, 9 and 16.

## 4. Orientation and plan shape

### 4.1 Plan shape (all official plans agree)

- The seating bowl is a **three-part fan: a centre block plus two wing blocks, each wing rotated 33.6 deg toward the stage**. The 33.6 deg angle is exact in the vector PDF (text matrix of every wing row is rotated +-33.6 deg) and is reproduced by the floor maps (33.6-33.9 deg measured) and by the Music Terrace map. **ESTIMATED from official drawings; three independent drawings agree.**
- The building footprint is a **hexagon**: short stage-end wall at the top, two long side walls diverging from it, two rear diagonal faces, and a rear centre face carrying a **projecting rectangular glass box** (Main Entrance at L3, Lounge 5 at L5, Arena Bar 7 at L7). The corners where a side wall meets a rear diagonal are right angles (measured 90-95 deg), i.e. each wing is a rectangle.
- The plan **grows with height**: outline width on the common floor-map canvas is 707 px at L1, 897 px at L3, 915 px at L5 and 997 px at L7 (ratio 1.00 : 1.27 : 1.29 : 1.41). The rear wall therefore leans outward following the upper stand (also visible in the official cross-section and in exterior photos). ESTIMATED.

### 4.2 Compass orientation (ESTIMATED from the official precinct map and access map)

Both maps are north-up (precinct elevators are labelled N / E / S / W and the gates North / East / South / West; station positions on the access map match reality).

| Element | Outward normal (azimuth, 0 = north) | Note |
|---|---|---|
| Main Entrance face (rear centre, glass box) | about **300 deg (WNW-NW)**, +-15 | faces the waterfront / Yokohama Station side; Arena Bar 7 and Lounge 5 look this way |
| North Entrance face (house-left rear diagonal) | about 338 deg (NNW) | |
| South Entrance face (house-right rear diagonal) | about 270 deg (W) | faces Music Terrace Square / Hilton |
| Stage-end wall | about 121 deg (ESE-SE) | |
| Hall axis rear -> stage | about **122 deg (toward ESE-SE)** | audience looks south-east |
| House-left side wall | runs along azimuth about 160 deg | north-east side of the building |
| House-right side wall | runs along azimuth about 90 deg | south side of the building (Arena Street) |

So: **house-left = north / north-east side, house-right = south side**, consistent with the floor map putting "North Entrance" on the left rear diagonal and "South Entrance" and the Hilton bridge on the right.

### 4.3 Approximate footprint dimensions (ESTIMATED; use GIS data if available)

Scale taken from the official cross-section (section 9: 0.09 m per pixel, validated by the 1.8 m stage and the 30 m columns): rear column line to stage-end outer wall is about **141 m**. Applying that length to the Music Terrace map (Main Entrance face midpoint to stage-end wall midpoint = 425 px, about 0.33 m/px):

| Face | Map length | Estimate |
|---|---|---|
| Main Entrance face (rear centre) | 180 px | about 59 m |
| North / South Entrance faces (rear diagonals) | 210 / 212 px | about 70 m each |
| Side walls | 372 / 378 px | about 123-125 m each |
| Stage-end wall | 105 px | about 35 m |
| Widest point (between the two 90 deg corners) | 576 px | about 170-190 m |

These carry +-15 %.

## 5. Level-by-level content

Read from `floor/img_floor_map_lv{1,3,4,5,7}.jpg` (CONFIRMED as shown on the official maps; pixel positions in Appendix C).

| Level | Official name | Seating | Gates | Public facilities shown | Notes |
|---|---|---|---|---|---|
| **LEVEL 1** | ARENA (アリーナ) | Flat arena floor (standard layout 34 rows) + STAGE | **101, 102** (house-left rear diagonal wall), **103, 104** (house-right rear diagonal wall); 101/104 nearer the stage, 102/103 at the rear corners | Toilets on both sides between the gate pairs (each side: women 19, men 4, + accessible toilet); kiosks x2 (売店1A, 1B) on the outer side of the two diagonal corridors; coin-locker banks **1A-1G**; 4 stairs "LEVEL 1・3" at the rear | Ground level. L1 public concourse is a chevron-shaped corridor behind the arena's rear diagonals. A closed block sits directly behind the arena's rear wall (under the lower stand). |
| LEVEL 2 | (not public, not on the floor guide) | - | - | - | Stairs are labelled "LEVEL 1・3", i.e. no public L2. Parking P1 / back-of-house (ESTIMATED). |
| **LEVEL 3** | LOWER STAND (ロアースタンド) | Lower stand, 29 rows; **wheelchair seating (車イス席) platform at rear centre** | **301** (house-left diagonal), **302, 303** (rear straight, either side of the central stair), **304** (house-right diagonal) | **Main Entrance** (rear centre), **North Entrance** (left rear diagonal), **South Entrance** (right rear diagonal); central grand stair "LEVEL 1・3・4・5" + 2 flanking stairs; 6 stairs "LEVEL 3・5・7"; **2 escalators "LEVEL 3・5"** just inside the Main Entrance; kiosks x2 (売店3A, 3B) at the diagonal/rear corners; toilets on both diagonal concourses (each: women 18, men 6, + accessible/ostomate); nursing room (授乳室) at the far house-left end | **Main entrance floor = Arena Deck level.** Gates are behind the top row (row 29): the lower stand is entered from the top. |
| **LEVEL 4** | (no name) | none | none | Boomerang-shaped mezzanine concourse: toilets (each arm: women 25, men 4), smoking rooms x2 near the rear centre, coin lockers **4A, 4B**, central wide stair "LEVEL 3・4・5" + 2 stairs | Low mezzanine tucked under the middle-stand rake. |
| **LEVEL 5** | MIDDLE STAND (ミドルスタンド) | Middle stand: wings 26 rows; centre = **BALCONY SEATING rows 1-3** + rows 6-17 | **501-504** (house-left diagonal), **505-508** (rear straight), **509-512** (house-right diagonal) | **LOUNGE 5** (rear centre box); kiosks x4 (売店5A far-left end, 5B and 5C either side of Lounge 5, 5D far-right end); accessible toilets x2 only; 4 stairs "LEVEL 3・4・5"; 6 stairs "LEVEL 3・5・7"; 2 escalators "LEVEL 3・5" arriving either side of Lounge 5; **"Bridge (ブリッジ)" leaving the house-right (south) rear diagonal** toward the Hilton | Gates are in-stand vomitories. |
| LEVEL 6 | VIP K-Arena (not on the floor guide) | VIP boxes with box seats | - | VIP lounge, dedicated lobby | "ご契約者専用フロア" - contract holders only. Level number not printed on the site; the cross-section shows the glazed box band between the top of L5 and the front of L7, so L6 is the logical floor (ESTIMATED). |
| **LEVEL 7** | UPPER STAND (アッパースタンド) | Upper stand: centre 28 rows, wings rows 3-28 | **701-704** (house-left diagonal), **705-708** (rear straight), **709-712** (house-right diagonal) | **Arena Bar 7** (rear centre box); kiosks x3 (売店7A far-left, 7B rear centre facing Arena Bar 7, 7C far-right); toilets: big blocks in the two forward side corridors (each: women 19, men 6), women-only x8 on each diagonal concourse, men-only x4 twice on the rear straight; smoking rooms x2; coin lockers **7A, 7B**; 6 stairs "LEVEL 3・5・7" | Highest public level. |
| LEVEL 8-9 | (not public) | - | - | - | Building has 9 floors; top technical galleries / plant (ESTIMATED). |

Notes printed under every map (CONFIRMED): toilet gender allocation may change per show; an elevator serving all floors is available for guests with reduced mobility (arranged through each show's organizer).

## 6. Vertical circulation

| Element | Count / position | Conf. | Source |
|---|---|---|---|
| Escalators L3 <-> L5 | 2, on both sides immediately inside the Main Entrance; they land on L5 either side of Lounge 5 | CONFIRMED | https://k-arena.com/faq/ ; L3 and L5 floor maps |
| Central grand stair | L3 foyer, between gates 302 and 303, labelled "LEVEL 1・3・4・5"; red steps with a white/black "K-Arena" mural on the red back wall | CONFIRMED | L3 floor map; `img_facility_details.jpg` |
| Stairs "LEVEL 1・3" | 4 at the rear of the L1 concourse (two pairs, each pair flanking a locker bank) | CONFIRMED | L1 floor map |
| Stairs "LEVEL 3・4・5" | 2-4 around the rear centre (L4 map shows 2 + the wide central stair; L5 map shows 4) | CONFIRMED | L4 / L5 floor maps |
| Stairs "LEVEL 3・5・7" | 6: one at the far end of each wing, one on each diagonal concourse, one each side of the rear centre box | CONFIRMED | L3 / L5 / L7 floor maps |
| Elevators | Reach all floors; not drawn on the public maps; use is arranged via the organizer | CONFIRMED | https://k-arena.com/faq/ |
| Bridge | L5, south (house-right) rear diagonal, toward Hilton Yokohama | CONFIRMED (drawn) / ESTIMATED (destination) | L5 floor map; exterior photo shows a skybridge to the hotel |
| Wheelchair route into the precinct | South Gate (elevator + slope) | CONFIRMED | https://k-arena.com/faq/ |

## 7. Entrances and gates

### 7.1 Building entrances (all on LEVEL 3 = Arena Deck level)

| Entrance | Position on plan | Faces (ESTIMATED azimuth) | Precinct context |
|---|---|---|---|
| **Main Entrance (メインエントランス)** | Rear centre, at the bottom of the projecting glass box | about 300 deg (WNW-NW) | Opens onto the **Arena Deck (アリーナデッキ)**, reached from Music Terrace Square by the **Big Steps (ビッグステップス)**; precinct map labels it "Arena Entrance アリーナ入口" |
| **North Entrance (ノースエントランス)** | House-left rear diagonal face | about 338 deg (NNW) | Next to the **Arena Tent (アリーナテント, merchandise)** on the north deck |
| **South Entrance (サウスエントランス)** | House-right rear diagonal face | about 270 deg (W) | Faces Music Terrace Plaza / BAYDECK; outdoor toilets and a smoking room are on Arena Street beside it |

### 7.2 Precinct gates (Music Terrace, deck level)

| Gate | Position | Equipment | Note |
|---|---|---|---|
| **North Gate (ノースゲート)** | North-west waterfront side, between the Hilton and the arena, beside "Arena Front (アリーナフロント)" | Stairs, slope, elevator "N"; **toilets at 1F under the stairs: women 10, men 4** (open before doors) | After a show, P1 parking users go down these stairs |
| **East Gate (イーストゲート)** | North-east corner | Stairs, elevator "E" | Marked "※将来開通予定" (to open in the future) |
| **South Gate (サウスゲート)** | South edge, between K-Tower and the BAYDECK block | Stairs, slope, elevator "S" | Official wheelchair route |
| **West Gate (ウエストゲート)** | Far west, beside K-Tower; a pedestrian bridge arrives here | Stairs, elevator "W" | The official entry/exit notice routes Yokohama Station pedestrians over the **高島水際線デッキ (Takashima Suigiwasen Deck)**, which lands at this side (ESTIMATED from the two official maps) |

Source: https://k-arena.com/wp-content/themes/k-arena/assets/images/shopguide/terrace_map_sp.png ; https://k-arena.com/news/20260204-1/ (map https://k-arena.com/wp-content/uploads/2026/02/260325_newsmap.jpg).

Walking times (CONFIRMED, https://k-arena.com/access/): Yokohama Station east exit 9 min; Shin-Takashima Station exit 4 (Rinko Park exit) 5 min; Minatomirai Station exit 2 (Icho-dori exit) 12 min. Exit control after shows: stairs other than the exit route are closed; Minatomirai Station users are sent along グランモール軸.

### 7.3 Hall gates (doors into the bowl)

| Level | Gates | Type | Position |
|---|---|---|---|
| L1 | 101, 102, 103, 104 | Doors in the arena's rear diagonal walls | 101 / 104: upper (stage-side) end of the left / right diagonal, level with rows 19-21; 102 / 103: rear corners just behind row 34 |
| L3 | 301, 302, 303, 304 | Doors from the rear concourse, **behind the top row (29)** | 301 behind the house-left wing, 302 / 303 behind the centre block either side of the wheelchair platform, 304 behind the house-right wing |
| L5 | 501-512 | **In-stand vomitories cut into rows 11-16 (centre) / rows 11-17 (wings)** (centre: 505-508 between the four inner aisles; 504 / 509 at the two wing-centre corners; wings: 3 each) | One vomitory per aisle, spacing = one 20-seat block; the level maps label rows 11-17 beside each gate |
| L7 | 701-712 | **In-stand vomitories cut into rows 6-10** (same pattern as L5) | Rows 1-5 are below the gates, rows 11-28 above |

The red foyer columns carry stencil signage such as "LEVEL 3 LOWER STAND <- 301-302 / 303-304 ->" and "LEVEL 1 ARENA, GATE 302 ... 303-304 ->" (official foyer photo).

## 8. Seat map

Sources: https://k-arena.com/seat/ ; `seat/img_seat-map_level{1,3,5,7}.png`; `seat/zoom/img_seat-map_level{1,3,5,7}_zoom{1,2,3}.png`; `seat/img_seat_level_all.png`; **https://k-arena.com/wp-content/themes/k-arena/assets/pdf/seat-map.pdf** (vector, title "240808_seatmap", 500 x 420 mm, dated 2024-08-08). The official note says the arena (L1) layout and the stage shape change per show; the map is the standard seated layout.

### 8.1 Tiers and seat counts

Seat counts are **an exact count of the seat-number ranges printed on every row of the official vector PDF** (about 1,250 row segments parsed; about 25 labels whose digits were split across text objects were re-joined by hand from the adjacent glyphs). They are ESTIMATED in the sense that the official site publishes only the 20,033 total.

| Level | Tier | Rows | Seat numbers | Left wing | Centre | Right wing | **Total** | Share |
|---|---|---|---|---:|---:|---:|---:|---:|
| LEVEL 1 | Arena (standard layout) | 1-34 | 1-140 | - | 3,964 | - | **3,964** | 19.9 % |
| LEVEL 3 | Lower stand | 1-29 | 1-216 | 1,500 | 1,978 | 1,500 | **4,978** | 25.0 % |
| LEVEL 5 | Middle stand | wings 1-26; centre 1-3 + 6-17 | 1-240 | 1,581 | 1,210 (of which **balcony 235**) | 1,581 | **4,372** | 22.0 % |
| LEVEL 7 | Upper stand | centre 1-28; wings 3-28 | 1-284 | 1,801 | 2,977 | 1,801 | **6,579** | 33.1 % |
| | | | | | | | **19,893** | |

Official total 20,033. The 140-seat difference is not explained on the site; candidates are the VIP box seats (11 boxes, REPORTED), wheelchair positions and layout revisions (ESTIMATED).

### 8.2 Numbering conventions (CONFIRMED on the official maps)

- **Ticket notation**: tickets print "LEVEL n" (CONFIRMED, FAQ); a seat is then identified by row number and seat number as drawn on the map (the 列 / 番 wording is ESTIMATED). Gates are printed as GATE 101 etc.
- **Rows** are numbered from the stage side: row 1 is nearest the stage on every level.
- **Seat numbers run continuously across the whole level from house-left to house-right**, through the left wing, centre and right wing (they do not restart per block). There are no block letters; a block is identified by its seat-number range.
- Standard block width is **20 seats**; aisles fall between ...20|21, 40|41 ... on L1 and at the boundaries listed below on the stands.
- Row numbers skip where there is no seating: L5 centre has no rows 4-5 (cross-aisle behind the balcony); L7 wings start at row 3.

### 8.3 Block structure per level

**LEVEL 1 (arena, standard layout)** - 7 blocks x 20 seats, 6 longitudinal aisles, one cross-aisle between rows 17 and 18.

| Block | Seats | Rows 1-17 | Rows 18-34 |
|---|---|---|---|
| 1 (far house-left) | 1-20 | tapered at the front corner: rows 1-2 = 13-20, 3-4 = 11-20, 5 = 9-20, 6-7 = 7-20, 8 = 5-20, 9-10 = 3-20, rows 11-17 full | tapered at the rear: row 18 = 2-20 ... row 25 = 19-20, then ends |
| 2 | 21-40 | full | full to row 27, tapering rows 28-34 (23-40 ... 38-40) |
| 3, 4, 5 | 41-60, 61-80, 81-100 | full | full (34 rows) |
| 6 | 101-120 | full | mirror of block 2 |
| 7 (far house-right) | 121-140 | mirror of block 1 | mirror of block 1 |

The arena floor outline is therefore an **elongated octagon**: front corners chamfered at about 60 deg, short straight sides, rear diagonals at 33.6 deg (they are the fronts of the lower-stand wings), short rear wall. The official photo shows the real chairs set out as a fan (blocks angled toward stage centre), not parallel as drawn.

**LEVEL 3 (lower stand)** - cross-aisle between rows 11 and 12 everywhere.

| Section | Rows 1-11 (front part) | Rows 12-29 (rear part) |
|---|---|---|
| House-left wing (seats 1-63) | 9-28, 29-48 | 1-8 (outer block, 8 seats), 9-28, 29-48, wedge 49-56 growing to 49-63 |
| Centre (seats 64-153) | 79-98, 99-107 + 108-116 (centre block split by a thin centre aisle, 18 seats), 119-138 | wedge 71-78 growing to 64-78, 79-98, 99-118, 119-138, wedge 139-146 growing to 139-153; **rows 26-29 are interrupted by the wheelchair platform** (seats 90-127 removed in rows 26-27, 89-128 in row 28) |
| House-right wing (seats 154-216) | 169-188, 189-208 | wedge 161-168 growing to 154-168, 169-188, 189-208, 209-216 |

Row 29 is partly removed where the aisle stairs meet the rear concourse (e.g. left wing row 29 = 1-8 / 14-24 / 29-36 / 41-48 / 53-62).

**LEVEL 5 (middle stand)**

| Section | Blocks |
|---|---|
| House-left wing (seats 1-68), rows 1-26 | 1-8, 9-28, 29-48, wedge 49-60 (row 1) growing to 49-68 (rows 18-26). Gates 501 / 502 / 503 cut rows 11-17 at the three aisles |
| Centre **balcony** rows 1-3 | 72-82 (71-82 in rows 2-3), 91-108, 111-129, 131-148, 155-165 (155-166 in rows 2-3): 77 + 79 + 79 = **235 seats**, wider pitch (about 17 % fewer seats per metre than the standard rows behind) |
| Centre standard rows 6-17 | 72-86 growing to 69-86, 91-110, 111-130, 131-150, 155-169 growing to 155-172; gates 505-508 cut rows 11-16; row 17 adds 87-90 and 151-154 |
| House-right wing (seats 173-240), rows 1-26 | mirror: wedge 181-192 growing to 173-192, 193-212, 213-232, 233-240; gates 510 / 511 / 512 |

**LEVEL 7 (upper stand)**

| Section | Blocks |
|---|---|
| House-left wing (seats 1-80), rows 3-28 | 1-8, 9-28, 29-48, 49-68, wedge 69-70 (rows 3-4) and 69-72 growing to 69-80 (rows 12-28); gates 701 / 702 / 703 cut rows 6-10 |
| Centre (seats 81-204), rows 1-28 | wedge 91-92 (rows 1-4) and 89-92 growing to 81-92 (rows 12-28), 93-112, 113-132, 133-152, 153-172, 173-192, wedge 193-194 / 193-196 growing to 193-204; gates 705-708 cut rows 6-10; 704 / 709 at the corners |
| House-right wing (seats 205-284), rows 3-28 | mirror: wedge 215-216 / 213-216 growing to 205-216, 217-236, 237-256, 257-276, 277-284 (alternately 277-282 / 283 in the rear rows); gates 710 / 711 / 712 |

Full row-by-row seat ranges for every level are in **Appendix A**.

### 8.4 Special seating

| Item | Detail | Conf. |
|---|---|---|
| Wheelchair seating (車イス席 / ACCESSIBLE SEATING) | One platform at the **rear centre of LEVEL 3**, behind row 25, between gates 302 and 303. In the PDF it is a trapezoid 194 pt wide x 26 pt deep = about **23 m x 3.1 m** at the scale of 8.6, notched by the two aisle heads. The FAQ says actual wheelchair areas are set per show by the organizer | CONFIRMED position / ESTIMATED size |
| Balcony seats (バルコニー席) | L5 centre front, rows 1-3, 235 seats, vermilion upholstery, wood frame (section 14) | CONFIRMED / count ESTIMATED |
| VIP boxes | Glazed rooms with box seats in front, in a band between the top of the L5 centre stand and the front of the L7 stand; 11 rooms (REPORTED); contract holders only | CONFIRMED existence |
| Standing shows | Standing areas and arena layout are set per show; not drawn | CONFIRMED |

### 8.5 Stage-view photo positions (useful as ground truth for sight lines)

`https://k-arena.com/wp-content/themes/k-arena/assets/images/seat/stage/img_seat-map_stage_level{1,3,5,7}_0{1,2,3}.jpg` (12 photos; `_01` = house-left position, `_02` = centre, `_03` = house-right). Viewpoints marked on the zoom maps: L1 = on the cross-aisle (rows 17/18) at the first aisle from the left, at the centre, and at the first aisle from the right; L3 = on the cross-aisle (rows 11/12) of each wing and of the centre.

### 8.6 Geometry extracted from the vector seat-map PDF

Measured units are PDF points (pt). The drawing is internally consistent: **one seat = 4.062 pt on every level** (a 20-seat row bar is 81.23 pt) and the row pitch is constant.

**Suggested calibration (ESTIMATED): 1 pt = 0.1206 m.** Derivation: the official ribbon vision on the front edge of the upper stand is 62.5 m long; the front edge of the L7 centre section in the PDF is 518.3 pt. This gives a seat pitch of 0.49 m and a stand row pitch of 0.82 m, both realistic. Caveat: aisles are drawn about 15-18 pt wide (1.9-2.2 m at this scale) to make room for row-number circles; real aisles are probably about 1.2 m, so overall widths may be 5-8 % too large.

| Quantity | pt | Seat widths | Metres at 0.1206 m/pt |
|---|---:|---:|---:|
| Seat pitch (standard) | 4.062 | 1.00 | **0.49** |
| Balcony seat pitch (77 seats where the standard row has 90) | about 4.75 | 1.17 | **about 0.57** |
| Row pitch, all stands | 6.79 | 1.67 | **0.82** |
| Row pitch, L1 rows 1-17 / rows 18-34 | 7.54 / 6.8 | 1.86 / 1.67 | 0.91 / 0.82 |
| L1 cross-aisle, row 17 to row 18 centre-to-centre | 18 | | 2.2 (clear about 1.3) |
| L3 cross-aisle, row 11 to row 12 | 12 | | 1.45 |
| Balcony row pitch (rows 1-3) | 8-9 | | 1.0-1.1 |
| Gap balcony row 3 to row 6 | 15 | | 1.8 |
| L1 arena polygon: front edge / max width / rear wall | 569 / 697 / 335 | 140 / 172 / 82 | **68.6 / 84.0 / 40.3** |
| L1 arena polygon: depth (front edge to rear wall) | 275 | | **33.1** |
| L1: straight side walls / front chamfers / rear diagonals | 42 / 129 / 218 | | 5.1 / 15.6 (at 60.2 deg) / 26.2 (at 33.6 deg) |
| L1 seating rows 1-34, front to back | 247 | | 29.8 |
| L3 centre: front edge / depth of plate | 335 / 235 | | 40.4 / 28.4 (rows 1-29 = 23.5) |
| L3 wing: front edge (rows 1-11) / full back width (rows 12-29) | 217 / 334 | | 26.2 / 40.2 |
| L5 centre front edge (balcony front) | 476 | | **57.4** |
| L5 wing front edge | 272 | | 32.8 (26 rows = 20.4 deep) |
| L7 centre front edge (ribbon vision) | 518 | | **62.5** (calibration) |
| L7 wing front edge | 349 | | 42.1 (rows 3-28 = 20.5 deep) |
| L7 centre rows 1-28 depth | 183 | | 22.1 |
| Vomitory mouth (L5 / L7) | 6 seats + aisle wide, 5 rows deep | | about 4.2 m x 4.1 m |
| Gate spacing along a stand | 99.3 | | 12.0 |

**Fan focus (ESTIMATED):** the normal through the middle of each L3 wing front edge meets the hall axis about **21 m upstage of the arena front edge** (i.e. near the back of the stage zone). Wing seats therefore look at a point behind the stage centre, about 33.6 deg off the hall axis.

Polygon vertex lists are in Appendix B.

## 9. Cross-section: vertical dimensions (ESTIMATED)

Source: https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png (1800 x 582 px cutaway along the axis, rear at left, stage at right; labels LEVEL7 UPPER STAND, LEVEL5 MIDDLE STAND, BALCONY SEATING, LEVEL4, LEVEL3 LOWER STAND, LEVEL1 ARENA, ARENA DECK).

Scale: the ground line is at the same pixel row at both ends (orthographic). The base stage block is 20 px high = 1.8 m (official) so **1 px = 0.09 m**; the roof top at the rear is then 45.2 m (official: about 45 m), and deck-to-soffit is 30.6 m (REPORTED column height 30 m). Three independent checks agree, so the section can be trusted to about +-10 %.

| Element | Height above arena floor (m) | Note |
|---|---:|---|
| LEVEL 1 arena floor = ground | 0 | |
| LEVEL 2 slab | about +3.4 | not public |
| **LEVEL 3 slab = Arena Deck** | about **+6.7 to +7** | two storeys below the deck; an early render suggests up to +9 |
| Lower stand top row (29) | about +8 | about 1.2 m above the L3 slab; stand descends to the arena floor |
| LEVEL 4 mezzanine | about +10.1 | 3.4 m above L3, under the L5 rake |
| Middle stand front (balcony row 1) | about +13.4 to +14.4 | cantilevers over the rear of the lower stand |
| **LEVEL 5 concourse slab** | about **+18** | level of L5 rows 11-16 (vomitories) |
| Middle stand centre top row (17) | about +20 | |
| VIP box floor (L6) | about +20 to +24 | glazing band about 2.8 m high |
| Upper stand front row / ribbon vision | about +26 | |
| **LEVEL 7 concourse slab** | about **+29** | level of L7 rows 6-10 |
| Upper stand top row (28) | about +37.7 | |
| Column tops / soffit of the roof crown | about +37 | 30 m columns standing on the deck |
| Roof truss at the rear: bottom / top chord | about +39.5 / +45 | truss depth about 5.5 m, spans rear -> stage |
| Roof at the proscenium line: bottom / top chord | about +31 / +36.6 | roof slopes down toward the stage (about 4 deg) |
| Stage-end block parapet | about +37 | |
| Side technical galleries near the stage (5 tiers of railings) | about +8, +12, +17, +22, +26 | drape-backed galleries |

Apparent rakes in the drawing: middle and upper stands about 20-22 deg (the upper stand looks steeper in the photos; treat 25-30 deg as the plausible range for L7).

Lengths along the axis (0.09 m/px): roof crown overhang beyond the rear column line about **10 m** (REPORTED 9.0 m); rear column line to stage-end outer wall about **141 m**; **farthest seat (L7 top row) to stage front about 94 m** horizontally; stage zone (stage front to backstage wall) about 21 m; backstage block about 24 m deep.

Longitudinal stacking (ESTIMATED, distances from the stage front): arena floor 0-33 m; lower stand 34-62 m; middle stand front about 55 m (overhanging the last 5-7 m of the lower stand), top about 70 m; upper stand 70-94 m.

## 10. Stage and technical data (official)

All CONFIRMED from https://www.atpress.ne.jp/news/363680 unless tagged.

| Item | Value |
|---|---|
| Base stage | about 22 m wide x about 13 m deep x 1.8 m high, permanent |
| Optional hanamichi wings | about 14.5 m long on each side (total frontage up to about 51 m) |
| Lifting grids | 8 |
| Rigging points / total load | 480 / 120 t |
| Main PA | L-Acoustics K1 and K2 line arrays, flown; plus out-fills and upper-stand delay speakers. Official photos show, per side, an outer curved line array, a flown subwoofer column beside the screen and an inner main line array (ESTIMATED from photos) |
| Main LED screens | 2, flown left and right of the stage, 16:9; size not published. **ESTIMATE about 10 m x 5.6 m each** (roughly 45 % of the stage width in the official photo) |
| Upper service visions | about 3.5 m x 2 m, 4 screens |
| Ribbon vision | about 62.5 m x 1 m on the upper-stand front fascia |
| Cameras / control | Sony BRC-X1000 remote cameras, XVS-G1 switcher, 12G-SDI routing; VPL-FHZ91L projectors and BRAVIA displays in the lounges |
| Lighting | Follow spots and moving lights installed; house lighting truss lowerable on the lifting grids |
| Load-in | One-way route, trucks drive onto the arena floor |

## 11. Named facilities

| Facility | Level / position | Official data | Conf. | Source |
|---|---|---|---|---|
| **Lounge 5** | L5, rear centre glass box, directly above the Main Entrance foyer | About 400 seats; eat-and-drink space, no reservation; two adjacent kiosks (5B, 5C) sell hot snacks; signage "LOUNGE 5", gate 507 doors open onto it | CONFIRMED | https://k-arena.com/shopguide/ ; https://k-arena.com/faq/ |
| **Arena Bar 7** | L7, rear centre glass box, directly above Lounge 5; faces the WNW night skyline | 120 seats; open 18:00-23:00 (L.O. 22:00); non-smoking (smoking room on the same floor); open to non-ticket holders on non-show days and after shows; live project "Yokohama Corridor Music" held inside | CONFIRMED | https://k-arena.com/shopguide/ ; https://arenabar7.com/ ; https://k-arena.com/news/20260527-1/ |
| **Kiosks (売店)** | 1A, 1B (L1); 3A, 3B (L3); 5A, 5B, 5C, 5D (L5); 7A, 7B, 7C (L7) | 11 in total; cashless; 5A and 5D have a "free space" beside them; 7B is opposite Arena Bar 7; soft drinks 500 yen, alcohol 700 yen on the menu boards | CONFIRMED | https://k-arena.com/seat/ (kiosk pop-ups) ; shop guide |
| **VIP K-Arena** | Between L5 and L7 | Luxury hospitality floor, lounge + dedicated lobby + boxes; contract holders only | CONFIRMED | https://k-arena.com/floor/ |
| **Main foyer** | L3, inside the Main Entrance | Grand red stair, escalators both sides | CONFIRMED | L3 floor map, foyer photo |
| **K-Arena Shop** | Music Terrace, low building west of the Big Steps (map no. 3) | Official goods shop; cloakroom for suitcases (1,000 yen per item); 11:00-20:00 | CONFIRMED | shop guide |
| **Arena Tent** | Deck north of the North Entrance | Show merchandise sales | CONFIRMED | precinct map |
| **Ticket counter (チケット売場)** | Arena Street, north-east side of the arena | | CONFIRMED | precinct map |
| **BAYDECK - BEER & GRILL** | Centre of Music Terrace (map nos. 1, 2) | 138 seats, industrial "port" interior, terrace seats | CONFIRMED | shop guide |
| **Lido Stand COFFEE & JUICE** | K-Tower corner (map no. 4) | Coffee stand | CONFIRMED | shop guide |
| **Lawson** | Music Terrace 1F (ground floor) | 7:00-23:00 | CONFIRMED | shop guide |
| **Terrace Vision (テラスビジョン)** | On the low building facing Music Terrace Square | **500-inch** outdoor LED | CONFIRMED | https://k-arena.com/wp-content/themes/k-arena/assets/pdf/k-arena-ad-menu.pdf |
| **Poster boxes** | Around the precinct | 7 locations, 8 faces; black freestanding lightbox totems | CONFIRMED | same PDF |
| **Parking P1** | Ground floor under the deck | 7:00-23:00; vehicle limit L 5.0 m x W 2.3 m x H 2.8 m, 4.0 t; P2 is for hotel guests | CONFIRMED | https://k-arena.com/access/ |

## 12. Toilets, lockers, smoking, nursing (fixture counts printed on the official maps)

| Location | Women | Men | Other |
|---|---:|---:|---|
| L1, each side (x2) | 19 | 4 | accessible toilet each side |
| L3, each side (x2) | 18 | 6 | accessible / ostomate toilet each side; nursing room at far house-left |
| L4, each arm (x2) | 25 | 4 | smoking rooms x2 |
| L5 | - | - | accessible toilets x2 only |
| L7 forward side corridors, each (x2) | 19 | 6 | smoking rooms x2 |
| L7 diagonal concourses, each (x2) | 8 | - | |
| L7 rear straight (x2) | - | 4 | |
| Outside, North Gate 1F | 10 | 4 | open before doors |
| Outside, Arena Street by South Entrance | 4 | 2 | + smoking room; open before doors |
| K-Arena Shop block | | 1 | accessible toilets x2 |

Coin lockers (CONFIRMED, FAQ): up to 6,240 in total. Inside banks: 1A-1G (L1), 4A-4B (L4), 7A-7B (L7), small size only, 23 x 31 x 45 cm (W x H x D), 400 yen. Outside (Arena Street, three groups): small (same), medium 36 x 27 x 60 cm, large 36 x 56 x 60 cm. Change machines on every floor. No vending machines, no guest Wi-Fi, no childcare.

## 13. Music Terrace precinct (from the official precinct map)

Named places (CONFIRMED): Arena Deck, Arena Front, Arena Street (deck walkway along the north-east and south sides of the arena), Arena Tent, Big Steps, Bay Tent (ベイテント), Music Terrace Stage (ミュージックテラスステージ, roofed multi-purpose stage), Music Terrace Square, Music Terrace Plaza, Music Terrace Front, Tower Street, Hotel Entrance, Office Entrance, Hotel Porte Cochere (ground floor), P1 Parking (ground floor), Bicycle Parking (ground floor, north side, 7:00-23:00), "South Street" (named in a 2026 event notice).

Layout (ESTIMATED from the map, north-up): arena occupies the eastern half of the site; Hilton Yokohama is a slab rotated about 30 deg in the west-centre; K-Tower Yokohama is at the south-west corner; low two- to three-storey buildings with the shops sit between them. The Big Steps are a wide stair band running roughly north-south that takes the level change between Music Terrace Square (west, lower) and the Arena Deck (east, higher). A vehicle ramp "搬入車スロープ / Authorized vehicles only" is at the south-west corner.

## 14. Materials and colours seen in official photos (ESTIMATED colour values)

| Element | Description | Approx. colour |
|---|---|---|
| Roof crown (庇) | Smooth white panelled soffit flaring up and outward all round the rear and sides, radial joints; "K-Arena" sign on the crown above the Main Entrance; lit by colour-changing LEDs at night (pink, seasonal shows 18:00-22:00) | #f2f2f0 |
| Perimeter columns | Tall square off-white concrete-look columns from deck to soffit; about 16-22 visible along the main elevation | #dcdad4 |
| Wall behind columns | White horizontally ribbed metal cladding with dark slot windows; glazed band at deck level; dark canted plinth panels | #e8e8e6 / #2a2c30 |
| Main entrance box | Curtain wall, silver-grey mullions, clear glass, dark door band at deck level, about 4 glazed storeys above | glass #9fb4b8 |
| Deck paving | Light-grey pavers with darker diagonal bands; Big Steps in light-brown timber-look treads; red stair handrails; black slim lamp posts | #cfcfcb / #b08d68 |
| Precinct buildings | Red-brick columns and base courses with pale stone plinths; white fan-vault "mushroom" capitals with radiating LED lines (the logo motif) | #7a3b2e |
| Main foyer (L3) | Polished warm concrete floor; huge square columns clad in dark-grey stone-look panels with white stencil signage; red grand stair and red wall with "K-Arena" graffiti mural; red steel braces and mesh balustrades; exposed black soffit with silver-foil ducts; orange linear LED lines in a radiating pattern | floor #8a6a55 (lit), columns #4a4d52, red #c8161d, LED #ff8a1f |
| Hall ceiling | Matte black; exposed steel truss grid, catwalks, lifting grids, small downlights; black FOH bridge crossing the hall high up | #0c0c0e |
| Hall side and stage-end walls | Three stacked technical galleries with black railings, backed by **purple pleated drapes** washed by a pink-white LED cove at the top of each tier; a fourth drape band at arena level behind the stage; black fascia with a row of about 12 round jet diffusers per side | drape #6b2a6e, lit #c77bd0 |
| Arena floor | Bare light warm-grey concrete | #b9b3aa |
| Arena chairs | Black folding chairs with blue-grey speckled seat pads | #1b1b1d |
| Stand seats (L3, L5, L7) | Steel / denim-blue woven fabric pads on black plastic shells, black cup holders; tip-up | #3d5a8c |
| Balcony seats | Vermilion coarse-woven fabric, dark-brown wood back frame and armrests, black cup holder on each armrest, black pedestals | #e8431f, wood #4a2a1c |
| Stand structure | Exposed light-grey concrete parapets with steel handrails; grey steps with white nosing lines; black aisle rails. The front part of the lower stand (rows 1-11) sits on black box units with a vertical black front about 2.5-3 m high (looks like retractable or demountable tribunes) | #bdbab4 |
| Upper stand fascia | Black, with the white LED ribbon and a row of small round lights | |
| VIP box | Mustard curved sofa, black marble tables, navy carpet with gold art-deco lines, dark wood walls, full glass front to the hall | |
| VIP lounge | Red carpet with gold rays, burgundy leather tub chairs, gold zig-zag wall panels, black and white marble floor | |
| Lounge 5 | Polished concrete floor, long rust-brown tables on dark steel frames, cobalt-blue benches, dark-grey columns, red walls, exposed black ceiling, full-height glazing | |
| Arena Bar 7 | Long curved bar with gold / pearl mosaic front and uplights, black stone top, art-deco chandeliers, full-height glazing, dark ceiling with a curved light cove, gold-rimmed round tables | |
| Kiosk | Black counter, blue walls and blue LED, 4 menu monitors, 4 glass-door fridges, gold beer towers | #1f3fbf |
| Parking P1 | Bare concrete, columns with red or blue steel frames by zone, navy wall panels | |

## 15. URL catalogue

### 15.1 Floor maps, seat maps, sections (all official)

| URL | Shows |
|---|---|
| https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png | Cutaway cross-section with level labels |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/floor/img_floor_map_lv1.jpg (`_sp.jpg` = mobile version) | LEVEL 1 floor map: stage, arena, gates 101-104, toilets, lockers 1A-1G, kiosks, stairs |
| .../floor/img_floor_map_lv3.jpg | LEVEL 3: lower stand, 3 entrances, gates 301-304, escalators, stairs, toilets, nursing room |
| .../floor/img_floor_map_lv4.jpg | LEVEL 4 mezzanine: toilets, smoking rooms, lockers 4A-4B |
| .../floor/img_floor_map_lv5.jpg | LEVEL 5: middle stand, balcony, gates 501-512, Lounge 5, bridge, kiosks |
| .../floor/img_floor_map_lv7.jpg | LEVEL 7: upper stand, gates 701-712, Arena Bar 7, toilets, lockers 7A-7B |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/seat/img_seat-map_level1.png | LEVEL 1 seat map (rows 1-34) |
| .../seat/img_seat-map_level3.png , `_level5.png` , `_level7.png` | Seat maps of the three stands |
| .../seat/img_seat_level_all.png | All four levels on one sheet |
| .../seat/zoom/img_seat-map_level{1,3,5,7}_zoom{1,2,3}.png | 12 enlarged seat maps with seat-number ranges (1 = house-left, 2 = centre, 3 = house-right) |
| **https://k-arena.com/wp-content/themes/k-arena/assets/pdf/seat-map.pdf** | Vector seat map of all levels (the source of Appendix A / B) |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/shopguide/terrace_map_sp.png | Music Terrace precinct map with gates, entrances, lockers, outdoor toilets |
| https://k-arena.com/wp-content/uploads/2026/11/261101_k-arena_accessmap_ol（SP電車）.png | Access map for rail users |
| https://k-arena.com/wp-content/uploads/2026/11/261101_k-arena_accessmap_ol（SP車）.png | Access map for cars (route to the parking entrance) |
| https://k-arena.com/wp-content/uploads/2026/02/260325_newsmap.jpg | Entry / exit route map (Takashima Suigiwasen Deck, exit-control zone) |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/img_access_map-yokohama-station.png | Rail line diagram |

### 15.2 Official photo sets

| URL | Shows |
|---|---|
| .../assets/images/seat/stage/img_seat-map_stage_level{1,3,5,7}_0{1,2,3}.jpg | 12 stage views from the seats (2400 x 1600) |
| .../assets/images/seat/drink/img_seat-map_drink_level{L}-{k}_0{n}.jpg | Kiosk photos (e.g. `level1-1_01` ... `level7-3_03`; 3-4 per kiosk) |
| .../assets/images/img_facility_details.jpg | Main foyer (L3), wide |
| .../assets/images/img_facility_vip01.jpg , `img_facility_vip02.jpg` | VIP box interior, VIP lounge |
| .../assets/images/img_idx-facility_structure_sp.jpg , `_sound_sp.jpg` , `_seat_sp.jpg` | Top-page feature images: fan stands, line arrays, fabric seat |
| .../assets/images/hero_sp.png | Key visual (roof / fins illustration) |
| https://k-arena.com/wp-content/uploads/2023/08/アリーナ外観写真.jpg | Aerial exterior from the north-west (arena, Hilton, K-Tower) |
| https://k-arena.com/wp-content/uploads/2023/08/メインホワイエ.jpg | Main foyer stair, close |
| https://k-arena.com/wp-content/uploads/2022/12/arena-outlook.jpg | Dusk exterior render |
| https://k-arena.com/wp-content/uploads/2026/08/写真01-scaled.jpg , `写真02-scaled.jpg` | Balcony seats close-up; bowl overview from the upper stand |
| https://k-arena.com/wp-content/uploads/2023/09/img_shopguide_lounge5_main.jpg | Lounge 5 |
| https://k-arena.com/wp-content/uploads/2023/09/img_shopguide_arena-bar7_main-1.jpg , `_01` , `_03` , `_04` , `_05` , `_06` , `_09` .jpg | Arena Bar 7 |
| https://k-arena.com/wp-content/uploads/2026/04/売店メイン画像.jpg | Kiosk front |
| https://k-arena.com/wp-content/themes/k-arena/assets/pdf/k-arena-media-location.pdf | Location-photo PDF: bowl overview, foyer, VIP lounge, deck, Terrace Vision, pilotis, parking |
| https://k-arena.com/wp-content/themes/k-arena/assets/pdf/k-arena-ad-menu.pdf | Ad menu (Terrace Vision, poster boxes) |
| https://www.atpress.ne.jp/releases/363680/img_363680_{1..14}.jpg/png | Press-release images: exterior, foyer, hall interior x2, renders incl. section |
| https://arenabar7.com/wp-content/uploads/2024/03/img_idx_slide-{01..24}.jpg | Arena Bar 7 interior (24 photos) |

### 15.3 Facility-related news items

| Date | URL | Content |
|---|---|---|
| 2023-01-26 | https://k-arena.com/news/20230126-1/ | Opening date; press PDF with 20,033 seats / 9F / 45 m |
| 2023-08-01 | https://k-arena.com/news/20230801-1/ | Completion; stage and rigging data |
| 2023-09-27 | https://k-arena.com/news/20230927-1/ | Opening ceremony |
| 2025-10-20 | https://k-arena.com/news/20251020-1/ | Illumination and facade light-up |
| 2026-02-04 | https://k-arena.com/news/20260204-1/ | Entry / exit routes |
| 2026-08-31 | https://k-arena.com/news/20260831-1/ | Balcony seats |
| 2026-09-29 | https://k-arena.com/news/20260929-1/ | Third anniversary, visitor numbers |
| 2026-09-30 | https://k-arena.com/news/20260930-1/ | Pink light-up of the facade |

## 16. Gaps and best estimates

| Gap | What was tried | Best estimate for modelling |
|---|---|---|
| Organizer documents (technical drawings, floor loading, dressing rooms, truck route) | https://document.k-arena.com/ returns HTTP 401 | Use the press-release figures in section 10 |
| Official per-level capacity | Not on the site | Section 8.1 counts (3,964 / 4,978 / 4,372 / 6,579); scale by 20,033 / 19,893 if the official total must be matched |
| Floor-to-floor heights and level elevations | Only the cross-section graphic | Section 9 table; L3 +6.7-7 m, L5 about +18 m, L7 about +29 m, roof +45 m |
| Seat width, row tread | Not stated | Seat pitch 0.49 m, tread 0.82 m (stands), 0.91 / 0.82 m (arena); balcony seat pitch about 0.57 m, tread 1.0-1.1 m |
| Riser heights | Not stated | Lower stand about 0.25-0.30 m average (8 m over 29 rows); middle stand about 0.40 m; upper stand about 0.42-0.48 m (11.8 m over 28 rows) |
| Maximum viewing distance | Not stated | About 94 m horizontally from the stage front to the last row of L7 centre; about 100 m line of sight |
| Arena floor size | Not stated | Octagon about 84 m max width x 33 m deep (front edge 69 m, rear wall 40 m); may be 5-8 % smaller in reality |
| Hall clear height | Not stated | Truss bottom chord about +39 m at the rear, about +31 m at the proscenium |
| True footprint and compass bearing | Schematic maps only | Section 4.2 / 4.3; replace with GIS footprint |
| Arena-only building area, designer roles, contractor | Not on the official site | Section 2 (REPORTED credits) |
| VIP level number, box layout | Site only says contract-holders' floor | L6, 11 boxes in an arc behind the L5 centre stand, each about 5-6 m wide (62 m / 11) |
| Elevator positions | Not drawn on public maps | Place cores beside the "LEVEL 3・5・7" stairs at the rear corners and near the South Entrance |
| Main LED screen size | Not stated | About 10 m x 5.6 m each |
| Whether lower-stand rows 1-11 retract | Only inferred from a photo | Model as separate black box units |

---

## Appendix A - Row-by-row seat ranges (parsed from the official seat-map PDF)

Segments are listed from house-left to house-right; a "/" marks an aisle or a vomitory. Row counts are exact for the drawing dated 2024-08-08.

#### LEVEL 1 (ARENA, standard seated layout)

**centre** (34 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 116 | 13-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-128 |
| 2 | 116 | 13-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-128 |
| 3 | 120 | 11-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-130 |
| 4 | 120 | 11-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-130 |
| 5 | 124 | 9-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-132 |
| 6 | 128 | 7-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-134 |
| 7 | 128 | 7-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-134 |
| 8 | 132 | 5-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-136 |
| 9 | 136 | 3-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-138 |
| 10 | 136 | 3-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-138 |
| 11 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 12 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 13 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 14 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 15 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 16 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 17 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 18 | 138 | 2-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-139 |
| 19 | 134 | 4-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-137 |
| 20 | 128 | 7-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-134 |
| 21 | 124 | 9-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-132 |
| 22 | 118 | 12-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-129 |
| 23 | 112 | 15-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-126 |
| 24 | 108 | 17-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-124 |
| 25 | 104 | 19-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-122 |
| 26 | 100 | 21-40 / 41-60 / 61-80 / 81-100 / 101-120 |
| 27 | 100 | 21-40 / 41-60 / 61-80 / 81-100 / 101-120 |
| 28 | 96 | 23-40 / 41-60 / 61-80 / 81-100 / 101-118 |
| 29 | 90 | 26-40 / 41-60 / 61-80 / 81-100 / 101-115 |
| 30 | 86 | 28-40 / 41-60 / 61-80 / 81-100 / 101-113 |
| 31 | 80 | 31-40 / 41-60 / 61-80 / 81-100 / 101-110 |
| 32 | 74 | 34-40 / 41-60 / 61-80 / 81-100 / 101-107 |
| 33 | 70 | 36-40 / 41-60 / 61-80 / 81-100 / 101-105 |
| 34 | 66 | 38-40 / 41-60 / 61-80 / 81-100 / 101-103 |

Subtotal: **3964** seats

Level total (counted from the official PDF): **3964** seats


#### LEVEL 3 (LOWER STAND)

**house-left wing (rows rotated 33.6 deg)** (29 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 40 | 9-28 / 29-48 |
| 2 | 40 | 9-28 / 29-48 |
| 3 | 40 | 9-28 / 29-48 |
| 4 | 40 | 9-28 / 29-48 |
| 5 | 40 | 9-28 / 29-48 |
| 6 | 40 | 9-28 / 29-48 |
| 7 | 40 | 9-28 / 29-48 |
| 8 | 40 | 9-28 / 29-48 |
| 9 | 40 | 9-28 / 29-48 |
| 10 | 40 | 9-28 / 29-48 |
| 11 | 40 | 9-28 / 29-48 |
| 12 | 56 | 1-8 / 9-28 / 29-48 / 49-56 |
| 13 | 56 | 1-8 / 9-28 / 29-48 / 49-56 |
| 14 | 57 | 1-8 / 9-28 / 29-48 / 49-57 |
| 15 | 57 | 1-8 / 9-28 / 29-48 / 49-57 |
| 16 | 58 | 1-8 / 9-28 / 29-48 / 49-58 |
| 17 | 58 | 1-8 / 9-28 / 29-48 / 49-58 |
| 18 | 59 | 1-8 / 9-28 / 29-48 / 49-59 |
| 19 | 59 | 1-8 / 9-28 / 29-48 / 49-59 |
| 20 | 60 | 1-8 / 9-28 / 29-48 / 49-60 |
| 21 | 60 | 1-8 / 9-28 / 29-48 / 49-60 |
| 22 | 61 | 1-8 / 9-28 / 29-48 / 49-61 |
| 23 | 61 | 1-8 / 9-28 / 29-48 / 49-61 |
| 24 | 62 | 1-8 / 9-28 / 29-48 / 49-62 |
| 25 | 62 | 1-8 / 9-28 / 29-48 / 49-62 |
| 26 | 63 | 1-8 / 9-28 / 29-48 / 49-63 |
| 27 | 63 | 1-8 / 9-28 / 29-48 / 49-63 |
| 28 | 63 | 1-8 / 9-28 / 29-48 / 49-63 |
| 29 | 45 | 1-8 / 14-24 / 29-36 / 41-48 / 53-62 |

Subtotal: **1500** seats

**centre** (29 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 2 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 3 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 4 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 5 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 6 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 7 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 8 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 9 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 10 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 11 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 12 | 76 | 71-78 / 79-98 / 99-118 / 119-138 / 139-146 |
| 13 | 76 | 71-78 / 79-98 / 99-118 / 119-138 / 139-146 |
| 14 | 78 | 70-78 / 79-98 / 99-118 / 119-138 / 139-147 |
| 15 | 78 | 70-78 / 79-98 / 99-118 / 119-138 / 139-147 |
| 16 | 80 | 69-78 / 79-98 / 99-118 / 119-138 / 139-148 |
| 17 | 80 | 69-78 / 79-98 / 99-118 / 119-138 / 139-148 |
| 18 | 82 | 68-78 / 79-98 / 99-118 / 119-138 / 139-149 |
| 19 | 82 | 68-78 / 79-98 / 99-118 / 119-138 / 139-149 |
| 20 | 84 | 67-78 / 79-98 / 99-118 / 119-138 / 139-150 |
| 21 | 84 | 67-78 / 79-98 / 99-118 / 119-138 / 139-150 |
| 22 | 86 | 66-78 / 79-98 / 99-118 / 119-138 / 139-151 |
| 23 | 86 | 66-78 / 79-98 / 99-118 / 119-138 / 139-151 |
| 24 | 88 | 65-78 / 79-98 / 99-118 / 119-138 / 139-152 |
| 25 | 88 | 65-78 / 79-98 / 99-118 / 119-138 / 139-152 |
| 26 | 52 | 64-78 / 79-89 / 128-138 / 139-153 |
| 27 | 52 | 64-78 / 79-89 / 128-138 / 139-153 |
| 28 | 50 | 64-78 / 79-88 / 129-138 / 139-153 |
| 29 | 38 | 65-74 / 79-87 / 130-138 / 143-152 |

Subtotal: **1978** seats

**house-right wing (rows rotated 33.6 deg)** (29 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 40 | 169-188 / 189-208 |
| 2 | 40 | 169-188 / 189-208 |
| 3 | 40 | 169-188 / 189-208 |
| 4 | 40 | 169-188 / 189-208 |
| 5 | 40 | 169-188 / 189-208 |
| 6 | 40 | 169-188 / 189-208 |
| 7 | 40 | 169-188 / 189-208 |
| 8 | 40 | 169-188 / 189-208 |
| 9 | 40 | 169-188 / 189-208 |
| 10 | 40 | 169-188 / 189-208 |
| 11 | 40 | 169-188 / 189-208 |
| 12 | 56 | 161-168 / 169-188 / 189-208 / 209-216 |
| 13 | 56 | 161-168 / 169-188 / 189-208 / 209-216 |
| 14 | 57 | 160-168 / 169-188 / 189-208 / 209-216 |
| 15 | 57 | 160-168 / 169-188 / 189-208 / 209-216 |
| 16 | 58 | 159-168 / 169-188 / 189-208 / 209-216 |
| 17 | 58 | 159-168 / 169-188 / 189-208 / 209-216 |
| 18 | 59 | 158-168 / 169-188 / 189-208 / 209-216 |
| 19 | 59 | 158-168 / 169-188 / 189-208 / 209-216 |
| 20 | 60 | 157-168 / 169-188 / 189-208 / 209-216 |
| 21 | 60 | 157-168 / 169-188 / 189-208 / 209-216 |
| 22 | 61 | 156-168 / 169-188 / 189-208 / 209-216 |
| 23 | 61 | 156-168 / 169-188 / 189-208 / 209-216 |
| 24 | 62 | 155-168 / 169-188 / 189-208 / 209-216 |
| 25 | 62 | 155-168 / 169-188 / 189-208 / 209-216 |
| 26 | 63 | 154-168 / 169-188 / 189-208 / 209-216 |
| 27 | 63 | 154-168 / 169-188 / 189-208 / 209-216 |
| 28 | 63 | 154-168 / 169-188 / 189-208 / 209-216 |
| 29 | 45 | 155-164 / 169-176 / 181-188 / 193-203 / 209-216 |

Subtotal: **1500** seats

Level total (counted from the official PDF): **4978** seats


#### LEVEL 5 (MIDDLE STAND)

**house-left wing (rows rotated 33.6 deg)** (26 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 60 | 1-8 / 9-28 / 29-48 / 49-60 |
| 2 | 61 | 1-8 / 9-28 / 29-48 / 49-61 |
| 3 | 61 | 1-8 / 9-28 / 29-48 / 49-61 |
| 4 | 62 | 1-8 / 9-28 / 29-48 / 49-62 |
| 5 | 62 | 1-8 / 9-28 / 29-48 / 49-62 |
| 6 | 63 | 1-8 / 9-28 / 29-48 / 49-63 |
| 7 | 63 | 1-8 / 9-28 / 29-48 / 49-63 |
| 8 | 64 | 1-8 / 9-28 / 29-48 / 49-64 |
| 9 | 64 | 1-8 / 9-28 / 29-48 / 49-64 |
| 10 | 65 | 1-8 / 9-28 / 29-48 / 49-65 |
| 11 | 44 | 1-5 / 12-25 / 32-45 / 52-62 |
| 12 | 48 | 1-5 / 11-25 / 31-45 / 52-64 |
| 13 | 50 | 1-6 / 12-26 / 32-46 / 51-64 |
| 14 | 49 | 1-5 / 11-25 / 31-45 / 52-65 |
| 15 | 51 | 1-6 / 12-26 / 32-46 / 51-65 |
| 16 | 50 | 1-5 / 11-25 / 31-45 / 52-66 |
| 17 | 52 | 1-6 / 12-26 / 32-46 / 51-66 |
| 18 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 19 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 20 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 21 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 22 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 23 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 24 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 25 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 26 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |

Subtotal: **1581** seats

**centre** (15 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 77 | 72-82 / 91-108 / 111-129 / 131-148 / 155-165 |
| 2 | 79 | 71-82 / 91-108 / 111-129 / 131-148 / 155-166 |
| 3 | 79 | 71-82 / 91-108 / 111-129 / 131-148 / 155-166 |
| 6 | 90 | 72-86 / 91-110 / 111-130 / 131-150 / 155-169 |
| 7 | 90 | 72-86 / 91-110 / 111-130 / 131-150 / 155-169 |
| 8 | 92 | 71-86 / 91-110 / 111-130 / 131-150 / 155-170 |
| 9 | 92 | 71-86 / 91-110 / 111-130 / 131-150 / 155-170 |
| 10 | 94 | 70-86 / 91-110 / 111-130 / 131-150 / 155-171 |
| 11 | 64 | 73-83 / 94-107 / 114-127 / 134-147 / 158-168 |
| 12 | 71 | 71-83 / 93-107 / 114-128 / 134-148 / 158-170 |
| 13 | 73 | 71-84 / 94-108 / 113-127 / 133-147 / 157-170 |
| 14 | 73 | 70-83 / 93-107 / 114-128 / 134-148 / 158-171 |
| 15 | 75 | 70-84 / 94-108 / 113-127 / 133-147 / 157-171 |
| 16 | 75 | 69-83 / 93-107 / 114-128 / 134-148 / 158-172 |
| 17 | 86 | 69-84 / 87-90 / 94-108 / 113-128 / 133-147 / 151-154 / 157-172 |

Subtotal: **1210** seats

**house-right wing (rows rotated 33.6 deg)** (26 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 60 | 181-192 / 193-212 / 213-232 / 233-240 |
| 2 | 61 | 180-192 / 193-212 / 213-232 / 233-240 |
| 3 | 61 | 180-192 / 193-212 / 213-232 / 233-240 |
| 4 | 62 | 179-192 / 193-212 / 213-232 / 233-240 |
| 5 | 62 | 179-192 / 193-212 / 213-232 / 233-240 |
| 6 | 63 | 178-192 / 193-212 / 213-232 / 233-240 |
| 7 | 63 | 178-192 / 193-212 / 213-232 / 233-240 |
| 8 | 64 | 177-192 / 193-212 / 213-232 / 233-240 |
| 9 | 64 | 177-192 / 193-212 / 213-232 / 233-240 |
| 10 | 65 | 176-192 / 193-212 / 213-232 / 233-240 |
| 11 | 44 | 179-189 / 196-209 / 216-229 / 236-240 |
| 12 | 48 | 177-189 / 196-210 / 216-230 / 236-240 |
| 13 | 50 | 177-190 / 195-209 / 215-229 / 235-240 |
| 14 | 49 | 176-189 / 196-210 / 216-230 / 236-240 |
| 15 | 51 | 176-190 / 195-209 / 215-229 / 235-240 |
| 16 | 50 | 175-189 / 196-210 / 216-230 / 236-240 |
| 17 | 52 | 175-190 / 195-209 / 215-229 / 235-240 |
| 18 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 19 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 20 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 21 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 22 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 23 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 24 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 25 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |
| 26 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |

Subtotal: **1581** seats

Level total (counted from the official PDF): **4372** seats


#### LEVEL 7 (UPPER STAND)

**house-left wing (rows rotated 33.6 deg)** (26 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 3 | 70 | 1-8 / 9-28 / 29-48 / 49-68 / 69-70 |
| 4 | 70 | 1-8 / 9-28 / 29-48 / 49-68 / 69-70 |
| 5 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 6 | 50 | 1-5 / 12-25 / 32-45 / 52-68 |
| 7 | 53 | 1-5 / 11-25 / 31-45 / 51-68 |
| 8 | 53 | 1-6 / 12-26 / 32-46 / 52-68 |
| 9 | 53 | 1-5 / 11-25 / 31-45 / 51-68 |
| 10 | 54 | 1-6 / 11-26 / 32-46 / 52-68 |
| 11 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |
| 12 | 70 | 3-8 / 9-28 / 29-48 / 49-68 / 69-72 |
| 13 | 71 | 2-8 / 9-28 / 29-48 / 49-68 / 69-72 |
| 14 | 71 | 3-8 / 9-28 / 29-48 / 49-68 / 69-73 |
| 15 | 72 | 2-8 / 9-28 / 29-48 / 49-68 / 69-73 |
| 16 | 72 | 3-8 / 9-28 / 29-48 / 49-68 / 69-74 |
| 17 | 73 | 2-8 / 9-28 / 29-48 / 49-68 / 69-74 |
| 18 | 73 | 3-8 / 9-28 / 29-48 / 49-68 / 69-75 |
| 19 | 74 | 2-8 / 9-28 / 29-48 / 49-68 / 69-75 |
| 20 | 74 | 3-8 / 9-28 / 29-48 / 49-68 / 69-76 |
| 21 | 75 | 2-8 / 9-28 / 29-48 / 49-68 / 69-76 |
| 22 | 75 | 3-8 / 9-28 / 29-48 / 49-68 / 69-77 |
| 23 | 76 | 2-8 / 9-28 / 29-48 / 49-68 / 69-77 |
| 24 | 76 | 3-8 / 9-28 / 29-48 / 49-68 / 69-78 |
| 25 | 77 | 2-8 / 9-28 / 29-48 / 49-68 / 69-78 |
| 26 | 77 | 3-8 / 9-28 / 29-48 / 49-68 / 69-79 |
| 27 | 78 | 2-8 / 9-28 / 29-48 / 49-68 / 69-79 |
| 28 | 78 | 3-8 / 9-28 / 29-48 / 49-68 / 69-80 |

Subtotal: **1801** seats

**centre** (28 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 1 | 104 | 91-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-194 |
| 2 | 104 | 91-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-194 |
| 3 | 104 | 91-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-194 |
| 4 | 104 | 91-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-194 |
| 5 | 100 | 93-112 / 113-132 / 133-152 / 153-172 / 173-192 |
| 6 | 76 | 93-109 / 116-129 / 136-149 / 156-169 / 176-192 |
| 7 | 81 | 93-110 / 116-130 / 136-150 / 155-169 / 175-192 |
| 8 | 79 | 93-109 / 115-129 / 135-149 / 156-170 / 176-192 |
| 9 | 81 | 93-110 / 116-130 / 136-150 / 155-169 / 175-192 |
| 10 | 80 | 93-109 / 115-129 / 135-150 / 156-170 / 176-192 |
| 11 | 100 | 93-112 / 113-132 / 133-152 / 153-172 / 173-192 |
| 12 | 108 | 89-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-196 |
| 13 | 108 | 89-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-196 |
| 14 | 110 | 88-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-197 |
| 15 | 110 | 88-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-197 |
| 16 | 112 | 87-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-198 |
| 17 | 112 | 87-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-198 |
| 18 | 114 | 86-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-199 |
| 19 | 114 | 86-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-199 |
| 20 | 116 | 85-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-200 |
| 21 | 116 | 85-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-200 |
| 22 | 118 | 84-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-201 |
| 23 | 118 | 84-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-201 |
| 24 | 120 | 83-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-202 |
| 25 | 120 | 83-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-202 |
| 26 | 122 | 82-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-203 |
| 27 | 122 | 82-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-203 |
| 28 | 124 | 81-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-204 |

Subtotal: **2977** seats

**house-right wing (rows rotated 33.6 deg)** (26 rows)

| Row | Seats in row | Seat-number segments (house-left -> house-right) |
|---:|---:|---|
| 3 | 70 | 215-216 / 217-236 / 237-256 / 257-276 / 277-284 |
| 4 | 70 | 215-216 / 217-236 / 237-256 / 257-276 / 277-284 |
| 5 | 68 | 217-236 / 237-256 / 257-276 / 277-284 |
| 6 | 50 | 217-233 / 240-253 / 260-273 / 280-284 |
| 7 | 53 | 217-234 / 240-254 / 260-274 / 280-284 |
| 8 | 53 | 217-233 / 239-253 / 259-273 / 279-284 |
| 9 | 53 | 217-234 / 240-254 / 260-274 / 280-284 |
| 10 | 54 | 217-233 / 239-253 / 259-274 / 279-284 |
| 11 | 68 | 217-236 / 237-256 / 257-276 / 277-284 |
| 12 | 70 | 213-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 13 | 71 | 213-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 14 | 71 | 212-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 15 | 72 | 212-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 16 | 72 | 211-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 17 | 73 | 211-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 18 | 73 | 210-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 19 | 74 | 210-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 20 | 74 | 209-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 21 | 75 | 209-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 22 | 75 | 208-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 23 | 76 | 208-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 24 | 76 | 207-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 25 | 77 | 207-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 26 | 77 | 206-216 / 217-236 / 237-256 / 257-276 / 277-282 |
| 27 | 78 | 206-216 / 217-236 / 237-256 / 257-276 / 277-283 |
| 28 | 78 | 205-216 / 217-236 / 237-256 / 257-276 / 277-282 |

Subtotal: **1801** seats

Level total (counted from the official PDF): **6579** seats


Grand total counted from the official seat-map PDF: **19893** seats (official figure: 20,033).

## Appendix B - Geometry of the official seat-map PDF (points; origin bottom-left, y up, stage at the top)

Suggested conversion: 1 pt = 0.1206 m (see 8.6). The four levels are drawn one below another on the sheet (exploded view); they share the same centre line x = 708.6 pt but their y positions are **not** registered to each other, except that L3's front edge is drawn 30.6 pt below L1's rear wall. Polygons are background plates: the stage-side edges follow the stand fronts closely, the rear edges include a margin.

| Level | Polygon vertices (pt) |
|---|---|
| L1 arena | (424.2,1140.3) (993.0,1140.3) (1057.1,1028.2) (1057.1,985.7) (875.9,865.4) (541.3,865.4) (360.1,985.8) (360.1,1028.2) |
| L3 lower stand | (541.2,834.8) (876.0,834.8) (1057.1,955.1) (1103.8,884.9) (1141.4,909.9) (1225.0,784.1) (947.2,599.5) (470.0,599.5) (192.2,784.1) (275.8,909.9) (313.4,884.9) (360.1,955.1) |
| L5 middle stand | (471.0,568.8) (947.1,568.8) (1172.7,718.7) (1313.4,506.9) (974.5,281.8) (968.1,290.4) (449.8,290.4) (443.5,281.6) (103.8,507.3) (244.6,719.2) |
| L7 upper stand | (449.6,259.7) (967.9,259.7) (971.1,248.9) (1262.1,442.3) (1367.8,283.2) (1024.5,55.1) (393.0,55.1) (49.4,283.4) (155.1,442.5) (446.5,248.9) |
| L3 wheelchair platform | (611.7,623.6) (805.5,623.6) (799.3,649.5) (766.4,649.5) (766.4,631.1) (749.8,631.1) (749.8,649.5) (666.5,649.5) (666.5,631.1) (651.7,631.1) (651.7,649.5) (617.9,649.5) |

Gate label positions (pt; label anchor, about 5 pt left of the gate centre):

| Gate | x, y | Gate | x, y | Gate | x, y |
|---|---|---|---|---|---|
| 101 | 355, 970 | 501 | 207, 591 | 701 | 162, 379 |
| 102 | 516, 863 | 502 | 289, 536 | 702 | 244, 325 |
| 103 | 888, 854 | 503 | 371, 482 | 703 | 326, 270 |
| 104 | 1050, 962 | 504 | 455, 426 | 704 | 428, 197 |
| 301 | 340, 667 | 505 | 551, 426 | 705 | 551, 197 |
| 302 | 567, 583 | 506 | 650, 426 | 706 | 651, 197 |
| 303 | 833, 583 | 507 | 750, 426 | 707 | 750, 197 |
| 304 | 1063, 657 | 508 | 849, 426 | 708 | 849, 197 |
| | | 509 | 944, 426 | 709 | 972, 197 |
| | | 510 | 1031, 472 | 710 | 1077, 261 |
| | | 511 | 1115, 528 | 711 | 1162, 314 |
| | | 512 | 1197, 582 | 712 | 1243, 371 |

Seat rows: first row of each section (label baseline y, pt) and extent. Rows step by 6.79 pt (7.54 pt for L1 rows 1-17).

| Section | Row-1 baseline | Last-row baseline | Note |
|---|---|---|---|
| L1 | y = 1121 (row 1) | y = 874 (row 34) | row 17 at y = 1000, row 18 at y = 982; blocks start at x = 379.5, 476, 572.7, 669, 765.7, 862.3, 959.0 (pitch 96.6) |
| L3 centre | y = 820 (row 1) | y = 625 (row 29) | row 11 at y = 752, row 12 at y = 740 |
| L5 centre | y = 514 (balcony row 1), 506, 497 | y = 407 (row 17) | row 6 at y = 482 |
| L7 centre | y = 250 (row 1) | y = 67 (row 28) | |
| Wings | rotated +-33.6 deg about the wing-centre corner | | wing rows are parallel to the wing front edges listed above |

## Appendix C - Outlines read from the official floor-map images (pixels, 1200 x 975 canvas, y down, stage at top)

All five floor maps share one canvas and can be overlaid. They are schematic (compressed along the axis compared with the seat-map PDF), so use them for topology and relative position, not for scale. Values are approximate (+-5 px).

| Level | Building outline vertices (clockwise from top-left) | Hall void / stand front |
|---|---|---|
| L1 | (553,0) (835,0) (1047,325) (838,462) (550,462) (340,325) | Stage box 582-805 x 22-96. Arena polygon (485,113) (902,113) (952,188) (790,296) (597,296) (436,188) |
| L3 | (527,0) (862,0) (1142,425) (907,575) (907,632) (813,632) (813,685) (573,685) (573,632) (480,632) (480,575) (245,425) | Void (530,5) (860,5) (998,222) (830,333) (555,333) (388,222). Wheelchair box 625-762 x 402-423 |
| L4 | (338,290) (535,418) (517,443) (535,457) (852,457) (868,443) (850,418) (1048,290) (1140,427) (892,588) (832,588) (832,522) (765,522) (765,588) (622,588) (622,522) (555,522) (555,588) (495,588) (247,427) | no stand |
| L5 | (545,0) (840,0) (1150,470) (1092,568) (902,693) (817,693) (817,725) (565,725) (565,693) (480,693) (290,568) (235,470) | Void (545,5) (838,5) (1003,265) (805,393) (578,393) (380,265). Balcony box 578-805 x 395-418. Lounge 5: 570-810 x 595-722. Bridge from (1060,592) to (1160,665) |
| L7 | (478,0) (910,0) (1192,435) (885,632) (835,632) (835,710) (553,710) (553,632) (500,632) (195,435) | Void (568,8) (818,8) (1013,305) (825,430) (563,430) (372,305). Arena Bar 7: 557-830 x 632-705 |

Key points on the floor maps (px):

| Item | L1 | L3 | L5 | L7 |
|---|---|---|---|---|
| Gates (label centres) | 101 (440,225), 102 (562,308), 103 (822,308), 104 (920,243) | 301 (438,392), 302 (602,453), 303 (785,453), 304 (948,397) | 501 (308,415), 502 (370,457), 503 (430,497), 504 (492,537), 505 (596,563), 506 (662,563), 507 (721,563), 508 (788,563), 509 (892,537), 510 (952,497), 511 (1012,457), 512 (1072,415) | 701 (303,460), 702 (366,505), 703 (421,542), 704 (482,580), 705 (593,597), 706 (651,597), 707 (737,597), 708 (795,597), 709 (903,580), 710 (965,540), 711 (1019,503), 712 (1082,460) |
| Kiosks | (472,385), (902,385) | (493,432), (893,432) | (268,460), (600,620), (782,620), (1117,460) | (238,422), (693,555), (1147,422) |
| Toilets | (500,265), (872,275) | (363,348), (1020,348) | accessible (465,592), (912,592) | (415,165), (968,165); women (417,487), (968,487); men (621,557), (765,557) |
| Stairs | (572,430), (652,430), (733,430), (814,430) | 1・3・4・5: (558,452), (693,455), (830,452); 3・5・7: (333,450), (432,507), (548,558), (840,558), (955,507), (1052,450) | 3・4・5: (565,522), (632,522), (752,522), (817,522); 3・5・7: (315,485), (430,565), (542,618), (840,618), (955,565), (1070,485) | (360,452), (477,522), (553,558), (832,558), (910,522), (1025,452) |
| Escalators | - | (548,610), (840,610) | (527,665), (852,665) | - |
| Lockers | 1A (378,318), 1B (530,422), 1C (612,412), 1D (772,412), 1E (855,422), 1F (1012,312), 1G (955,225) | - | - | 7A (357,290), 7B (1035,290) |
| Smoking | - | - | - | (318,350), (1068,350) |
| Entrances | - | Main (693,672), North (368,500), South (1018,500) | - | - |

L4 map: lockers 4A (425,383), 4B (960,383); toilets (363,465), (1020,465); smoking rooms (483,543), (905,543); stairs (530,560), (855,560); central stair 622-765 x 522-588.

Music Terrace map (1200 x 975 px, north-up, y down): arena polygon (587,400) (665,238) (690,250) (715,213) (910,135) (1020,490) (965,580) (965,612) (587,612); South Entrance arrow (577,522); Main Entrance arrow (605,287); North Entrance arrow (805,165); North Gate (485,262); East Gate (1050,78); South Gate (330,612); West Gate (65,430); Big Steps band from (540,265) to (480,480); Arena Tent (765,140); ticket counter (945,263); outdoor toilets (717-742,597); Hilton centre (330,400); K-Tower centre (140,605).
