# K-Arena Yokohama (Kアリーナ横浜) — consolidated fact sheet

Single authoritative fact sheet for the digital-twin model. Compiled 2026-11-23 from the eight research reports in this folder, the geo data in `research/geo/`, and a follow-up round in which the editors opened the key drawings themselves (official cross-section, official seat map and floor maps, the designers' section and plans in the JATET journal, the Kajima site plan, a frontal exterior photo). The machine-readable version of this sheet is `research/model-spec.json`.

Where this sheet and an individual report disagree, this sheet wins. The detailed evidence stays in the reports: `official-site.md`, `organizer-tech.md`, `architecture.md`, `seatmap.md`, `exterior-site.md`, `geo-data.md`, `interior-facilities.md`, `tech-stack.md`.

## 0. Read this first

### 0.1 Confidence tags

| Tag | Meaning |
|---|---|
| **CONFIRMED** | Stated by an official or primary source (operator, developer, designer, contractor, maker), or official survey data (MLIT PLATEAU, GSI), or counted directly on the official vector seat map. |
| **REPORTED** | Credible secondary source, or a designer drawing whose digits are only partly legible. |
| **ESTIMATED** | Derived by the researchers or editors. The derivation is given. |

### 0.2 Four corrections that change the model

1. **Floor levels.** Several reports put LEVEL 5 at +17 to +18 m and LEVEL 7 at +28 to +29 m. Those readings were one storey off. The designers' section (JATET) gives 3FL +7.27, 4FL +10.07, 5FL +12.67, 6FL +18.07, 7FL +23.47, 8FL +28.42, 9FL +30.62 m above the arena floor. The escalator rise of 5,400 mm (CONFIRMED, Fujitec) is exactly 3FL to 5FL. LEVEL 4 is a low mezzanine under the front part of the Middle Stand, not a full storey.
2. **Seat-map scale.** The two seat-map reports used 0.1206 and 0.1254 m per PDF point (seat 0.49 / 0.51 m, row 0.82 / 0.85 m). Three independent anchors fix it at **0.97 x the `seatmap.md` scale**: seat spacing 0.494 m, row tread 0.8245 m. Multiply every plan coordinate of `seatmap.md` by 0.97.
3. **Where the bowl sits in the building.** Stage rear wall 17.5 m, stage front 34.7 m, seat datum 35.9 m, column line 129.46 m and eave edge 138.46 m from the stage-end facade along the axis. The fan apex (where the facet junction lines meet) lies 2.1 m inside the stage-end facade; the bowl facets are parallel offsets of the three rear facade facets.
4. **Hall plan.** The hall side walls are parallel to the outer flank walls, about 5.2 m inside them. With that, the flat floor (stands retracted) is 5,018 m2 in the model against the listed 4,950 m2, and the flat depth on the axis is 52.98 m against the dimensioned 53.0 m.

### 0.3 Coordinate frames

| Frame | Definition | Use |
|---|---|---|
| Arena frame **G** | Origin `S0` = symmetry axis x stage-end outer facade, `[139.6314284, 35.4641981]`. +Y_G along bearing 303.25 deg (stage to rear). +X_G along bearing 33.25 deg (north-east = house-left when facing the stage). Z up. | Building, facade, site. |
| Hall frame **H** | X_H = X_G. Y_H = Y_G - 34.7. Origin = centre of the stage front at arena floor level. Z = height above the arena floor. | Bowl, stage, production. |
| Seat-map frame **S** | Frame of `seatmap.md` (X_S positive toward audience right, Y_S from the seat datum). | Row-by-row seat data. |

Conversions (ESTIMATED, see section 12): `X_H = -0.97 * X_S`, `Y_H = 0.97 * Y_S + 1.2`. East / north of `S0` in metres: `E = 0.54829 X_G - 0.83629 Y_G`, `N = 0.83629 X_G + 0.54829 Y_G`; `lon = 139.6314284 + E / 90769.19`, `lat = 35.4641981 + N / 110949.11`.

House-left (low seat numbers, gates x01) is the **north-east** side (+X). House-right (high seat numbers, the Hilton bridge, the South Entrance) is the **south-west** side (-X). All elevations below are metres above the arena floor (LEVEL 1 = 1FL), which is taken as the site ground (4.18 m T.P.).

---

## 1. Identity and outline

| Item | Value | Conf. | Source |
|---|---|---|---|
| Name | Kアリーナ横浜 / K-Arena Yokohama | CONFIRMED | k-arena.com |
| Type | Music-only arena, end stage, fan-shaped house ("音楽のために造られた世界最大級の音楽アリーナ") | CONFIRMED | k-arena.com; JATET article by the designers |
| Address | 〒220-8507 神奈川県横浜市西区みなとみらい6-2-14 | CONFIRMED | k-arena.com/access |
| Precinct | ミュージックテラス (Music Terrace), Minato Mirai 21 blocks 60 / 61: arena + Hilton Yokohama + K Tower Yokohama on one site | CONFIRMED | Ken Corp releases |
| Developer / owner | 株式会社ケン・コーポレーション | CONFIRMED | notice board, Ken Corp |
| Operator | 株式会社Kアリーナマネジメント | CONFIRMED | k-arena.com/company |
| Design | General creator 野沢誠 (Ken Corp); arena 梓設計 (representative designer 永廣正邦); hotel 国建; hotel and office 鹿島建設; interiors, signage, art イリア (ILYA); theatre consultant Theatre Workshop | CONFIRMED | notice board, Kajima monthly 2024-09, Shinkenchiku 2023:10, Shotenkenchiku 2024-01, JATET |
| Contractor | 鹿島建設 横浜支店 | CONFIRMED | notice board, Kajima |
| Construction | Start 2020-08-01, completion 2023-07-31, opening 2023-09-29 | CONFIRMED | Ken Corp, k-arena.com news |
| Seats | **20,033** | CONFIRMED | k-arena.com/floor |
| Other modes | About 22,000 with a standing arena (REPORTED, Oricon); 13,000 with the Upper Stand screened off (CONFIRMED, JATET); "arena mode" 5,400 (REPORTED, global-produce.jp) | mixed | as stated |
| Floors | 9 above ground, no basement | CONFIRMED | k-arena.com/floor; Ken Corp |
| Height | About 45 m (official). Surveyed roof apex 46.18 m above ground (PLATEAU) | CONFIRMED | k-arena.com/floor; PLATEAU 2024 |
| Gross floor area, arena | 53,853 m2 (2021 announcement: about 54,090 m2) | CONFIRMED | Ken Corp development page |
| Whole complex | Site 31,793.97 m2; total floor area 118,384.78 m2; towers 99.87 m | CONFIRMED | notice board; Azusa; Kajima |
| Structure | S (steel) with partial RC and SRC; 18 steel roof trusses spanning about 112 m, about 3,400 t of roof steel; column-free bowl | CONFIRMED (system, count, weight) / REPORTED (span chain) | notice board; Kajima monthly 2021-10; JATET section |
| Roof outline | 138.46 m along the axis x 182.2 m maximum width; 152.0 m (N-S) x 149.5 m (E-W); 16,154 m2 | ESTIMATED from CONFIRMED polygon | PLATEAU LOD0 |
| Stands | Flat arena floor + three stacked stands (Lower / Middle / Upper), all seats facing the stage | CONFIRMED | k-arena.com |
| Amenities | 11 kiosks; up to 6,240 coin lockers; Lounge 5 about 400 seats; Arena Bar 7 120 seats; VIP lounge and 11 VIP BOX rooms | CONFIRMED (11 rooms: Kotobuki) | k-arena.com shop guide, FAQ |
| Sound | L-Acoustics K series, over 200 loudspeakers, permanently installed | CONFIRMED | L-Acoustics, Sony |
| Awards | 66th Kanagawa Architecture Concours, Excellence Award; IEIJ Lighting Facility Award 2025; ZEB Oriented certification | CONFIRMED / REPORTED | Azusa; JATET |

---

## 2. Site and geo

### 2.1 Position and orientation

| Item | Value | Conf. | Source / derivation |
|---|---|---|---|
| Centre (area centroid of the roof outline) | `[139.6307004, 35.4645890]` | ESTIMATED from CONFIRMED polygon | PLATEAU LOD0 |
| Axis bearing, stage to rear | **303.25 deg** (audience looks toward 123.25 deg, south-east) | ESTIMATED from CONFIRMED walls | PLATEAU: NW wall normal 303.26, stage-end normal 303.23 |
| Stage end | South-east (narrow) end. Main Entrance and the three rear facets face north-west | CONFIRMED (official floor maps + survey shape) | k-arena.com; PLATEAU |
| Ground elevation | 4.18 m T.P. (PLATEAU wall base); site ground 3.0-5.2 m T.P. | CONFIRMED | PLATEAU; GSI elevation API |
| Geoid height | 36.37 m (subtract from PLATEAU 3D Tiles ellipsoidal heights) | ESTIMATED | PLATEAU tiles vs CityGML |
| Street grid | South and west edges of the site are true E-W / N-S within 0.1 deg; the axis is rotated 56.75 deg west of north | ESTIMATED | PLATEAU, OSM |

### 2.2 Roof outline (PLATEAU, sharp corners; fillets and stage-end notch removed)

| Corner | X_G, Y_G (m) | lon, lat | Edge to next | Length (m) | Outward normal (deg) |
|---|---|---|---|---|---|
| C1 stage end, south | -21.48, 0.00 | 139.6312987, 35.4640361 | stage-end face (with a 7.05 x 7.86 m notch on the axis) | 42.38 | 123.2 |
| C2 stage end, east | 20.90, 0.00 | 139.6315546, 35.4643556 | north-east flank | 126.37 | 67.1 |
| C3 north tip | 91.25, 104.98 | 139.6310124, 35.4654046 | N facet (North Entrance side) | 60.12 | 337.1 |
| C4 | 41.30, 138.45 | 139.6304023, 35.4651936 | NW facet (Main Entrance) | 82.32 | 303.3 |
| C5 | -41.02, 138.47 | 139.6299049, 35.4645732 | W facet (South Entrance side) | 59.77 | 269.9 |
| C6 south-west corner | -90.95, 105.63 | 139.6299059, 35.4640345 | south flank | 126.43 | 179.9 |

All CONFIRMED (MLIT PLATEAU Yokohama 2024, building `14100-bldg-1007198`, aerial photogrammetry). The outline is the **roof edge**: on the N, NW and W facets it is the tip of the eave, with the columns 9 m and the walls about 18 m inside it. The full 14-vertex ring is in `model-spec.json` (`geo.footprint`). OSM way 934667675 is a coarser 7-node version (rear facet 77 m instead of 82 m); do not use it.

Width across the axis grows 1.328 m per metre of Y_G from 42.4 m at the stage end to 181.8 m at Y_G 105, then narrows to 82.3 m at the rear edge.

### 2.3 Decks, gates, bridges

| Item | Value | Conf. | Source |
|---|---|---|---|
| Arena Deck (アリーナデッキ) = LEVEL 3 | +7.27 m | REPORTED | 3FL on the JATET section; official cutaway 6.9 m |
| Plaza deck (Music Terrace Square / Plaza, hotel side) | about +5.0 m | ESTIMATED | Kajima "decks at 6 m and 4.5 m"; OSM podium height 5; Big Steps of about 15 risers lead up to the Arena Deck |
| Big Steps (ビッグステップス) | rise about 2.3 m, about 60 m wide, reddish-brown; from `[139.6298798, 35.4648917]` up to `[139.6300135, 35.4648109]` | ESTIMATED size / REPORTED position | photos; OSM |
| Precinct gates | North Gate (stairs, slope, lift; to P1), South Gate (stairs, slope, lift; wheelchair route), West Gate (landing of 高島水際線デッキ), East Gate (future link to block 62) | CONFIRMED | official precinct map, FAQ |
| Building entrances (all on LEVEL 3) | Main `[139.6302491, 35.4648307]`, North `[139.6307595, 35.4651388]`, South `[139.6301072, 35.4643248]` | CONFIRMED existence / ESTIMATED positions (+-3 m main, +-10 m sides) | official floor map; positions on the LEVEL 3 wall line |
| Bridge to Hilton Yokohama | on LEVEL 5 (+12.67), W facet; glazed, red exposed truss, about 18 x 3 x 3.5 m | CONFIRMED level (official L5 map) / ESTIMATED size | k-arena.com; photos |
| 高島水際線デッキ | city footbridge, 130.4 m long, 6.0 m wide, max span 69.4 m, opened 2025-03-27; lands at the West Gate by K Tower | CONFIRMED | Yokohama City |
| Parking / service | P1 parking and all truck circulation are at ground level under the deck; P1 entrance on the north facade | CONFIRMED | k-arena.com/access; JATET |

### 2.4 Neighbours (details and footprints in `model-spec.json`)

| Building | Plan | Height | Conf. | Look |
|---|---|---|---|---|
| Hilton Yokohama | 62.6 x 33.0 m (OSM), east face 8 m from the arena roof edge | 99.87 m, B1 + 26F | CONFIRMED height / REPORTED footprint | white piers and blue-grey glass in vertical stripes, 3-storey brick-and-white podium with mansard roofs |
| K Tower Yokohama | 43.4 x 32.0 m (Kajima) | 99.87 m, B1 + 21F | CONFIRMED | dark blue-black glass with white fins |
| Low-rise annex north of the Hilton | about 29 x 21 m | 21.4 m (walls 18.65 m) | CONFIRMED (PLATEAU) | white pilasters, dark hipped roof |
| Podium / deck | 7,241 m2 polygon (OSM) | +5.0 m (plaza), +7.27 m (Arena Deck) | REPORTED / ESTIMATED | pavers, railings, brick lift towers |

The Hilton and the K Tower are **not** in PLATEAU 2024; model them. Everything else around the site (84 PLATEAU footprints with heights, roads, the Takashima freight line 60-100 m to the north-west, 高島水際線公園, the Katabira river mouth, 308 trees) is in `research/geo/site-context.geojson`.

---

## 3. Exterior massing and facade

### 3.1 Massing in one paragraph

A hexagonal fan. The narrow stage end faces south-east. Two sheer white flank walls (125.5 m each) diverge at 67.2 deg. The wide rear is closed by three facets (N 60.1 m, NW 82.3 m, W 59.8 m at the eave edge) that carry the signature element: a huge upward-tilted eave projecting 9 m beyond a row of 24 square columns 30 m tall, like a temple portico. A glass box 46 m wide stands in the middle of the NW facet (Main Entrance, Lounge 5, VIP lounge, Arena Bar 7). The roof is a single faceted plane, highest above the rear colonnade (45 m) and falling about 5 deg to about 36 m at the stage end.

### 3.2 Rear facets (N, NW, W)

| Element | Value | Conf. | Source / derivation |
|---|---|---|---|
| Eave projection beyond the columns | 9,000 mm | CONFIRMED | Shinkenchiku 2023:10 |
| Columns | 1,200 mm square SRC, 30 m high above the deck (+7.27 to +37.3) | CONFIRMED size / ESTIMATED levels | Shinkenchiku 2023:10; JATET section |
| Column count | **24** = 10 on the NW facet + 7 on each side facet | ESTIMATED (counted by the editors on the Concours photo) | architecture.md said 24, exterior-site.md about 25 |
| Column pitch | 8.54 m on the NW facet (76.9 m column line / 9 bays), about 8.0 m on the side facets | ESTIMATED | PLATEAU geometry; notice-board grid |
| Eave soffit | +37.3 at the column line rising about 22 deg to +40.9 under the tip; top of lip +41.8 | ESTIMATED / CONFIRMED (lip top, PLATEAU 41.6-42.1) | JATET section; PLATEAU LOD2 |
| Roof skirt behind the lip | mid-grey standing seam, from +41.8 at 4.8 m inside the tip to the ridge +45.0 at 9 m inside | CONFIRMED (PLATEAU) | PLATEAU LOD2 |
| LEVEL 3 wall line | about 18.0 m inside the eave edge (9 m behind the column line) | ESTIMATED | JATET 3F / 5F plans 18.4-18.6; official cutaway 18.2 |
| Wall bands, bottom to top | 0 to 7.27 podium / under-deck storeys; 7.27 to 12.67 entrance storey (light-grey flat metal panels, black-framed door bays, some glazing, outdoor locker banks); 12.67 to 18.07 continuous two-tier glazed band (5F concourse); 18.07 to 31.3 white horizontally ribbed wall leaning outward about 7.4 m, with long dark strip windows at 7F (about +24.5 to +25.7, one per column bay) and short slots lower down; 31.3 to 37.3 junction with the soffit | ESTIMATED | Concours photo, official cutaway, JATET levels. The official cutaway starts the lean lower (about +11.3) |
| Glass box | 46 m wide, about 9.8 m deep, from the deck (+7.27) to about +32.0; glass face about 0.8 m outside the column centre line, so 6 columns stand inside the glazing and rise out of its roof; storey lines at 12.67 / 18.07 / 23.47 / 28.42; door storey 5.4 m with 5-6 door bays; dark mullions at about 1.5 m with projecting fins | ESTIMATED | Concours photo; JATET section and 5F plan |
| Roof sign | "K-Arena", white serif channel letters on a steel frame on the roof skirt above the glass box; about 18.3 m wide x 3.7 m high | ESTIMATED | Concours photo |
| Entrance sign | "K-Arena" over the central door bay, about 3.9 x 0.8 m | ESTIMATED | photo |

Column centre positions and the LEVEL 3 wall polygon are in `model-spec.json` (`facade.columns.positions_G`, `facade.rearWall.l3WallPolygon_G`).

### 3.3 Flanks and stage end

| Element | Value | Conf. | Source |
|---|---|---|---|
| Flank walls | 125.5 m each, vertical on the roof edge; parapet 33.0 m (stage end) rising to 39.2 m (south-west corner) and 33.3 m to 40.3 m (north tip) | CONFIRMED | PLATEAU LOD2 |
| Flank cladding | flat matte white panels, stacked grid about 2.2 x 3.0 m, thin dark joints, no windows | ESTIMATED | photos; notice-board elevations |
| Flank details | ribbed triangular wedge (stand underside) at the fan end under the eave prow; one recessed opening about 10 x 13 m with two open service galleries about 40 m from the stage-end corner; dark louvre band about 3 m high over a dark blue-grey ground storey | ESTIMATED | photos |
| Stage-end face | 42.4 m wide, parapet 33.0-33.3 m, small rounded corners, 7.05 x 7.86 m notch on the axis; low roof strip 12.1 m deep with rooftop plant | CONFIRMED | PLATEAU |
| Backstage block | 17.5 m deep (bays 4.6 + 8.1 + 4.8 m) behind the stage rear wall | REPORTED | JATET section |
| Truck doors | five large entrances for 11 t trucks: both sides of the arena, stage rear, audience rear | CONFIRMED (JATET) / positions ESTIMATED | JATET; notice-board south elevation |

### 3.4 Roof (CONFIRMED, PLATEAU LOD2, heights above ground 4.18 m T.P.)

| Point | X_G, Y_G | Height (m) |
|---|---|---|
| Apex (on the axis, above the column line) | 0.2, 129.6 | 46.18 |
| Raised roof, rear corners | +-38.3, 129.5 | 44.9 / 45.3 |
| Raised roof, widest corners | +-81, 101.5 | 42.6 / 42.8 |
| Raised roof, stage end (corners / centre) | +-22.3, 12.1 / 0, 12.1 | 35.5-35.7 / 36.6 |
| Roof edge, rear corners (eave lip) | +-41.2, 138.5 | 41.6 / 42.1 |
| Roof edge, widest corners | -91.0, 105.6 / 91.3, 105.0 | 39.2 / 40.3 |
| Roof edge, stage end | +-21.5, 0.7 | 33.0 / 33.3 |

Mean fall along the axis 4.65 deg. Standing-seam metal, light grey on the main planes, mid grey on the skirts. The official height is "約45 m" and the designers' section reads about 45.0 m above 1FL; the surveyed apex of 46.18 m probably includes the roof-sign frame or survey error (see section 15).

### 3.5 Night appearance

RGB wash of the eave soffit from the column heads (default warm white; red-orange and pink scenes exist), columns lit up and down, strip windows glowing cyan, glass box warm white to amber with a red-orange base from the foyer, roof sign lit white. Light-up of the eave designed by Color Kinetics Japan (CONFIRMED credit, Shotenkenchiku 2024-01); everything else ESTIMATED from photos.

---

## 4. Levels and vertical circulation

### 4.1 Floor levels

| Level | Elevation (m) | What is there | Conf. | Source |
|---|---|---|---|---|
| LEVEL 1 (1FL) | 0.00 | ARENA floor; arena foyer / concourse behind the rear diagonals and under the Lower Stand; gates 101-104; truck lanes, stage-rear dock; P1 parking under the deck outside | CONFIRMED (datum) | official |
| LEVEL 2 (2FL) | 3.73 | not public, back of house | REPORTED | JATET section chain 3,730 |
| LEVEL 3 (3FL) | **7.27** | Arena Deck outside; Main / North / South Entrance; main foyer; top of the LOWER STAND; gates 301-304; wheelchair platform | REPORTED | JATET chain 7,270; official cutaway 6.9 |
| LEVEL 4 (4FL) | 10.07 | mezzanine under the front part of the Middle Stand: toilets, lockers 4A / 4B, smoking rooms | REPORTED | JATET chain +2,800; official cutaway 10.0 |
| LEVEL 5 (5FL) | **12.67** | MIDDLE STAND concourse and vomitories 501-512; Lounge 5; kiosks 5A-5D; bridge to the Hilton | REPORTED, tied to a CONFIRMED number | 3FL + 5,400 = escalator rise (Fujitec) |
| LEVEL 6 (6FL) | 18.07 | VIP K-Arena: lounge, lobby, 11 VIP BOX rooms (contract holders only); top row of the Middle Stand wings | REPORTED | JATET chain +5,400 |
| LEVEL 7 (7FL) | **23.47** | UPPER STAND concourse and vomitories 701-712; Arena Bar 7; kiosks 7A-7C | REPORTED | JATET chain +5,400; grid height "25 m = 7th floor" (Yamaha SS) |
| LEVEL 8 (8FL) | 28.42 | not public | REPORTED | JATET chain +4,950 |
| LEVEL 9 (9FL) | 30.62 | not public: plant, pin-spot gallery access; truss bearing at the stage end | REPORTED | JATET chain +2,200 |
| Roof ridge | 45.0 | | CONFIRMED | official "約45 m" |

The digits of the JATET dimension chain are small and partly blurred; the values above were read as 3,730 / 3,540 / 2,800 / 2,600 / 5,400 / 5,400 / 4,950 / 2,200 and checked by pixel scaling against the legible 53,000 dimension (+-0.3 m) and against the official cutaway (6.9 / 10.0 / 12.3 / 18.1 / 23.7 / 29.1).

### 4.2 Vertical circulation

| Element | Value | Conf. | Source |
|---|---|---|---|
| Escalators | 4 units in 2 locations (an up / down pair on each side just inside the Main Entrance), LEVEL 3 to LEVEL 5 only; rise 5,400 mm, 30 deg, step width 1,000 mm; blue under-handrail lighting | CONFIRMED | Fujitec project page; official FAQ and floor maps |
| Elevators | 5 units, serve all floors, staff-controlled, not on the public maps; positions unknown | CONFIRMED (count) | Fujitec; official FAQ |
| Grand stair | red stair in the main foyer directly behind the wheelchair platform, between gates 302 and 303, labelled LEVEL 1-3-4-5; plus two flanking stairs with the same label | CONFIRMED | official L3 map |
| Stairs LEVEL 1-3 | 4 at the rear of the arena concourse | CONFIRMED | official L1 map |
| Stairs LEVEL 3-4-5 | 4 behind gates 505-508 | CONFIRMED | official L5 map |
| Stairs LEVEL 3-5-7 | 6: one at the far end of each wing, one on each diagonal, one each side of the rear centre | CONFIRMED | official maps |
| LEVEL 5 to LEVEL 7 | stairs only, 10.8 m (about 64 steps), plus about 1.9 m of steps inside each Upper Stand vomitory | REPORTED / ESTIMATED | JATET levels; fan reports "about 90 steps" |
| Lower Stand access | entered from the top (LEVEL 3) through gates 301-304; LEVEL 1 and LEVEL 3 also connect inside the bowl by the aisle stairs | CONFIRMED / REPORTED | official maps; fan report |

---

## 5. Hall geometry in plan and section

### 5.1 Station chain along the axis

| Station | Y_G (m) | Y_H (m) | Conf. | Basis |
|---|---|---|---|---|
| Stage-end outer facade (`S0`) | 0.0 | -34.7 | CONFIRMED | PLATEAU |
| Fan apex A (facet junction lines meet) | 2.1 | -32.6 | ESTIMATED | 16.8 deg bisectors through the surveyed rear corners C4 / C5 |
| Stage rear wall, hall side | 17.5 | -17.2 | REPORTED | JATET section bays 4.6 + 8.1 + 4.8 |
| Upstage edge of the basic stage | 22.0 | -12.7 | ESTIMATED | front minus 12.7 m |
| **Stage front** | 34.7 | 0.0 | ESTIMATED (+-1.5) | 17.2 m from the rear wall on the JATET section |
| Seat datum (front edge of the L1 seating outline) | 35.9 | 1.2 | ESTIMATED (+-1) | section 12 |
| Arena row 1 / row 17 / row 18 / row 34 | 38.07 / 52.74 / 54.90 / 68.09 | 3.37 / 18.04 / 20.20 / 33.39 | ESTIMATED | seat map x 0.97 |
| Front edge of the telescopic stand = end of the flat floor | 70.5 | 35.8 | REPORTED | "53,000" from the stage rear wall (JATET) |
| Lower Stand row 1 / 11 / 12 / 29 | 70.97 / 79.22 / 80.65 / 94.67 | 36.27 / 44.52 / 45.95 / 59.97 | ESTIMATED | seat map x 0.97 |
| Middle Stand balcony row 1 / row 6 / row 17 | 90.28 / 94.27 / 103.36 | 55.58 / 59.57 / 68.66 | ESTIMATED | seat map x 0.97 |
| Upper Stand row 1 / row 28 | 104.57 / 126.82 | 69.87 / 92.12 | ESTIMATED | seat map x 0.97 |
| LEVEL 3 rear wall (outside the glass box) | 120.46 | 85.76 | ESTIMATED | 18.0 m inside the eave edge |
| Column line | 129.46 | 94.76 | ESTIMATED from CONFIRMED | eave edge minus 9,000 mm; JATET 17.5 + 112.0 |
| Glass box face | 130.26 | 95.56 | ESTIMATED | photo |
| Rear eave edge (`R0`) | 138.46 | 103.76 | CONFIRMED | PLATEAU |

### 5.2 Plan

| Item | Value | Conf. | Source / derivation |
|---|---|---|---|
| Shape | Not a curved fan. Three straight facets per tier: a centre facet with rows perpendicular to the axis and two wing facets rotated **33.6 deg** toward the stage. Junction lines at 16.8 deg through the apex A | CONFIRMED (official vector seat map) | seat-map text and bar rotation |
| Relation to the building | Facade facets step by 33.3 / 33.8 deg; flank walls are perpendicular to the wing rows; opening angle between the flank walls 67.2 deg | CONFIRMED (PLATEAU) | geo-data.md |
| Hall side walls | parallel to the flank walls; wall face about 5.2 m inside the outer face; technical galleries about 2.8 m deep in front of it. Half width of the wall face at station Y_G = 14.96 + 0.664 Y_G; gallery fronts 11.6 + 0.664 Y_G; outer walls 21.2 + 0.664 Y_G | ESTIMATED | JATET 5F plan (hall line 8 m inside the outer face, 46.3 m between gallery fronts at the stage wall); floor-area check |
| Stage rear wall width | 53.2 m (wall face), 46.4 m between gallery fronts | ESTIMATED | model; JATET 5F plan 46.3; organizer-tech.md 45 +-4 |
| Hall width at the stage front | 76.0 m (wall face). Kajima / Nikkei: "stage width 80 m" | ESTIMATED / REPORTED | model |
| Flat floor, stands retracted | polygon (H): (+-26.58, -17.2), (+-54.51, 24.87), (+-23.53, 45.46); 5,018 m2; 62.7 m deep on the axis; 109 m maximum width | ESTIMATED | model |
| Flat floor, telescopic rows deployed | polygon (H): (+-26.58, -17.2), (+-49.16, 16.81), (+-20.61, 35.78); 3,899 m2; 52.98 m deep; 98.3 m maximum width | ESTIMATED | model |
| Listed floor area / depth | 4,950 m2 (REPORTED, global-produce.jp); 53,000 mm flat depth (REPORTED, JATET section) | REPORTED | both reproduced by the model within 1.4 % and 0.02 m |
| Floor | fully flat exposed sealed concrete, 3 t/m2, 11 t trucks and forklifts drive on it without protection | CONFIRMED | Theatre Workshop; JATET; operator release |

### 5.3 Stage-end and side-wall galleries (演出用バルコニー)

| Item | Value | Conf. | Source |
|---|---|---|---|
| Gallery levels | 4, at +7.27 / +12.67 / +18.07 / +23.47 (3FL / 5FL / 6FL / 7FL), U-shaped: stage rear wall plus both side walls | REPORTED | JATET section; official cutaway 7.7 / 13.2 / 18.7 / 24.3 |
| Curtains | full-height pleated curtains behind the three lower galleries plus one band at arena level behind the stage; opening them changes reverberation time by 0.3-0.4 s; reflective walls behind | CONFIRMED (function) / ESTIMATED (which bands) | JATET article; photos |
| Depth, guard | about 2.8 m deep, black steel handrail 1.1 m; pale concrete walkway, dark grey steel | ESTIMATED | photos |
| Side-gallery ends | where the side wall meets the wing front of the stand at that level: Y_H about 24.9 (3F), 34.6 (5F, 6F), 47.9 (7F) | ESTIMATED | reconstructed plan |
| Lowest fascia | black band with about 11 round ports (0.5 m) per side, taken to be air-supply nozzles | ESTIMATED | photos |
| Uses | dancers have performed on them; lighting clamps on the handrails; power for touring follow spots on the side galleries | CONFIRMED | JATET article |

### 5.4 Section

| Item | Value | Conf. | Source |
|---|---|---|---|
| Roof truss, bottom chord | +30.7 at the stage rear wall rising to +39.3 at the column line (0.0768 m per m) | ESTIMATED (+-0.7) | scaled from the JATET section |
| Roof truss, top chord | +35.1 at the stage rear wall to +45.0 at the column line; depth 4.4 to 5.7 m | ESTIMATED / REPORTED (45.0) | JATET section |
| Trusses | 18, spanning about 112 m from the stage wall to the rear column line | CONFIRMED count / REPORTED span | Kajima; JATET chain 53.0 + 59.0 |
| Lifting grids, parked | about +25 m ("7th floor"), can be lowered to the floor | CONFIRMED | Yamaha Sound Systems |
| Listed ceiling height | 26 m | REPORTED | global-produce.jp |
| Ceiling look | everything matte black: trusses, grating catwalks, absorber panels about 0.9 x 1.8 m hung inside the truss depth, a regular field of round LED downlights | CONFIRMED (absorbers, catwalks) / ESTIMATED (look) | Bestec; JATET; photos |
| Clearance above the last row | truss bottom +39.2 over row-28 floor +36.47 = 2.7 m | ESTIMATED | model |
| Roof build-up | double folded-plate roof with absorber between, thin concrete panel with air gap (sound insulation) | CONFIRMED | JATET article |

### 5.5 Viewing distances (ESTIMATED from the reconciled plan; no official figure exists)

| From the stage front centre to | Horizontal (m) | Line of sight (m) |
|---|---|---|
| Arena row 1 / row 34 | 3.4 / 33.4 | 3.5 / 33 |
| Lower Stand row 1 / row 12 / row 29 (centre) | 36.3 / 46.0 / 60.0 | 36 / 46 / 60 |
| Middle Stand balcony row 1 / row 17 (centre) | 55.6 / 68.7 | 56 / 70 |
| Upper Stand row 1 / row 28 (centre) | 69.9 / **92.1** | 73 / 98 |
| Farthest seat (Upper Stand wing, row 28, outer end) | **101.8** | 107 |

---

## 6. Tiers, blocks, rows, seats

### 6.1 Capacity

| Tier | Level | Rows | Seat numbers | Seats | Conf. |
|---|---|---|---|---:|---|
| ARENA, official standard layout | LEVEL 1 | 34 | 1-140 | 3,964 | CONFIRMED (counted on the official vector seat map) |
| LOWER STAND, telescopic rows | LEVEL 3 | 1-11 | 9-48, 79-138, 169-208 | 1,518 | CONFIRMED count; "telescopic" CONFIRMED by Kotobuki, row split ESTIMATED |
| LOWER STAND, fixed rows | LEVEL 3 | 12-29 | 1-216 | 3,460 | CONFIRMED |
| MIDDLE STAND (incl. 235 balcony seats) | LEVEL 5 | wings 1-26; centre 1-3 and 6-17 | 1-240 | 4,372 | CONFIRMED |
| UPPER STAND | LEVEL 7 | centre 1-28; wings 3-28 | 1-284 | 6,579 | CONFIRMED |
| **Seats on the official map** | | | | **19,893** | CONFIRMED (re-added by the editors) |
| VIP BOX seats (11 rooms) | LEVEL 6 | 2 per box | - | 120 | REPORTED (organiser room 20, ten corporate rooms of 10) |
| Wheelchair positions | LEVEL 3 | platform | - | 20 | ESTIMATED (remainder) |
| **Total** | | | | **20,033** | CONFIRMED (official) |

L1 + L3 + L5 + VIP = 13,434, which matches the "13,000" mode with the Upper Stand closed.

### 6.2 Tier geometry

Radii are apothems from the fan apex A (perpendicular distance to the row line; the same on the centre and wing facets). Subtract 32.6 m to get Y_H on the centre facet.

| Tier | Front row apothem (m) | Back row apothem (m) | Front / back row floor (m) | Rise per row (m) | Rake (deg) | Tread (m) | Conf. |
|---|---|---|---|---|---|---|---|
| ARENA | 35.97 | 65.99 | 0 / 0 | 0 | 0 | 0.917 (rows 1-17), 0.8245 (rows 18-34); cross-aisle 2.16 between rows 17 and 18 | ESTIMATED |
| LOWER, telescopic 1-11 | 68.86 | 77.11 | 0.25 / 2.75 | 0.25 | 16.9 | 0.8245 | ESTIMATED |
| LOWER, fixed 12-29 | 78.54 | 92.57 | 3.10 / 7.10 | 0.235 | 15.9 | 0.8245 | ESTIMATED |
| MIDDLE | 88.17 | 108.67 (wing row 26); 101.26 (centre row 17) | 10.20 / 18.10 (centre row 17: 15.26) | 0.316 | 21.0 | 0.8245; balcony rows 1.04 | ESTIMATED |
| VIP box seats | 102.8 | 103.85 | 17.37 / 17.72; room floor 18.07 | 0.35 | 18.6 | 1.04 | ESTIMATED |
| UPPER | 102.46 (centre row 1); 104.20 (wing row 3) | 124.71 | 23.43 / 36.47 (wing row 3: 24.40) | 0.483 | 30.4 | 0.8245 | ESTIMATED |

Row elevation formulas: Lower telescopic `z = 0.25 r`; Lower fixed `z = 3.10 + 0.2353 (r - 12)`; Middle `z = 10.20 + 0.316 (r - 1)`; Upper `z = 23.43 + 0.483 (r - 1)`.

Other bowl facts:

| Item | Value | Conf. | Source |
|---|---|---|---|
| Seat spacing | 0.494 m (balcony and VIP 0.553 m); 20-seat block 9.87 m | ESTIMATED | seat map x 0.97 |
| Stagger | stand rows are staggered by half a seat (千鳥配置) | CONFIRMED | Kotobuki; visible on the seat map |
| Radial aisles | about 1.9-2.2 m as drawn (1.7-2.0 m on a frontal photo); central steel handrails | ESTIMATED | seat map; photos |
| Overhangs | Middle front is about 4.8 m in front of the Lower Stand last row; Upper wing front about 4.8 m in front of the Middle wing last row; in the centre the Upper Stand starts 1.2 m behind Middle row 17, above the VIP boxes | ESTIMATED | reconstructed plan; official cutaway 4.7 / 4.8 |
| Lower Stand front | rows 1-11 are seven retractable units (Kotobuki RSP, semi-automatic, wall-stored) with black side cheeks; fixed row 12 stands on a wall about 3 m high | CONFIRMED (product) / ESTIMATED (heights) | Kotobuki; photos |
| Wheelchair platform | rear centre of the Lower Stand, replaces rows 26-29 of block 99-118, about 23 x 3 m, at the LEVEL 3 concourse level | CONFIRMED position / ESTIMATED size | official maps |
| Balcony seating | Middle Stand centre rows 1-3, 235 seats, wider red seats; cross-aisle behind (no rows 4-5 in the centre) | CONFIRMED | Kotobuki; official news 2026-08-31 |
| VIP boxes | 11 glass-fronted rooms behind centre rows 6-17 of the Middle Stand, under the Upper Stand front; band about 60 m wide; room floor +18.07, ceiling about +23.1 | CONFIRMED (11) / ESTIMATED | Kotobuki; official seat map; cutaway |
| Vomitories | Middle: 12 gates (501-512) cutting rows 11-17, floor +12.67; Upper: 12 gates (701-712) cutting rows 6-10, concourse +23.47, mouth at about +25.4; portal about 2.9 m wide flanked by stairs | CONFIRMED (rows) / ESTIMATED (sizes) | official seat map; photos |
| Parapets | cream solid parapets about 1.1 m at the Middle and Upper fronts; ribbon LED on the Upper centre front | ESTIMATED / CONFIRMED (ribbon) | photos; operator release |

### 6.3 Numbering rules (CONFIRMED on the official maps)

- Tickets read `LEVEL n / GATE nnn / 列 (row) / 番 (seat)`. Gate first digit = level; gates are numbered from house-left.
- Row 1 is always nearest the stage.
- Seat numbers run continuously across a whole level from house-left to house-right (left wing, centre, right wing). There are no block letters; the block ids below are the researchers' own.
- Standard block width is 20 seats. Wedge blocks at the facet junctions grow by one seat every two rows.

### 6.4 Block table

Angles are azimuths at the stage-front centre from the axis, negative toward house-left (north-east), positive toward house-right; they are ESTIMATED (+-2 deg). Seat counts and row numbers are CONFIRMED (official vector seat map).

| Tier | Block | Facet | Seat numbers | Rows | Seats in first / last row | Seats | Start / end angle (deg) | Front row ends X_H, Y_H (m) |
|---|---|---|---|---|---|---:|---|---|
| L1 Arena | A1 | centre | 1-20 | 1-25 | 8 / 2 | 351 | -84.38 / -83.65 | (34.29, 3.37) to (30.32, 3.37) |
| L1 Arena | A2 | centre | 21-40 | 1-34 | 20 / 3 | 611 | -83.23 / -79.69 | (28.42, 3.37) to (18.55, 3.37) |
| L1 Arena | A3 | centre | 41-60 | 1-34 | 20 / 20 | 680 | -78.58 / -63.68 | (16.69, 3.37) to (6.82, 3.37) |
| L1 Arena | A4 | centre | 61-80 | 1-34 | 20 / 20 | 680 | -55.71 / 55.61 | (4.95, 3.37) to (-4.93, 3.37) |
| L1 Arena | A5 | centre | 81-100 | 1-34 | 20 / 20 | 680 | 63.59 / 78.56 | (-6.79, 3.37) to (-16.67, 3.37) |
| L1 Arena | A6 | centre | 101-120 | 1-34 | 20 / 3 | 611 | 79.68 / 83.23 | (-18.52, 3.37) to (-28.4, 3.37) |
| L1 Arena | A7 | centre | 121-140 | 1-25 | 8 / 2 | 351 | 83.65 / 84.38 | (-30.29, 3.37) to (-34.27, 3.37) |
| L3 Lower, telescopic | 3L-b | left-wing | 9-28 | 1-11 | 20 / 20 | 220 | -62.49 / -51.14 | (42.23, 22) to (34.05, 27.43) |
| L3 Lower, telescopic | 3L-c | left-wing | 29-48 | 1-11 | 20 / 20 | 220 | -47.97 / -34.78 | (31.97, 28.81) to (23.79, 34.25) |
| L3 Lower, telescopic | 3C-b | centre | 79-98 | 1-11 | 20 / 20 | 220 | -25.31 / -11.4 | (17.15, 36.27) to (7.31, 36.27) |
| L3 Lower, telescopic | 3C-c | centre | 99-118 | 1-11 | 18 / 18 | 198 | -7.66 / 7.15 | (4.88, 36.27) to (-4.55, 36.27) |
| L3 Lower, telescopic | 3C-d | centre | 119-138 | 1-11 | 20 / 20 | 220 | 11.3 / 25.21 | (-7.25, 36.27) to (-17.07, 36.27) |
| L3 Lower, telescopic | 3R-b | right-wing | 169-188 | 1-11 | 20 / 20 | 220 | 34.65 / 47.87 | (-23.68, 34.26) to (-31.86, 28.83) |
| L3 Lower, telescopic | 3R-c | right-wing | 189-208 | 1-11 | 20 / 20 | 220 | 51.04 / 62.41 | (-33.94, 27.45) to (-42.12, 22.01) |
| L3 Lower, fixed | 3L-a | left-wing | 1-8 | 12-29 | 8 / 8 | 144 | -62.95 / -59.5 | (52.49, 26.81) to (49.2, 28.98) |
| L3 Lower, fixed | 3L-b | left-wing | 9-28 | 12-29 | 20 / 11 | 351 | -57.49 / -47.73 | (47.38, 30.2) to (39.2, 35.63) |
| L3 Lower, fixed | 3L-c | left-wing | 29-48 | 12-29 | 20 / 16 | 356 | -45.6 / -34.82 | (37.52, 36.75) to (29.34, 42.18) |
| L3 Lower, fixed | 3L-d | left-wing | 49-63 | 12-29 | 8 / 10 | 209 | -32.35 / -27.97 | (27.5, 43.41) to (24.21, 45.59) |
| L3 Lower, fixed | 3C-a | centre | 64-78 | 12-29 | 8 / 10 | 209 | -26.7 / -22.57 | (23.11, 45.95) to (19.1, 45.95) |
| L3 Lower, fixed | 3C-b | centre | 79-98 | 12-29 | 20 / 9 | 321 | -20.19 / -8.75 | (16.9, 45.95) to (7.07, 45.95) |
| L3 Lower, fixed | 3C-c | centre | 99-118 | 12-25 | 20 / 20 | 280 | -6.3 / 5.92 | (5.07, 45.95) to (-4.76, 45.95) |
| L3 Lower, fixed | 3C-d | centre | 119-138 | 12-29 | 20 / 9 | 321 | 8.65 / 20.12 | (-6.99, 45.95) to (-16.83, 45.95) |
| L3 Lower, fixed | 3C-e | centre | 139-153 | 12-29 | 8 / 10 | 209 | 22.5 / 26.63 | (-19.03, 45.95) to (-23.04, 45.95) |
| L3 Lower, fixed | 3R-a | right-wing | 154-168 | 12-29 | 8 / 10 | 209 | 27.85 / 32.24 | (-24.09, 45.6) to (-27.38, 43.41) |
| L3 Lower, fixed | 3R-b | right-wing | 169-188 | 12-29 | 20 / 16 | 356 | 34.71 / 45.51 | (-29.22, 42.19) to (-37.41, 36.75) |
| L3 Lower, fixed | 3R-c | right-wing | 189-208 | 12-29 | 20 / 11 | 351 | 47.65 / 57.42 | (-39.09, 35.64) to (-47.27, 30.2) |
| L3 Lower, fixed | 3R-d | right-wing | 209-216 | 12-29 | 8 / 8 | 144 | 59.44 / 62.89 | (-49.09, 28.99) to (-52.37, 26.81) |
| L5 Middle | 5L-a | left-wing | 1-8 | 1-26 | 8 / 8 | 190 | -59.25 / -56.18 | (58.06, 34.55) to (54.8, 36.72) |
| L5 Middle | 5L-b | left-wing | 9-28 | 1-26 | 20 / 20 | 484 | -54.37 / -45.9 | (52.95, 37.95) to (44.76, 43.38) |
| L5 Middle | 5L-c | left-wing | 29-48 | 1-26 | 20 / 20 | 484 | -43.9 / -34.76 | (42.92, 44.61) to (34.74, 50.05) |
| L5 Middle | 5L-d | left-wing | 49-68 | 1-26 | 12 / 20 | 423 | -32.41 / -26.87 | (32.65, 51.43) to (27.71, 54.71) |
| L5 Middle | 5B-a | centre | 71-82 | 1-3 | 11 / 12 | 35 | -24.37 / -18.95 | (25.17, 55.58) to (19.08, 55.58) |
| L5 Middle | 5B-b | centre | 91-108 | 1-3 | 18 / 18 | 54 | -16.84 / -7.03 | (16.82, 55.58) to (6.86, 55.58) |
| L5 Middle | 5B-c | centre | 111-129 | 1-3 | 19 / 19 | 57 | -5.51 / 5.28 | (5.36, 55.58) to (-5.14, 55.58) |
| L5 Middle | 5B-d | centre | 131-148 | 1-3 | 18 / 18 | 54 | 7.09 / 16.89 | (-6.92, 55.58) to (-16.88, 55.58) |
| L5 Middle | 5B-e | centre | 155-166 | 1-3 | 11 / 12 | 35 | 18.99 / 24.41 | (-19.13, 55.58) to (-25.22, 55.58) |
| L5 Middle | 5C-a | centre | 69-86 | 6-17 | 15 / 16 | 177 | -23.95 / -17.73 | (26.46, 59.57) to (19.05, 59.57) |
| L5 Middle | 5C-a2 | centre | 87-90 | 17-17 | 4 / 4 | 4 | -15.57 / -13.95 | (19.13, 68.66) to (17.05, 68.66) |
| L5 Middle | 5C-b | centre | 91-110 | 6-17 | 20 / 15 | 204 | -15.8 / -6.69 | (16.86, 59.57) to (6.98, 59.57) |
| L5 Middle | 5C-c | centre | 111-130 | 6-17 | 20 / 16 | 205 | -4.84 / 4.64 | (5.04, 59.57) to (-4.84, 59.57) |
| L5 Middle | 5C-d | centre | 131-150 | 6-17 | 20 / 15 | 204 | 6.73 / 15.84 | (-7.03, 59.57) to (-16.91, 59.57) |
| L5 Middle | 5C-e0 | centre | 151-154 | 17-17 | 4 / 4 | 4 | 13.96 / 15.58 | (-17.07, 68.66) to (-19.15, 68.66) |
| L5 Middle | 5C-e | centre | 155-172 | 6-17 | 15 / 16 | 177 | 17.78 / 23.99 | (-19.1, 59.57) to (-26.51, 59.57) |
| L5 Middle | 5R-a | right-wing | 173-192 | 1-26 | 12 / 20 | 423 | 26.9 / 32.46 | (-27.76, 54.71) to (-32.71, 51.43) |
| L5 Middle | 5R-b | right-wing | 193-212 | 1-26 | 20 / 20 | 484 | 34.81 / 43.93 | (-34.79, 50.04) to (-42.97, 44.61) |
| L5 Middle | 5R-c | right-wing | 213-232 | 1-26 | 20 / 20 | 484 | 45.92 / 54.39 | (-44.81, 43.39) to (-52.99, 37.95) |
| L5 Middle | 5R-d | right-wing | 233-240 | 1-26 | 8 / 8 | 190 | 56.2 / 59.26 | (-54.85, 36.71) to (-58.11, 34.55) |
| L6 VIP | VIP-row | centre | - | 2 per box | 60 / 60 | 120 | -23.2 / 23.2 | band about 60 m wide at Y_H about 70 |
| L7 Upper | 7L-a | left-wing | 1-8 | 3-28 | 8 / 6 | 169 | -54.48 / -51.85 | (67.12, 47.91) to (63.79, 50.12) |
| L7 Upper | 7L-b | left-wing | 9-28 | 3-28 | 20 / 20 | 495 | -50.41 / -43.47 | (62.02, 51.29) to (53.8, 56.76) |
| L7 Upper | 7L-c | left-wing | 29-48 | 3-28 | 20 / 20 | 494 | -41.87 / -34.58 | (51.97, 57.98) to (43.74, 63.44) |
| L7 Upper | 7L-d | left-wing | 49-68 | 3-28 | 20 / 20 | 507 | -32.95 / -25.67 | (41.91, 64.65) to (33.7, 70.11) |
| L7 Upper | 7L-e | left-wing | 69-80 | 3-28 | 2 / 12 | 136 | -24.91 / -23.96 | (32.83, 70.69) to (31.74, 71.41) |
| L7 Upper | 7C-a | centre | 81-92 | 1-28 | 2 / 12 | 140 | -24.19 / -23.34 | (31.38, 69.87) to (30.15, 69.87) |
| L7 Upper | 7C-b | centre | 93-112 | 1-28 | 20 / 20 | 547 | -22.68 / -15.46 | (29.2, 69.87) to (19.32, 69.87) |
| L7 Upper | 7C-c | centre | 113-132 | 1-28 | 20 / 20 | 534 | -13.78 / -5.92 | (17.13, 69.87) to (7.25, 69.87) |
| L7 Upper | 7C-d | centre | 133-152 | 1-28 | 20 / 20 | 535 | -4.15 / 3.95 | (5.06, 69.87) to (-4.82, 69.87) |
| L7 Upper | 7C-e | centre | 153-172 | 1-28 | 20 / 20 | 534 | 5.92 / 13.78 | (-7.25, 69.87) to (-17.13, 69.87) |
| L7 Upper | 7C-f | centre | 173-192 | 1-28 | 20 / 20 | 547 | 15.46 / 22.69 | (-19.32, 69.87) to (-29.21, 69.87) |
| L7 Upper | 7C-g | centre | 193-204 | 1-28 | 2 / 12 | 140 | 23.34 / 24.19 | (-30.15, 69.87) to (-31.39, 69.87) |
| L7 Upper | 7R-a | right-wing | 205-216 | 3-28 | 2 / 12 | 136 | 23.96 / 24.91 | (-31.74, 71.41) to (-32.83, 70.69) |
| L7 Upper | 7R-b | right-wing | 217-236 | 3-28 | 20 / 20 | 507 | 25.67 / 32.95 | (-33.7, 70.11) to (-41.91, 64.65) |
| L7 Upper | 7R-c | right-wing | 237-256 | 3-28 | 20 / 20 | 494 | 34.58 / 41.87 | (-43.74, 63.44) to (-51.97, 57.98) |
| L7 Upper | 7R-d | right-wing | 257-276 | 3-28 | 20 / 20 | 495 | 43.47 / 50.41 | (-53.8, 56.76) to (-62.02, 51.29) |
| L7 Upper | 7R-e | right-wing | 277-284 | 3-28 | 8 / 6 | 169 | 51.85 / 54.48 | (-63.79, 50.12) to (-67.12, 47.91) |

Sum of the blocks: 19893 seats on the official map; with 20 wheelchair positions the tier capacities in `model-spec.json` add up to 20033.

The complete row-by-row seat-number table is in Appendix A; plan coordinates of every row segment are in `seatmap.md`, Appendix A JSON (apply the 0.97 conversion of section 0.3).

### 6.5 Gates

Positions are the gate markers of the official seat map in the hall frame (ESTIMATED, +-2 m).

| Gate | X_H, Y_H (m) | Floor (m) | Gate | X_H, Y_H (m) | Floor (m) | Where it meets the seating |
|---|---|---|---|---|---|---|
| 101 | 41.9, 21.76 | 0 | 104 | -41.9, 21.76 | 0 | side ends of the arena cross-aisle (rows 17 / 18) |
| 102 | 22.21, 34.86 | 0 | 103 | -22.12, 34.86 | 0 | rear corners of the arena, at the centre / wing junction of the Lower Stand front |
| 301 | 43.65, 54.94 | 7.27 | 304 | -43.55, 54.94 | 7.27 | top (rear) edge of the Lower Stand wings, behind row 29 |
| 302 | 16.2, 64.44 | 7.27 | 303 | -16.2, 64.44 | 7.27 | top edge of the Lower Stand centre, at aisles 78|79 and 138|139, either side of the wheelchair platform |
| 501 | 59.75, 46.3 | 12.67 | 512 | -59.75, 46.3 | 12.67 | Middle Stand vomitory, rows 11-17 (wing) |
| 502 | 49.76, 53 | 12.67 | 511 | -49.76, 53 | 12.67 | Middle Stand vomitory, rows 11-17 (wing) |
| 503 | 39.67, 59.69 | 12.67 | 510 | -39.67, 59.69 | 12.67 | Middle Stand vomitory, rows 11-17 (wing) |
| 504 | 29.68, 65.8 | 12.67 | 509 | -29.68, 65.8 | 12.67 | Middle Stand vomitory, rows 11-17 (junction) |
| 505 | 18.14, 65.8 | 12.67 | 508 | -18.14, 65.8 | 12.67 | Middle Stand vomitory, rows 11-17 (centre) |
| 506 | 6.01, 65.8 | 12.67 | 507 | -6.01, 65.8 | 12.67 | Middle Stand vomitory, rows 11-17 (centre) |
| 701 | 65.28, 54.06 | 23.47 | 712 | -65.28, 54.06 | 23.47 | Upper Stand vomitory, rows 6-10 (wing) |
| 702 | 55.29, 60.76 | 23.47 | 711 | -55.48, 61.05 | 23.47 | Upper Stand vomitory, rows 6-10 (wing) |
| 703 | 45.2, 67.45 | 23.47 | 710 | -45.2, 67.45 | 23.47 | Upper Stand vomitory, rows 6-10 (wing) |
| 704 | 33.08, 75.6 | 23.47 | 709 | -33.08, 75.6 | 23.47 | Upper Stand vomitory, rows 6-10 (junction) |
| 705 | 18.14, 75.6 | 23.47 | 708 | -18.14, 75.6 | 23.47 | Upper Stand vomitory, rows 6-10 (centre) |
| 706 | 6.01, 75.6 | 23.47 | 707 | -6.01, 75.6 | 23.47 | Upper Stand vomitory, rows 6-10 (centre) |

### 6.6 Seat products

| Item | Value | Conf. | Source |
|---|---|---|---|
| Maker | コトブキシーティング (Kotobuki Seating) | CONFIRMED | Kotobuki case study |
| General seat (arena and stands) | "Lux": upholstered tip-up, high back, fabric on all seats, deep blue ("the sea of Yokohama"), 2 cup holders per seat (black rings on the back shell of the seat in front), zip-off covers | CONFIRMED | Kotobuki; operator release |
| Arena seats | same chair on movable frames: caster-type seats nearest the stage, "Matrix System" behind | CONFIRMED | Kotobuki |
| Balcony seat | "Cadenza" TS-71, red fabric, wood back / arms / end panels, cup holder at each arm | CONFIRMED | Kotobuki |
| VIP box seat | TS-71 with FABRIKO waffle-weave fabric in midnight blue with a hidden "K" | CONFIRMED | Kotobuki; FABRIKO |
| Chair size for modelling | 0.494 m wide, back top about 0.95 m above the tread, seat height 0.43 m, depth 0.30 m folded / 0.55 m open | ESTIMATED (generic) | seatmap.md |

---

## 7. Stage and production

### 7.1 Stage

| Item | Value | Conf. | Source |
|---|---|---|---|
| Concept | no proscenium and no built-in stage; a demountable facility-owned "basic stage" (基礎ステージ) stands by default and can be rebuilt or removed | CONFIRMED | operator release; JATET |
| Basic stage | 12 ken x 7 ken = about 21.8 m wide x 12.7 m deep (quoted "about 22 x 13 m"), 1.8 m high (can be rebuilt to 2.1 m) | CONFIRMED | operator release (atpress 363680); JATET |
| Hanamichi / performer passages | 8 ken = about 14.5 m on each side; total width 28 ken = about 50.9 m | CONFIRMED | operator release; JATET |
| Hanamichi depth | about 5.5 m | ESTIMATED (low) | oblique photos |
| Position | front at Y_H 0 (17.2 m from the stage rear wall), upstage edge at Y_H -12.7, about 4.5 m crossover behind | ESTIMATED (+-1.5) | JATET section |
| Parts | main deck, performer passages, side stages, stairs, front extensions; load-in ramps at stage left and right (one more can be set at the front); outlet racks, lip fills and ground subs underneath; tool-less assembly | CONFIRMED | JATET |
| Centre stage | possible with the telescopic stands retracted; 40 t of roof capacity reserved above the centre-stage zone | CONFIRMED | JATET |
| Typical show | end stage with both wings, tour-supplied upstage LED wall (42 x 12 m at the opening shows), about 10 raked "finger" trusses, runways and centre lifts per production | REPORTED | Real Sound |

### 7.2 Rigging, lighting, sound, video

| Item | Value | Conf. | Source |
|---|---|---|---|
| Rigging | 480 points; 3 m pitch on the lifting grids; 120 t total including house equipment: 80 t above the stage + 40 t above the centre-stage zone | CONFIRMED | operator release; Theatre Workshop; JATET |
| Lifting grids (昇降グリッド) | 8 (6 over the stage, 2 over the audience front), lowered to the floor for rigging, parked at about +25 m | CONFIRMED | operator release; Theatre Workshop; Yamaha SS |
| Grid layout | 4 positions in depth at Y_H about -9.8 / 2.3 / 14.1 / 26.2, two frames about 9 x 9 m side by side | ESTIMATED (low) | JATET section |
| Lighting trusses | 6 trusses 16 m wide, 550 x 550 mm, above the basic stage, divisible every 4 m; 32 Claypaky HY B-EYE K25; trim about +10.8 in the reference photo | CONFIRMED / ESTIMATED (trim) | JATET; Sony |
| Follow spots | 8 x 3 kW in a two-row pin-spot gallery hung under the roof | CONFIRMED | Sony; JATET |
| Pin-spot galleries | row 1 at Y_H about 45, floor about +30.6, 3.6 m high; row 2 at Y_H about 66.5, floor about +33.0; both follow the three-facet shape | ESTIMATED | JATET section and 8F plan |
| Main PA | L-Acoustics: per side 16 K1 over 4 K2 (array 8.4 m tall, X_H +-12.3, bottom at +9.0 or +11.5), 12 KS28 flown beside it (X_H +-14.4), 20 K2 out-fill (X_H +-26); centre 6 KARA II; under the stage 10 x 2 KIVA II lip fills and 4 x 2 KS28 | CONFIRMED (inventory, trims) / ESTIMATED (positions) | L-Acoustics; JATET; Bestec frontal photo |
| Delays and fills | on the pin-spot galleries 6 x 4 K2 and 8 x 4 K3 for the Upper Stand; at the 5F balcony level 2 sets of 5 KIVA II + 2 SB15m | CONFIRMED | JATET |
| Amplifiers | 84-86 LA12X on the grid / catwalk level; over 200 loudspeakers in total | CONFIRMED | Bestec; L-Acoustics |
| Stage side screens | 2 x (9.0 m x 5.0 m), flown on trusses above the hanamichi (X_H about +-20, bottom about +6.8) | CONFIRMED (size) / ESTIMATED (position) | JATET; Bestec photo |
| Ribbon vision | about 62.5 m x 1 m on the front fascia of the Upper Stand centre (bottom about +23.5) | CONFIRMED (size) / ESTIMATED (height) | operator release |
| Upper service vision | 4 screens about 3.5 x 2 m under the rear pin-spot gallery, facing the Upper Stand | CONFIRMED (size, count) / ESTIMATED (position) | operator release |
| Cameras, control | 10 Sony BRC-X1000, XVS-G1 switcher, 12G-SDI; sound control room with DiGiCo Quantum338; room locations not published | CONFIRMED / gap | Sony |
| FOH | temporary; rear of the arena floor on the axis (Y_H about 31), or in place of the centre telescopic unit | ESTIMATED | press photos |
| Power | 3,500 kVA for production | CONFIRMED | Theatre Workshop; JATET |
| Loading | 11 t trucks drive onto the arena floor and behind the stage; five large entrances; one-way route at ground level under the deck; doors about 5.5 x 4 m | CONFIRMED / ESTIMATED (door size) | JATET; operator release; notice-board elevation |
| Backstage | multi-storey block behind the stage rear wall; about 20 dressing rooms (REPORTED), rehearsal room, machine rooms on 8F-9F | REPORTED | note.com visitor report; Oricon |

---

## 8. Concourses and lounges

General language of all public concourses (ESTIMATED from photos): industrial black box. Exposed soffit in black or grey sprayed fireproofing, silver foil ducts, charcoal mortar-look walls and column casings, sealed concrete floors, long linear LED tubes, white stencil signage (DIN-style type) painted directly on walls, one accent colour per level.

| Level | Elevation | Plan | Width / clear height (ESTIMATED) | Accent | Facilities (CONFIRMED on the official maps) |
|---|---|---|---|---|---|
| LEVEL 1 | 0.00 | chevron corridor behind the arena's rear diagonals, under the Lower Stand | 6.5 m / 3.0 m | red | gates 101-104; toilets each side (women 19, men 4 stalls); kiosks 1A, 1B; lockers 1A-1G; 4 stairs to LEVEL 3 |
| LEVEL 3 | 7.27 | main foyer about 26 x 26 m inside the Main Entrance + wing concourses to the North and South Entrance | wings 7 m / 4.2 m (storey 5.4 m) | red | gates 301-304; grand stair; 2 escalator pairs; kiosks 3A, 3B; toilets each side (women 18, men 6); nursing room at the north end |
| LEVEL 4 | 10.07 | boomerang mezzanine under the Middle Stand | 7 m / 2.8 m | none | toilets each arm (women 25, men 4); lockers 4A, 4B; 2 smoking rooms |
| LEVEL 5 | 12.67 | concourse behind the Middle Stand; Lounge 5 at the rear centre | 8 m / 4.0 m (storey 5.4 m) | red | gates 501-512; kiosks 5A-5D; 2 accessible toilets only; bridge to the Hilton |
| LEVEL 6 | 18.07 | VIP floor, not on public maps | - | art deco | VIP lobby, lounge, 11 VIP BOX rooms |
| LEVEL 7 | 23.47 | concourse behind the Upper Stand; Arena Bar 7 at the rear centre | 8 m / 3.2 m (storey 4.95 m) | blue | gates 701-712; kiosks 7A-7C; toilets (women 19 + 19 + 8 + 8, men 6 + 6 + 4 + 4); lockers 7A, 7B; 2 smoking rooms |

Toilet stalls inside: 178 women, 48 men (CONFIRMED, numbers printed on the official floor maps; allocation may change per show).

| Venue | Level | Data | Conf. | Look (from official photos) |
|---|---|---|---|---|
| Main Foyer | LEVEL 3 | about 26 x 26 m, storey 5.4 m | ESTIMATED | polished warm-grey concrete floor, 1.2 m square columns with white stencil signage, signal-red grand stair and walls with a graffiti-style "K-Arena" mural, exposed black soffit, orange-amber linear LEDs in a chevron pattern |
| Lounge 5 | LEVEL 5, glass box | about 400 seats (CONFIRMED; press 408); about 41 x 12 m (ESTIMATED, JATET 5F plan) | mixed | sealed concrete, rust-brown tables on black steel frames, cobalt-blue benches, red stand doors, red end wall with porthole mirror, full-height glazing |
| VIP Lounge | LEVEL 6, glass box | "40 m wide", about 100 seats | REPORTED | art deco by ILYA: red carpet with gold starbursts, black marble aisles, burgundy leather chairs, gold zig-zag valance, oval gold-mosaic bar under a ring chandelier |
| VIP BOX | LEVEL 6 | 11 rooms (CONFIRMED); organiser room about 20 people, ten corporate rooms of 10 (REPORTED) | mixed | navy carpet with gold lines, macassar panels, mirror wall, mustard sofa, sliding glass to a private balcony |
| Arena Bar 7 | LEVEL 7, glass box | 120 seats (CONFIRMED); about 35 x 9 m, counter about 15 m (ESTIMATED) | mixed | long island counter with gold fan-pattern mosaic and black stone top, brass shelving, art-deco chandeliers, dark polished concrete, skyline view toward Yokohama Station |
| Kiosks | L1 x2, L3 x2, L5 x4, L7 x3 | 11 (CONFIRMED); module about 8.5 x 2.4 m (ESTIMATED) | mixed | black counter with glowing front (red on L1 / L3 / L5, blue on L7), 4 menu screens, 4 fridges, gold beer towers |
| Lockers | L1, L4, L7 inside; Arena Deck outside | 6,240 in total (CONFIRMED); 910 / 820 / 590 inside and 3,920 outside (REPORTED) | mixed | black 5-tier banks inside, bright red banks outside |
| Outside | deck | Arena Tent (merchandise, 42.7 m, 11 booths), Bay Tent / Music Terrace Stage, 500-inch Terrace Vision, BAYDECK (138 seats), K-Arena Shop, Lawson (ground floor) | CONFIRMED | shop guide |

---

## 9. Material and colour palettes

All hex values, roughness and metalness are ESTIMATED from photographs under mixed lighting (about +-10 % lightness). No finish schedule is public. Where reports disagreed the editors took a middle value and note the range.

### 9.1 Exterior

| Element | Material | Hex | Roughness | Metalness | Notes |
|---|---|---|---|---|---|
| eave soffit and fascia | painted aluminium panels, satin | `#E4E5E3` | 0.4 | 0.15 | tapering radial strips about 2 m wide, dark 10 mm joints #8E9194 |
| eave columns | fair-faced concrete (SRC) | `#CFCCC4` | 0.85 | 0 | formwork lines every 1.8 m, tie holes 4 per row; reports range from #B4B3AE to #DCDAD4 |
| inclined upper wall | horizontally ribbed white metal siding | `#E2E4E6` | 0.5 | 0.1 | rib shadow lines #C4C7CA at 150-200 mm |
| flank and stage-end panels | flat white panels, matte | `#E6E8EA` | 0.55 | 0.05 | joints #B5B8BB, grid about 2.2 x 3.0 m |
| strip windows | dark glass | `#14171A` | 0.1 | 0 | emissive cyan #22A8FF at night |
| glass box glazing | tinted reflective glass | `#56737F` | 0.05 | 0 | dark state #26343B; reflects the sky |
| glass box mullions and fins | dark anodised aluminium | `#2A2C2E` | 0.35 | 0.6 |  |
| 5F band and concourse glazing frames | silver-grey aluminium | `#9DA2A6` | 0.35 | 0.7 |  |
| deck-level wall panels | light grey flat metal panels | `#C9CCCE` | 0.5 | 0.1 | concrete kerb #BDBCB7 |
| soffit over the deck walkway | dark grey panel | `#3A3D40` | 0.6 | 0.1 |  |
| louvre band on the flanks | dark grey metal louvres | `#7E8286` | 0.5 | 0.4 |  |
| ground storey on the flanks | painted panels, blue-grey | `#6C727A` | 0.7 | 0 |  |
| podium wall | vertically ribbed white panels | `#DCDDDD` | 0.6 | 0 | alternating stripes #CBCCCD |
| roof main planes | standing-seam metal, light grey | `#D5D8DB` | 0.45 | 0.3 | reads white to very light grey from above (ortho photo) and light grey from the ground |
| roof skirt | standing-seam metal, mid grey | `#8F959A` | 0.45 | 0.35 |  |
| brick lift towers and Hilton piers | red-brown brick tile | `#8C3B2E` | 0.8 | 0 | mortar #B7A699 |
| Hilton / podium white frame | off-white precast | `#E6E4DE` | 0.6 | 0 |  |
| Hilton window frames | champagne-bronze aluminium | `#A38D6C` | 0.35 | 0.7 |  |
| Hilton glass | blue-grey reflective glass | `#6E8CA3` | 0.05 | 0 |  |
| K Tower glass | dark blue-black glass | `#2C4156` | 0.05 | 0 |  |
| mansard roofs | slate-grey metal | `#3C3F45` | 0.6 | 0.2 |  |
| plaza and deck pavers | concrete / stone pavers, warm grey | `#A6A4A0` | 0.8 | 0 | dark bands #6C6B69 about 0.6 m wide |
| Big Steps | reddish-brown stone / clay units | `#A8705C` | 0.75 | 0 |  |
| grey stairs | pale granite | `#B9B9B6` | 0.7 | 0 |  |
| railings and lamp posts | black / charcoal painted steel | `#25272A` | 0.45 | 0.5 |  |
| banners | navy fabric with white logo | `#1B2A6B` | 0.9 | 0 |  |
| zig-zag rail and sky-bridge truss | signal-red painted steel | `#D7262B` | 0.4 | 0.3 |  |
| tent membranes | white PVC | `#EFEFEC` | 0.6 | 0 | underside cream #D9D0BC, frame #8E9498 |
| roof and entrance sign letters | white acrylic faces | `#FFFFFF` | 0.3 | 0 | emissive white at night |
| outdoor locker banks | red painted steel | `#C8201E` | 0.5 | 0.5 |  |
| river water | water | `#3F5A55` | 0.1 | 0 |  |
| park grass | grass | `#7FA84A` | 0.9 | 0 | winter #9A8B5A |

### 9.2 Interior

| Element | Material | Hex | Roughness | Metalness | Notes |
|---|---|---|---|---|---|
| hall roof steel, catwalks, bridges | matte black painted steel | `#0E0F11` | 0.8 | 0.3 |  |
| hall upper side walls | ribbed / perforated acoustic panels | `#26272B` | 0.9 | 0 | fine vertical ribs |
| stage-end wall behind curtains | painted panel | `#5E5A4E` | 0.8 | 0 | visible when the curtains are tied back |
| acoustic curtains | pleated velour | `#7A3566` | 1 | 0 | unlit wine; reads #B45CA8 under the cool cove light and #B5654F under warm light; pleats about 0.15 m |
| gallery steel | dark grey painted steel | `#2B2D30` | 0.6 | 0.4 | H-sections, bolted splices, 3-rail pipe guard |
| gallery floors | pale concrete | `#A39C8F` | 0.7 | 0 |  |
| nozzle fascia | black painted metal | `#141416` | 0.6 | 0.3 | row of 0.5 m round ports |
| arena floor | sealed concrete | `#8F8A80` | 0.35 | 0 | lit photos read #B9B3AA; white block lines |
| basic stage deck | grey stage deck | `#55565A` | 0.6 | 0 | black skirt #0B0B0C |
| stand terraces | bare concrete | `#8E8E8C` | 0.7 | 0 | two white nosing lines per step, stencilled numbers |
| stand parapets and fascias | cream painted concrete | `#D8D2C4` | 0.7 | 0 |  |
| balcony top rail | grey painted steel tube | `#8A8C90` | 0.5 | 0.4 |  |
| handrails | black steel | `#111214` | 0.5 | 0.5 |  |
| standard seat fabric (Lux) | navy woven tweed with lighter flecks | `#2F4A78` | 0.95 | 0 | flecks #3E6C9C; reads steel blue #3B5F9A when brightly lit and near black under show light |
| seat shells and cup holders | matte black moulded plastic | `#1E1F21` | 0.5 | 0 |  |
| seat brackets | light grey cast aluminium | `#B8BCC0` | 0.4 | 0.8 |  |
| balcony seat fabric (Cadenza) | vermilion woven fabric | `#D8391F` | 0.95 | 0 |  |
| balcony seat wood | dark walnut stained wood | `#4A2A1C` | 0.4 | 0 |  |
| VIP box seat fabric | midnight-blue waffle weave (FABRIKO) | `#2B3F6B` | 0.95 | 0 | hidden "K" motif |
| VIP seat wood | reddish-brown wood | `#6E3A26` | 0.4 | 0 |  |
| LED ribbon and screens (off) | LED modules | `#3A3C40` | 0.4 | 0 | emissive when on |
| foyer stair and red walls | signal-red paint | `#D21F1B` | 0.5 | 0 |  |
| concourse columns and walls | charcoal mortar-look trowel finish | `#55575C` | 0.8 | 0 | L3 lighter #6E7075, L7 darker #3A3B3F |
| concourse floor | sealed / polished concrete | `#8C857C` | 0.25 | 0 | L7 darker #3A3B3D |
| exposed soffit | sprayed fireproofing / black paint | `#2A2A2A` | 0.95 | 0 |  |
| ducts | foil-wrapped insulation | `#B8B8B8` | 0.4 | 0.8 |  |
| linear LED tubes | emissive | `#FFB060` | 0.5 | 0 | warm on L3 / L5; cool blue #9CCBFF on L7 |
| directory wall | aubergine paint | `#3A2038` | 0.7 | 0 |  |
| foyer logotype | cream paint with black outline | `#F1E9D2` | 0.6 | 0 |  |
| kiosk counter front | back-lit panel | `#E0201C` | 0.3 | 0 | deep blue #1E3FB0 on L7 |
| Lounge 5 table top | rust-effect laminate | `#8A4B2A` | 0.6 | 0 |  |
| Lounge 5 benches | cobalt-blue powder-coated steel | `#2F4FA8` | 0.5 | 0.5 | frames #2E3136 |
| fair-faced concrete columns | concrete | `#BDBAB3` | 0.7 | 0 |  |
| Arena Bar 7 counter front | champagne-gold glass mosaic | `#C9A65A` | 0.3 | 0.6 |  |
| bar tops | black polished stone | `#0B0B0C` | 0.1 | 0 |  |
| brass fittings | brass | `#B08D3C` | 0.3 | 1 |  |
| VIP lounge carpet | red Axminster with gold lines | `#B3121F` | 0.95 | 0 | lines #D4A93A |
| VIP box carpet | navy Axminster with gold lines | `#1E2A5A` | 0.95 | 0 |  |
| VIP marble floor | black marble with white bands | `#0E0E10` | 0.1 | 0 |  |
| gold-leaf panels | gold leaf | `#D1A63B` | 0.3 | 1 |  |
| macassar wall panels | gloss veneer | `#3B2418` | 0.15 | 0 |  |
| indoor lockers | black steel, ivory key grips | `#1B1B1D` | 0.5 | 0.5 |  |
| toilet wallpaper | teal vinyl with beige floral pattern | `#3F8F9A` | 0.7 | 0 | pattern #D9C7A3 |

---

## 10. Props list

Sizes are ESTIMATED generic dimensions (width, depth, height in metres). "Count" carries the confidence shown in `model-spec.json`.

| Prop | Group | Size W x D x H (m) | Count | Count conf. | Where | Look | Suggested source |
|---|---|---|---:|---|---|---|---|
| stand seat "Lux" (Kotobuki) | hall | 0.49 x 0.55 x 0.95 | 15694 | CONFIRMED | LOWER / MIDDLE / UPPER STAND (instanced) | tip-up, high back, navy tweed, matte black shell with two ring cup holders on the back | procedural low-poly + AI texture |
| arena seat (Lux on movable frames) | hall | 0.49 x 0.55 x 0.95 | 3964 | CONFIRMED | ARENA standard layout | same chair on black movable leg frames (caster seats near the stage, Matrix System behind) | procedural |
| balcony seat "Cadenza TS-71" | hall | 0.55 x 0.65 x 1 | 235 | CONFIRMED | MIDDLE STAND centre rows 1-3 | vermilion fabric, dark wood back and armrests, black pedestal, cup holder on each arm | AI 3D or procedural |
| VIP box seat | hall | 0.55 x 0.65 x 1 | 120 | REPORTED | VIP BOX balconies | midnight-blue waffle fabric, wood arms, small side tables | AI 3D or procedural |
| main line array (16 K1 + 4 K2) | production | 1.35 x 0.6 x 8.4 | 2 | CONFIRMED | X_H +-12.3, bottom +9.0 | black curved J-array with top frame and cable basket above | procedural |
| flown sub column (12 KS28) | production | 1.35 x 0.7 x 6.2 | 2 | CONFIRMED | X_H +-14.4 | black column of subwoofers | procedural |
| out-fill array (20 K2) | production | 1.35 x 0.6 x 7.1 | 2 | CONFIRMED | X_H +-26, aimed outward | black curved array | procedural |
| centre fill (6 KARA II) | production | 0.75 x 0.5 x 1.5 | 1 | CONFIRMED | on the axis, about +17 | small black array | procedural |
| delay cluster (4 K2 or 4 K3) | production | 1.35 x 0.6 x 1.5 | 14 | CONFIRMED | on the pin-spot galleries | short black arrays | procedural |
| stage side LED screen | production | 9 x 0.3 x 5 | 2 | CONFIRMED | X_H +-20 above the hanamichi | LED wall on a truss frame, black bezel, emissive | procedural |
| upper service screen | production | 3.5 x 0.2 x 2 | 4 | CONFIRMED | under the rear pin-spot gallery | LED screen, black bezel | procedural |
| ribbon vision | production | 62.5 x 0.2 x 1 | 1 | CONFIRMED | front fascia of the UPPER STAND centre | LED band; photos show 12 white "KEN" roundels on blue | procedural emissive texture |
| lighting truss | production | 16 x 0.55 x 0.55 | 6 | CONFIRMED | above the basic stage | silver / black box truss with moving heads | procedural |
| lifting grid frame | production | 9 x 9 x 0.6 | 8 | CONFIRMED | parked at +25 over the stage and the front arena | black truss frame with hoists and yellow number plates | procedural |
| moving-head light (B-EYE K25 type) | production | 0.45 x 0.45 x 0.65 | 32 | CONFIRMED | on the lighting trusses | round honeycomb lens face | AI 3D |
| follow spot | production | 0.5 x 1.6 x 1.8 | 8 | CONFIRMED | pin-spot galleries | long-barrel 3 kW spot on a stand | AI 3D |
| FOH riser with consoles | production | 6 x 5 x 1.2 | 1 | ESTIMATED | arena rear centre | black riser, consoles, blue mat | procedural |
| stage barricade | production | 1 x 1.2 x 1.2 | 50 | ESTIMATED | in front of the stage | black steel crowd barrier | procedural |
| acoustic curtain bay | hall | 4.5 x 0.4 x 5.4 | 180 | ESTIMATED | three gallery levels round the stage end and side walls, plus the arena-level band behind the stage | pleated wine / mauve velour, two states: drawn or tied back; lit by a linear cove | procedural + AI texture |
| kiosk module | concourse | 8.5 x 2.5 x 2.4 | 11 | CONFIRMED | L1 x2, L3 x2, L5 x4, L7 x3 | black counter with glowing front, 4 menu screens, 4 fridges, beer towers | procedural + AI texture |
| queue stanchion | concourse | 0.35 x 0.35 x 0.95 | 120 | ESTIMATED | kiosks, gates | chrome post with black belt | AI 3D |
| indoor locker bank module (5 tiers) | concourse | 0.9 x 0.5 x 1.8 | 155 | ESTIMATED | L1 (910 lockers), L4 (820), L7 (590) | black steel, ivory key grips, white numbers | procedural |
| outdoor locker bank module | site | 0.9 x 0.65 x 2 | 300 | ESTIMATED | along the deck-level wall on all three rear facets ("Arena Street") | bright red steel lockers | procedural |
| Lounge 5 table and bench set | venue | 1.8 x 1.6 x 0.75 | 50 | ESTIMATED | Lounge 5 | black steel frame with riveted gussets, rust-brown top, cobalt-blue benches | AI 3D |
| shell bar stool | venue | 0.45 x 0.45 x 1 | 150 | ESTIMATED | Lounge 5, Arena Bar 7 | dark-grey leather shell with white piping on black wire legs | AI 3D |
| round bar table | venue | 0.7 x 0.7 x 1.05 | 30 | ESTIMATED | Arena Bar 7 | dark top with ribbed gold edge, black column and disc base | AI 3D |
| Arena Bar 7 chandelier | venue | 1.6 x 1.6 x 1.4 | 3 | ESTIMATED | Arena Bar 7 | brass frame with 6-7 ribbed-glass lantern cylinders | AI 3D |
| VIP lounge ring chandelier | venue | 4 x 4 x 2 | 1 | ESTIMATED | VIP lounge bar | 5-tier frosted glass rings in a brass cage | AI 3D |
| gold fretwork screen | venue | 1.2 x 0.1 x 3.5 | 4 | ESTIMATED | VIP lounge | gold fretwork in a black frame | AI 3D |
| gate board / wall map | concourse | 1.6 x 0.05 x 1.2 | 32 | CONFIRMED | every gate | black board with seat-block plan, red footer, stencil "GATE 3xx" | procedural texture |
| roof sign "K-Arena" | site | 18.3 x 0.5 x 3.7 | 1 | ESTIMATED | roof skirt above the centre of the glass box | white serif channel letters on a steel frame, lit white | procedural (text geometry) |
| plaza lamp post with banners | site | 0.6 x 0.6 x 6.5 | 25 | ESTIMATED | plaza, stair edges, Arena Deck | slim black pole, cylindrical lantern, two navy banners | AI 3D |
| street light | site | 0.4 x 1.5 x 8.5 | 20 | ESTIMATED | north and east perimeter roads | grey pole with two flat LED heads | AI 3D |
| "K-Arena" monument letters | site | 4 x 0.4 x 0.8 | 1 | REPORTED | in front of the Bay Tent | white 3D letters on a low plinth | procedural |
| flag pole | site | 0.15 x 0.15 x 9 | 3 | ESTIMATED | beside the Bay Tent | slim silver pole with flag | procedural |
| 500-inch outdoor LED vision | site | 11.1 x 0.5 x 6.2 | 1 | CONFIRMED | upper storeys of the podium block facing the plaza | LED wall in a black frame | procedural emissive |
| red zig-zag sculpture rail | site | 6 x 0.3 x 1.2 | 1 | ESTIMATED | north end of the Big Steps | signal-red steel tube folded in a zig-zag | AI 3D or procedural |
| crowd barrier | site | 2 x 0.5 x 1.1 | 40 | ESTIMATED | door fronts, stored along walls | blue or black interlocking event barrier | AI 3D |
| direction totem / digital signage pillar | site | 0.7 x 0.25 x 2.1 | 14 | ESTIMATED | stair heads, gates, near BAYDECK | black monolith or portrait LCD totem | procedural |
| brick lift tower | site | 4 x 4 x 9 | 4 | REPORTED | North Gate, West Gate, South Gate, deck edges | red-brown brick box with dark metal roof | procedural + AI texture |
| street tree | site | 3 x 3 x 5.5 | 60 | ESTIMATED | sidewalks and garden pockets (positions in site-context.geojson) | young deciduous trees; conifer-type specimens in the north garden | AI 3D or billboard |
| kitchen car (food truck) | site | 5 x 2 x 2.6 | 3 | REPORTED | plaza west of the Bay Tent | small food trucks | AI 3D |
| railway catenary portal | site | 10 x 0.4 x 7 | 8 | ESTIMATED | JR Takashima freight line north-west of the site | grey steel portal frames with wires | procedural |
| sky-bridge to the Hilton | site | 18 x 3 x 3.5 | 1 | CONFIRMED | W facet at LEVEL 5 | glazed bridge with exposed signal-red zig-zag truss | procedural |

---

## 11. Conflict table (resolved)

Source priority: official / survey > designer and contractor > trade press > fan sites. "Editors" means checked again in this consolidation.

| # | Quantity | Values in the reports | Resolved value | Why |
|---|---|---|---|---|
| 1 | LEVEL 3 elevation | 6.2 (architecture), 6.5 +-1 (geo), about 6 (exterior), 6.6 (seatmap), 6.7-7 (official-site, interior), 7.4 (organizer) | **7.27** | JATET section chain 3,730 + 3,540 read by the editors; official cutaway 6.9 |
| 2 | LEVEL 4 elevation | 10.1 (official-site, seatmap), 10.2 (organizer), 11 (interior), 11.6 (architecture) | **10.07** | JATET chain +2,800; cutaway 10.0. It is a mezzanine under the stand, 2.6 m below LEVEL 5 |
| 3 | LEVEL 5 elevation | 12.7 (organizer), 13.3 (seatmap), 15.5 (interior), 17.0 (architecture), 18 (official-site) | **12.67** | 3FL + 5,400 mm = CONFIRMED escalator rise; the 17-18 m readings mistook 6FL for LEVEL 5 |
| 4 | LEVEL 6 (VIP) elevation | 18.2 (organizer), 18.7 (seatmap), 20 (interior), 20-24 (official-site), 22.5 (architecture) | **18.07** | JATET chain; cutaway 18.1 |
| 5 | LEVEL 7 elevation | 23.6 (organizer), 24-25.5 (seatmap), 27.6 (architecture), 28.5 (interior), 29 (official-site) | **23.47** | JATET chain; the 28-29 m readings are 8FL. Vomitory mouths are about 1.9 m higher (steps inside) |
| 6 | Seat spacing / row tread | 0.49 / 0.82 (official-site), 0.51 / 0.85 (seatmap, interior), 0.50 / 0.93 arena (organizer) | **0.494 / 0.8245** (0.917 in arena rows 1-17) | scale 0.97 x seatmap.md fits the 53.0 m floor, the 59 m stand zone, the column line and the 62.5 m ribbon |
| 7 | Stage front to arena row 1 | 2.2 m (seatmap), about 4 m (organizer) | **3.4 m** | stage front 17.2 m from the rear wall (JATET), seat datum 18.4 m |
| 8 | Arena floor size | 84 x 33 m seating outline (official-site), 2,560 m2 seating zone (seatmap), 3,800 / 4,600 m2 (organizer), listed 4,950 m2 | flat floor **5,018 m2 retracted / 3,899 m2 deployed**; 53.0 m deep; 98-109 m widest | hall-wall model reproduces the listed 4,950 m2 and the 53,000 dimension |
| 9 | Stage rear wall width | 45 +-4 (organizer), 65-70 "clear width" (architecture) | **46.4 between gallery fronts, 53.2 wall face, 65.6 outer** | the three numbers describe three different lines |
| 10 | Axis bearing | 300 +-15 (official-site), 302 (organizer), 302.5 (architecture), 302.7 (exterior), 303.25 (geo) | **303.25** | PLATEAU survey walls |
| 11 | Footprint length x width | 141 x 170-190 (official-site), 140 x 160 (architecture), 139.4 x 179 (exterior, OSM), 138.46 x 182.2 (geo) | **138.46 x 182.2** | PLATEAU; design chain 17.5 + 53.0 + 59.0 + 9.0 = 138.5 |
| 12 | E-W extent | 153.6 (Kajima 2021 plan label), 149.5 (PLATEAU) | **149.5** | as-built survey; the Kajima label is a design-stage site plan |
| 13 | Rear facet length | 77.1 (OSM), 79.4 at the 2F wall (architecture), 82.3 (PLATEAU eave) | **82.3 at the eave, 76.9 at the column line** | PLATEAU |
| 14 | Building height | 45 (official), 46.2 (PLATEAU apex) | **45.0** for the ridge; keep 46.18 as the surveyed apex | official + JATET chain; survey may include the sign frame |
| 15 | Column count | 24 (architecture), about 25 (exterior), 16-22 visible (official-site) | **24 (10 + 7 + 7)** | editors' count on the Concours photo |
| 16 | Glass box | 45 x 18 m (architecture), 46 x 20 x 11 m (exterior) | **46 wide, about 24.7 high (top about +32), about 9.8 deep** | Concours photo scaled on the 30 m columns; JATET levels |
| 17 | Rear wall setback from the eave edge | 15.5 (architecture), 18 +-3 (geo), 18-19 (exterior recipe) | **18.0** | JATET 3F / 5F plans; cutaway |
| 18 | Lower Stand depth / rows | 21 m, about 24 rows (architecture section) vs 29 rows (seat map) | 29 rows; **25 rows on the axis** | on the axis rows 26-29 are replaced by the wheelchair platform, so the section shows 25 rows (21 m) |
| 19 | Middle Stand front elevation | 9.7 (architecture), 10.3 (seatmap), 12.9 (organizer), 13.4-14.4 (official-site), 14 (interior) | **10.2** | step trace of the official cutaway; wing row 26 lands on 6FL |
| 20 | Middle Stand rake | 21 (seatmap), 25.8 (architecture), about 30 (organizer) | **21.0** | cutaway step trace; the JATET section profile includes the VIP box rows |
| 21 | Upper Stand rake | 29 (organizer), 29.5 (seatmap), 29.8 (architecture), 25-30 (official-site) | **30.4** | same rise (13.04 m over 27 rows) on the shorter 0.8245 m tread |
| 22 | Stage gallery levels | 3 curtain tiers (interior), 4 (organizer), 5 (official-site, architecture) | **4 galleries** at 3FL / 5FL / 6FL / 7FL; 3 curtain-backed + 1 arena-level curtain band behind the stage | JATET section; cutaway |
| 23 | Side screen size | 10 x 5.6 (official-site est.), 8.5-9 x 5 (interior est.), 9.0 x 5.0 (organizer, JATET) | **9.0 x 5.0** | designers' article |
| 24 | Escalators | 2 (official FAQ, interior) vs 4 units (Fujitec) | **4 units in 2 locations** | each location is an up / down pair |
| 25 | VIP boxes | 11 rooms (Kotobuki) vs "5 on each side" (Wikipedia) | **11 = 1 organiser room + 10 corporate rooms** | both are right |
| 26 | Farthest seat | 94 (official-site), 91 (organizer), 95-110 (architecture), 100-110 (interior), 93.7 / 104 (seatmap) | **92.1 m (last row, centre) / 101.8 m (farthest seat)** | reconciled plan |
| 27 | Roof truss | bottom 29.5 flat then to 38.5, depth 5.5-9 (architecture); 31 to 41, depth 5 (organizer); depth 7-8 (interior, exterior) | **bottom 30.7 to 39.3, depth 4.4 to 5.7** | editors' scaling of the JATET section with tilt correction |
| 28 | Eave heights | soffit 33.9 / tip 40.0 (architecture); 36 / 41 (exterior); tip 42.9 (geo) | **soffit 37.3 at the columns, tip underside 40.9, lip top 41.8** | JATET section; PLATEAU ledge 41.6-42.1 |
| 29 | Roof colour | white to very light grey (geo, exterior satellite) vs mid grey (architecture) | **light grey main planes (#D5D8DB), mid-grey skirts (#8F959A)** | both seen: main planes from above, skirts from the ground |
| 30 | Lounge 5 size | 60 x 15 m (interior, from seat count) | **about 41 x 12 m** | JATET 5F plan |
| 31 | Outdoor vision | 12 x 6 m (press) vs 11.1 x 6.2 m (500 inch at 16:9) | **11.1 x 6.2** | geometry of a 500-inch 16:9 screen |
| 32 | Truck doors | 3 on the south elevation (architecture), 2 per long side (exterior est.) | **5 entrances: both sides, stage rear, audience rear** | designers' article (JATET) |
| 33 | Deck level names | "terrace about +6", "decks at 6 m and 4.5 m" (Kajima) | **plaza about +5.0, Arena Deck +7.27** | Kajima values are nominal; the Big Steps take the difference |
| 34 | Site area | 31,793.97 (MLIT, notice board) vs 31,817 (Nikkei) | **31,793.97** | statutory figure |
| 35 | Outdoor large lockers | 516 (blog) vs 2,320 (Music Port) | unresolved; keep the official total 6,240 | no primary source |

---

## 12. Geometric reconciliation

Each check states what was compared and the result.

| # | Check | Numbers | Result |
|---|---|---|---|
| 1 | Axial chain versus the surveyed outline | backstage 17.5 + flat floor 53.0 + stand zone 59.0 (grid chain 9 + 7 + 7 + 7 + 6 + 6 + 6 + 11 on the JATET section) + eave 9.0 = 138.5 m; PLATEAU 138.46 m | consistent (0.04 m). Note: three of the bay values were read as 8,000 in organizer-tech.md; pixel widths show they are about 6,000 |
| 2 | Seat-map scale | Stand zone on the seat map from the front edge of row 1 (L3) to the back edge of row 28 (L7) = 58.4 m at the seatmap.md scale; available between the 53.0 m line and the top row seen 2.1-2.6 m inside the column line = 56.4-56.9 m | scale factor 0.965-0.974; adopted **0.97** |
| 3 | Fan apex versus facade | Junction lines at 16.8 deg through the surveyed rear corners (X +-41.16 at Y_G 138.46) meet the axis at Y_G 2.1 (+-1.2). With scale 0.97 and the 53.0 m anchor the apex of the seat map falls at Y_G 2.1 | consistent: the bowl facets are parallel offsets of the facade facets |
| 4 | Ribbon vision | Official 62.5 m; Upper Stand centre facet at its front fascia = 2 x 101.9 x tan 16.8 = 61.5 m at scale 0.97 (63.4 m at 1.00, 61.0 m at 0.9617) | consistent within 1.6 % ("約") |
| 5 | Flat floor | Model polygon with stands retracted 5,018 m2 versus listed 4,950 m2; axis depth to the deployed telescopic front 52.98 m versus dimensioned 53.0 m | consistent (+1.4 %, -0.02 m) |
| 6 | Rows x pitch per tier | Lower: 10 x 0.8245 + 1.43 gap + 17 x 0.8245 = 23.7 m = apothem 68.86 to 92.57. Middle wings: 25 x 0.8245 = 20.6 m = 88.06 to 108.67. Middle centre: 2 x 1.04 + 1.92 + 11 x 0.8245 = 13.1 m = 88.17 to 101.26. Upper centre: 27 x 0.8245 = 22.3 m = 102.46 to 124.71 | consistent by construction (all from one drawing with a constant unit) |
| 7 | Seats x spacing versus facet width | Upper centre row 28: 124 seats x 0.494 + 6 aisles (about 2.1 m) = 73.9 m; facet width at apothem 124.71 = 75.3 m. Lower centre row 25: 88 x 0.494 + 4 aisles = 51.9 m; facet 53.9 m. Arena rows 11-17: 140 x 0.494 + 6 x 1.87 = 80.4 m inside a wall-to-wall width of 93-100 m | fits everywhere: 1-2 m to spare in the stands, 6-10 m of side margin on the arena floor |
| 8 | Wing ends versus the hall wall | Outer ends of the wing rows lie 2.5-3.0 m (perpendicular) inside the wall-face line on all three stands, i.e. 7.7-8.2 m inside the outer wall face; the JATET 5F plan shows the hall line about 8 m inside | consistent; the strip holds the end aisles and the LEVEL 3-5-7 stairs |
| 9 | Heights: levels versus stands | Lower top row +7.10 one step below LEVEL 3 (+7.27). Middle row 10-11 at +13.0 to +13.4, 0.4-0.7 m above the LEVEL 5 vomitory floor (+12.67). Middle wing row 26 at +18.1 = 6FL. Upper row 1 at +23.43 = 7FL (+23.47); vomitory mouths at row 5 level (+25.4) need about 1.9 m of steps | consistent, with one inferred feature (steps inside the Upper Stand vomitories) |
| 10 | Heights: tiers under the roof | Upper row 28 floor +36.47; truss bottom chord above it +39.2; column tops +37.3; ridge +45.0 | 2.7 m clear above the last row: tight but matches the cutaway, where the top rows sit directly under the truss |
| 11 | Tier stacking | Middle front (+10.2) clears the Lower Stand rear rows (+6.2 to +7.1) by about 2.5 m of headroom after structure; Upper wing front (+24.4) is 6.3 m above Middle wing row 21-26 (+16.5 to +18.1); VIP rooms 18.07 to 23.1 sit exactly under the Upper centre front (+23.43) | consistent |
| 12 | Top row versus colonnade | Row 28 line at Y_G 126.82, column line 129.46: 2.6 m | consistent with the sections (2.1-2.6 m) |
| 13 | Foyer depth | Lower Stand rear (Y_G about 95.1) to the LEVEL 3 wall line (120.46) = 25.4 m; photo estimate 26 m | consistent |
| 14 | Capacity | 3,964 + 1,518 + 3,460 + 4,372 + 6,579 = 19,893 on the map (re-added row by row by the editors); + 120 VIP + 20 wheelchair = 20,033 | equals the official total by construction of the last two numbers |
| 15 | Footprint sources | OSM is within 1-5 m of PLATEAU except the rear facet (77.1 vs 82.3 m); Kajima's 153.6 m label does not match the surveyed 149.5 m | flagged; PLATEAU used |
| 16 | Building height | Official 45 m and JATET chain about 45.0 m versus PLATEAU apex 46.18 m | **inconsistent by 1.2 m**; proposed: ridge 45.0 in the hall section, PLATEAU key points for the exterior shell (they match the surveyed context), difference noted |
| 17 | Design-stage sections versus as-built seat map | Ken Corp 2020 and JATET sections place the Middle Stand front at 71 m and the Upper Stand back at 107-110 m from the stage wall; the reconciled plan gives 72.3 m and 109.3 m | consistent within 1.5 m once the on-axis row counts are taken into account |

---

## 13. Follow-up research done for this consolidation

| What | Finding |
|---|---|
| Official cross-section image, enlarged | slabs read at +3.3 / 6.9 / 10.0 / 12.3 / 18.1 / 23.7 / 29.1; LEVEL 4 is the blue plate under the Middle Stand; rear wall leans out 7.4 m; stage galleries at 7.7 / 13.2 / 18.7 / 24.3 |
| JATET journal (Korean edition) PDF: images extracted, text decoded | real section with dimension chain (levels above), bays 4,600 + 8,100 + 4,800 and 53,000; 1F / 3F / 5F / 7F / 8F plans; designers' statements (five truck entrances, 80 t + 40 t, 13,000-seat mode, curtains 0.3-0.4 s) |
| Fujitec project page | 4 escalators, rise 5,400 mm, 30 deg, 1,000 mm; 5 elevators |
| Kajima monthly 2021-10 site plan | labels 285.0 / 284.5 / 163.3 / 153.6 / 64.8 / 43.4 / 32.0 m confirmed |
| Kanagawa Architecture Concours photo | 24 columns (10 + 7 + 7), columns inside the glass box, box 46 m wide and about 0.83 of the column height, roof sign 18.3 m, 5F glazed band, strip windows at 7F |
| Official seat map (all levels), L3 and L5 floor maps | structure, VIP zone across the centre facet, grand stair behind the wheelchair platform, bridge on LEVEL 5 |
| Kotobuki, Theatre Workshop, Yamaha SS, global-produce, Wikipedia, Shinkenchiku, Oricon pages | no published seat width, row pitch, per-level capacity, wheelchair count or maximum viewing distance; grid height 25 m; 4,950 m2 and 26 m listed; VIP organiser room about 20 and corporate rooms of 10 |
| Searches for seat width, wheelchair count, per-level capacity, maximum viewing distance | nothing official found |
| Not reachable | Ken Corp 2020-08-20 PDF (connection reset, HTTP 502); document.k-arena.com (login); Azusa Sekkei page (script-rendered, empty) |

---

## 14. Index of reference photos and drawings

No image is stored in the project. Open these URLs when modelling or generating textures.

### 14.1 Drawings

| URL | What it shows |
|---|---|
| https://k-arena.com/wp-content/themes/k-arena/assets/pdf/seat-map.pdf | official vector seat map, all levels (source of every seat count) |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/seat/img_seat_level_all.png | same as PNG; `.../seat/img_seat-map_level{1,3,5,7}.png` and `.../seat/zoom/img_seat-map_level{L}_zoom{1,2,3}.png` |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png | official perspective cutaway along the axis with level labels |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/floor/img_floor_map_lv{1,3,4,5,7}.jpg | official floor maps (schematic; topology only) |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/shopguide/terrace_map_sp.png | official precinct map with gates and entrances |
| https://stagesafety.or.kr/webzine/14/common/download/붙임6. (국문) JATET 매거진.pdf | designers' section with dimension chain; 1F, 3F, 5F, 7F, 8F plans; Soundvision model (K-Arena pages near the end) |
| https://www.kajima.co.jp/news/digest/oct_2021/feature/05/images/img_03.jpg | dimensioned 2F site layout; `img_09.jpg` BIM of the 18 trusses; `img_04.jpg` construction aerial |
| https://www.kencorp.co.jp/news/20200820/20200820_k-arena.pdf | 2020 orthographic section "断面イメージ" (design stage) |
| https://skyskysky.net/photo2/202140/202012/03-1.jpg , `04-1.jpg` , `05-1.jpg` | notice-board north elevation, south elevation, site / roof plan |
| https://www.mlit.go.jp/common/001273962.pdf | 2019 certified plan: areas, schematic section |
| https://www.atpress.ne.jp/releases/363680/img_363680_8.png | cutaway render (same family as the official cross-section) |
| https://www.sony.jp/professional/solution/location-value-planning/img/works/k-arena/02.jpg | section variant labelled LEVEL3(内) / LEVEL3(外) |

### 14.2 Exterior photos

| URL | What it shows |
|---|---|
| https://www.pref.kanagawa.jp/osirase/0721/kanagawa-architecture-concours/gallery/66/images/general/musicterrace/musicterrace1.jpg | best frontal view across the river: eave, 24 columns, glass box, roof sign, both towers |
| https://cdn-xtech.nikkei.com/atcl/nxt/column/18/00585/080100198/k1.jpg | completion photo; `k5.jpg` perspective section |
| https://asset.watch.impress.co.jp/img/trw/docs/1533/996/002_o.jpg | official night photo from the north-west (lighting scheme) |
| https://asset.watch.impress.co.jp/img/trw/docs/1533/996/005_o.jpg ... `010_o.jpg` | south flank, plaza, glass box and doors, Hilton pilotis, Arena Tent, Lawson forecourt |
| https://skyskysky.net/photo2/202140/202305/82.jpg , `93.jpg` , `105.jpg` , `74.jpg` , `71.jpg` , `60.jpg` | NE flank panels, stage-end corner, full south elevation, eave prow, north facet, front symmetry |
| https://livedoor.blogimg.jp/bluestylecom/imgs/0/e/0e9e5a22.jpg , `e/1/e11d2419.jpg` , `2/e/2e1e2a15.jpg` , `9/7/971ee3ec.jpg` , `c/8/c8317b1b.jpg` | high view from the west, frontal from across the river, NE elevation telephoto, aerial from the south (roof), under the eave (column and wall textures) |
| https://k-arena.com/wp-content/uploads/2023/08/アリーナ外観写真.jpg | official aerial from the north-west |
| https://commons.wikimedia.org/wiki/File:K-Arena_Yokohama_(night_scene)_01.jpg ; `File:K-Arena_at_night_2024_(1).jpg` , `(2).jpg` ; `File:K_arena_2022_1.jpg` | night colour wash; glass box and main doors at night; 2022 construction (eave profile) |
| https://commons.wikimedia.org/wiki/Category:Takashima_Suisaisen_deck | the city footbridge |
| https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=139.6278,35.4630,139.6326,35.4664&bboxSR=4326&imageSR=3857&size=1400,1218&format=jpg&f=image | satellite view of the roof |
| https://www.sogo-unicom.co.jp/leisure/mag/ararenasample.pdf | magazine feature with official photos and the precinct plan |

### 14.3 Hall photos

| URL | What it shows |
|---|---|
| https://contents.oricon.co.jp/upimg/news/2297000/2296012/20230922_111817_p_o_71844023.jpg | whole bowl from the upper house-left side |
| .../20230922_111818_p_o_85112688.jpg | stage-end elevation from the Middle Stand centre |
| .../20230922_111820_p_o_95194040.jpg | all tiers seen from the stage |
| .../20230922_113432_p_o_80907819.jpg | top view: converging side walls, arena blocks, curtains tied back |
| https://theatre-workshop.co.jp/hubfs/01_TW_venues/2023_05_k_arenayokohama/k_arena_01.jpg ... `k_arena_05.jpg` | stage, galleries, a lowered lifting grid, under-stage racks |
| https://www.bestecaudio.com/wp/wp-content/uploads/Kアリーナ横浜.pdf | dead-frontal view of the stage end with every flown array and both side screens |
| https://www.yamaha-ss.co.jp/halls-in-japan/images/k-arena_photo05.jpg , `photo07.jpg` , `photo10.jpg` , `photo12.jpg` , `photo13.jpg` | centre-line views, empty flat floor, catwalk amp racks, sound control room |
| https://www.l-acoustics.com/wp-content/uploads/2023/11/la-k-arena-2-1024x759.jpg ... `la-k-arena-5-1024x576.jpg` | bare stage, PA layout, side gallery close-up |
| https://www.kotobuki-seating.co.jp/projects/list/detail.html?pdid1=01155 | seat close-ups, balcony, VIP box balcony |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/seat/stage/img_seat-map_stage_level{1,3,5,7}_0{1,2,3}.jpg | 12 official stage views from the seats (sight-line ground truth) |
| https://asset.watch.impress.co.jp/img/trw/docs/1533/996/001_o.jpg , `012_o.jpg` , `013_o.jpg` , `016_o.jpg` ... `022_o.jpg` , `029_o.jpg` | arena floor, parapets and vomitories, seats, curtains, upper screens, last-row views |
| https://k-arena.com/wp-content/uploads/2026/08/写真01-scaled.jpg , `写真02-scaled.jpg` | balcony seats; bowl overview from the Upper Stand |

### 14.4 Foyer, concourses, lounges

| URL | What it shows |
|---|---|
| https://k-arena.com/wp-content/themes/k-arena/assets/images/img_facility_details.jpg ; https://asset.watch.impress.co.jp/img/trw/docs/1533/996/011_o.jpg | main foyer and red grand stair |
| https://k-arena.com/wp-content/uploads/2023/09/img_shopguide_lounge5_main.jpg | Lounge 5 |
| https://k-arena.com/wp-content/uploads/2023/09/img_shopguide_arena-bar7_main-1.jpg , `_01.jpg` , `_03.jpg` ; https://arenabar7.com/wp-content/uploads/2024/03/img_idx_slide-{01..24}.jpg | Arena Bar 7 |
| https://k-arena.com/wp-content/themes/k-arena/assets/images/img_facility_vip01.jpg , `img_facility_vip02.jpg` | VIP BOX room, VIP lounge |
| https://k-arena.com/wp-content/uploads/2026/04/売店メイン画像.jpg ; `.../seat/drink/img_seat-map_drink_level{L}-{k}_0{n}.jpg` | kiosks |
| https://contents.oricon.co.jp/upimg/news/2297000/2296012/20230924_143842_p_o_45431019.jpg , `20230924_145052_p_o_49372727.jpg` | wall directory, gate board (signage system) |
| https://cdn-ak.f.st-hatena.com/images/fotolife/h/hnmrk/20240115/20240115143938.jpg , `20240115144146.jpg` , `20240115145220.jpg` | wall maps of L1, L5, L7 (colour code per level) |
| https://musicport-yokohama.jp/interview/k_arena_yokohama | lockers, toilets, L4, VIP seating photos |

### 14.5 Geo data

| URL / file | What |
|---|---|
| `research/geo/site-context.geojson` , `research/geo/karena-arena-frame.json` , `research/geo/plateau/karena_plateau_lod012.json` | site context, arena frame, PLATEAU roof / wall polygons |
| https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/14103-bldg-lod2-notexture-2024/tileset.json | PLATEAU Nishi-ku LOD2 3D Tiles (hide `14100-bldg-1007198`) |
| https://www.openstreetmap.org/way/934667675 , `/934667674` , `/934667673` , `/934667677` , `/934667676` | OSM arena, Hilton, K Tower, podium, footbridge |
| https://www.city.yokohama.lg.jp/city-info/koho-kocho/press/toshi/2024/20250314.files/0007_20250314.pdf | 高島水際線デッキ plan and data |

---

## 15. Open uncertainties, ranked by impact on model fidelity

| Rank | Uncertainty | Effect | Value to use meanwhile |
|---|---|---|---|
| 1 | Seat spacing and row tread are not published; the organiser drawings are behind a login (`document.k-arena.com`) | scales the whole bowl by +-2-3 % (+-2 m on the last row) | 0.494 m / 0.8245 m |
| 2 | Tier elevations rest on a perspective render and a low-resolution section | +-0.5 m on floor levels, +-1 m on stand fronts; Middle Stand front 9.7-11.0 | section 6.2 |
| 3 | Rear facade behind the columns: where the wall starts to lean (12.7 or 18.1 m), exact glazing extents, glass-box top | visible on the main elevation | section 3.2 |
| 4 | Longitudinal registration of the bowl (seat datum) and the standard stage position | +-1 m and +-1.5 m | Y_G 35.9 and 34.7 |
| 5 | Hall side-wall line and gallery depth | +-1.5 m on the hall width | 5.2 m wall zone, 2.8 m galleries |
| 6 | Facade products, colours, roofing product (finish schedules paywalled) | texture accuracy | section 9 |
| 7 | Building height 45.0 (official) versus 46.18 (survey apex) | 1.2 m at the ridge | ridge 45.0 inside, PLATEAU points outside |
| 8 | Lifting-grid plan layout, pin-spot gallery positions, catwalk plan, truss member layout | ceiling zone detail | section 7.2 |
| 9 | Wheelchair positions (20) and VIP seats (120) | none on geometry; affects the seat total only | as stated |
| 10 | Flank wall details (recessed opening, louvre band, truck door positions and sizes) | secondary elevations | section 3.3 |
| 11 | Elevator positions, first-aid room, control rooms, dressing rooms | interior back-of-house | not modelled or placed by assumption |
| 12 | Concourse widths, ceiling heights, lounge sizes | interior walk-through | section 8 |
| 13 | Grand stair riser count (23 counted) versus the 2.8 m rise to LEVEL 4 | stair detail | 18 risers of 0.155 m |
| 14 | State of the neighbouring lots in late 2026 (block 62, Linkage Terrace site) | context views to the east and south | use PLATEAU / OSM as is |

---

## Appendix A. Row-by-row seat numbers (CONFIRMED, official vector seat map)

Copied from `seatmap.md` section 6. A " / " marks a radial aisle, vomitory or gap. Part ids: `L1/C` arena; `LW` left wing (house-left), `C` centre, `RW` right wing.

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
