# K-Arena Yokohama (Kアリーナ横浜) — Production / Technical Specification Research

Angle: organizer / stage-crew facing technical data (stage, arena floor, rigging, loading, power, sound, lighting, video, acoustics, control positions, backstage).
Research date: 2026-11-23. All dimensions in metres unless noted.

## 0. How to read this report

### 0.1 Confidence tags
| Tag | Meaning |
|---|---|
| **CONFIRMED** | Stated by the owner/operator, the system integrator, the theatre consultant, or by the project's own designers in a technical journal |
| **REPORTED** | Credible secondary source (trade press, venue-listing site, visitor report) |
| **ESTIMATED** | Derived by me (scaled from a drawing or photo, or counted). Derivation is always given |

### 0.2 Important access note
The official organizer documentation site (主催者の方はこちら) `https://document.k-arena.com/` returns **HTTP 401 (login required)**. The official stage drawings / rigging plots / 利用案内 are therefore NOT publicly readable and were not obtained. Everything below comes from public sources. The single richest public source turned out to be a Korean translation of the JATET (劇場演出空間技術協会) journal special issue "大型音楽施設" which contains articles written by the project team (Ken Corporation, Azusa Sekkei, Theatre Workshop, Shimizu Octo, Lighting Big One, Hibino) plus small reproductions of the real section and floor plans.

### 0.3 Hall coordinate system used in this report
- Origin **O** = centre of the stage-end rear wall (inner face) at arena floor level (LEVEL 1 / 1FL = 0.0).
- **+Y** = from the stage rear wall toward the audience (hall centre axis). **X** = lateral, hall is mirror-symmetric about X = 0. **Z** = height above arena floor.
- Compass (ESTIMATED from the JATET 1F site plan, north arrow up): the stage is at the **south-east** end; the +Y axis (stage to audience) points to bearing approx. **302° (WNW/NW)** ±5°, i.e. the audience looks toward approx. 122° (ESE). Verify against map data from the geo researchers.

---

## 1. Headline numbers (quick table)

| Item | Value | Conf. | Source |
|---|---|---|---|
| Seats | 20,033 (standing-arena mode approx. 22,000) | CONFIRMED / REPORTED | atpress 363680; Oricon 2296012 |
| Capacity modes | 20,000 full; approx. 13,000 when the Upper Stand is hidden by a screen/curtain | CONFIRMED | JATET (Nozawa / Nagahiro article) |
| Building | 9 floors above ground, height approx. 45 m, S structure (partly RC / SRC) | CONFIRMED | atpress; Nikkei xTECH |
| Stage type | End stage, fan-shaped house; stage is NOT a fixed architectural stage: a demountable, facility-owned "basic stage" (基礎ステージ) | CONFIRMED | atpress; JATET; Theatre Workshop |
| Basic stage | W 12 ken (approx. 22 m) x D 7 ken (approx. 13 m) x H 1.8 m (re-buildable to 2.1 m) | CONFIRMED | atpress; JATET |
| Stage with wings | + hanamichi 8 ken (approx. 14.5 m) on each side = total W 28 ken (approx. 51 m) | CONFIRMED | atpress; JATET |
| Lifting grids (昇降グリッド) | 8 units total: 6 over the stage + 2 over the front of the audience area | CONFIRMED | atpress; Theatre Workshop |
| Rigging points | 480 points in the arena; 3 m pitch on the lifting grids | CONFIRMED | atpress; Theatre Workshop |
| Total rigging load | 120 t (includes facility-owned equipment): 80 t above the stage + 40 t above the centre-stage zone | CONFIRMED | atpress; JATET |
| Grid height | approx. 25 m ("equivalent to a 7-storey building"); the grids can be lowered to floor level | CONFIRMED | Yamaha Sound Systems case study |
| "Ceiling height" (venue listing) | 26 m | REPORTED | global-produce.jp |
| Arena floor load | 3 t/m2, trucks and forklifts drive directly on it without floor protection | CONFIRMED | Theatre Workshop; JATET; Bestec |
| Arena flat floor area (venue listing) | 4,950 m2 | REPORTED | global-produce.jp |
| Flat floor depth on centre line (stage rear wall to lower-stand structure) | 53.0 m | REPORTED (dimension "53,000" on the published section, low resolution, cross-checked by scale) | JATET section drawing |
| Power for production | 3,500 kVA total; 1-phase 3-wire, 3-phase 4-wire, 3-phase 3-wire | CONFIRMED | Theatre Workshop; JATET |
| Truck access | 11 t trucks drive onto the arena floor; 5 large loading entrances (both sides of arena, stage rear, audience rear) | CONFIRMED | Oricon 2295721; JATET |
| House PA | L-Acoustics K series, 200+ loudspeakers, 84 to 86 LA12X | CONFIRMED | Bestec; L-Acoustics; Sony |
| Stage side LED screens | 2 x (W 9.0 m x H 5.0 m), flown on trusses above the hanamichi | CONFIRMED | JATET |
| Upper service vision | 4 screens, approx. W 3.5 m x H 2 m each | CONFIRMED | Sony; atpress |
| Ribbon vision | approx. 62.5 m x 1 m at the front row edge of the Upper Stand | CONFIRMED | Sony; atpress |
| House follow spots | 8 x 3 kW, in a two-row "pin spot gallery" hung under the roof | CONFIRMED | Sony; JATET |
| Facility moving lights | 32 x Claypaky HY B-EYE K25 | CONFIRMED | Sony |
| Dressing rooms | approx. 20 (large and small, some with showers) | REPORTED | note.com visitor report |

---

## 2. Stage

### 2.1 Concept
- K-Arena has no proscenium and no built-in stage. The whole LEVEL 1 slab from the stage rear wall to the stands is one flat concrete floor. The venue owns a modular stage kit and keeps it standing as a default; it can be re-configured or completely removed. (CONFIRMED: atpress; JATET; Theatre Workshop)
- Everything permanent (basic stage, lighting trusses, loudspeakers, LED panels) was planned on the premise that it can be re-arranged or taken away on request. (CONFIRMED: JATET, Okuda)
- Stage position: **end stage at the narrow (south-east) end** of the fan. A centre stage is also possible (movable stands retract, and 40 t of roof capacity is reserved above the centre-stage zone). (CONFIRMED: JATET)

### 2.2 Basic stage (基礎ステージ) dimensions
| Parameter | Value | Conf. | Notes |
|---|---|---|---|
| Width (間口) | 12 ken = approx. 21.8 m (quoted "約22m") | CONFIRMED | 1 ken = 1.818 m |
| Depth (奥行) | 7 ken = approx. 12.7 m (quoted "約13m") | CONFIRMED | |
| Height | 1.8 m standard; can be rebuilt to 2.1 m | CONFIRMED | JATET |
| Hanamichi / performer passages (花道) | 8 ken = approx. 14.5 m long, one on each side | CONFIRMED | atpress |
| Total width with both hanamichi | 28 ken = approx. 50.9 m | CONFIRMED | JATET ("W28間") |
| Hanamichi depth | approx. 5.5 m (3 ken), aligned with the downstage edge | ESTIMATED (low confidence) | Judged from oblique photos (Theatre Workshop k_arena_01/03): wing decks look roughly 40% of the main stage depth |
| Composition | main deck + performer passages + side stages + stairs; front-extension parts also exist | CONFIRMED | JATET |
| Ramps (スロープ) | one at stage right and one at stage left for load-in; an additional ramp can be set on the audience side for load-in from the front | CONFIRMED | JATET |
| Deck finish | black deck surface, black skirt/fascia on the audience side; black steel sub-frame (truss-type legs) visible underneath | ESTIMATED from photos | Theatre Workshop k_arena_02, k_arena_05; Bestec frontal photo |
| Under-stage | Lighting outlet racks on casters, lip-fill and ground-sub loudspeakers, cable runs | CONFIRMED | JATET; Theatre Workshop caption |
| Assembly | tool-less; frames interlock at the top so levels match | CONFIRMED | JATET |

### 2.3 Stage position in the hall
| Parameter | Value | Conf. | Derivation |
|---|---|---|---|
| Downstage (front) edge | Y approx. 16.5 to 17.5 | ESTIMATED | JATET section: stage label and sight-line origin at x approx. 205 to 212 px, rear wall at 138 px, scale 4.26 px/m |
| Upstage edge | Y approx. 4 (front edge minus 12.7 m) | ESTIMATED | same |
| Clear strip behind the stage | approx. 3 to 4 m between upstage edge and rear wall line (rear galleries overhang this strip) | ESTIMATED | same; consistent with Theatre Workshop k_arena_03 |
| First seat row (row 1) | Y approx. 21 | ESTIMATED | 53 m floor depth minus 34 rows at 0.93 m minus cross aisle |
| Stage-end rear wall width at gallery level | approx. 45 m (+/- 4) | ESTIMATED | JATET 5F/8F plans (scale 0.597 m/px from building length approx. 130 m in the section) gave 41.5 to 46 m; Bestec frontal photo gives 43 to 50 m |

### 2.4 Stage-end wall and wing spaces
- The stage end is NOT a flat blank wall. It is a U-shaped set of **production balconies / technical galleries** (演出用バルコニー) on **four levels**, running along the rear wall and continuing along both splayed side walls toward the audience. (CONFIRMED: Theatre Workshop "演出用に舞台側にバルコニーを設置"; visible in all photos)
- Performers/dancers have actually been staged on these wall balconies; lighting fixtures can be clamped to their handrails; the side balconies have power for touring follow spots. (CONFIRMED: JATET)
- The rear galleries connect to the dressing-room corridors. (REPORTED: note.com)
- Wing space at floor level: the flat floor continues to the side walls on both sides of the stage; black masking drapes (legs) can hang from the upper gallery in front of the side galleries (seen in Yamaha Sound Systems photos 15 and 08).
- Gallery details are in section 4.3.

---

## 3. Arena floor (LEVEL 1)

### 3.1 Construction and finish
| Item | Value | Conf. | Source |
|---|---|---|---|
| Floor type | fully flat, exposed sealed concrete ("荒床"), no protection needed for vehicles | CONFIRMED | atpress; JATET; Yamaha SS caption |
| Load capacity | 3 t/m2 (also quoted as a vibration measure for jumping crowds) | CONFIRMED | Theatre Workshop; Bestec |
| Colour / look | mid-to-light warm grey concrete with visible joint lines, white painted reference lines and heavy tyre/scuff wear; reads dark charcoal-brown under show light | ESTIMATED from photos | Yamaha SS photo10, 19; Travel Watch 016 |
| Floor cable route | a straight strip of removable floor covers runs along the hall axis toward the stage (cable trench or duct) | ESTIMATED from photo | Travel Watch 016 |

### 3.2 Plan shape (three-facet fan)
The hall is a pentagon symmetric about the Y axis. The audience stands are NOT a curved arc: they are **three straight facets** (centre facet parallel to the stage wall + two wing facets rotated toward the stage). Side walls are perpendicular to the wing facets. (ESTIMATED from the JATET 3F/5F/8F plans and the official LEVEL 1 seat map; angle consistent in both.)

| Parameter | Value | Conf. | Derivation |
|---|---|---|---|
| Wing facet rotation relative to centre facet | approx. 35° (+/- 3) | ESTIMATED | Official LEVEL 1 seat map: wing boundary runs 448 px laterally for 315 px of depth, atan = 35.1°. JATET 8F plan: outer wall directions 57°, 90°, 22° give +32.5° / -35.5° |
| Side wall splay from the hall axis | approx. 33 to 35° each side | ESTIMATED | JATET 8F plan: stage wall at 56 to 58° to the south side wall, so 90° - 57° = 33° |
| Rear wall width W0 | approx. 45 m | ESTIMATED | see 2.3 |
| Flat floor depth on the centre line | 53.0 m (Y = 0 to 53) | REPORTED | "53,000" dimension on the JATET section; scale check: 53 m = 225.7 px gives 4.26 px/m, and the same scale reproduces the 45 m building height and the 5.4 m escalator rise between 3F and 5F |
| Y of the lower-stand wing tips (where stands meet the side walls) | Y approx. 37 to 38 | ESTIMATED | JATET section (wing stands seen in elevation start at 38 m); official seat map (maximum width band ends just after row 17) |
| Floor width at Y = 17 (stage front line) | approx. 68 m wall to wall | ESTIMATED | 45 + 2 x 17 x tan 34° |
| Maximum floor width (at Y approx. 38) | approx. 96 m wall to wall; seating field itself approx. 80 to 86 m | ESTIMATED | 45 + 2 x 38 x tan 34°; seat map gives 140 seats + 6 aisles |
| Centre facet width of the lower-stand front | approx. 42 to 53 m | ESTIMATED | seat map (41.5 m at 0.5 m per seat) vs. plan geometry (53 m) |
| Flat floor area | 4,950 m2 | REPORTED | global-produce.jp. My polygon gives approx. 3,800 m2 for the standard layout and approx. 4,600 m2 with the movable stands retracted, so the listed figure probably refers to the maximum flat area |

Recommended parametric outline for modelling (ESTIMATED, +/- 4 m):
```
Rear wall:        (-22.5, 0) ... (+22.5, 0)
Side walls:       (+-22.5, 0) -> (+-48, 38)      splay approx. 34 deg from the axis
Lower-stand wing fronts: (+-48, 38) -> (+-26, 53) rotated 35 deg
Lower-stand centre front: (-26, 53) ... (+26, 53)
```

### 3.3 Standard arena seating layout (official seat map, 2024-08 edition)
Source: `https://k-arena.com/wp-content/themes/k-arena/assets/pdf/seat-map.pdf` and `https://k-arena.com/wp-content/themes/k-arena/assets/images/seat/img_seat-map_level1.png` (CONFIRMED layout; the operator notes that arena layout changes per event).

- 34 rows, row 1 nearest the stage. 7 blocks across, **20 seats per block**, seat numbers 1 to 140 left to right, 6 longitudinal aisles.
- One cross aisle between row 17 and row 18.
- Gates 101 / 104 at the side ends of the cross aisle zone; gates 102 / 103 at the rear corners of the centre facet. Toilets behind gates 101-102 and 103-104.

| Rows | Seat numbers present | Seats per row | Conf. |
|---|---|---|---|
| 1 to 2 | 13 to 128 | 116 | CONFIRMED |
| 3 to 4 | 11 to 130 | 120 | CONFIRMED |
| 5 | 9 to 132 | 124 | CONFIRMED |
| 6 to 7 | 7 to 134 | 128 | CONFIRMED |
| 8 | 5 to 136 | 132 | CONFIRMED |
| 9 to 10 | 3 to 138 | 136 | CONFIRMED |
| 11 to 17 | 1 to 140 | 140 | CONFIRMED |
| 18 | 2 to 139 | 138 | CONFIRMED |
| 19 | 4 to 137 | 134 | CONFIRMED |
| 20 | 7 to 134 | 128 | CONFIRMED |
| 21 | 9 to 132 | 124 | CONFIRMED |
| 22 | 12 to 129 | 118 | CONFIRMED |
| 23 | 15 to 126 | 112 | CONFIRMED |
| 24 | 17 to 124 | 108 | CONFIRMED |
| 25 | approx. 19 to 122 | approx. 104 | ESTIMATED from image |
| 26 to 27 | 21 to 120 | 100 | ESTIMATED from image |
| 28 to 34 | centre three blocks 41 to 100 full, side blocks shrinking by 2 to 3 seats per row | approx. 96, 90, 86, 80, 74, 70, 66 | ESTIMATED from image |
| **Total** | | **approx. 3,960 arena seats** | ESTIMATED (sum of the above) |

Geometry of the seat field (ESTIMATED; assumes 0.50 m seat pitch, which makes the drawn row pitch 0.93 m and reproduces the 35° wing angle): block width 10 m, drawn aisle approx. 2 m (real aisles likely 1.2 to 1.8 m), rows 1 to 17 span approx. 15 m, rows 18 to 34 span approx. 14 m, total seated depth approx. 31 to 32 m.

Arena chairs: upholstered fabric tip-up seats with armrests and 2 cup holders, ganged on black steel frames (not folding pipe chairs). They look dark navy/black in most photos and blue under full light. (CONFIRMED fabric + cup holders: atpress, Oricon; colour ESTIMATED from photos.) Maker reported as Kotobuki Seating (REPORTED: 月刊レジャー産業資料 2023-11 caption).

### 3.4 Movable seating and modes
- Arena seats are loose/movable; the front part of the Lower Stand is retractable movable seating (移動観覧席); the rest is fixed. (REPORTED: l-tike; musicport-yokohama)
- Retracting the movable stands enlarges the arena for centre-stage shows. (CONFIRMED: JATET)
- The front movable seats can also be pushed aside to open working / load-in space in front of the stage. (CONFIRMED: Theatre Workshop caption)
- Standing arena: total capacity approx. 22,000. (REPORTED: Oricon; IQ Magazine "concert capacity 22,000")
- Venue-listing modes: full approx. 20,000; middle approx. 13,000; "arena mode" 5,400. (REPORTED: global-produce.jp; the 13,000 figure is CONFIRMED by JATET)

---

## 4. Hall envelope, levels, galleries, roof

### 4.1 Floor levels (from the JATET section)
Derivation: the left dimension chain of the section is too blurred to read, so levels were measured in pixels (scale 4.26 px/m from the legible 53,000 dimension; check: 1FL to roof top = 45.4 m; 3FL to 5FL = 5.3 m, matching the Fujitec escalator rise of 5,400 mm).

| Level | Z above arena floor | Conf. | What is there |
|---|---|---|---|
| 1FL (LEVEL 1) | 0.0 | ESTIMATED | Arena floor, arena foyer, truck lanes, stage-rear dock |
| 2FL | approx. +3.8 | ESTIMATED | backstage / service |
| 3FL (LEVEL 3) | approx. +7.4 | ESTIMATED | Main entrance, Arena Deck (outside), Lower Stand access; lowest stage gallery |
| 4FL (LEVEL 4) | approx. +10.2 | ESTIMATED | mezzanine concourse at the top of the Lower Stand |
| 5FL (LEVEL 5) | approx. +12.7 | ESTIMATED | Middle Stand, Lounge 5; second stage gallery |
| 6FL (LEVEL 6) | approx. +18.2 | ESTIMATED | VIP lounge / VIP boxes; third stage gallery |
| 7FL (LEVEL 7) | approx. +23.6 | ESTIMATED | Upper Stand concourse, Arena Bar 7; top stage gallery (grid level) |
| 8FL | approx. +28.5 | ESTIMATED | upper part of Upper Stand, pin spot gallery access |
| 9FL | approx. +30.7 | ESTIMATED | top of backstage block (machine rooms) |
| Highest point | approx. +45 | CONFIRMED (45 m) | roof at the audience (rear) end |

Escalators: 4 units, rise 5,400 mm, 30°, step width 1,000 mm (CONFIRMED: Fujitec project page). Escalators appear on the official floor maps of LEVEL 3 and LEVEL 5 only, so the 5.4 m is the 3F to 5F rise.

### 4.2 Longitudinal section (centre line), from the JATET section drawing
| Element | Y range | Z range | Conf. |
|---|---|---|---|
| Backstage block (behind rear wall) | -17.5 to 0 (three bays approx. 4.6 + 8.1 + 4.8) | 0 to +30.7 | ESTIMATED (digits blurred) |
| Flat floor | 0 to 53 | 0 | REPORTED |
| Stand structure zone | 53 to approx. 136 (bays approx. 9, 7, 7, 7, 8, 8, 8, 11, 10, 7) | | ESTIMATED (digits blurred) |
| Lower Stand, centre profile | approx. 53/60 to 74 | approx. +2 to +10 | ESTIMATED |
| Lower Stand wing tips (seen in elevation) | start at approx. 38 | approx. +2 | ESTIMATED |
| Middle Stand, centre profile | approx. 71 to 86 | +12.9 to +21.8 (approx. 30° rake) | ESTIMATED |
| Middle Stand wing tips | start at approx. 51 | | ESTIMATED |
| Upper Stand, centre profile | approx. 85 to 108.5 | +27.2 to +40.1 (approx. 29° rake) | ESTIMATED |
| Upper Stand wing tips | start at approx. 64 | approx. +26 | ESTIMATED |
| Longest viewing distance (stage front to last row) | approx. 91 m horizontal, approx. 99 m slant | | ESTIMATED (label on drawing unreadable) |
| Roof truss, bottom chord | whole length approx. 117 m | +31 at the stage end rising to approx. +41 at the rear | ESTIMATED |
| Roof truss depth | approx. 5 m | | ESTIMATED |
| Building length along the axis | approx. 130 m (plus approx. 9 m eave) | | ESTIMATED |

The roof deliberately slopes down from the audience end to the stage end to minimise air volume (CONFIRMED: JATET, ZEB Oriented description). Eave overhang 9,000 mm carried by 1,200 mm square SRC columns 30 m high (CONFIRMED: Shinkenchiku 2023-10 summary).

### 4.3 Stage-end production galleries (演出用バルコニー)
| Parameter | Value | Conf. | Derivation |
|---|---|---|---|
| Number of gallery levels | 4 (three curtain-backed galleries + a top gallery at grid level) | ESTIMATED | Counted in Theatre Workshop k_arena_01/03, Bestec frontal photo, JATET section |
| Gallery floor heights | approx. +7.5, +13, +18.5, +24 (+/- 1 m); spacing approx. 5.4 to 5.8 m | ESTIMATED | JATET section: backstage floors align with 3FL/5FL/6FL/7FL; gallery bands drawn at 8.6 / 14.4 / 20.0 / 25.3 (band centres incl. handrail) |
| Plan shape | U: rear wall (approx. 45 m) + both side walls | ESTIMATED | photos and plans |
| Side gallery length (along the wall) | approx. 47 m (lowest), approx. 56 m (2nd, 3rd), approx. 67 m (top) | ESTIMATED | JATET section: side galleries end at Y approx. 39 / 46 / 47 / 56, divided by cos 34° |
| Walkway depth | approx. 2.5 to 3 m | ESTIMATED | Theatre Workshop k_arena_02 (looking down along the top gallery) |
| Structure / finish | steel galleries, light grey concrete walkway, black steel handrail approx. 1.1 m with vertical balusters, dark grey fascia; exposed black steel posts at the audience-side ends | ESTIMATED | photos |
| Cove lighting | continuous linear LED under the front edge of every gallery, washing the curtain band below; seen as warm white, pink, purple (colour-changing) | ESTIMATED | Bestec, Theatre Workshop, Travel Watch photos |
| Air nozzles | a row of round jet-nozzle diffusers in the fascia below the lowest gallery on the side walls | ESTIMATED | Theatre Workshop k_arena_03, Travel Watch 021 |

### 4.4 Ceiling zone
| Item | Value | Conf. | Source / derivation |
|---|---|---|---|
| Lifting-grid parked height | approx. 25 m | CONFIRMED | Yamaha SS |
| Listed ceiling height | 26 m | REPORTED | global-produce.jp |
| Truss underside | approx. +31 (stage end) to +41 (rear) | ESTIMATED | JATET section |
| Maintenance deck / catwalks (メンテナンスデッキ) | steel grating catwalks inside and under the roof trusses; amplifier racks for the flown PA stand here; fenced with black handrails | CONFIRMED (existence) | Bestec; Yamaha SS photo12; JATET |
| Ceiling absorbers | large quantity of absorber panels approx. 0.9 x 1.8 m (3 shaku x 6 shaku) hung from the maintenance deck inside the truss zone | CONFIRMED | Bestec; L-Acoustics; JATET |
| Look | everything matte black (trusses, decking, catwalks); regular field of round LED downlights (house lights) | ESTIMATED | photos |
| Pin spot gallery (ピンスポットギャラリー) | two rows hung under the truss: front row at Y approx. 60 to 63, floor Z approx. +31, box approx. 3.7 m high; rear row at Y approx. 83 to 85, floor Z approx. +35.4. In plan they follow the three-facet stand shape. The front row shows as 4 box-like cabins in photos | ESTIMATED positions; CONFIRMED "two-row pin spot gallery" | JATET section, 8F plan, JATET text; Bestec panorama |

---

## 5. Rigging

| Item | Value | Conf. | Source |
|---|---|---|---|
| System | 昇降グリッド: truss-frame grids with rigging hooks that are lowered to arena floor level so motors/trusses are attached at ground level, then raised. Second installation of this kind in Japan after Saitama Super Arena | CONFIRMED | Oricon 2296012; atpress |
| Quantity | 8 grids: 6 above the stage, 2 above the audience front (provision for stage extension) | CONFIRMED | Theatre Workshop |
| Point pitch on grids | 3 m | CONFIRMED | Theatre Workshop caption |
| Total points in arena | 480 | CONFIRMED | atpress |
| Loads | 120 t total incl. house equipment; 80 t above stage; 40 t above centre stage | CONFIRMED | atpress; JATET |
| Per-point load | not found | | |
| Grid arrangement | 2 columns (left/right of centre) x 4 rows in depth | ESTIMATED | JATET section shows 4 grid positions in depth; 8 / 4 = 2 |
| Grid row centres | Y approx. 7, 19.5, 31, 43.5 | ESTIMATED | JATET section, grid brackets at 150-185, 203-238, 253-288, 305-342 px |
| Size of one grid | approx. 9 m x 9 m (4 x 4 points at 3 m) | ESTIMATED (low confidence) | Theatre Workshop k_arena_03 shows a lowered frame of 3 x 3 cells; section shows approx. 8.2 m depth |
| Grid parked Z | approx. +25 to +27 | CONFIRMED / ESTIMATED | Yamaha SS; section |
| Look when lowered | black box-truss frame with cross members, hoist drums, yellow number plates ("No.3", "No.5") | ESTIMATED | Theatre Workshop k_arena_03 |
| House PA suspension | chain motors; centre cluster tilt by front/rear chain length; outside clusters on 3-point "delta plate"; lift stroke over 20 m; cable is stored in cylindrical metal baskets above each array which travel separately | CONFIRMED | Yamaha SS; JATET |
| Recommended PA trim | array bottom at Z = 9 m or 11.5 m (two house presets) | CONFIRMED | JATET |

---

## 6. Loading, trucks, logistics

| Item | Value | Conf. | Source |
|---|---|---|---|
| Vehicle size | 11 t trucks drive directly onto the arena floor and to the back of the stage | CONFIRMED | Oricon 2295721; JATET; Wikipedia JA |
| Loading entrances | 5 large entrances for 11 t vehicles: both sides of the arena, stage rear, audience rear, so stage and house can be built simultaneously | CONFIRMED | JATET |
| Route concept | one-way circulation (ワンウェイ方式) | CONFIRMED | atpress |
| Level | all vehicle and back-of-house circulation is at ground level (1F) under the pedestrian deck; the public arrives on the deck at 3F | CONFIRMED | JATET (Maekawa) |
| Truck routes on the 1F plan | one route runs along the south side of the arena building and wraps around the stage (south-east) end; another runs between the hotel block and the arena toward the audience-rear entrance | ESTIMATED (reading of small drawing) | JATET 1F plan |
| Stage-rear dock | truck lane ("荷捌き車路") directly behind the stage rear wall inside the approx. 17.5 m deep backstage block | ESTIMATED | JATET section and 1F plan |
| Audience-rear entrance | passes under the Lower Stand on the centre line into the arena | ESTIMATED | JATET section (blue arrow) |
| Truck waiting area | a dedicated waiting area near the entrances; the count on the drawing is unreadable | gap | JATET 1F plan annotation |
| Shutter | "large shutter" through which trucks reach the stage | REPORTED | note.com |
| Arena-side door seen in photos | a door opening in the side wall at floor level near the stage-right front corner | ESTIMATED | Theatre Workshop k_arena_03 |
| Time saving claimed | 3 to 5 hours; one-day load-in/show/load-out possible; extreme case: sound arrives in a single 4 t truck | CONFIRMED | Yamaha SS; JATET |
| Merchandise | 11 permanent tents on the deck | REPORTED | Oricon |

Best estimate for dock door size (not found): model 5 roll-up shutters approx. 5 m wide x 4.5 m high, enough for an 11 t wing-body truck (2.5 m wide, 3.8 m high).

---

## 7. Power and infrastructure

| Item | Value | Conf. | Source |
|---|---|---|---|
| Production power | 3,500 kVA total; 1φ3W, 3φ4W, 3φ3W | CONFIRMED | Theatre Workshop; JATET |
| Truss feed | outlet racks on casters under the stage, fed from 1φ3W panels at the stage rear; 19-pin connectors to fly ducts | CONFIRMED | JATET |
| Floor power | portable 200 V and 100 V floor outlet racks | CONFIRMED | JATET |
| Truss outlets | 100 V C-type 20 A and parallel 15 A x 2; 200 V D-type 20 A and powerCON TRUE1; test switch | CONFIRMED | JATET |
| Lighting network | Luminex GigaCore 10 x 2 and LumiNode 4 x 2 per truss; 6 mobile network racks | CONFIRMED | JATET |
| Audio power | house audio on 1φ3W 200 V; DiGiCo SD-Racks and audio power at stage left, stage right and FOH | CONFIRMED | JATET |
| Amp power control | PLC-based central control of distributed amplifier racks | CONFIRMED | Yamaha SS |
| Video | 12G-SDI routing from tie-lines around the arena to the control room | CONFIRMED | Sony |
| Energy | aims at effectively renewable electricity for shows | CONFIRMED | atpress |

---

## 8. Permanent sound system

Design: Hibino Sound Div. (system design, operation); installation design and construction: Yamaha Sound Systems; integration: Sony Marketing; products: L-Acoustics via Bestec. (CONFIRMED: L-Acoustics release; Yamaha SS; Bestec; Sony)

### 8.1 Loudspeaker inventory
| Group | Content | Position | Conf. |
|---|---|---|---|
| Main L/R | 16 x K1 over 4 x K2 per side | flown above the downstage edge | CONFIRMED |
| Flown subs | 12 x KS28 per side, cardioid, beside each main array | flown | CONFIRMED |
| Out-fill (outside) | 20 x K2 per side | flown, far left/right | CONFIRMED |
| Centre fill | 6 x KARA II | flown on centre line | CONFIRMED |
| Lip fill | 10 positions x 2 KIVA II | under the stage front | CONFIRMED |
| Ground subs | 4 positions x 2 KS28 | under the stage, evenly spaced | CONFIRMED |
| Balcony side-fill | 2 sets of (5 x KIVA II + 2 x SB15m) | at the 5F balcony level, left and right | CONFIRMED |
| Delay ring 1 | 6 arrays x 4 K2 (front rows of Upper Stand) | hung from the pin spot gallery | CONFIRMED |
| Delay ring 2 | 8 arrays x 4 K3 (rear rows of Upper Stand) | hung from the pin spot gallery | CONFIRMED |
| Mobile reserve | 8 x KS28, 20 x KIVA II | | CONFIRMED |
| Totals | "over 200" loudspeakers (Sony lists 194 installed); 84 LA12X (Bestec) or 86 (L-Acoustics); P1 processors 4 installed (+2 portable); Milan-AVB with analogue backup | | CONFIRMED |
| Amplifier location | on the lifting-grid / catwalk level near each array | | CONFIRMED |
| Consoles | DiGiCo Quantum338 (house), SD11i (mobile); FOH console, effects and stage monitors are normally brought by the tour | | CONFIRMED |
| Cabinet finish | all black | | ESTIMATED from photos |

### 8.2 Positions of the flown system (for modelling)
Derivation: Bestec frontal photo (`bestec_10`, see section 14). Scale 0.0405 m/px obtained three independent ways that agree: (a) 20 boxes (16 K1 at 0.438 m + 4 K2 at 0.354 m = 8.4 m) = 208 px; (b) stage with hanamichi 51 m = 1,260 px; (c) side screen 9.0 x 5.0 m (JATET) = 221 x 125 px. Stage deck top is at Z = 1.8.

| Object | X (m) | Y (m) | Z bottom / top (m) | Conf. |
|---|---|---|---|---|
| Main K1/K2 arrays | +/- 12.3 | approx. 17 to 18 | 9.0 / 17.4 (house preset "9 m"; alternative preset 11.5 m) | ESTIMATED (bottom trim CONFIRMED) |
| Flown KS28 columns | +/- 14.4 | approx. 17 to 18 | 9.6 / 15.8 | ESTIMATED |
| Out-fill K2 arrays | +/- 26 | approx. 16 to 18, aimed outward | 9.0 / 15.8 | ESTIMATED |
| Centre KARA II | 0 | approx. 17 | approx. 16 / 18 | ESTIMATED |
| Cable baskets | directly above each array | | approx. +18 to +19 when PA is at show trim | ESTIMATED |
| Delay ring 1 (6 x 4 K2) | spread along the three facets | approx. 60 (centre facet) | approx. +29 to +31 | ESTIMATED |
| Delay ring 2 (8 x 4 K3) | spread along the three facets | approx. 84 (centre facet) | approx. +33 to +35 | ESTIMATED |

---

## 9. Permanent lighting

| Item | Value | Conf. | Source |
|---|---|---|---|
| Stage lighting trusses | 6 trusses, each 16 m wide, above the basic stage; section 550 x 550 mm; three battens under each (both ends + centre); divisible every 4 m; fly ducts inside | CONFIRMED | JATET |
| Truss feed | audience-side 2 trusses fed from grid level via cable baskets and storable at grid level; stage-side 4 fed from arena level through a cable truss running upstage-downstage | CONFIRMED | JATET |
| Truss positions | X from -8 to +8; six lines spread over the stage depth, approx. Y = 4.5 to 17 at approx. 2.5 m spacing; trim in the reference photo approx. Z = +10.8 (variable) | ESTIMATED | Bestec frontal photo: truss field 415 px = 16.8 m wide |
| Side-vision trusses | one truss above each hanamichi carrying the side LED screen | CONFIRMED | JATET |
| Moving lights | 32 x Claypaky HY B-EYE K25 (LED wash) | CONFIRMED | Sony; JATET |
| Work lights | LED 4-lamp mini-brutes on the trusses | CONFIRMED | JATET |
| Follow spots | 8 x 3 kW, permanent, in the two-row pin spot gallery; additional power on side balconies for touring follow spots | CONFIRMED | Sony; JATET |
| Lighting desks | 2 | CONFIRMED | Sony |
| House lights | LED fixtures; separately circuited for arena, stands, balconies; dedicated control desk | CONFIRMED | JATET |
| House light look | round downlights in a regular field on the black ceiling; aisle step lights in the stands | ESTIMATED | photos |
| Lighting company | Lighting Big One (co-author of the JATET article) | CONFIRMED | JATET |

---

## 10. Video / LED

| Item | Size | Position | Conf. | Source |
|---|---|---|---|---|
| Stage side vision (ステージサイドビジョン) x 2 | W 9.0 m x H 5.0 m each (16:9, approx. 405-inch) | flown above the hanamichi: centres at X = +/- 20, Y approx. 15 to 16; bottom Z approx. +6.8, top approx. +11.8 | size CONFIRMED (JATET); position ESTIMATED (Bestec frontal photo) | JATET |
| Upper service vision x 4 | approx. W 3.5 m x H 2 m each | hung under the roof at the pin spot gallery, facing the rear of the Upper Stand | size CONFIRMED; position ESTIMATED (Travel Watch 020) | Sony; atpress |
| Ribbon vision x 1 | approx. 62.5 m x 1 m | fascia at the front row of the Upper Stand (centre facet and beyond), Z approx. +26 | size CONFIRMED; height ESTIMATED | Sony; atpress |
| Remote cameras | 10 x Sony BRC-X1000 covering the arena | | CONFIRMED | Sony |
| Switcher | Sony XVS-G1 in the control room, 12G-SDI routing | | CONFIRMED | Sony |
| Lounges | 1 x Sony VPL-FHZ91L projector, Bravia monitors in lounges and rooms | | CONFIRMED | Sony |
| Level 7 monitors | relay monitors on the concourse | | REPORTED | note.com |
| Outdoor screen (Music Terrace plaza) | 500-inch; approx. W 12 m x H 6 m | by the covered outdoor stage in the plaza | REPORTED | Oricon; musicport-yokohama |
| LED pixel pitch / maker | not found | | gap | |

No permanent centre-hung scoreboard and no permanent upstage LED wall: upstage video is always tour-supplied.

---

## 11. Acoustic treatment and interior finishes

| Element | Description | Conf. | Source |
|---|---|---|---|
| Stage-surround walls | deliberately sound-reflective walls around the stage (to keep "live feeling"), fitted with full-height **curtains** on every gallery level; opening/closing the curtains changes reverberation time by approx. 0.3 to 0.4 s | CONFIRMED | JATET |
| Curtains (look) | heavy pleated drapes, dusty mauve / plum purple (approx. #7B4B6A under neutral light; glows pink-magenta approx. #C77FB0 under the cove light). Two states: fully drawn = continuous pleated band on every level; open = gathered and tied into bundles every 4 to 5 m in front of dark grey wall | ESTIMATED colours; states visible in photos | Theatre Workshop 01/02/03; Bestec; Travel Watch 016/019 |
| Walls behind curtains | dark grey to black panels; small technical doors | ESTIMATED | photos |
| Audience side walls | absorptive walls with an air cavity; dark indigo/black panel surface with a fine diagonal joint pattern | CONFIRMED (absorptive) / ESTIMATED (look) | JATET; Travel Watch 021 |
| Ceiling | absorber panels approx. 0.9 x 1.8 m hung in large numbers inside the truss zone, absorbing low frequencies | CONFIRMED | Bestec; JATET |
| Seats | all fabric-upholstered, counted as absorption | CONFIRMED | Travel Watch caption |
| Roof insulation | double folded-plate roof with absorber in between + thin concrete panel with air gap | CONFIRMED | JATET |
| Walls | described as approx. 5 m thick zone for isolation | REPORTED | Real Sound |
| HVAC | humidity control in heating season to reduce HF loss | CONFIRMED | Bestec |
| Stand seats | steel blue fabric (approx. #2F4E7E), black frames; staggered (千鳥) layout | CONFIRMED staggered / ESTIMATED colour | Oricon; photos |
| Balcony seats | red fabric (approx. #C8372D), front centre of LEVEL 5 / in front of the VIP boxes; 235 seats | CONFIRMED red; REPORTED count | Oricon; l-tike |
| Ribbon / fascias | dark grey/black parapets; VIP box glazing band behind the Middle Stand centre | ESTIMATED | photos |

---

## 12. Control rooms, FOH, camera and follow-spot positions

| Item | Finding | Conf. | Source |
|---|---|---|---|
| Sound control room (音響調整室) | permanent room with a window to the hall; DiGiCo Quantum338, DiGiCo racks, L-Acoustics P1 rack ("音響室出力制御架"), dark grey carpet, blue curtain at the window; it is on a different floor from the arena | CONFIRMED (existence) / REPORTED (different floor) | Yamaha SS photo13; Bestec; note.com |
| Video control room (コントロールルーム) | houses XVS-G1 switcher and 12G-SDI router | CONFIRMED | Sony |
| Location of the control rooms | not published | gap | Best estimate: rear centre of the house at LEVEL 4 to 6 (behind the Lower/Middle Stand centre facet) |
| FOH mix position | temporary, per show; audio tie-lines and power exist "at FOH". In the opening-ceremony photo the consoles sit at the rear of the arena floor, just in front of the Lower Stand | CONFIRMED tie-lines / ESTIMATED position | JATET; Travel Watch 021 |
| FOH for the model | place a 6 m x 5 m riser at X = 0, Y approx. 46 to 51 | ESTIMATED | |
| Follow spots | two-row pin spot gallery under the roof (section 4.4); 8 house units; side balconies as alternative positions | CONFIRMED | JATET |
| Camera platforms | no fixed platform data found; 10 remote PTZ cameras are distributed in the hall | gap / CONFIRMED cameras | Sony |
| PA crew standby area | exists backstage | REPORTED | note.com |

---

## 13. Backstage and dressing rooms

| Item | Finding | Conf. | Source |
|---|---|---|---|
| Location | multi-storey backstage block behind the stage rear wall, approx. 17.5 m deep, full height of the stage end; floors align with 3FL / 5FL / 6FL / 7FL | ESTIMATED | JATET section |
| Dressing rooms | approx. 20, large and small, some with shower rooms; "world-class artist" standard | REPORTED | note.com; 月刊レジャー産業資料 caption |
| Link to stage | stage-rear galleries connect to the dressing-room corridor | REPORTED | note.com |
| Ground floor | stage-rear truck lane / dock | ESTIMATED | JATET section |
| Top floors | machine rooms (機械室) at the 8F-9F zone of the backstage block | ESTIMATED | JATET section labels |
| Storage | stage parts, trusses and LED are stored on site when struck | CONFIRMED | JATET |
| Other | a kamidana (Shinto altar) backstage | REPORTED | note.com |
| Artist hotel | Hilton Yokohama next door (connected by deck) | CONFIRMED | Oricon |

---

## 14. Reference images worth opening while modelling (URLs only; nothing saved in the project)

| URL | What it shows |
|---|---|
| `https://www.bestecaudio.com/wp/wp-content/uploads/Kアリーナ横浜.pdf` | Page images: dead-frontal view of the stage end (basic stage with hanamichi, both 9 x 5 m side screens, all flown arrays, 4 gallery levels with curtains); panorama from house left; close-ups of K1/K2 + KS28, centre cluster, lip fill |
| `https://theatre-workshop.co.jp/hubfs/01_TW_venues/2023_05_k_arenayokohama/k_arena_01.jpg` | High oblique of the whole room: stage, galleries with drawn curtains, arena blocks, movable front of Lower Stand, red balcony seats |
| `.../k_arena_02.jpg` | Looking down from the top stage-left gallery: stage deck, lowered truss, side screen truss, gallery walkway, tied curtains |
| `.../k_arena_03.jpg` | A lifting grid lowered to working height (3 m pitch frame, "No.3"/"No.5"), four gallery levels on the stage-right side wall, floor-level door |
| `.../k_arena_04.jpg` | Floor-level view with front movable seats pushed aside; ceiling downlights; galleries glowing |
| `.../k_arena_05.jpg` | Under-stage outlet racks |
| `https://www.yamaha-ss.co.jp/halls-in-japan/images/k-arena_photo10.jpg` | Empty flat floor (concrete, joint lines), stage end without stage |
| `.../k-arena_photo05.jpg` and `.../k-arena_photo07.jpg` | Symmetric centre-line views: toward the stage and toward the audience (pin spot gallery frame under the roof, VIP band, ribbon) |
| `.../k-arena_photo12.jpg`, `photo13.jpg`, `photo15.jpg` | Amp racks on the catwalk; sound control room; arrays with black masking drapes |
| `https://travel.watch.impress.co.jp/img/trw/docs/1533/996/016_o.jpg`, `019_o.jpg`, `020_o.jpg`, `021_o.jpg` | Stage from arena row 18; side screens and trusses; an upper service vision; view from the last row of the Upper Stand (pin spot gallery, side wall panels, FOH position) |
| `https://www.atpress.ne.jp/releases/363680/LL_img_363680_4.jpg` | Official photo from the stage toward the full house |
| `https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png` | Official perspective cut-away (levels, galleries, flown truss) |
| `https://stagesafety.or.kr/webzine/14/common/download/붙임6. (국문) JATET 매거진.pdf` | K-Arena pages near the end: real section drawing, 1F / 3F / 5F / 7F / 8F plans (small), Soundvision model, equipment photos |

---

## 15. Consolidated modelling values (use when nothing better is available)

| Parameter | Use this | Basis |
|---|---|---|
| Rear wall width | 45 m | ESTIMATED |
| Side wall splay | 34° from axis | ESTIMATED |
| Flat floor depth (centre) | 53 m | REPORTED |
| Wing tips of Lower Stand | (+/- 48, 38) | ESTIMATED |
| Centre facet of Lower Stand front | (+/- 26, 53) | ESTIMATED |
| Basic stage box | X -10.9 to +10.9, Y 4.0 to 16.7, Z 0 to 1.8 | CONFIRMED size / ESTIMATED position |
| Hanamichi boxes | X +/- 10.9 to +/- 25.45, Y 11.2 to 16.7, Z 0 to 1.8 | CONFIRMED length / ESTIMATED depth |
| Seat rows | row n at Y = 21 + 0.93 (n-1), add 1.0 m after row 17 | ESTIMATED |
| Gallery levels | Z = 7.5, 13, 18.5, 24; depth 2.8 m; railing 1.1 m | ESTIMATED |
| Lifting grids | 8 frames 9 x 9 m at Z = 25, centres X = +/- 6, Y = 7, 19.5, 31, 43.5 | ESTIMATED |
| Lighting trusses | 6 x (16 m x 0.55 x 0.55), Y = 4.5 to 17, Z = 11 | CONFIRMED size / ESTIMATED position |
| Side screens | 9 x 5 m at X = +/- 20, Y = 15.5, Z centre 9.3 | CONFIRMED size / ESTIMATED position |
| Main arrays | 8.4 m tall J-arrays at X = +/- 12.3, Y = 17.5, bottom Z = 9 | CONFIRMED trim / ESTIMATED X |
| Sub columns | X = +/- 14.4, Z 9.6 to 15.8 | ESTIMATED |
| Out-fills | 7.1 m tall at X = +/- 26, bottom Z = 9 | ESTIMATED |
| Truss underside | Z = 31 at Y = 0 rising linearly to Z = 41 at Y = 117 | ESTIMATED |
| Pin spot gallery | row 1 at Y = 60 to 63, Z = 31 to 34.7; row 2 at Y = 83 to 85, Z = 35.4 to 38.5; both bent along the three facets | ESTIMATED |
| Upper service visions | 4 x (3.5 x 2 m) under pin spot gallery row 2, facing +Y | ESTIMATED |
| Ribbon | 62.5 x 1 m on Upper Stand front fascia, Z approx. 26 | ESTIMATED |

---

## 16. Gaps (not found) and best estimates

| Gap | Best estimate and reasoning |
|---|---|
| Official organizer drawings (stage plan, rigging plot, dock plan) | Behind login at document.k-arena.com (HTTP 401). Use section 15 |
| Exact arena floor width | Approx. 96 m wall to wall at the widest, 68 m at the stage front line; derived from 45 m rear wall and 34° splay. Uncertainty +/- 6 m |
| Exact wall splay angle | 33 to 35°; two independent drawings agree |
| Exact gallery heights | +7.5 / +13 / +18.5 / +24; tied to floor levels measured on a blurred section; +/- 1 m |
| Lifting grid plan size and lateral position, per-point load | 9 x 9 m frames in 2 x 4 array; per-point load unknown (typical for such systems: 1 to 2 t per point) |
| Number of trucks that can park in the arena / waiting bays | Number on the plan unreadable; arena easily holds 6+ 11 t trucks side by side behind a 51 m stage |
| Dock shutter sizes | Assume approx. 5 x 4.5 m |
| Dressing-room count per level, room sizes | Approx. 20 rooms in a 17.5 m deep block on 3 to 4 levels |
| Control room locations | Assume rear-centre, LEVEL 4 to 6 |
| Standard FOH position | Assume arena rear centre, Y approx. 46 to 51 |
| LED pixel pitch and manufacturer; follow-spot model | Not published; model as generic black LED wall and 3 kW xenon long-throw spots |
| Hanamichi depth | Approx. 5.5 m (3 ken), low confidence |
| Catwalk / maintenance-deck layout | Model as black grating walkways along truss lines every approx. 12 m plus the two pin spot gallery rows |
| Camera platforms | None documented |
| Nikkei xTECH page 2 (roof truss and music-specific equipment) | Paywalled, not read |

---

## 17. Sources

| # | Source | URL |
|---|---|---|
| 1 | Ken Corporation / K-Arena Management completion press release (2023-08-01) | https://www.atpress.ne.jp/news/363680 |
| 2 | Sony Marketing news release (equipment list) | https://www.sony.jp/professional/News/newsrelease/20230801/ |
| 3 | Sony case page | https://www.sony.jp/professional/solution/location-value-planning/works/k-arena/ |
| 4 | Theatre Workshop (theatre consultant) project page | https://theatre-workshop.co.jp/venues/2023_05 |
| 5 | JATET journal special "大型音楽施設", Korean translation (K-Arena articles + drawings) | https://stagesafety.or.kr/webzine/14/common/download/붙임6. (국문) JATET 매거진.pdf |
| 6 | Bestec Audio case study (L-Acoustics) | https://www.bestecaudio.com/wp/wp-content/uploads/Kアリーナ横浜.pdf |
| 7 | L-Acoustics press release | https://www.l-acoustics.com/press-releases/yokohamas-brand-new-k-arena-receives-l-acoustics-k-series-treatment/ |
| 8 | Yamaha Sound Systems case study | https://www.yamaha-ss.co.jp/halls-in-japan/kanagawa-k-arena.html |
| 9 | Official seat map (PDF and LEVEL 1 image), floor map, cross-section | https://k-arena.com/seat , https://k-arena.com/floor |
| 10 | Official organizer site (login required) | https://document.k-arena.com/ |
| 11 | Oricon news (press briefing; preview) | https://www.oricon.co.jp/news/2295721/full/ , https://www.oricon.co.jp/news/2296012/full/ |
| 12 | Impress Watch / Travel Watch | https://www.watch.impress.co.jp/docs/news/1520699.html , https://travel.watch.impress.co.jp/docs/news/1533996.html |
| 13 | Nikkei xTECH (page 1) | https://xtech.nikkei.com/atcl/nxt/column/18/00585/080100198/ |
| 14 | Shinkenchiku 2023-10 data page | https://data.shinkenchiku.online/projects/articles/SK_2023_10_166-0 |
| 15 | Fujitec project page (escalators) | https://www.fujitec.co.jp/project/8940 |
| 16 | global-produce.jp venue listing (4,950 m2, 26 m) | https://www.global-produce.jp/service/uniquevenue/k-arena-yokohama/ |
| 17 | Music Port Yokohama | https://musicport-yokohama.jp/interview/k_arena_yokohama |
| 18 | note.com visitor report of a special tour | https://note.com/sowe_2430/n/nb7058f20d2d1 |
| 19 | 月刊レジャー産業資料 2023-11 sample | https://www.sogo-unicom.co.jp/leisure/mag/ararenasample.pdf |
| 20 | Real Sound; l-tike; Wikipedia JA; BCN | https://realsound.jp/2023/09/post-1440792.html , https://tour.l-tike.com/contents/media/article20240508.html , https://ja.wikipedia.org/wiki/Kアリーナ横浜 , https://www.bcnretail.com/market/detail/20230802_350733.html |
