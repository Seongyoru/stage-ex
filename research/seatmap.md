# K-Arena Yokohama (Kアリーナ横浜) — Seating Bowl Ground Truth (`seatmap.md`)

Research angle: the seating bowl in maximum detail (tiers, blocks, rows, seats, fan geometry, rake, seat product, arena floor, sight distances).
Research date: 2026-11-23. All dimensions are metres unless stated.

Confidence tags used on every fact:

- **CONFIRMED** = stated by an official / primary source, or counted directly on the official vector seat map.
- **REPORTED** = stated by a credible secondary source (press, fan guide).
- **ESTIMATED** = derived by me; the derivation is given.

---

## 0. How this data was obtained (read this first)

1. **Official seat map, vector PDF** `https://k-arena.com/wp-content/themes/k-arena/assets/pdf/seat-map.pdf` (title `240808_seatmap`, Adobe Illustrator, created 2024-08-08, sheet 500 x 420 mm, linked from `https://k-arena.com/seat/`). The PDF contains every row of every tier as a separate vector bar (1,258 bars, 5 of them duplicates) with the first and last seat number printed at both ends of each bar (3,937 text objects). I parsed the content stream (bar end points + text positions), joined labels to bars and rebuilt the complete table **tier -> row -> seat-number segments** with plan coordinates. Result: 1,253 unique row segments, 19,893 seats. The same drawing exists as PNG: `https://k-arena.com/wp-content/themes/k-arena/assets/images/seat/img_seat_level_all.png`, `.../img_seat-map_level1.png`, `..._level3.png`, `..._level5.png`, `..._level7.png`.
2. **Official cross-section render** `https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png` (1800 x 582 px). I traced the stepped section profiles pixel by pixel (rows are resolvable: 9.65 px per row) to get rake, tier heights and overhangs.
3. **Seat maker's case study** (Kotobuki Seating / コトブキシーティング) with seven professional interior photos, which I studied for block layout, vomitories, colours and materials: `https://www.kotobuki-seating.co.jp/projects/list/detail.html?pdid1=01155`.
4. Press and fan sources (listed in section 15) for capacity statements, ticket formats, VIP boxes, steepness impressions.
5. OpenStreetMap footprint (way 934667675) used only as an independent size check.

Things that are **not published anywhere I could reach**: seat width, row depth, rake angles, tier heights, distances. The organiser document site `https://document.k-arena.com/` returns HTTP 401 (login). All such values below are ESTIMATED with the derivation shown, and they are mutually consistent (section 3.4).

---

## 1. Key numbers at a glance

| item | value | confidence | source / derivation |
|---|---|---|---|
| Total seats | 20,033 | CONFIRMED | k-arena.com/floor, Kotobuki case study |
| Tier names | LEVEL 1 = ARENA (アリーナ); LEVEL 3 = LOWER STAND (ロアースタンド); LEVEL 5 = MIDDLE STAND (ミドルスタンド) incl. BALCONY SEATING (バルコニー席); LEVEL 7 = UPPER STAND (アッパースタンド) | CONFIRMED | official cross-section image and seat page |
| Level number = building floor | LEVEL1 = 1F, LEVEL5 = 5F etc. | CONFIRMED | k-arena.com/faq |
| Seats on the official map | L1 3,964 (standard layout) / L3 4,978 / L5 4,372 (incl. 235 balcony) / L7 6,579 = 19,893 | CONFIRMED (counted on official PDF) | section 2 |
| Rows | L1: 34; L3: 29; L5: 26 in wings, centre 1-3 + 6-17; L7: 28 in centre, 3-28 in wings | CONFIRMED | official PDF |
| Seat-number ranges (left to right, audience view) | L1 1-140; L3 1-216; L5 1-240; L7 1-284 | CONFIRMED | official PDF |
| Gates (扉 / GATE) | 101-104, 301-304, 501-512, 701-712 (32 in total) | CONFIRMED | official PDF |
| Bowl plan shape | 3 straight facets: centre + 2 wings rotated 33.6 deg; all rows are straight lines (no curved rows) | CONFIRMED (geometry of official PDF) | text rotation +-33.6 deg, junction lines at 16.8 deg |
| Seating layout | staggered rows (千鳥配置) in the stands | CONFIRMED | Kotobuki; visible in PDF (alternate rows shifted half a seat) |
| Seat centre spacing | about 0.51 m (balcony about 0.57 m) | ESTIMATED | section 3.3 |
| Row depth (tread) | about 0.85 m in all stand tiers; arena rows 1-17 about 0.945 m, rows 18-34 about 0.85 m; balcony about 1.07 m | ESTIMATED | section 3.3 |
| Rake | L3 rows 1-11 about 16 deg (riser 0.25); L3 rows 12-29 about 14 deg (0.21); L5 about 21 deg (0.325); L7 about 29.5 deg (0.48) | ESTIMATED | section 9 |
| Floor height of rows above arena floor | L3: 0.25 to 6.7; L5: 10.3 to 18.4; L7: 23.4 to 36.5 | ESTIMATED | section 9 |
| Stage front to last row L7 (centre), horizontal | about 94 m (official render gives about 92 m) | ESTIMATED | section 10 |
| Farthest seat (L7 row 28 outer wing end) | about 104 m horizontal, about 110 m line of sight | ESTIMATED | section 10 |
| Seat maker / models | Kotobuki Seating: "Lux" (general, arena and stands), "Cadenza TS-71" (balcony, VIP BOX), "Matrix System" + caster seats (arena floor), semi-auto telescopic stand "RSP" (front of lower stand) | CONFIRMED | Kotobuki case study |
| Seat colours | general: deep blue fabric, black shell; balcony: red fabric + dark wood; VIP: midnight-blue patterned fabric + wood | CONFIRMED (names), ESTIMATED (hex) | section 11 |
| Cup holders | 2 per seat | CONFIRMED | Kotobuki, Travel Watch, Nikkei xTECH |
| Standing mode | about 22,000 with arena standing | REPORTED | Oricon |

---

## 2. Tier structure, naming, intermediate levels, capacities

### 2.1 Tiers

| tier | official name | what it is | rows | seat numbers | seats (counted on official map) | confidence |
|---|---|---|---|---|---|---|
| LEVEL 1 | ARENA (アリーナ) | flat floor, movable seats, layout changes per event | 34 (standard) | 1-140 | 3,964 (standard layout) | CONFIRMED |
| LEVEL 3 | LOWER STAND (ロアースタンド) | rows 1-11 retractable telescopic stand on the arena floor; rows 12-29 fixed concrete stand | 29 | 1-216 | 4,978 (1,518 telescopic + 3,460 fixed) | CONFIRMED (count); split telescopic/fixed ESTIMATED |
| LEVEL 5 | MIDDLE STAND (ミドルスタンド) | fixed; centre front 3 rows = BALCONY SEATING (バルコニー席) | wings 1-26; centre 1-3 and 6-17 | 1-240 | 4,372 (wings 2 x 1,581; centre 975; balcony 235) | CONFIRMED |
| (LEVEL 6) | VIP BOX | 11 glass-fronted boxes with private balcony seats, behind / above the centre of the Middle Stand; not on the public seat map | - | - | about 120 | 11 rooms CONFIRMED (Kotobuki); 120 seats REPORTED (jcv.pages.dev: ten rooms of 10 seats in two rows of 5, centre room "V" 20 seats) |
| LEVEL 7 | UPPER STAND (アッパースタンド) | fixed, steepest | centre 1-28; wings 3-28 | 1-284 | 6,579 (wings 2 x 1,801; centre 2,977) | CONFIRMED |

| part | rows | seat-number range | seats/row min-max | seats |
|---|---|---|---|---|
| LEVEL 1 arena (standard layout) (`L1/C`) | 1-34 (34 rows) | 1-140 | 66-140 | 3964 |
| LEVEL 3 left wing (`L3/LW`) | 1-29 (29 rows) | 1-63 | 40-63 | 1500 |
| LEVEL 3 centre (`L3/C`) | 1-29 (29 rows) | 64-153 | 38-88 | 1978 |
| LEVEL 3 right wing (`L3/RW`) | 1-29 (29 rows) | 154-216 | 40-63 | 1500 |
| LEVEL 5 left wing (`L5/LW`) | 1-26 (26 rows) | 1-68 | 44-68 | 1581 |
| LEVEL 5 centre balcony (rows 1-3) (`L5/C-balcony`) | 1-3 (3 rows) | 71-166 | 77-79 | 235 |
| LEVEL 5 centre (rows 6-17) (`L5/C`) | 6-17 (12 rows) | 69-172 | 64-94 | 975 |
| LEVEL 5 right wing (`L5/RW`) | 1-26 (26 rows) | 173-240 | 44-68 | 1581 |
| LEVEL 7 left wing (`L7/LW`) | 3-28 (26 rows) | 1-80 | 50-78 | 1801 |
| LEVEL 7 centre (`L7/C`) | 1-28 (28 rows) | 81-204 | 76-124 | 2977 |
| LEVEL 7 right wing (`L7/RW`) | 3-28 (26 rows) | 205-284 | 50-78 | 1801 |

Tier totals from the official map: L1 = 3964, L3 = 4978, L5 = 4372, L7 = 6579; sum = 19893.

### 2.2 Reconciliation with the official 20,033

- Seats drawn on the official map: **19,893**.
- Official total: **20,033**. Difference: **140**.
- Best explanation (ESTIMATED): VIP BOX seats on LEVEL 6 (about 120, REPORTED) + wheelchair positions on LEVEL 3 (about 20, my inference from the remainder) = 140. No official per-tier breakdown is published; fan guides quote approximations that agree with my counts (Arena about 4,000, LEVEL 3 about 5,000, LEVEL 5 about 4,500-4,600, LEVEL 7 about 6,200-6,400, balcony 235, LEVEL 6 boxes about 100: `https://mama-premama.com/k-arina-capamiekata/`, `https://yokubaringo.com/k-arena-seat/`).
- Cross-check: Kotobuki states the balcony has 3 rows and 235 seats (CONFIRMED). My count of the balcony from the PDF labels is exactly 235.
- One known ambiguity: LEVEL 3 row 29, seats 65-74 and 143-152 are labelled as 10 seats each but drawn 12 seats long; this could add up to 4 seats.
- Venue "modes" REPORTED by an event agency (`https://www.global-produce.jp/service/uniquevenue/k-arena-yokohama/`): full about 20,000; "middle mode" about 13,000; "arena mode" 5,400. ESTIMATED reading: L1 + L3 + L5 + VIP = 13,434 (upper stand closed); L1 + telescopic rows of L3 = 5,482.

### 2.3 Intermediate levels

| level | exists as | confidence |
|---|---|---|
| LEVEL 2 | not in the public floor guide; stairs are labelled "LEVEL 1-3" and pass it. Back of house | ESTIMATED |
| LEVEL 3 | main entrance floor (Main / North / South Entrance), top of the Lower Stand, gates 301-304, wheelchair seating | CONFIRMED (k-arena.com/floor, faq) |
| LEVEL 4 | public concourse level behind the bowl (toilets, lockers 4A / 4B, smoking room, stairs "LEVEL 3-4-5"); no seating gates | CONFIRMED (official LEVEL 4 floor map) |
| LEVEL 5 | Middle Stand concourse, gates 501-512, Lounge 5 | CONFIRMED |
| LEVEL 6 | "VIP K-Arena" floor for contract holders only: VIP lounge + 11 VIP BOX rooms | CONFIRMED (floor page, Oricon, Kotobuki) |
| LEVEL 7 | Upper Stand concourse, gates 701-712, Arena Bar 7 | CONFIRMED |
| LEVEL 8-9 | no public facilities; the top rows of the Upper Stand reach roughly 9F height; building is 9 storeys, about 45 m | REPORTED (fan guides), CONFIRMED (9 storeys, 45 m) |

Circulation facts relevant to the bowl: escalators only between LEVEL 3 and LEVEL 5 (CONFIRMED, faq); LEVEL 5 to LEVEL 7 by stairs (REPORTED); the Lower Stand is entered from its top (rear), the Middle and Upper Stands through mid-tier vomitories.

### 2.4 Ticket format and numbering rules

- Ticket wording (REPORTED, many fan posts): `LEVEL n / nnn GATE (ゲート, 扉) / 列 (row) / 番 (seat)`, e.g. "1 LEVEL 104GATE 13列 119番", "3レベル 303ゲート 19列 138番", "5レベル 510ゲート 22列 199番", "710ゲート 11列 252番". All of these examples are consistent with my table (e.g. L5 seat 199 lies in block 193-212 next to gate 510; L7 seat 252 lies in block 237-256 between gates 710 and 711).
- Row 1 is always the row nearest the stage (CONFIRMED, official map).
- Seat numbers increase from the audience's left to the audience's right when facing the stage, and run continuously through left wing -> centre -> right wing on each stand tier (CONFIRMED, official map).
- The first digit of a gate is the level; gates are numbered from the audience's left (CONFIRMED, official map).

---

## 3. Fan geometry and coordinate frame (true-plan reconstruction)

### 3.1 Shape

- The bowl is **not** a curved fan. Each stand tier consists of **three straight facets**: a centre section whose rows are perpendicular to the hall axis, and two wings whose rows are rotated by **33.6 deg** towards the stage (CONFIRMED from the PDF: all wing text and bars are rotated exactly +-33.6 deg; the centre/wing junction lines run at 16.8 deg = half of 33.6 deg on all three tiers).
- Where centre and wing meet there is a radial aisle on the bisector, and on both sides of it a wedge block that grows by one seat every two rows.
- All tiers share the same bisector lines, so each tier is a parallel offset of the one below. The bisectors meet at a fan apex on the hall axis about 34.8 m upstage of the stage-front line.
- The independent OSM building outline has the same signature: a 77 m rear facade parallel to the centre rows, two diagonal facades at 33.6 deg, a 179 m wide "shoulder", a 42 m stage-end wall and about 141 m depth (ESTIMATED from OSM way 934667675, 7 vertices).

### 3.2 Coordinate frame used in all tables

- Origin O: centre of the stage-front line at arena floor level. The stage-front line is taken as the front edge of the official LEVEL 1 seating outline (the stage itself is not drawn on the seat map; uncertainty about +-2 m, see section 14).
- +X: audience right (seat numbers increase with +X). +Y: away from the stage. +Z: up from the arena floor.
- Centre parts (`.../C`): a row is the line Y = const; along-row coordinate u = X.
- Left wing (`.../LW`, audience left): P = u * (cos t, sin t) + v * (-sin t, cos t), t = 33.6 deg. Rows are lines v = const; u increases with seat number (towards the centre).
- Right wing (`.../RW`): P = u * (cos t, -sin t) + v * (sin t, cos t). u increases with seat number (away from the centre).
- For the same row number, v(wing) = Y(centre) + 5.82 (property of the parallel offset, because the apex is at Y = -34.84 and 34.84 * (1 - cos t) = 5.82).
- Fan apex: (0, -34.84). Junction (bisector) lines: X = +-(Y + 34.84) * tan(16.8 deg).

### 3.3 Scale: how metres were obtained (ESTIMATED)

The official PDF has a constant drawing unit: seat pitch 4.06 pt, stand row pitch 6.78 pt, wing angle 33.6 deg. Three independent arguments fix the scale at **1 pt = 0.1254 m (drawing scale about 1:355)**:

1. Official cross-section render: one stand row = 9.65 px in all three tiers. The same image shows the building from ground to roof top = 510 px (official height about 45 m, giving 0.0882 m/px) and the base stage as a 21 px high box (official stage height 1.8 m, giving 0.0857 m/px). Hence row tread = 9.65 px = 0.83 to 0.85 m. I use **0.85 m**.
2. Geometry: with a 33.6 deg wing, the wedge blocks grow by exactly one seat per two rows only if seat pitch = 2 * tread * tan(16.8 deg) = 0.604 * tread. The PDF ratio is 4.06 / 6.78 = 0.599. With tread 0.85 this gives seat pitch **0.51 m**.
3. Size check against OSM: the reconstructed last row of LEVEL 7 centre is 76.4 m long (rear facade 77 m), the LEVEL 7 wing tips are 160.6 m apart (building shoulders 179 m), and stage front to last row is 93.7 m inside a roughly 141 m deep roof outline.
4. Size check against an official dimension: the operator's press release gives the "ribbon vision" LED board on the front of the Upper Stand as about 62.5 m wide x 1 m high (CONFIRMED, https://www.atpress.ne.jp/news/363680). In the reconstruction the front row of the Upper Stand centre is 60.2 m long between the junction aisles (seats 93-192) and 64.8 m including the two end stubs. Agreement within about 3 %.

Resulting dimensions (ESTIMATED, tolerance about +-5 %):

| dimension | value |
|---|---|
| seat centre spacing, general seats (Lux) | 0.509 m |
| seat centre spacing, balcony (Cadenza TS-71) | 0.570 m (drawn 12 % wider; official FAQ calls them wider special seats) |
| row depth, all stand tiers incl. telescopic rows | 0.85 m (maker's telescopic system offers 0.90 / 0.95 for this chair, so 0.85 to 0.90 is the plausible range) |
| row depth, balcony rows 1-3 | 1.07 m |
| row depth, arena rows 1-17 | 0.945 m |
| row depth, arena rows 18-34 | 0.85 m |
| cross-aisle arena row 17 to 18 (row line to row line) | 2.23 m |
| gap arena row 34 to L3 row 1 (row line to row line) | 2.96 m |
| gap L3 row 11 (telescopic) to row 12 (fixed), row line to row line | 1.47 m (0.62 m more than a normal row) |
| gap L5 balcony row 3 to row 6 (cross-aisle; rows 4-5 do not exist in the centre) | 1.98 m |
| radial aisle between 20-seat blocks (gap between seat ends) | 2.0 to 2.3 m as drawn; 1.7 to 2.0 m measured on a frontal photo |
| gap between blocks at vomitory rows | 4.8 to 5.3 m (vomitory about 2.9 m plus a stair on each side) |
| length of a 20-seat block | 10.18 m |
| stagger between consecutive stand rows | 0.26 m (half a seat) |

### 3.4 Consistency checks passed

- Tier overlaps predicted by aligning the three tiers on their common apex: LEVEL 5 row 1 sits above LEVEL 3 row 23-24, LEVEL 7 wing row 3 sits above LEVEL 5 wing row 20-21. The official section render shows the Middle Stand front 5.5 rows in front of the Lower Stand's last row and the Upper Stand front 5.6 rows in front of the Middle Stand's last row. Same result from two independent sources.
- The render's cut profile shows 11 + 18 rows (Lower), 26 rows (Middle), 26 rows (Upper): exactly the row counts of the wings on the seat map.
- Stage front to the back of the Upper Stand: 91.9 m in the render, 93.7 m (centre row 28 line) in the plan model.
- Balcony count 235 equals the maker's figure.

### 3.5 Angular span of the bowl seen from the stage-front centre (ESTIMATED)

| tier | bearing of the outermost seat from the hall axis | total span |
|---|---|---|
| LEVEL 1 row 1 end seats | 86 deg (beside the stage) | 172 deg |
| LEVEL 1 row 11-17 end seats | 74 to 67 deg | about 140 deg |
| LEVEL 3 wing outer end | 64 deg (row 1) to 58 deg (row 29) | about 125 deg |
| LEVEL 5 wing outer end | 60 deg (row 1) to 54 deg (row 26) | about 115 deg |
| LEVEL 7 wing outer end | 55 deg (row 3) to 50 deg (row 28) | about 105 deg |
| ends of the centre section | 22 to 26 deg on all tiers | about 48 deg |

The wing rows face a point on the stage-front line about 10 to 15 m to their own side of centre (normal through the wing midpoint).

### 3.6 "Radius" of first and last row from the stage front (ESTIMATED)

| tier | first row, centre (Y) | last row, centre (Y) | first row, wing midpoint (horizontal distance to O) | last row, wing midpoint |
|---|---|---|---|---|
| LEVEL 1 | 2.2 | 33.2 | - | - |
| LEVEL 3 telescopic rows 1-11 | 36.2 | 44.7 | 43.9 | - |
| LEVEL 3 fixed rows 12-29 | 46.1 | 60.6 | - | 67.4 |
| LEVEL 5 | 56.1 (balcony row 1), 60.2 (row 6) | 69.5 (row 17) | 62.9 | 83.6 (row 26) |
| LEVEL 7 | 70.8 (row 1) | 93.7 (row 28) | 78.9 (row 3) | 99.8 (row 28) |

Tiers overlap in plan: LEVEL 5 overhangs the last 5-6 rows of LEVEL 3; LEVEL 7 overhangs the last 5-6 rows of the LEVEL 5 wings (in the centre LEVEL 7 row 1 starts about 1.3 m behind LEVEL 5 row 17, above the VIP boxes).

---

## 4. Tier-by-tier description

### 4.1 LEVEL 1 - ARENA (official "standard" layout)

- CONFIRMED (official map): 34 rows; seat numbers 1-140; seven columns of 20 seats (1-20, 21-40, 41-60, 61-80, 81-100, 101-120, 121-140) separated by six longitudinal aisles; one cross-aisle between rows 17 and 18; 3,964 seats. The official page states the arena layout changes per event.
- Front rows are trimmed at the sides (row 1-2: seats 13-128; full width 1-140 only in rows 11-17) because the side walls converge towards the stage; rear rows 18-34 are trimmed along the 33.6 deg fronts of the Lower Stand wings (row 34: seats 38-103).
- ESTIMATED size: seating field 82.9 m wide at rows 11-17, 70.7 m at row 1, 41.8 m at row 34; row 1 at Y = 2.2, row 34 at Y = 33.2. Seating-zone outline (official background polygon) in plan: (-35.7, 0) (35.6, 0) (43.7, 14.0) (43.7, 19.3) (21.0, 34.5) (-21.0, 34.5) (-43.7, 19.3) (-43.7, 14.0); area about 2,560 m2. REPORTED arena floor area 4,950 m2 and clear height 26 m (global-produce.jp); the larger figure presumably includes the stage zone and the zone under the retracted telescopic stands.
- Rows in the arena are not staggered on the drawing.
- Gates: 101 and 104 at the side ends of the cross-aisle (X = -+43.2, Y = 21.2); 102 and 103 at the two rear corners (X = -+22.9, Y = 34.7), i.e. at the centre/wing junction of the Lower Stand front (CONFIRMED positions on map; coordinates ESTIMATED).
- Seat type (CONFIRMED, Kotobuki): the same upholstered Lux chair as the stands, on movable frames: caster-mounted movable seats in the zone nearest the stage and "Matrix System" seats behind them. ESTIMATED: the differing row pitch suggests rows 1-17 = caster seats (0.945 m pitch), rows 18-34 = Matrix (0.85 m).
- Floor: exposed concrete; trucks can drive in without floor protection (REPORTED, Nikkei xTECH).
- Standing configuration: total capacity about 22,000 (REPORTED), i.e. about 5,900 standing on the floor (ESTIMATED: 22,000 minus the 16,069 stand and box seats).

### 4.2 LEVEL 3 - LOWER STAND

- 29 rows, seats 1-216, 4,978 seats (CONFIRMED count).
- Rows 1-11 = telescopic stand (移動観覧席): CONFIRMED by Kotobuki that a semi-automatic, mostly wall-fixed telescopic stand sits in front of the Lower Stand and is stored against the rear wall of the arena; REPORTED by fan guides that at some shows rows 1-11 do not exist and row 12 is the front row. On the map rows 1-11 exist only in six units: centre 79-98, 99-107, 108-116, 119-138 and each wing 9-28, 29-48 (1,518 seats). The centre pair 99-107 / 108-116 is split by a 0.6 m joint on the hall axis; seat numbers 117-118 do not exist in rows 1-11.
- Rows 12-29 = fixed stand (3,460 seats): left wing 1-8 / 9-28 / 29-48 / 49-63 (wedge); centre 64-78 (wedge) / 79-98 / 99-118 / 119-138 / 139-153 (wedge); right wing 154-168 (wedge) / 169-188 / 189-208 / 209-216.
- Wedge blocks grow by one seat every two rows: 8 seats in rows 12-13 up to 15 seats in rows 26-28.
- Wheelchair seating (車イス席 / ACCESSIBLE SEATING) (CONFIRMED on map): a platform at the rear centre replacing rows 26-29 of block 99-118 and the inner ends of the neighbouring blocks; ESTIMATED size 24.1 m x 3.1 m (X from -12.1 to +12.0, Y from 57.7 to 60.9) with two notches at the central aisles. REPORTED (hamakore) that similar spaces exist on the left and right. Number of positions not published (about 20 by my reconciliation).
- Row 29 is a broken back row with door / aisle-head gaps: left wing 1-8 / 14-24 / 29-36 / 41-48 / 53-62; centre 65-74 / 79-87 / 130-138 / 143-152; right wing mirrored.
- Gates 301-304 are all at the top (rear) of the stand: 302 and 303 behind the aisles 78|79 and 138|139 (X = -+16.7, Y = 65.2), 301 and 304 behind the middle of each wing (X = -+45.0, Y = 55.4). Spectators walk down from the LEVEL 3 concourse (main entrance level).
- The front of the fixed stand (row 12) stands on a wall about 3 m above the arena floor (photo, Travel Watch 013; my section estimate +3.1 m).
- Radial aisles have central steel handrails (photos).

### 4.3 LEVEL 5 - MIDDLE STAND, BALCONY, VIP BOX

- Wings: rows 1-26, blocks 1-8 / 9-28 / 29-48 / 49-68 (left) and 173-192 / 193-212 / 213-232 / 233-240 (right); 1,581 seats each. The inner block grows from 12 seats (row 1) to 17 (row 10), 20 from row 18.
- Centre: balcony rows 1-3 (seats 72-82 / 91-108 / 111-129 / 131-148 / 155-165 in row 1; 71-82 ... 155-166 in rows 2-3) = 235 seats (CONFIRMED), then a cross-aisle (rows 4-5 do not exist in the centre), then rows 6-17 (blocks 69-86 / 91-110 / 111-130 / 131-150 / 155-172) = 975 seats. Rows 18-26 do not exist in the centre: that zone is occupied by the VIP boxes above.
- Seat numbers 87-90 and 151-154 exist only as two 4-seat stubs in row 17 (behind gates 505 and 508).
- Balcony seats (CONFIRMED: FAQ, Kotobuki, Travel Watch): wider special seats, red fabric, wood trim, Cadenza TS-71, row depth about 1.07 m; often used for guests / seated-only.
- Vomitories: 12 gates, all at rows 11-17. Wings: 501 (aisle 8|9), 502 (28|29), 503 (48|49); centre: 504 (left junction), 505 (86|91), 506 (110|111), 507 (130|131), 508 (150|155), 509 (right junction); right wing: 510 (192|193), 511 (212|213), 512 (232|233). At vomitory rows three seats are removed on each side of the aisle (e.g. row 11: 94-107 instead of 91-110).
- Vomitory appearance (photos): light-grey concrete portal box with a dark opening, stairs up on both sides of the portal to rows 12-17, a wider stair from the mouth down to the cross-aisle / front rows.
- VIP BOX (LEVEL 6): 11 rooms (CONFIRMED) in a row behind / above centre rows 11-17 and below the Upper Stand front; each room has a glass front and a small private balcony with two rows of fixed seats. Seats about 120 (REPORTED).
- Above the boxes, on the front of the Upper Stand centre, runs the "ribbon vision" LED board: about 62.5 m wide x 1 m high (CONFIRMED, operator press release); in photos it shows 12 white "KEN" roundels on blue.

### 4.4 LEVEL 7 - UPPER STAND

- Centre rows 1-28 (blocks 81-92 wedge / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-204 wedge) = 2,977 seats; wings rows 3-28 (left 1-8 / 9-28 / 29-48 / 49-68 / 69-80 wedge; right 205-216 wedge / 217-236 / 237-256 / 257-276 / 277-284) = 1,801 seats each. The centre projects two rows further forward than the wings.
- Rows 1-4 have 2-seat stubs at the junction (91-92, 193-194; wings 69-70, 215-216 in rows 3-4). Wedges restart at row 12 with 4 seats and reach 12 seats in row 28.
- Outer end blocks alternate 6 and 7 seats in rows 12-28 (3-8 / 2-8; mirrored 277-282 / 277-283) because of the stagger.
- Vomitories: 12 gates at rows 6-10: 701 (8|9), 702 (28|29), 703 (48|49), 704 (left junction), 705 (112|113), 706 (132|133), 707 (152|153), 708 (172|173), 709 (right junction), 710 (236|237), 711 (256|257), 712 (276|277). No cross-aisle on this tier.
- Steepness: riser about 0.48 m per row on a 0.85 m tread (about 29.5 deg), ESTIMATED from the official section. Fan and press reports describe it as very steep with stair-like steps and a large height difference to the row in front (REPORTED: Oricon, yokubaringo, kpop-concierge). No rails in front of individual rows are visible in photos; aisles have central handrails; the front row has a parapet with rail and is often sold as seated-only (REPORTED).
- Four "Upper Service Vision" screens of about 3.5 m x 2 m hang from the roof for the rear of the Upper Stand, and follow speakers for the Upper Stand are permanently installed (CONFIRMED, operator press release https://www.atpress.ne.jp/news/363680).

---

## 5. Machine-usable block table (tier -> blocks)

Block ids are mine (the venue itself identifies seats only by LEVEL / GATE / row / seat number). "Order" is left to right as seen by the audience. u is the along-row coordinate of section 3.2 in metres.

| tier/part | block id (mine) | order L->R | seat numbers (nominal column) | rows present | seats per row (min-max) | seats in block | along-row extent u (m) at first row / last row |
|---|---|---|---|---|---|---|---|
| `L1/C` | A1 | 1 | 1-20 | 1-25 | 2-20 | 351 | -35.4..-31.3 / -32.8..-31.3 |
| `L1/C` | A2 | 2 | 21-40 | 1-34 | 3-20 | 611 | -29.3..-19.1 / -20.9..-19.1 |
| `L1/C` | A3 | 3 | 41-60 | 1-34 | 20-20 | 680 | -17.2..-7.0 / -17.2..-7.0 |
| `L1/C` | A4 | 4 | 61-80 | 1-34 | 20-20 | 680 | -5.1..5.1 / -5.1..5.1 |
| `L1/C` | A5 | 5 | 81-100 | 1-34 | 20-20 | 680 | 7.0..17.2 / 7.0..17.2 |
| `L1/C` | A6 | 6 | 101-120 | 1-34 | 3-20 | 611 | 19.1..29.3 / 19.1..20.9 |
| `L1/C` | A7 | 7 | 121-140 | 1-25 | 2-20 | 351 | 31.2..35.3 / 31.2..32.8 |
| `L3/LW` | 3L-a | 1 | 1-8 | 12-29 | 8-8 | 144 | -30.5..-26.4 / -30.7..-26.6 |
| `L3/LW` | 3L-b | 2 | 9-28 | 1-29 | 11-20 | 571 | -24.4..-14.3 / -21.9..-16.2 |
| `L3/LW` | 3L-c | 3 | 29-48 | 1-29 | 16-20 | 576 | -11.7..-1.6 / -11.8..-1.5 |
| `L3/LW` | 3L-d | 4 | 49-63 | 12-29 | 8-15 | 209 | 0.5..4.5 / 2.7..7.8 |
| `L3/C` | 3C-a | 1 | 64-78 | 12-29 | 8-15 | 209 | -23.8..-19.7 / -27.1..-21.0 |
| `L3/C` | 3C-b | 2 | 79-98 | 1-29 | 9-20 | 541 | -17.7..-7.5 / -17.7..-13.1 |
| `L3/C` | 3C-c | 3 | 99-118 | 1-25 | 18-20 | 478 | -5.0..4.7 / -5.0..5.2 |
| `L3/C` | 3C-d | 4 | 119-138 | 1-29 | 9-20 | 541 | 7.5..17.6 / 13.1..17.6 |
| `L3/C` | 3C-e | 5 | 139-153 | 12-29 | 8-15 | 209 | 19.6..23.8 / 20.9..27.0 |
| `L3/RW` | 3R-a | 1 | 154-168 | 12-29 | 8-15 | 209 | -4.6..-0.6 / -8.0..-2.9 |
| `L3/RW` | 3R-b | 2 | 169-188 | 1-29 | 16-20 | 576 | 1.5..11.6 / 1.4..11.6 |
| `L3/RW` | 3R-c | 3 | 189-208 | 1-29 | 11-20 | 571 | 14.2..24.3 / 16.1..21.8 |
| `L3/RW` | 3R-d | 4 | 209-216 | 12-29 | 8-8 | 144 | 26.3..30.4 / 26.5..30.6 |
| `L5/LW` | 5L-a | 1 | 1-8 | 1-26 | 5-8 | 190 | -30.8..-26.8 / -30.6..-26.6 |
| `L5/LW` | 5L-b | 2 | 9-28 | 1-26 | 14-20 | 484 | -24.5..-14.4 / -24.3..-14.1 |
| `L5/LW` | 5L-c | 3 | 29-48 | 1-26 | 14-20 | 484 | -12.1..-2.0 / -11.8..-1.7 |
| `L5/LW` | 5L-d | 4 | 49-68 | 1-26 | 11-20 | 423 | 0.6..6.7 / 0.4..10.5 |
| `L5/C-balcony` | 5B-a | 1 | 71-82 | 1-3 | 11-12 | 35 | -25.9..-19.7 / -26.5..-19.7 |
| `L5/C-balcony` | 5B-b | 2 | 91-108 | 1-3 | 18-18 | 54 | -17.3..-7.1 / -17.4..-7.1 |
| `L5/C-balcony` | 5B-c | 3 | 111-129 | 1-3 | 19-19 | 57 | -5.5..5.3 / -5.5..5.3 |
| `L5/C-balcony` | 5B-d | 4 | 131-148 | 1-3 | 18-18 | 54 | 7.1..17.4 / 7.1..17.4 |
| `L5/C-balcony` | 5B-e | 5 | 155-166 | 1-3 | 11-12 | 35 | 19.7..26.0 / 19.7..26.6 |
| `L5/C` | 5C-a | 1 | 69-86 | 6-17 | 11-17 | 177 | -27.3..-19.6 / -29.1..-20.9 |
| `L5/C` | 5C-a2 | 2 | 87-90 | 17 | 4-4 | 4 | -19.7..-17.6 / -19.7..-17.6 |
| `L5/C` | 5C-b | 3 | 91-110 | 6-17 | 14-20 | 204 | -17.4..-7.2 / -16.1..-8.5 |
| `L5/C` | 5C-c | 4 | 111-130 | 6-17 | 14-20 | 205 | -5.2..5.0 / -3.9..4.2 |
| `L5/C` | 5C-d | 5 | 131-150 | 6-17 | 14-20 | 204 | 7.2..17.4 / 8.5..16.2 |
| `L5/C` | 5C-e0 | 6 | 151-154 | 17 | 4-4 | 4 | 17.6..19.7 / 17.6..19.7 |
| `L5/C` | 5C-e | 7 | 155-172 | 6-17 | 11-17 | 177 | 19.7..27.3 / 21.0..29.1 |
| `L5/RW` | 5R-a | 1 | 173-192 | 1-26 | 11-20 | 423 | -6.7..-0.6 / -10.4..-0.3 |
| `L5/RW` | 5R-b | 2 | 193-212 | 1-26 | 14-20 | 484 | 2.0..12.1 / 1.8..11.9 |
| `L5/RW` | 5R-c | 3 | 213-232 | 1-26 | 14-20 | 484 | 14.4..24.5 / 14.2..24.3 |
| `L5/RW` | 5R-d | 4 | 233-240 | 1-26 | 5-8 | 190 | 26.8..30.9 / 26.6..30.6 |
| `L7/LW` | 7L-a | 1 | 1-8 | 3-28 | 5-8 | 169 | -31.0..-26.9 / -30.2..-27.1 |
| `L7/LW` | 7L-b | 2 | 9-28 | 3-28 | 14-20 | 495 | -24.7..-14.5 / -24.9..-14.7 |
| `L7/LW` | 7L-c | 3 | 29-48 | 3-28 | 14-20 | 494 | -12.2..-2.0 / -12.4..-2.3 |
| `L7/LW` | 7L-d | 4 | 49-68 | 3-28 | 17-20 | 507 | 0.2..10.4 / -0.0..10.1 |
| `L7/LW` | 7L-e | 5 | 69-80 | 3-4, 12-28 | 2-12 | 136 | 11.5..12.8 / 12.4..18.5 |
| `L7/C` | 7C-a | 1 | 81-92 | 1-4, 12-28 | 2-12 | 140 | -32.4..-31.1 / -38.2..-32.1 |
| `L7/C` | 7C-b | 2 | 93-112 | 1-28 | 17-20 | 547 | -30.1..-19.9 / -29.9..-19.7 |
| `L7/C` | 7C-c | 3 | 113-132 | 1-28 | 14-20 | 534 | -17.7..-7.5 / -17.4..-7.2 |
| `L7/C` | 7C-d | 4 | 133-152 | 1-28 | 14-20 | 535 | -5.2..5.0 / -5.0..5.2 |
| `L7/C` | 7C-e | 5 | 153-172 | 1-28 | 14-20 | 534 | 7.5..17.7 / 7.2..17.4 |
| `L7/C` | 7C-f | 6 | 173-192 | 1-28 | 17-20 | 547 | 19.9..30.1 / 19.7..29.9 |
| `L7/C` | 7C-g | 7 | 193-204 | 1-4, 12-28 | 2-12 | 140 | 31.1..32.4 / 32.1..38.2 |
| `L7/RW` | 7R-a | 1 | 205-216 | 3-4, 12-28 | 2-12 | 136 | -12.8..-11.5 / -18.5..-12.4 |
| `L7/RW` | 7R-b | 2 | 217-236 | 3-28 | 17-20 | 507 | -10.4..-0.2 / -10.1..0.0 |
| `L7/RW` | 7R-c | 3 | 237-256 | 3-28 | 14-20 | 494 | 2.0..12.2 / 2.3..12.4 |
| `L7/RW` | 7R-d | 4 | 257-276 | 3-28 | 14-20 | 495 | 14.5..24.7 / 14.7..24.9 |
| `L7/RW` | 7R-e | 5 | 277-284 | 3-28 | 5-8 | 169 | 26.9..31.0 / 27.1..30.2 |

Sum of all blocks = 19893 seats.

Official total 20,033 = 19,893 (above) + about 120 VIP BOX seats (REPORTED) + about 20 wheelchair positions (ESTIMATED).

---

## 6. Complete row-by-row seat-number table (CONFIRMED, counted on the official PDF)

A " / " marks a radial aisle, vomitory or gap between seat-number segments. Rows not listed for a part do not exist there.

**LEVEL 1 arena (standard layout)** (`L1/C`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1-2 | 116 | 13-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-128 |
| 3-4 | 120 | 11-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-130 |
| 5 | 124 | 9-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-132 |
| 6-7 | 128 | 7-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-134 |
| 8 | 132 | 5-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-136 |
| 9-10 | 136 | 3-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-138 |
| 11-17 | 140 | 1-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-140 |
| 18 | 138 | 2-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-139 |
| 19 | 134 | 4-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-137 |
| 20 | 128 | 7-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-134 |
| 21 | 124 | 9-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-132 |
| 22 | 118 | 12-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-129 |
| 23 | 112 | 15-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-126 |
| 24 | 108 | 17-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-124 |
| 25 | 104 | 19-20 / 21-40 / 41-60 / 61-80 / 81-100 / 101-120 / 121-122 |
| 26-27 | 100 | 21-40 / 41-60 / 61-80 / 81-100 / 101-120 |
| 28 | 96 | 23-40 / 41-60 / 61-80 / 81-100 / 101-118 |
| 29 | 90 | 26-40 / 41-60 / 61-80 / 81-100 / 101-115 |
| 30 | 86 | 28-40 / 41-60 / 61-80 / 81-100 / 101-113 |
| 31 | 80 | 31-40 / 41-60 / 61-80 / 81-100 / 101-110 |
| 32 | 74 | 34-40 / 41-60 / 61-80 / 81-100 / 101-107 |
| 33 | 70 | 36-40 / 41-60 / 61-80 / 81-100 / 101-105 |
| 34 | 66 | 38-40 / 41-60 / 61-80 / 81-100 / 101-103 |

**LEVEL 3 left wing** (`L3/LW`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1-11 | 40 | 9-28 / 29-48 |
| 12-13 | 56 | 1-8 / 9-28 / 29-48 / 49-56 |
| 14-15 | 57 | 1-8 / 9-28 / 29-48 / 49-57 |
| 16-17 | 58 | 1-8 / 9-28 / 29-48 / 49-58 |
| 18-19 | 59 | 1-8 / 9-28 / 29-48 / 49-59 |
| 20-21 | 60 | 1-8 / 9-28 / 29-48 / 49-60 |
| 22-23 | 61 | 1-8 / 9-28 / 29-48 / 49-61 |
| 24-25 | 62 | 1-8 / 9-28 / 29-48 / 49-62 |
| 26-28 | 63 | 1-8 / 9-28 / 29-48 / 49-63 |
| 29 | 45 | 1-8 / 14-24 / 29-36 / 41-48 / 53-62 |

**LEVEL 3 centre** (`L3/C`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1-11 | 58 | 79-98 / 99-107 / 108-116 / 119-138 |
| 12-13 | 76 | 71-78 / 79-98 / 99-118 / 119-138 / 139-146 |
| 14-15 | 78 | 70-78 / 79-98 / 99-118 / 119-138 / 139-147 |
| 16-17 | 80 | 69-78 / 79-98 / 99-118 / 119-138 / 139-148 |
| 18-19 | 82 | 68-78 / 79-98 / 99-118 / 119-138 / 139-149 |
| 20-21 | 84 | 67-78 / 79-98 / 99-118 / 119-138 / 139-150 |
| 22-23 | 86 | 66-78 / 79-98 / 99-118 / 119-138 / 139-151 |
| 24-25 | 88 | 65-78 / 79-98 / 99-118 / 119-138 / 139-152 |
| 26-27 | 52 | 64-78 / 79-89 / 128-138 / 139-153 |
| 28 | 50 | 64-78 / 79-88 / 129-138 / 139-153 |
| 29 | 38 | 65-74 / 79-87 / 130-138 / 143-152 |

**LEVEL 3 right wing** (`L3/RW`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1-11 | 40 | 169-188 / 189-208 |
| 12-13 | 56 | 161-168 / 169-188 / 189-208 / 209-216 |
| 14-15 | 57 | 160-168 / 169-188 / 189-208 / 209-216 |
| 16-17 | 58 | 159-168 / 169-188 / 189-208 / 209-216 |
| 18-19 | 59 | 158-168 / 169-188 / 189-208 / 209-216 |
| 20-21 | 60 | 157-168 / 169-188 / 189-208 / 209-216 |
| 22-23 | 61 | 156-168 / 169-188 / 189-208 / 209-216 |
| 24-25 | 62 | 155-168 / 169-188 / 189-208 / 209-216 |
| 26-28 | 63 | 154-168 / 169-188 / 189-208 / 209-216 |
| 29 | 45 | 155-164 / 169-176 / 181-188 / 193-203 / 209-216 |

**LEVEL 5 left wing** (`L5/LW`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1 | 60 | 1-8 / 9-28 / 29-48 / 49-60 |
| 2-3 | 61 | 1-8 / 9-28 / 29-48 / 49-61 |
| 4-5 | 62 | 1-8 / 9-28 / 29-48 / 49-62 |
| 6-7 | 63 | 1-8 / 9-28 / 29-48 / 49-63 |
| 8-9 | 64 | 1-8 / 9-28 / 29-48 / 49-64 |
| 10 | 65 | 1-8 / 9-28 / 29-48 / 49-65 |
| 11 | 44 | 1-5 / 12-25 / 32-45 / 52-62 |
| 12 | 48 | 1-5 / 11-25 / 31-45 / 52-64 |
| 13 | 50 | 1-6 / 12-26 / 32-46 / 51-64 |
| 14 | 49 | 1-5 / 11-25 / 31-45 / 52-65 |
| 15 | 51 | 1-6 / 12-26 / 32-46 / 51-65 |
| 16 | 50 | 1-5 / 11-25 / 31-45 / 52-66 |
| 17 | 52 | 1-6 / 12-26 / 32-46 / 51-66 |
| 18-26 | 68 | 1-8 / 9-28 / 29-48 / 49-68 |

**LEVEL 5 centre balcony (rows 1-3)** (`L5/C-balcony`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1 | 77 | 72-82 / 91-108 / 111-129 / 131-148 / 155-165 |
| 2-3 | 79 | 71-82 / 91-108 / 111-129 / 131-148 / 155-166 |

**LEVEL 5 centre (rows 6-17)** (`L5/C`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 6-7 | 90 | 72-86 / 91-110 / 111-130 / 131-150 / 155-169 |
| 8-9 | 92 | 71-86 / 91-110 / 111-130 / 131-150 / 155-170 |
| 10 | 94 | 70-86 / 91-110 / 111-130 / 131-150 / 155-171 |
| 11 | 64 | 73-83 / 94-107 / 114-127 / 134-147 / 158-168 |
| 12 | 71 | 71-83 / 93-107 / 114-128 / 134-148 / 158-170 |
| 13 | 73 | 71-84 / 94-108 / 113-127 / 133-147 / 157-170 |
| 14 | 73 | 70-83 / 93-107 / 114-128 / 134-148 / 158-171 |
| 15 | 75 | 70-84 / 94-108 / 113-127 / 133-147 / 157-171 |
| 16 | 75 | 69-83 / 93-107 / 114-128 / 134-148 / 158-172 |
| 17 | 86 | 69-84 / 87-90 / 94-108 / 113-128 / 133-147 / 151-154 / 157-172 |

**LEVEL 5 right wing** (`L5/RW`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1 | 60 | 181-192 / 193-212 / 213-232 / 233-240 |
| 2-3 | 61 | 180-192 / 193-212 / 213-232 / 233-240 |
| 4-5 | 62 | 179-192 / 193-212 / 213-232 / 233-240 |
| 6-7 | 63 | 178-192 / 193-212 / 213-232 / 233-240 |
| 8-9 | 64 | 177-192 / 193-212 / 213-232 / 233-240 |
| 10 | 65 | 176-192 / 193-212 / 213-232 / 233-240 |
| 11 | 44 | 179-189 / 196-209 / 216-229 / 236-240 |
| 12 | 48 | 177-189 / 196-210 / 216-230 / 236-240 |
| 13 | 50 | 177-190 / 195-209 / 215-229 / 235-240 |
| 14 | 49 | 176-189 / 196-210 / 216-230 / 236-240 |
| 15 | 51 | 176-190 / 195-209 / 215-229 / 235-240 |
| 16 | 50 | 175-189 / 196-210 / 216-230 / 236-240 |
| 17 | 52 | 175-190 / 195-209 / 215-229 / 235-240 |
| 18-26 | 68 | 173-192 / 193-212 / 213-232 / 233-240 |

**LEVEL 7 left wing** (`L7/LW`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 3-4 | 70 | 1-8 / 9-28 / 29-48 / 49-68 / 69-70 |
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

**LEVEL 7 centre** (`L7/C`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 1-4 | 104 | 91-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-194 |
| 5 | 100 | 93-112 / 113-132 / 133-152 / 153-172 / 173-192 |
| 6 | 76 | 93-109 / 116-129 / 136-149 / 156-169 / 176-192 |
| 7 | 81 | 93-110 / 116-130 / 136-150 / 155-169 / 175-192 |
| 8 | 79 | 93-109 / 115-129 / 135-149 / 156-170 / 176-192 |
| 9 | 81 | 93-110 / 116-130 / 136-150 / 155-169 / 175-192 |
| 10 | 80 | 93-109 / 115-129 / 135-150 / 156-170 / 176-192 |
| 11 | 100 | 93-112 / 113-132 / 133-152 / 153-172 / 173-192 |
| 12-13 | 108 | 89-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-196 |
| 14-15 | 110 | 88-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-197 |
| 16-17 | 112 | 87-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-198 |
| 18-19 | 114 | 86-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-199 |
| 20-21 | 116 | 85-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-200 |
| 22-23 | 118 | 84-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-201 |
| 24-25 | 120 | 83-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-202 |
| 26-27 | 122 | 82-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-203 |
| 28 | 124 | 81-92 / 93-112 / 113-132 / 133-152 / 153-172 / 173-192 / 193-204 |

**LEVEL 7 right wing** (`L7/RW`)

| rows | seats per row | seat-number segments (aisle or gap between segments) |
|---|---|---|
| 3-4 | 70 | 215-216 / 217-236 / 237-256 / 257-276 / 277-284 |
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

---

## 7. Row line coordinates and row heights

Row line = line through the seat positions of that row. Y for centre parts, v for wings (frame of section 3.2). Heights are floor heights of the row above the arena floor (ESTIMATED, section 9). Intermediate rows: add 0.85 per row (arena rows 1-17: 0.945; balcony: 1.07). The complete list is in the JSON appendix.

| part | row | row line coordinate (m) | floor height z (m) |
|---|---|---|---|
| `L1/C` | 1 | Y = 2.24 | 0.00 |
| `L1/C` | 2 | Y = 3.18 | 0.00 |
| `L1/C` | 3 | Y = 4.13 | 0.00 |
| `L1/C` | 5 | Y = 6.02 | 0.00 |
| `L1/C` | 6 | Y = 6.96 | 0.00 |
| `L1/C` | 10 | Y = 10.75 | 0.00 |
| `L1/C` | 11 | Y = 11.69 | 0.00 |
| `L1/C` | 12 | Y = 12.63 | 0.00 |
| `L1/C` | 17 | Y = 17.36 | 0.00 |
| `L1/C` | 18 | Y = 19.59 | 0.00 |
| `L1/C` | 25 | Y = 25.54 | 0.00 |
| `L1/C` | 26 | Y = 26.39 | 0.00 |
| `L1/C` | 34 | Y = 33.19 | 0.00 |
| `L3/LW` | 1 | v = 41.95 | 0.25 |
| `L3/LW` | 2 | v = 42.80 | 0.50 |
| `L3/LW` | 3 | v = 43.65 | 0.75 |
| `L3/LW` | 5 | v = 45.35 | 1.25 |
| `L3/LW` | 6 | v = 46.20 | 1.50 |
| `L3/LW` | 10 | v = 49.60 | 2.50 |
| `L3/LW` | 11 | v = 50.45 | 2.75 |
| `L3/LW` | 12 | v = 51.93 | 3.10 |
| `L3/LW` | 17 | v = 56.18 | 4.15 |
| `L3/LW` | 18 | v = 57.03 | 4.36 |
| `L3/LW` | 25 | v = 62.98 | 5.83 |
| `L3/LW` | 26 | v = 63.82 | 6.04 |
| `L3/LW` | 29 | v = 66.39 | 6.67 |
| `L3/C` | 1 | Y = 36.15 | 0.25 |
| `L3/C` | 2 | Y = 37.00 | 0.50 |
| `L3/C` | 3 | Y = 37.85 | 0.75 |
| `L3/C` | 5 | Y = 39.56 | 1.25 |
| `L3/C` | 6 | Y = 40.41 | 1.50 |
| `L3/C` | 10 | Y = 43.81 | 2.50 |
| `L3/C` | 11 | Y = 44.66 | 2.75 |
| `L3/C` | 12 | Y = 46.13 | 3.10 |
| `L3/C` | 17 | Y = 50.39 | 4.15 |
| `L3/C` | 18 | Y = 51.24 | 4.36 |
| `L3/C` | 25 | Y = 57.19 | 5.83 |
| `L3/C` | 26 | Y = 58.04 | 6.04 |
| `L3/C` | 29 | Y = 60.59 | 6.67 |
| `L3/RW` | 1 | v = 41.90 | 0.25 |
| `L3/RW` | 2 | v = 42.75 | 0.50 |
| `L3/RW` | 3 | v = 43.60 | 0.75 |
| `L3/RW` | 5 | v = 45.30 | 1.25 |
| `L3/RW` | 6 | v = 46.15 | 1.50 |
| `L3/RW` | 10 | v = 49.54 | 2.50 |
| `L3/RW` | 11 | v = 50.39 | 2.75 |
| `L3/RW` | 12 | v = 51.87 | 3.10 |
| `L3/RW` | 17 | v = 56.12 | 4.15 |
| `L3/RW` | 18 | v = 56.97 | 4.36 |
| `L3/RW` | 25 | v = 62.92 | 5.83 |
| `L3/RW` | 26 | v = 63.77 | 6.04 |
| `L3/RW` | 29 | v = 66.32 | 6.67 |
| `L5/LW` | 1 | v = 61.76 | 10.30 |
| `L5/LW` | 2 | v = 62.61 | 10.62 |
| `L5/LW` | 3 | v = 63.46 | 10.95 |
| `L5/LW` | 5 | v = 65.16 | 11.60 |
| `L5/LW` | 6 | v = 66.01 | 11.93 |
| `L5/LW` | 10 | v = 69.41 | 13.23 |
| `L5/LW` | 11 | v = 70.26 | 13.55 |
| `L5/LW` | 12 | v = 71.11 | 13.88 |
| `L5/LW` | 17 | v = 75.36 | 15.50 |
| `L5/LW` | 18 | v = 76.21 | 15.83 |
| `L5/LW` | 25 | v = 82.16 | 18.10 |
| `L5/LW` | 26 | v = 83.01 | 18.43 |
| `L5/C-balcony` | 1 | Y = 56.06 | 10.30 |
| `L5/C-balcony` | 2 | Y = 57.13 | 10.62 |
| `L5/C-balcony` | 3 | Y = 58.20 | 10.95 |
| `L5/C` | 6 | Y = 60.18 | 11.93 |
| `L5/C` | 10 | Y = 63.58 | 13.23 |
| `L5/C` | 11 | Y = 64.43 | 13.55 |
| `L5/C` | 12 | Y = 65.28 | 13.88 |
| `L5/C` | 17 | Y = 69.55 | 15.50 |
| `L5/RW` | 1 | v = 61.79 | 10.30 |
| `L5/RW` | 2 | v = 62.64 | 10.62 |
| `L5/RW` | 3 | v = 63.49 | 10.95 |
| `L5/RW` | 5 | v = 65.19 | 11.60 |
| `L5/RW` | 6 | v = 66.04 | 11.93 |
| `L5/RW` | 10 | v = 69.44 | 13.23 |
| `L5/RW` | 11 | v = 70.29 | 13.55 |
| `L5/RW` | 12 | v = 71.14 | 13.88 |
| `L5/RW` | 17 | v = 75.39 | 15.50 |
| `L5/RW` | 18 | v = 76.24 | 15.83 |
| `L5/RW` | 25 | v = 82.19 | 18.10 |
| `L5/RW` | 26 | v = 83.04 | 18.43 |
| `L7/LW` | 3 | v = 78.40 | 24.40 |
| `L7/LW` | 5 | v = 80.11 | 25.37 |
| `L7/LW` | 6 | v = 80.96 | 25.85 |
| `L7/LW` | 10 | v = 84.36 | 27.78 |
| `L7/LW` | 11 | v = 85.21 | 28.26 |
| `L7/LW` | 12 | v = 86.06 | 28.75 |
| `L7/LW` | 17 | v = 90.31 | 31.16 |
| `L7/LW` | 18 | v = 91.16 | 31.64 |
| `L7/LW` | 25 | v = 97.11 | 35.03 |
| `L7/LW` | 26 | v = 97.96 | 35.51 |
| `L7/LW` | 28 | v = 99.66 | 36.47 |
| `L7/C` | 1 | Y = 70.79 | 23.43 |
| `L7/C` | 2 | Y = 71.63 | 23.92 |
| `L7/C` | 3 | Y = 72.47 | 24.40 |
| `L7/C` | 5 | Y = 74.16 | 25.37 |
| `L7/C` | 6 | Y = 75.04 | 25.85 |
| `L7/C` | 10 | Y = 78.44 | 27.78 |
| `L7/C` | 11 | Y = 79.28 | 28.26 |
| `L7/C` | 12 | Y = 80.13 | 28.75 |
| `L7/C` | 17 | Y = 84.38 | 31.16 |
| `L7/C` | 18 | Y = 85.23 | 31.64 |
| `L7/C` | 25 | Y = 91.18 | 35.03 |
| `L7/C` | 26 | Y = 92.03 | 35.51 |
| `L7/C` | 28 | Y = 93.73 | 36.47 |
| `L7/RW` | 3 | v = 78.40 | 24.40 |
| `L7/RW` | 5 | v = 80.11 | 25.37 |
| `L7/RW` | 6 | v = 80.96 | 25.85 |
| `L7/RW` | 10 | v = 84.36 | 27.78 |
| `L7/RW` | 11 | v = 85.21 | 28.26 |
| `L7/RW` | 12 | v = 86.06 | 28.75 |
| `L7/RW` | 17 | v = 90.31 | 31.16 |
| `L7/RW` | 18 | v = 91.16 | 31.64 |
| `L7/RW` | 25 | v = 97.11 | 35.03 |
| `L7/RW` | 26 | v = 97.96 | 35.51 |
| `L7/RW` | 28 | v = 99.66 | 36.47 |

---

## 8. Gates / vomitories (plan positions of the gate markers on the official map)

Coordinates ESTIMATED via the plan reconstruction; the gate numbering and which aisle each gate sits on are CONFIRMED.

| gate | X (m) | Y (m) |
|---|---|---|
| 101 | -43.2 | 21.2 |
| 102 | -22.9 | 34.7 |
| 103 | 22.8 | 34.7 |
| 104 | 43.2 | 21.2 |
| 301 | -45.0 | 55.4 |
| 302 | -16.7 | 65.2 |
| 303 | 16.7 | 65.2 |
| 304 | 44.9 | 55.4 |
| 501 | -61.6 | 46.5 |
| 502 | -51.3 | 53.4 |
| 503 | -40.9 | 60.3 |
| 504 | -30.6 | 66.6 |
| 505 | -18.7 | 66.6 |
| 506 | -6.2 | 66.6 |
| 507 | 6.2 | 66.6 |
| 508 | 18.7 | 66.6 |
| 509 | 30.6 | 66.6 |
| 510 | 40.9 | 60.3 |
| 511 | 51.3 | 53.4 |
| 512 | 61.6 | 46.5 |
| 701 | -67.3 | 54.5 |
| 702 | -57.0 | 61.4 |
| 703 | -46.6 | 68.3 |
| 704 | -34.1 | 76.7 |
| 705 | -18.7 | 76.7 |
| 706 | -6.2 | 76.7 |
| 707 | 6.2 | 76.7 |
| 708 | 18.7 | 76.7 |
| 709 | 34.1 | 76.7 |
| 710 | 46.6 | 68.3 |
| 711 | 57.2 | 61.7 |
| 712 | 67.3 | 54.5 |

| gate group | where it meets the seating | rows affected |
|---|---|---|
| 101 / 104 | side ends of the arena cross-aisle | arena rows 17-18 |
| 102 / 103 | rear corners of the arena, at the centre/wing junction of the Lower Stand front | behind arena row 34 |
| 301 / 304 | top (rear) edge of the Lower Stand wings | behind row 29 |
| 302 / 303 | top (rear) edge of the Lower Stand centre, at aisles 78/79 and 138/139 | behind row 29 |
| 501-503, 510-512 | vomitories in the Middle Stand wings | rows 11-17 |
| 504-509 | vomitories in the Middle Stand centre (504 / 509 on the junctions) | rows 11-17 |
| 701-703, 710-712 | vomitories in the Upper Stand wings | rows 6-10 |
| 704-709 | vomitories in the Upper Stand centre (704 / 709 on the junctions) | rows 6-10 |

---

## 9. Section: rake, heights, overhangs (ESTIMATED from the official cross-section render)

Method: in `img_cross-section.png` the cut face shows the stepped slabs. Pixel tracing gives 26 step levels for the Upper Stand between (189, 99) and (440, 236), 26 for the Middle Stand between (386, 304) and (634, 396), 18 for the fixed Lower Stand between (585, 437) and (748, 480) and 11 for the telescopic part between (755, 483) and (860, 513). Scale 0.0882 m/px (45 m building height = 510 px; check: stage box 21 px = 1.85 m against the official 1.8 m). Arena floor at y = 512.5 px.

| tier (rows) | rise per row | tread | angle | floor height of first row | floor height of last row |
|---|---|---|---|---|---|
| LEVEL 3 telescopic (1-11) | 0.25 (0.24 measured; maker's options 0.26 / 0.28 / 0.30) | 0.85 | about 16 deg | +0.25 | +2.75 |
| LEVEL 3 fixed (12-29) | 0.21 | 0.85 | about 14 deg | +3.1 | +6.7 (= LEVEL 3 concourse / main entrance level, about +6.6) |
| LEVEL 5 (1-26) | 0.325 | 0.85 (balcony 1.07) | about 21 deg | +10.3 | +18.4 (wing row 26); centre row 17 +15.5 |
| LEVEL 7 (1-28) | 0.483 | 0.85 | about 29.5 deg | +23.4 (centre row 1), +24.4 (wing row 3) | +36.5 (row 28) |

Formulas used in the tables: z(L3, r <= 11) = 0.25 r; z(L3, r >= 12) = 3.1 + 0.21 (r - 12); z(L5, r) = 10.3 + 0.325 (r - 1); z(L7, r) = 24.4 + 0.483 (r - 3).

Other heights read from the same image (ESTIMATED, +-1 m): LEVEL 3 floor +6.6; LEVEL 4 floor +10.1; LEVEL 5 concourse about +13.3 (level of rows 10-11, where the vomitories open); VIP BOX floor (LEVEL 6) about +18.7, box ceiling about +23.1; LEVEL 7 concourse about +24 to +25.5 (rows 5-6 level); a slab at about +28.7 (LEVEL 8); roof top about +45 at the rear, sloping down towards the stage; stage 1.8 high.

Aisle steps (ESTIMATED from the rise): LEVEL 7 three steps of 0.16 per row; LEVEL 5 two steps per row (two steps per row are visible at the balcony in the Kotobuki photo); LEVEL 3 one intermediate step per row.

Overhangs (plan): Middle Stand front edge is about 4.7 m in front of the Lower Stand's last row (covers rows 24-29 of LEVEL 3); Upper Stand wing front is about 4.8 m in front of the Middle Stand wings' last row (covers rows 21-26). Vertical clearances at those points: about 4.8 m and about 7.6 m.

Sightline plausibility: with these values the C-value per row towards the stage front is about 0.16 m (L3), 0.18 m (L5), 0.21 m (L7), reasonable for staggered seating, so the estimated rakes are self-consistent.

Front edges: LEVEL 3 fixed stand front = white wall about 3 m high; LEVEL 5 front = light concrete upstand with a round dark steel rail and (at the balcony) a translucent panel; LEVEL 7 centre front = LED "ribbon vision" fascia (62.5 m x 1 m, CONFIRMED) above the VIP boxes; dark fascia on the wings (photos).

---

## 10. Sight distances (ESTIMATED, plan reconstruction + section heights)

Horizontal distance from the stage-front centre O; "line of sight" from seated eye height (floor + 1.1) to a performer's head (stage 1.8 + 1.6).

| seat | plan position (X, Y) | horizontal | line of sight |
|---|---|---|---|
| LEVEL 1 row 1 centre | (0, 2.2) | 2.2 | about 3 |
| LEVEL 1 row 34 centre | (0, 33.2) | 33.2 | 33 |
| LEVEL 3 row 1 centre (telescopic, nearest stand seat) | (0, 36.2) | 36.2 | 36 |
| LEVEL 3 row 12 centre (nearest fixed seat) | (0, 46.1) | 46.1 | 46 |
| LEVEL 3 row 29 centre | (0, 60.6) | 60.6 | 61 |
| LEVEL 3 wing row 29 outer end | (-62.3, 38.3) | 73.2 | 73 |
| LEVEL 5 balcony row 1 centre | (0, 56.1) | 56.1 | 57 |
| LEVEL 5 row 17 centre | (0, 69.5) | 69.5 | 71 |
| LEVEL 5 wing row 26 outer end | (-71.4, 52.2) | 88.5 | 90 |
| LEVEL 7 row 1 centre | (0, 70.8) | 70.8 | 74 |
| LEVEL 7 row 28 centre | (0, 93.7) | 93.7 | 100 |
| LEVEL 7 wing row 28 outer end (farthest seat) | (-80.3, 66.3) | 104.1 | 110 |

Check: the official section render gives 32.7 m from the stage front to the front of the telescopic stand, 42.4 m to the fixed Lower Stand front, 52.3 m to the Middle Stand front, 69.8 m to the Upper Stand front and 91.9 m to its back. Fan guides only give rough statements (rear arena blocks more than 20 m away; LEVEL 5 roughly 30-50 m, which looks too low).

---

## 11. Seat product

| item | value | confidence | source |
|---|---|---|---|
| Maker | Kotobuki Seating Co., Ltd. (コトブキシーティング) | CONFIRMED | Kotobuki case study (published 2023-12-05) |
| General seat (arena + all stands) | "Lux" chair body (the upholstered variant is catalogued as Lux-M: urethane-padded high back, three-layer seat cushion with wave spring, slow self-rising tip-up seat, damper) | CONFIRMED (Lux); Lux-M variant ESTIMATED from the description | Kotobuki case study and product page |
| Upholstery | fabric on all 20,033 seats; described as sound-absorbing; covers are zip-on and replaceable; deep blue chosen to evoke the sea of Yokohama | CONFIRMED | Kotobuki, Travel Watch |
| Cup holders | 2 per seat, except some seats (press release). Photos: two black fold-out rings on the rear shell of every seat back (for the row behind); front-row seats have a black ring on a short arm beside the seat | CONFIRMED (2 per seat); mounting ESTIMATED from photos | Kotobuki, hamakore photo 32, Travel Watch photo 017 |
| Armrests | none visible between general seats; balcony and VIP seats have wooden armrests | ESTIMATED (photos) | - |
| Shell / frame | matte black moulded rear shell and seat underside; light-grey cast aluminium pivot brackets; black steel beam and legs; arena seats on black movable leg frames | ESTIMATED (photos) | - |
| Number plate | small black tag with white characters centred on the top edge of each seat back | ESTIMATED (photos) | Travel Watch 017, hamakore 14 |
| Seat centre spacing | about 0.51 m | ESTIMATED | section 3.3 |
| Row depth | about 0.85 m (users report tight legroom; maker recommends 0.90 for the telescopic version) | ESTIMATED / REPORTED | section 3.3, jcv.pages.dev |
| Indicative chair size for modelling | back top about 0.95 m above the tread, seat height 0.43 m, depth about 0.30 m folded and 0.55 m open | ESTIMATED (generic for this chair class, low confidence) | - |
| Balcony seat | "Cadenza" TS-71 series theatre chair, red fabric, wood back / armrests / end panels, black cup holder at each armrest front, about 0.57 m spacing | CONFIRMED (model, colour); spacing ESTIMATED | Kotobuki |
| VIP BOX seat | TS-71 with original waffle-weave fabric by FABRIKO in midnight blue with a "K" motif, wooden side tables, blue patterned carpet | CONFIRMED | Kotobuki, fabriko.co.jp |
| Arena movable seats | caster-type movable seats nearest the stage (a lever lowers casters, seats roll away without folding) and "Matrix System" (multi-seat frames dropped into leg-frame sockets, moved on trolleys) | CONFIRMED | Kotobuki |
| Telescopic stand | "RSP" semi-auto retractable seating, wall-fixed, in front of the Lower Stand; maker limit 12 rows for semi-auto (11 rows used) | CONFIRMED / maker spec | Kotobuki |
| Cost | about 100,000 yen per seat (chairman's remark) | REPORTED | Travel Watch |

Colours sampled from photos (ESTIMATED; white-light photos, sRGB):

| surface | approx. colour | note |
|---|---|---|
| general seat fabric | #3E5578 base (photo samples #526A90 to #6D7D96 lit, #333E50 in dim house light) | blue with a fine speckled / tweed weave |
| seat rear shell, seat pan underside, cup holders | #151411 | matte black plastic |
| seat brackets | #B8BCC0 | light grey metal |
| balcony fabric | #D73A29 | vermilion red |
| balcony / VIP wood | #33201A (balcony, dark walnut), #64392A (VIP, reddish brown) | |
| VIP fabric | #405072 | midnight blue waffle weave |
| VIP carpet | #5673AB | blue patterned |
| stand treads, arena floor | #BEADA3 to #C8B8B0 | exposed warm-grey concrete |
| Middle Stand front parapet, vomitory portals | #E2D1C9 | light warm grey |
| LED ribbon above VIP boxes | #BAE1FE on blue | with white "KEN" roundels |
| stage-end acoustic curtains | pink / magenta lit | REPORTED as sound-absorbing curtains |

---

## 12. Arena floor (LEVEL 1): layouts

| configuration | data | confidence |
|---|---|---|
| Official standard seated layout | 34 rows x up to 140 seats, 7 columns of 20, cross-aisle after row 17, 3,964 seats (section 6) | CONFIRMED |
| Ticket identification, standard layout | LEVEL 1 + gate 101-104 + row + seat (left half gates 101 / 102, right half 103 / 104) | REPORTED (fan ticket examples) |
| Block naming used by some promoters | 7 blocks across named A1-A7 (ends = 1 and 7); other guides describe "7 blocks across x 2 or 3 blocks deep" | REPORTED (kpop-concierge-japan.com, mama-premama.com) |
| Front rows removed for stage / barrier | examples: front 2 or 4 rows removed so that row 5 or row 8 becomes the first row; rows 1-17 removed for the opening ceremony | REPORTED (oshikatu-life.com, Travel Watch) |
| Extra rows | a ticket "row 38" is reported, i.e. some layouts extend beyond row 34 into the zone of the retracted centre telescopic stand | REPORTED (curious103.com) |
| Runway / centre-stage shows | arena capacity drops to about 3,500-4,000 | REPORTED (kpop-concierge-japan.com) |
| Standing | about 22,000 in total with a standing arena, about 5,900 on the floor | REPORTED / ESTIMATED |
| Base stage (permanent foundation stage) | about 22 m wide (12 ken) x 13 m deep (7 ken) x 1.8 m high; hanamichi wings of 8 ken (about 14.5 m) can be added on both sides (about 51 m in total); 8 hoist grids above the stage; 480 rigging points, 120 t total suspended load | CONFIRMED (operator press release https://www.atpress.ne.jp/news/363680; also Nikkei xTECH) |
| Stage zone width | 80 m | REPORTED (Nikkei xTECH, 2022) |

Suggested default for the model (ESTIMATED): base stage as a box X in [-11, 11] (optionally [-25.5, 25.5] with wings), Y in [-13, 0], Z in [0, 1.8]; a 3 m wide barrier zone can be created by omitting arena rows 1-2.

---

## 13. Modelling recipe

1. Use the JSON in Appendix A. For every row segment `[firstSeat, lastSeat, uStart, uEnd]` place `n = lastSeat - firstSeat + 1` seats at `u_i = uStart + (i + 0.5) * (uEnd - uStart) / n`. Convert (u, v) to (X, Y) with the part's frame (section 3.2) and use the row's z.
2. Seat orientation: centre parts face -Y; left-wing seats face the direction (sin t, -cos t); right-wing seats face (-sin t, -cos t), t = 33.6 deg.
3. Build each stand tier as stepped slabs: tread 0.85 m, riser from section 9, slab polygon per facet bounded by the outermost seat ends plus about 0.6 m, with radial aisles in the gaps between segments (stairs: 3 / 2 / 1 steps per row on L7 / L5 / L3).
4. Cut vomitory boxes where rows are shortened: L5 rows 11-17 and L7 rows 6-10 at the 12 gate positions each; portal box about 2.9 m wide, flanked by two stairs of about 1.0 m.
5. LEVEL 3 rows 1-11 are separate telescopic units (six units) standing on the arena floor in front of a 3 m high wall; make them a toggle (deployed / retracted).
6. LEVEL 5 centre: balcony terrace (3 rows, 1.07 m deep, red seats), cross-aisle, rows 6-17; behind row 17 a wall with 11 VIP box fronts at about +18.7 m and an LED ribbon above (bottom edge about +23 m).
7. Front parapets about 1.1 m high in front of the first row of L5 and L7; white 3 m wall below L3 row 12.
8. Symmetry: everything is mirror-symmetric about X = 0 (seat n on the left corresponds to seat N + 1 - n, N = 140 / 216 / 240 / 284).

---

## 14. Gaps and uncertainties

| gap | status | best estimate to use |
|---|---|---|
| Seat width, row depth | not published | 0.51 m and 0.85 m (section 3.3), +-5 % |
| Rake angles and tier heights | not published | section 9 values, +-1 m in height, +-2 deg |
| Exact position of the stage front relative to arena row 1 | stage not drawn on the seat map | stage front at Y = 0 (+-2 m); official render suggests the stage front may be up to 1.8 m closer to the stands |
| Official per-tier capacities | not published | counts of section 2; +120 VIP, +20 wheelchair |
| Wheelchair positions (number, side platforms) | only the centre platform is drawn | about 20 positions; side platforms at the top of the wings near gates 301 / 304 |
| LEVEL 3 row 29 seats 65-74 / 143-152 | label says 10 seats, bar is 12 seats long | use labels (10) |
| Whether Lower Stand rake is constant or progressive | not resolvable in the render | constant |
| VIP box seat layout | 11 rooms confirmed, seat counts from one fan guide | 10 rooms x 10 seats (2 rows of 5) + centre room 20 |
| Arena layouts per event (block names, runway shapes, standing pens) | vary; organiser documents are behind a login | section 12 |
| Sources not reachable | `https://lignea.co.jp/k-arena-yokohama-seat/` (HTTP 403), `https://document.k-arena.com/` (HTTP 401), `https://minute.jp/articles/4376` (DNS failure), Nikkei xTECH page 2 (paywall) | - |
| Ticketing-site seat charts (Pia, Lawson, eplus, Live Nation, Ticketmaster) | no venue-specific chart with more detail than the official map was found; they refer to the official map | - |

---

## 15. Sources

Official / primary:

- Seat page: https://k-arena.com/seat/
- Seat map PDF: https://k-arena.com/wp-content/themes/k-arena/assets/pdf/seat-map.pdf
- Seat map PNGs: https://k-arena.com/wp-content/themes/k-arena/assets/images/seat/img_seat_level_all.png , .../img_seat-map_level1.png , .../img_seat-map_level3.png , .../img_seat-map_level5.png , .../img_seat-map_level7.png
- Cross-section: https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png
- Floor guide: https://k-arena.com/floor (images .../assets/images/floor/img_floor_map_lv1_sp.jpg , lv3 , lv4 , lv5 , lv7)
- FAQ: https://k-arena.com/faq
- Kotobuki Seating case study: https://www.kotobuki-seating.co.jp/projects/list/detail.html?pdid1=01155
- Kotobuki Lux chair: https://www.kotobuki-seating.co.jp/products/list/detail.html?pdid1=00521
- Kotobuki Cadenza TS-71: https://www.kotobuki-seating.co.jp/products/list/detail.html?pdid1=00105
- Kotobuki telescopic stand dimensions: https://www.kotobuki-seating.co.jp/rollback_chair_stand/dimensions_rsp.html
- FABRIKO (VIP fabric): https://www.fabriko.co.jp/works/2023/12/04/1986/

Press:

- Operator press release (Ken Corporation / K-Arena Management, completion; base stage, rigging, ribbon vision, upper service vision): https://www.atpress.ne.jp/news/363680
- Nikkei xTECH (completion, stage data, section render): https://xtech.nikkei.com/atcl/nxt/column/18/00585/080100198/
- Nikkei xTECH (construction site, 80 m stage, seat layout image): https://xtech.nikkei.com/atcl/nxt/column/18/00585/040800138/
- Travel Watch preview report with photos: https://travel.watch.impress.co.jp/docs/news/1533996.html
- Hamakore photo report with row / seat captions: https://hamakore.yokohama/karena-yokohama-report/
- Oricon preview report: https://www.oricon.co.jp/news/2296012/full/
- Natalie / Joysound preview report: https://natalie.mu/music/news/542119 , https://news.joysound.com/article/542119
- Event agency data sheet: https://www.global-produce.jp/service/uniquevenue/k-arena-yokohama/

Fan / guide sites:

- https://www.ticket.co.jp/entx/?p=8312
- https://mama-premama.com/k-arina-capamiekata/
- https://yokubaringo.com/k-arena-seat/
- https://curious103.com/karena/
- https://kpop-concierge-japan.com/k-arena-yokohama-guide/
- https://jcv.pages.dev/post/k-arena
- https://stage-seats.jp/karena-seat/
- https://oshikatu-life.com/k-arena-seat-view/
- https://seat-navi.com/karena-level5-howitlooks
- https://guidebridge.jp/k-arena-yokohama-seat-view-guide/

Size check:

- OpenStreetMap way 934667675 "K-Arena Yokohama" (tags building:levels = 9, height = 45): https://www.openstreetmap.org/way/934667675

---

## Appendix A. Complete machine-readable dataset (JSON)

Per part: `rows` = list of `[rowNumber, rowLineCoordinate (Y for centre parts, v for wings), floorHeightZ, [[firstSeat, lastSeat, uStart, uEnd], ...]]`. Seat numbers and row numbers are CONFIRMED (official PDF); coordinates and heights are ESTIMATED (sections 3 and 9). Frames are defined in `frame`. Notes: the two-seat stubs (e.g. 19-20, 121-122, 69-70, 91-92) are drawn longer than two seats on the map, and the LEVEL 3 row 29 segments 65-74 / 143-152 are drawn 12 seats long; for those use the seat pitch instead of the bar length.

```json
{
"frame":{"units": "metres", "origin": "stage-front centre at arena floor level (front edge of official LEVEL 1 seating outline)", "X": "audience right (+), seat numbers increase with X", "Y": "distance from stage-front line toward the rear", "Z": "up from arena floor", "wingAngleDeg": 33.6, "apexY": -34.84, "rowTread": 0.85, "seatPitch": 0.509, "balconySeatPitch": 0.57, "LW": "P = u*(cos t, sin t) + v*(-sin t, cos t)", "RW": "P = u*(cos t, -sin t) + v*(sin t, cos t)", "C": "P = (u, v)"},
"gateMarkers":{"101":[-43.2,21.2],"102":[-22.9,34.7],"103":[22.8,34.7],"104":[43.2,21.2],"301":[-45.0,55.4],"302":[-16.7,65.2],"303":[16.7,65.2],"304":[44.9,55.4],"501":[-61.6,46.5],"502":[-51.3,53.4],"503":[-40.9,60.3],"504":[-30.6,66.6],"505":[-18.7,66.6],"506":[-6.2,66.6],"507":[6.2,66.6],"508":[18.7,66.6],"509":[30.6,66.6],"510":[40.9,60.3],"511":[51.3,53.4],"512":[61.6,46.5],"701":[-67.3,54.5],"702":[-57.0,61.4],"703":[-46.6,68.3],"704":[-34.1,76.7],"705":[-18.7,76.7],"706":[-6.2,76.7],"707":[6.2,76.7],"708":[18.7,76.7],"709":[34.1,76.7],"710":[46.6,68.3],"711":[57.2,61.7],"712":[67.3,54.5]},
"outlines":{"L1_arena_seating_zone":[[-35.7,0.0],[35.6,0.0],[43.7,14.0],[43.7,19.3],[21.0,34.5],[-21.0,34.5],[-43.7,19.3],[-43.7,14.0]],"L3_stand_zone":[[64.7,40.8],[54.2,25.0],[49.5,28.1],[43.6,19.4],[20.9,34.4],[-21.0,34.4],[-43.7,19.4],[-49.6,28.1],[-54.3,25.0],[-64.8,40.8],[-30.0,64.0],[29.9,64.0],[64.5,41.1]],"L3_wheelchair_platform":[[-12.1,60.9],[12.0,60.9],[11.3,57.7],[7.2,57.7],[7.2,60.0],[5.2,60.0],[5.2,57.7],[-5.4,57.7],[-5.4,60.0],[-7.1,60.0],[-7.1,57.7],[-11.4,57.7]]},
"parts":{
"L1/C":{"name":"LEVEL 1 arena (standard layout)","rows":[
[1,2.24,0.0,[[13,20,-35.35,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,128,31.23,35.33]]],
[2,3.18,0.0,[[13,20,-35.35,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,128,31.23,35.33]]],
[3,4.13,0.0,[[11,20,-36.37,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,130,31.23,36.34]]],
[4,5.07,0.0,[[11,20,-36.37,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,130,31.23,36.34]]],
[5,6.02,0.0,[[9,20,-37.37,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,132,31.23,37.35]]],
[6,6.96,0.0,[[7,20,-38.39,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,134,31.23,38.37]]],
[7,7.91,0.0,[[7,20,-38.39,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,134,31.23,38.37]]],
[8,8.85,0.0,[[5,20,-39.41,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,136,31.23,39.38]]],
[9,9.8,0.0,[[3,20,-40.42,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,138,31.23,40.4]]],
[10,10.75,0.0,[[3,20,-40.42,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,138,31.23,40.4]]],
[11,11.69,0.0,[[1,20,-41.44,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,140,31.23,41.42]]],
[12,12.63,0.0,[[1,20,-41.44,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,140,31.23,41.42]]],
[13,13.58,0.0,[[1,20,-41.44,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,140,31.23,41.42]]],
[14,14.53,0.0,[[1,20,-41.44,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,140,31.23,41.42]]],
[15,15.47,0.0,[[1,20,-41.44,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,140,31.23,41.42]]],
[16,16.42,0.0,[[1,20,-41.44,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,140,31.23,41.42]]],
[17,17.36,0.0,[[1,20,-41.44,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,140,31.23,41.42]]],
[18,19.59,0.0,[[2,20,-40.93,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,139,31.23,40.91]]],
[19,20.44,0.0,[[4,20,-39.91,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,137,31.23,39.89]]],
[20,21.29,0.0,[[7,20,-38.39,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,134,31.23,38.37]]],
[21,22.14,0.0,[[9,20,-37.37,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,132,31.23,37.35]]],
[22,22.99,0.0,[[12,20,-35.86,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,129,31.23,35.84]]],
[23,23.84,0.0,[[15,20,-34.33,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,126,31.23,34.3]]],
[24,24.69,0.0,[[17,20,-33.32,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,124,31.23,33.29]]],
[25,25.54,0.0,[[19,20,-32.79,-31.26],[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28],[121,122,31.23,32.77]]],
[26,26.39,0.0,[[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28]]],
[27,27.24,0.0,[[21,40,-29.3,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,120,19.09,29.28]]],
[28,28.09,0.0,[[23,40,-28.32,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,118,19.09,28.3]]],
[29,28.94,0.0,[[26,40,-26.8,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,115,19.09,26.78]]],
[30,29.79,0.0,[[28,40,-25.78,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,113,19.09,25.76]]],
[31,30.64,0.0,[[31,40,-24.26,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,110,19.09,24.24]]],
[32,31.49,0.0,[[34,40,-22.73,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,107,19.09,22.71]]],
[33,32.34,0.0,[[36,40,-21.71,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,105,19.09,21.69]]],
[34,33.19,0.0,[[38,40,-20.88,-19.12],[41,60,-17.21,-7.03],[61,80,-5.1,5.08],[81,100,7.0,17.19],[101,103,19.09,20.86]]]
]},
"L3/LW":{"name":"LEVEL 3 left wing","rows":[
[1,41.95,0.25,[[9,28,-24.4,-14.27],[29,48,-11.7,-1.57]]],
[2,42.8,0.5,[[9,28,-24.14,-14.02],[29,48,-11.96,-1.83]]],
[3,43.65,0.75,[[9,28,-24.4,-14.27],[29,48,-11.7,-1.57]]],
[4,44.5,1.0,[[9,28,-24.14,-14.02],[29,48,-11.96,-1.83]]],
[5,45.35,1.25,[[9,28,-24.4,-14.27],[29,48,-11.7,-1.57]]],
[6,46.2,1.5,[[9,28,-24.14,-14.02],[29,48,-11.96,-1.83]]],
[7,47.05,1.75,[[9,28,-24.4,-14.27],[29,48,-11.7,-1.57]]],
[8,47.9,2.0,[[9,28,-24.14,-14.02],[29,48,-11.96,-1.83]]],
[9,48.75,2.25,[[9,28,-24.4,-14.27],[29,48,-11.7,-1.57]]],
[10,49.6,2.5,[[9,28,-24.14,-14.02],[29,48,-11.96,-1.83]]],
[11,50.45,2.75,[[9,28,-24.4,-14.27],[29,48,-11.7,-1.57]]],
[12,51.93,3.1,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-11.94,-1.81],[49,56,0.47,4.54]]],
[13,52.78,3.31,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.7,-1.57],[49,56,0.71,4.8]]],
[14,53.63,3.52,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-11.94,-1.82],[49,57,0.47,5.06]]],
[15,54.48,3.73,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.7,-1.58],[49,57,0.71,5.3]]],
[16,55.33,3.94,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-11.94,-1.82],[49,58,0.47,5.57]]],
[17,56.18,4.15,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.7,-1.58],[49,58,0.71,5.82]]],
[18,57.03,4.36,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-11.94,-1.81],[49,59,0.47,6.07]]],
[19,57.88,4.57,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.7,-1.57],[49,59,0.71,6.33]]],
[20,58.74,4.78,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-12.04,-1.91],[49,60,0.47,6.58]]],
[21,59.59,4.99,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.8,-1.67],[49,60,0.71,6.84]]],
[22,60.44,5.2,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-12.04,-1.91],[49,61,0.47,7.09]]],
[23,61.29,5.41,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.8,-1.67],[49,61,0.71,7.35]]],
[24,62.14,5.62,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-12.04,-1.91],[49,62,0.47,7.6]]],
[25,62.98,5.83,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.7,-1.57],[49,62,0.71,7.87]]],
[26,63.82,6.04,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-11.94,-1.82],[49,63,0.47,8.11]]],
[27,64.67,6.25,[[1,8,-30.72,-26.65],[9,28,-24.4,-14.27],[29,48,-11.7,-1.58],[49,63,0.71,8.38]]],
[28,65.52,6.46,[[1,8,-30.46,-26.4],[9,28,-24.14,-14.02],[29,48,-11.94,-1.82],[49,63,0.47,8.12]]],
[29,66.39,6.67,[[1,8,-30.72,-26.61],[14,24,-21.86,-16.25],[29,36,-11.79,-7.72],[41,48,-5.6,-1.52],[53,62,2.67,7.77]]]
]},
"L3/C":{"name":"LEVEL 3 centre","rows":[
[1,36.15,0.25,[[79,98,-17.68,-7.54],[99,107,-5.03,-0.47],[108,116,0.14,4.69],[119,138,7.47,17.6]]],
[2,37.0,0.5,[[79,98,-17.42,-7.29],[99,107,-4.76,-0.21],[108,116,0.4,4.95],[119,138,7.21,17.35]]],
[3,37.85,0.75,[[79,98,-17.68,-7.54],[99,107,-5.03,-0.47],[108,116,0.14,4.69],[119,138,7.47,17.6]]],
[4,38.71,1.0,[[79,98,-17.42,-7.29],[99,107,-4.76,-0.21],[108,116,0.4,4.95],[119,138,7.21,17.35]]],
[5,39.56,1.25,[[79,98,-17.68,-7.54],[99,107,-5.03,-0.47],[108,116,0.14,4.69],[119,138,7.47,17.6]]],
[6,40.41,1.5,[[79,98,-17.42,-7.29],[99,107,-4.76,-0.21],[108,116,0.4,4.95],[119,138,7.21,17.35]]],
[7,41.26,1.75,[[79,98,-17.68,-7.54],[99,107,-5.03,-0.47],[108,116,0.14,4.69],[119,138,7.47,17.6]]],
[8,42.11,2.0,[[79,98,-17.42,-7.29],[99,107,-4.76,-0.21],[108,116,0.4,4.95],[119,138,7.21,17.35]]],
[9,42.96,2.25,[[79,98,-17.68,-7.54],[99,107,-5.03,-0.47],[108,116,0.14,4.69],[119,138,7.47,17.6]]],
[10,43.81,2.5,[[79,98,-17.42,-7.29],[99,107,-4.76,-0.21],[108,116,0.4,4.95],[119,138,7.21,17.35]]],
[11,44.66,2.75,[[79,98,-17.68,-7.54],[99,107,-5.03,-0.47],[108,116,0.14,4.69],[119,138,7.47,17.6]]],
[12,46.13,3.1,[[71,78,-23.82,-19.69],[79,98,-17.42,-7.29],[99,118,-5.23,4.91],[119,138,7.21,17.35],[139,146,19.62,23.75]]],
[13,46.98,3.31,[[71,78,-24.03,-19.95],[79,98,-17.68,-7.54],[99,118,-4.98,5.15],[119,138,7.47,17.6],[139,146,19.88,23.96]]],
[14,47.83,3.52,[[70,78,-24.29,-19.69],[79,98,-17.42,-7.29],[99,118,-5.23,4.91],[119,138,7.21,17.35],[139,147,19.62,24.22]]],
[15,48.68,3.73,[[70,78,-24.54,-19.95],[79,98,-17.68,-7.54],[99,118,-4.98,5.15],[119,138,7.47,17.6],[139,147,19.88,24.47]]],
[16,49.53,3.94,[[69,78,-24.8,-19.69],[79,98,-17.42,-7.29],[99,118,-5.23,4.91],[119,138,7.21,17.35],[139,148,19.62,24.73]]],
[17,50.39,4.15,[[69,78,-25.05,-19.95],[79,98,-17.68,-7.54],[99,118,-4.98,5.15],[119,138,7.47,17.6],[139,148,19.88,24.98]]],
[18,51.24,4.36,[[68,78,-25.31,-19.69],[79,98,-17.42,-7.29],[99,118,-5.23,4.91],[119,138,7.21,17.35],[139,149,19.62,25.23]]],
[19,52.09,4.57,[[68,78,-25.58,-19.95],[79,98,-17.68,-7.54],[99,118,-4.98,5.15],[119,138,7.47,17.6],[139,149,19.88,25.5]]],
[20,52.94,4.78,[[67,78,-25.82,-19.69],[79,98,-17.42,-7.29],[99,118,-5.23,4.91],[119,138,7.21,17.35],[139,150,19.62,25.74]]],
[21,53.79,4.99,[[67,78,-26.07,-19.95],[79,98,-17.68,-7.54],[99,118,-4.98,5.15],[119,138,7.47,17.6],[139,150,19.88,26.0]]],
[22,54.64,5.2,[[66,78,-26.32,-19.69],[79,98,-17.42,-7.29],[99,118,-5.23,4.91],[119,138,7.18,17.32],[139,151,19.62,26.25]]],
[23,55.49,5.41,[[66,78,-26.58,-19.95],[79,98,-17.68,-7.54],[99,118,-4.98,5.15],[119,138,7.47,17.6],[139,151,19.88,26.5]]],
[24,56.34,5.62,[[65,78,-26.82,-19.69],[79,98,-17.42,-7.29],[99,118,-5.23,4.91],[119,138,7.21,17.35],[139,152,19.62,26.75]]],
[25,57.19,5.83,[[65,78,-27.09,-19.95],[79,98,-17.68,-7.54],[99,118,-4.98,5.15],[119,138,7.47,17.6],[139,152,19.88,27.01]]],
[26,58.04,6.04,[[64,78,-27.34,-19.69],[79,89,-17.42,-11.83],[128,138,11.76,17.35],[139,153,19.62,27.27]]],
[27,58.89,6.25,[[64,78,-27.6,-19.95],[79,89,-17.68,-12.09],[128,138,12.04,17.61],[139,153,19.88,27.52]]],
[28,59.74,6.46,[[64,78,-27.34,-19.69],[79,88,-17.42,-12.34],[129,138,12.28,17.35],[139,153,19.62,27.27]]],
[29,60.59,6.67,[[65,74,-27.09,-20.98],[79,87,-17.68,-13.12],[130,138,13.05,17.6],[143,152,20.91,27.01]]]
]},
"L3/RW":{"name":"LEVEL 3 right wing","rows":[
[1,41.9,0.25,[[169,188,1.47,11.6],[189,208,14.17,24.3]]],
[2,42.75,0.5,[[169,188,1.73,11.86],[189,208,13.92,24.04]]],
[3,43.6,0.75,[[169,188,1.47,11.6],[189,208,14.17,24.3]]],
[4,44.45,1.0,[[169,188,1.73,11.86],[189,208,13.92,24.04]]],
[5,45.3,1.25,[[169,188,1.47,11.6],[189,208,14.17,24.3]]],
[6,46.15,1.5,[[169,188,1.73,11.86],[189,208,13.91,24.04]]],
[7,47.0,1.75,[[169,188,1.47,11.6],[189,208,14.17,24.3]]],
[8,47.84,2.0,[[169,188,1.73,11.86],[189,208,13.92,24.04]]],
[9,48.69,2.25,[[169,188,1.47,11.6],[189,208,14.17,24.3]]],
[10,49.54,2.5,[[169,188,1.73,11.86],[189,208,13.92,24.04]]],
[11,50.39,2.75,[[169,188,1.47,11.6],[189,208,14.17,24.3]]],
[12,51.87,3.1,[[161,168,-4.64,-0.57],[169,188,1.71,11.84],[189,208,13.92,24.04],[209,216,26.3,30.36]]],
[13,52.72,3.31,[[161,168,-4.9,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.62]]],
[14,53.57,3.52,[[160,168,-5.16,-0.57],[169,188,1.71,11.84],[189,208,13.92,24.04],[209,216,26.3,30.36]]],
[15,54.42,3.73,[[160,168,-5.4,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.61]]],
[16,55.27,3.94,[[159,168,-5.67,-0.57],[169,188,1.71,11.84],[189,208,13.92,24.04],[209,216,26.3,30.36]]],
[17,56.12,4.15,[[159,168,-5.92,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.61]]],
[18,56.97,4.36,[[158,168,-6.18,-0.57],[169,188,1.71,11.84],[189,208,13.91,24.04],[209,216,26.3,30.36]]],
[19,57.82,4.57,[[158,168,-6.43,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.62]]],
[20,58.67,4.78,[[157,168,-6.69,-0.57],[169,188,1.71,11.84],[189,208,13.92,24.04],[209,216,26.3,30.36]]],
[21,59.52,4.99,[[157,168,-6.95,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.61]]],
[22,60.37,5.2,[[156,168,-7.2,-0.57],[169,188,1.71,11.84],[189,208,13.92,24.04],[209,216,26.3,30.36]]],
[23,61.22,5.41,[[156,168,-7.45,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.61]]],
[24,62.07,5.62,[[155,168,-7.71,-0.57],[169,188,1.71,11.84],[189,208,13.91,24.04],[209,216,26.3,30.36]]],
[25,62.92,5.83,[[155,168,-7.97,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.62]]],
[26,63.77,6.04,[[154,168,-8.21,-0.57],[169,188,1.71,11.84],[189,208,13.92,24.04],[209,216,26.3,30.36]]],
[27,64.62,6.25,[[154,168,-8.48,-0.81],[169,188,1.47,11.6],[189,208,14.17,24.3],[209,216,26.55,30.61]]],
[28,65.47,6.46,[[154,168,-8.22,-0.57],[169,188,1.71,11.84],[189,208,13.92,24.04],[209,216,26.3,30.36]]],
[29,66.32,6.67,[[155,164,-7.97,-2.87],[169,176,1.42,5.49],[181,188,7.52,11.6],[193,203,16.15,21.76],[209,216,26.51,30.62]]]
]},
"L5/LW":{"name":"LEVEL 5 left wing","rows":[
[1,61.76,10.3,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,60,0.62,6.73]]],
[2,62.61,10.62,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,61,0.36,6.98]]],
[3,63.46,10.95,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,61,0.62,7.24]]],
[4,64.31,11.28,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,62,0.36,7.49]]],
[5,65.16,11.6,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,62,0.62,7.75]]],
[6,66.01,11.93,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,63,0.36,8.0]]],
[7,66.86,12.25,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,63,0.62,8.26]]],
[8,67.71,12.58,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,64,0.36,8.51]]],
[9,68.56,12.9,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,64,0.62,8.77]]],
[10,69.41,13.23,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,65,0.36,9.03]]],
[11,70.26,13.55,[[1,5,-30.83,-28.25],[12,25,-22.96,-15.82],[32,45,-10.56,-3.42],[52,62,2.13,7.73]]],
[12,71.11,13.88,[[1,5,-30.59,-28.0],[11,25,-23.23,-15.58],[31,45,-10.82,-3.17],[52,64,1.86,8.5]]],
[13,71.96,14.2,[[1,6,-30.83,-27.74],[12,26,-22.96,-15.31],[32,46,-10.56,-2.91],[51,64,1.63,8.76]]],
[14,72.81,14.53,[[1,5,-30.59,-28.0],[11,25,-23.23,-15.58],[31,45,-10.82,-3.17],[52,65,1.86,9.02]]],
[15,73.66,14.85,[[1,6,-30.83,-27.74],[12,26,-22.96,-15.31],[32,46,-10.56,-2.91],[51,65,1.63,9.28]]],
[16,74.51,15.18,[[1,5,-30.57,-28.0],[11,25,-23.21,-15.58],[31,45,-10.8,-3.17],[52,66,1.88,9.54]]],
[17,75.36,15.5,[[1,6,-30.82,-27.74],[12,26,-22.95,-15.31],[32,46,-10.55,-2.91],[51,66,1.64,9.79]]],
[18,76.21,15.83,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,68,0.36,10.49]]],
[19,77.06,16.15,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,68,0.64,10.77]]],
[20,77.91,16.48,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,68,0.36,10.49]]],
[21,78.76,16.8,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,68,0.64,10.77]]],
[22,79.61,17.12,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,68,0.36,10.49]]],
[23,80.46,17.45,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,68,0.64,10.77]]],
[24,81.31,17.78,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,68,0.36,10.49]]],
[25,82.16,18.1,[[1,8,-30.83,-26.79],[9,28,-24.5,-14.37],[29,48,-12.09,-1.96],[49,68,0.64,10.77]]],
[26,83.01,18.43,[[1,8,-30.59,-26.55],[9,28,-24.26,-14.13],[29,48,-11.85,-1.72],[49,68,0.36,10.49]]]
]},
"L5/C-balcony":{"name":"LEVEL 5 centre balcony (rows 1-3)","rows":[
[1,56.06,10.3,[[72,82,-25.95,-19.67],[91,108,-17.34,-7.07],[111,129,-5.53,5.3],[131,148,7.13,17.4],[155,165,19.72,26.0]]],
[2,57.13,10.62,[[71,82,-26.23,-19.39],[91,108,-17.63,-7.36],[111,129,-5.25,5.58],[131,148,7.41,17.68],[155,166,19.44,26.28]]],
[3,58.2,10.95,[[71,82,-26.5,-19.67],[91,108,-17.35,-7.07],[111,129,-5.53,5.31],[131,148,7.13,17.41],[155,166,19.72,26.55]]]
]},
"L5/C":{"name":"LEVEL 5 centre (rows 6-17)","rows":[
[6,60.18,11.93,[[72,86,-27.28,-19.64],[91,110,-17.38,-7.2],[111,130,-5.2,4.99],[131,150,7.25,17.43],[155,169,19.69,27.33]]],
[7,61.03,12.25,[[72,86,-27.53,-19.89],[91,110,-17.63,-7.45],[111,130,-4.93,5.25],[131,150,7.5,17.68],[155,169,19.94,27.58]]],
[8,61.88,12.58,[[71,86,-27.79,-19.64],[91,110,-17.38,-7.2],[111,130,-5.2,4.99],[131,150,7.25,17.43],[155,170,19.69,27.84]]],
[9,62.73,12.9,[[71,86,-28.03,-19.89],[91,110,-17.63,-7.45],[111,130,-4.93,5.25],[131,150,7.5,17.68],[155,170,19.95,28.08]]],
[10,63.58,13.23,[[70,86,-28.29,-19.64],[91,110,-17.38,-7.2],[111,130,-5.2,4.99],[131,150,7.25,17.43],[155,171,19.7,28.35]]],
[11,64.43,13.55,[[73,83,-27.03,-21.43],[94,107,-16.1,-8.98],[114,127,-3.4,3.73],[134,147,9.03,16.15],[158,168,21.48,27.08]]],
[12,65.28,13.88,[[71,83,-27.81,-21.18],[93,107,-16.36,-8.73],[114,128,-3.66,3.98],[134,148,8.78,16.41],[158,170,21.23,27.86]]],
[13,66.14,14.2,[[71,84,-28.05,-20.92],[94,108,-16.11,-8.47],[113,127,-3.93,3.71],[133,147,8.52,16.16],[157,170,20.97,28.1]]],
[14,66.99,14.53,[[70,83,-28.3,-21.18],[93,107,-16.36,-8.72],[114,128,-3.66,3.98],[134,148,8.77,16.41],[158,171,21.23,28.35]]],
[15,67.84,14.85,[[70,84,-28.56,-20.92],[94,108,-16.11,-8.47],[113,127,-3.93,3.71],[133,147,8.52,16.16],[157,171,20.97,28.61]]],
[16,68.69,15.18,[[69,83,-28.82,-21.18],[93,107,-16.36,-8.72],[114,128,-3.66,3.98],[134,148,8.77,16.41],[158,172,21.23,28.87]]],
[17,69.55,15.5,[[69,84,-29.05,-20.93],[87,90,-19.72,-17.58],[94,108,-16.11,-8.47],[113,128,-3.93,4.23],[133,147,8.52,16.16],[151,154,17.6,19.74],[157,172,20.98,29.12]]]
]},
"L5/RW":{"name":"LEVEL 5 right wing","rows":[
[1,61.79,10.3,[[181,192,-6.69,-0.57],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.84,30.87]]],
[2,62.64,10.62,[[180,192,-6.93,-0.32],[193,212,1.77,11.9],[213,232,14.17,24.3],[233,240,26.6,30.63]]],
[3,63.49,10.95,[[180,192,-7.2,-0.57],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.83,30.87]]],
[4,64.34,11.28,[[179,192,-7.45,-0.32],[193,212,1.77,11.9],[213,232,14.17,24.3],[233,240,26.59,30.63]]],
[5,65.19,11.6,[[179,192,-7.71,-0.57],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.84,30.87]]],
[6,66.04,11.93,[[178,192,-7.96,-0.32],[193,212,1.77,11.9],[213,232,14.17,24.3],[233,240,26.6,30.63]]],
[7,66.89,12.25,[[178,192,-8.22,-0.57],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.84,30.87]]],
[8,67.74,12.58,[[177,192,-8.46,-0.32],[193,212,1.77,11.9],[213,232,14.17,24.3],[233,240,26.59,30.63]]],
[9,68.59,12.9,[[177,192,-8.72,-0.57],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.84,30.87]]],
[10,69.44,13.23,[[176,192,-8.99,-0.32],[193,212,1.77,11.9],[213,232,14.17,24.3],[233,240,26.59,30.63]]],
[11,70.29,13.55,[[179,189,-7.69,-2.08],[196,209,3.46,10.6],[216,229,15.87,23.0],[236,240,28.29,30.88]]],
[12,71.14,13.88,[[177,189,-8.46,-1.82],[196,210,3.22,10.87],[216,230,15.62,23.27],[236,240,28.04,30.63]]],
[13,71.99,14.2,[[177,190,-8.71,-1.59],[195,209,2.95,10.6],[215,229,15.36,23.01],[235,240,27.78,30.87]]],
[14,72.84,14.53,[[176,189,-8.98,-1.82],[196,210,3.22,10.87],[216,230,15.62,23.27],[236,240,28.04,30.63]]],
[15,73.69,14.85,[[176,190,-9.24,-1.59],[195,209,2.95,10.6],[215,229,15.36,23.0],[235,240,27.78,30.88]]],
[16,74.54,15.18,[[175,189,-9.5,-1.84],[196,210,3.21,10.85],[216,230,15.62,23.25],[236,240,28.04,30.61]]],
[17,75.39,15.5,[[175,190,-9.74,-1.6],[195,209,2.95,10.59],[215,229,15.36,23.0],[235,240,27.78,30.87]]],
[18,76.24,15.83,[[173,192,-10.45,-0.32],[193,212,1.77,11.89],[213,232,14.17,24.3],[233,240,26.59,30.63]]],
[19,77.09,16.15,[[173,192,-10.73,-0.6],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.84,30.87]]],
[20,77.94,16.48,[[173,192,-10.45,-0.32],[193,212,1.77,11.9],[213,232,14.17,24.3],[233,240,26.59,30.63]]],
[21,78.79,16.8,[[173,192,-10.73,-0.6],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.83,30.87]]],
[22,79.64,17.12,[[173,192,-10.45,-0.32],[193,212,1.77,11.89],[213,232,14.17,24.3],[233,240,26.59,30.63]]],
[23,80.49,17.45,[[173,192,-10.73,-0.6],[193,212,2.01,12.14],[213,232,14.41,24.54],[233,240,26.84,30.87]]],
[24,81.34,17.78,[[173,192,-10.45,-0.32],[193,212,1.77,11.9],[213,232,14.17,24.3],[233,240,26.59,30.63]]],
[25,82.19,18.1,[[173,192,-10.73,-0.6],[193,212,2.01,12.13],[213,232,14.41,24.54],[233,240,26.83,30.87]]],
[26,83.04,18.43,[[173,192,-10.45,-0.32],[193,212,1.77,11.89],[213,232,14.17,24.3],[233,240,26.59,30.63]]]
]},
"L7/LW":{"name":"LEVEL 7 left wing","rows":[
[3,78.4,24.4,[[1,8,-30.99,-26.87],[9,28,-24.68,-14.5],[29,48,-12.23,-2.05],[49,68,0.21,10.38],[69,70,11.46,12.8]]],
[4,79.26,24.88,[[1,8,-31.23,-27.14],[9,28,-24.92,-14.77],[29,48,-12.47,-2.32],[49,68,-0.04,10.1],[69,70,11.46,12.8]]],
[5,80.11,25.37,[[1,8,-30.99,-26.87],[9,28,-24.68,-14.5],[29,48,-12.23,-2.05],[49,68,0.21,10.39]]],
[6,80.96,25.85,[[1,5,-31.23,-28.66],[12,25,-23.4,-16.28],[32,45,-10.95,-3.83],[52,68,1.48,10.11]]],
[7,81.81,26.33,[[1,5,-30.99,-28.4],[11,25,-23.66,-16.02],[31,45,-11.21,-3.57],[51,68,1.22,10.39]]],
[8,82.66,26.81,[[1,6,-31.23,-28.15],[12,26,-23.4,-15.75],[32,46,-10.96,-3.3],[52,68,1.47,10.11]]],
[9,83.51,27.3,[[1,5,-30.99,-28.4],[11,25,-23.66,-16.02],[31,45,-11.21,-3.57],[51,68,1.22,10.39]]],
[10,84.36,27.78,[[1,6,-31.23,-28.15],[11,26,-23.9,-15.75],[32,46,-10.96,-3.31],[52,68,1.47,10.11]]],
[11,85.21,28.26,[[1,8,-30.99,-26.87],[9,28,-24.65,-14.49],[29,48,-12.2,-2.04],[49,68,0.22,10.38]]],
[12,86.06,28.75,[[3,8,-30.19,-27.13],[9,28,-24.89,-14.74],[29,48,-12.44,-2.29],[49,68,-0.04,10.12],[69,72,12.39,14.44]]],
[13,86.91,29.23,[[2,8,-30.43,-26.87],[9,28,-24.65,-14.47],[29,48,-12.2,-2.02],[49,68,0.2,10.38],[69,72,12.63,14.7]]],
[14,87.76,29.71,[[3,8,-30.19,-27.13],[9,28,-24.89,-14.74],[29,48,-12.44,-2.29],[49,68,-0.04,10.11],[69,73,12.4,14.96]]],
[15,88.61,30.2,[[2,8,-30.43,-26.87],[9,28,-24.65,-14.47],[29,48,-12.2,-2.02],[49,68,0.2,10.38],[69,73,12.63,15.21]]],
[16,89.46,30.68,[[3,8,-30.19,-27.13],[9,28,-24.89,-14.74],[29,48,-12.44,-2.29],[49,68,-0.04,10.11],[69,74,12.39,15.46]]],
[17,90.31,31.16,[[2,8,-30.43,-26.87],[9,28,-24.65,-14.47],[29,48,-12.2,-2.02],[49,68,0.2,10.38],[69,74,12.63,15.72]]],
[18,91.16,31.64,[[3,8,-30.19,-27.13],[9,28,-24.89,-14.74],[29,48,-12.44,-2.29],[49,68,-0.04,10.11],[69,75,12.39,15.93]]],
[19,92.01,32.13,[[2,8,-30.41,-26.87],[9,28,-24.63,-14.47],[29,48,-12.18,-2.02],[49,68,0.22,10.38],[69,75,12.63,16.21]]],
[20,92.86,32.61,[[3,8,-30.18,-27.13],[9,28,-24.88,-14.74],[29,48,-12.43,-2.29],[49,68,-0.04,10.1],[69,76,12.39,16.48]]],
[21,93.71,33.09,[[2,8,-30.43,-26.87],[9,28,-24.65,-14.47],[29,48,-12.2,-2.02],[49,68,0.2,10.38],[69,76,12.63,16.75]]],
[22,94.56,33.58,[[3,8,-30.18,-27.13],[9,28,-24.88,-14.73],[29,48,-12.44,-2.28],[49,68,-0.04,10.11],[69,77,12.39,16.99]]],
[23,95.41,34.06,[[2,8,-30.43,-26.87],[9,28,-24.65,-14.47],[29,48,-12.2,-2.02],[49,68,0.2,10.38],[69,77,12.63,17.26]]],
[24,96.26,34.54,[[3,8,-30.18,-27.13],[9,28,-24.88,-14.73],[29,48,-12.43,-2.28],[49,68,-0.04,10.11],[69,78,12.39,17.5]]],
[25,97.11,35.03,[[2,8,-30.43,-26.87],[9,28,-24.65,-14.47],[29,48,-12.2,-2.02],[49,68,0.2,10.38],[69,78,12.63,17.76]]],
[26,97.96,35.51,[[3,8,-30.18,-27.13],[9,28,-24.88,-14.74],[29,48,-12.44,-2.29],[49,68,-0.04,10.11],[69,79,12.39,18.01]]],
[27,98.81,35.99,[[2,8,-30.43,-26.87],[9,28,-24.65,-14.47],[29,48,-12.2,-2.02],[49,68,0.2,10.38],[69,79,12.63,18.27]]],
[28,99.66,36.47,[[3,8,-30.18,-27.13],[9,28,-24.88,-14.74],[29,48,-12.44,-2.29],[49,68,-0.04,10.11],[69,80,12.39,18.53]]]
]},
"L7/C":{"name":"LEVEL 7 centre","rows":[
[1,70.79,23.43,[[91,92,-32.35,-31.08],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,194,31.08,32.36]]],
[2,71.63,23.92,[[91,92,-32.35,-31.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,194,31.08,32.36]]],
[3,72.47,24.4,[[91,92,-32.35,-31.08],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,194,31.08,32.36]]],
[4,73.32,24.88,[[91,92,-32.35,-31.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,194,31.08,32.36]]],
[5,74.16,25.37,[[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11]]],
[6,75.04,25.85,[[93,109,-29.85,-21.19],[116,129,-15.87,-8.74],[136,149,-3.43,3.69],[156,169,8.75,15.87],[176,192,21.19,29.85]]],
[7,75.89,26.33,[[93,110,-30.1,-20.95],[116,130,-16.13,-8.5],[136,150,-3.69,3.94],[155,169,8.51,16.13],[175,192,20.95,30.11]]],
[8,76.74,26.81,[[93,109,-29.85,-21.19],[115,129,-16.39,-8.74],[135,149,-3.95,3.69],[156,170,8.75,16.39],[176,192,21.19,29.85]]],
[9,77.59,27.3,[[93,110,-30.1,-20.95],[116,130,-16.13,-8.5],[136,150,-3.69,3.94],[155,169,8.51,16.13],[175,192,20.95,30.11]]],
[10,78.44,27.78,[[93,109,-29.85,-21.19],[115,129,-16.39,-8.74],[135,150,-3.95,4.2],[156,170,8.75,16.39],[176,192,21.19,29.85]]],
[11,79.28,28.26,[[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11]]],
[12,80.13,28.75,[[89,92,-34.13,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,196,32.08,34.14]]],
[13,80.98,29.23,[[89,92,-34.39,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,196,32.33,34.39]]],
[14,81.83,29.71,[[88,92,-34.64,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,197,32.08,34.64]]],
[15,82.68,30.2,[[88,92,-34.9,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,197,32.33,34.9]]],
[16,83.53,30.68,[[87,92,-35.15,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,198,32.08,35.15]]],
[17,84.38,31.16,[[87,92,-35.41,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,198,32.33,35.41]]],
[18,85.23,31.64,[[86,92,-35.66,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,199,32.08,35.66]]],
[19,86.08,32.13,[[86,92,-35.91,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,199,32.33,35.91]]],
[20,86.93,32.61,[[85,92,-36.15,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,200,32.08,36.16]]],
[21,87.78,33.09,[[85,92,-36.41,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,200,32.33,36.41]]],
[22,88.63,33.58,[[84,92,-36.66,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,201,32.08,36.66]]],
[23,89.48,34.06,[[84,92,-36.92,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,201,32.33,36.92]]],
[24,90.33,34.54,[[83,92,-37.17,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,202,32.08,37.17]]],
[25,91.18,35.03,[[83,92,-37.43,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,202,32.33,37.43]]],
[26,92.03,35.51,[[82,92,-37.68,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,203,32.08,37.68]]],
[27,92.88,35.99,[[82,92,-37.94,-32.33],[93,112,-30.1,-19.92],[113,132,-17.66,-7.47],[133,152,-5.22,4.97],[153,172,7.47,17.66],[173,192,19.92,30.11],[193,203,32.33,37.94]]],
[28,93.73,36.47,[[81,92,-38.19,-32.08],[93,112,-29.85,-19.67],[113,132,-17.4,-7.22],[133,152,-4.96,5.22],[153,172,7.22,17.4],[173,192,19.67,29.85],[193,204,32.08,38.19]]]
]},
"L7/RW":{"name":"LEVEL 7 right wing","rows":[
[3,78.4,24.4,[[215,216,-12.8,-11.46],[217,236,-10.38,-0.21],[237,256,2.05,12.23],[257,276,14.5,24.68],[277,284,26.87,30.99]]],
[4,79.26,24.88,[[215,216,-12.8,-11.46],[217,236,-10.1,0.04],[237,256,2.33,12.47],[257,276,14.77,24.92],[277,284,27.14,31.23]]],
[5,80.11,25.37,[[217,236,-10.38,-0.21],[237,256,2.05,12.23],[257,276,14.5,24.68],[277,284,26.87,30.99]]],
[6,80.96,25.85,[[217,233,-10.11,-1.48],[240,253,3.83,10.96],[260,273,16.28,23.4],[280,284,28.66,31.23]]],
[7,81.81,26.33,[[217,234,-10.38,-1.22],[240,254,3.57,11.22],[260,274,16.02,23.66],[280,284,28.4,30.99]]],
[8,82.66,26.81,[[217,233,-10.11,-1.47],[239,253,3.31,10.96],[259,273,15.76,23.4],[279,284,28.15,31.23]]],
[9,83.51,27.3,[[217,234,-10.38,-1.22],[240,254,3.57,11.22],[260,274,16.02,23.66],[280,284,28.4,30.99]]],
[10,84.36,27.78,[[217,233,-10.11,-1.47],[239,253,3.31,10.96],[259,274,15.76,23.9],[279,284,28.15,31.23]]],
[11,85.21,28.26,[[217,236,-10.38,-0.22],[237,256,2.04,12.2],[257,276,14.49,24.65],[277,284,26.87,30.99]]],
[12,86.06,28.75,[[213,216,-14.44,-12.39],[217,236,-10.12,0.04],[237,256,2.29,12.45],[257,276,14.74,24.89],[277,282,27.13,30.19]]],
[13,86.91,29.23,[[213,216,-14.69,-12.63],[217,236,-10.38,-0.2],[237,256,2.02,12.2],[257,276,14.47,24.65],[277,283,26.87,30.43]]],
[14,87.76,29.71,[[212,216,-14.95,-12.39],[217,236,-10.11,0.04],[237,256,2.29,12.44],[257,276,14.74,24.89],[277,282,27.13,30.19]]],
[15,88.61,30.2,[[212,216,-15.21,-12.63],[217,236,-10.38,-0.2],[237,256,2.02,12.2],[257,276,14.47,24.65],[277,283,26.87,30.43]]],
[16,89.46,30.68,[[211,216,-15.46,-12.39],[217,236,-10.11,0.04],[237,256,2.29,12.44],[257,276,14.74,24.89],[277,282,27.13,30.19]]],
[17,90.31,31.16,[[211,216,-15.72,-12.63],[217,236,-10.38,-0.2],[237,256,2.02,12.2],[257,276,14.47,24.65],[277,283,26.87,30.43]]],
[18,91.16,31.64,[[210,216,-15.93,-12.39],[217,236,-10.11,0.04],[237,256,2.29,12.44],[257,276,14.74,24.89],[277,282,27.13,30.19]]],
[19,92.01,32.13,[[210,216,-16.21,-12.63],[217,236,-10.38,-0.22],[237,256,2.02,12.18],[257,276,14.47,24.63],[277,283,26.87,30.41]]],
[20,92.86,32.61,[[209,216,-16.48,-12.39],[217,236,-10.1,0.04],[237,256,2.29,12.43],[257,276,14.74,24.88],[277,282,27.13,30.18]]],
[21,93.71,33.09,[[209,216,-16.74,-12.63],[217,236,-10.38,-0.2],[237,256,2.02,12.2],[257,276,14.47,24.65],[277,283,26.87,30.43]]],
[22,94.56,33.58,[[208,216,-16.98,-12.39],[217,236,-10.11,0.04],[237,256,2.29,12.44],[257,276,14.73,24.89],[277,282,27.13,30.19]]],
[23,95.41,34.06,[[208,216,-17.26,-12.63],[217,236,-10.38,-0.2],[237,256,2.02,12.2],[257,276,14.47,24.65],[277,283,26.87,30.43]]],
[24,96.26,34.54,[[207,216,-17.5,-12.39],[217,236,-10.11,0.04],[237,256,2.29,12.44],[257,276,14.73,24.89],[277,282,27.13,30.18]]],
[25,97.11,35.03,[[207,216,-17.76,-12.63],[217,236,-10.38,-0.2],[237,256,2.02,12.2],[257,276,14.47,24.65],[277,283,26.87,30.43]]],
[26,97.96,35.51,[[206,216,-18.01,-12.39],[217,236,-10.11,0.04],[237,256,2.29,12.44],[257,276,14.74,24.89],[277,282,27.13,30.19]]],
[27,98.81,35.99,[[206,216,-18.27,-12.63],[217,236,-10.39,-0.2],[237,256,2.02,12.2],[257,276,14.47,24.65],[277,283,26.87,30.43]]],
[28,99.66,36.47,[[205,216,-18.52,-12.39],[217,236,-10.11,0.04],[237,256,2.29,12.44],[257,276,14.74,24.89],[277,282,27.13,30.18]]]
]}
}}
```
