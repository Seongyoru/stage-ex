# K-Arena Yokohama (Kアリーナ横浜): geospatial ground truth

Research date: 2026-11-23. Angle: geospatial ground truth (OpenStreetMap, PLATEAU, GSI, basemap sources).
All coordinates are `[lon, lat]` in decimal degrees (JGD2011, treated as WGS84), 7 decimals. Bearings are degrees clockwise from **true north**. Elevations "T.P." are metres above Tokyo Peil (the Japanese height datum, 標高).

Confidence tags used throughout:

- **CONFIRMED**: stated by an official / primary source (MLIT PLATEAU survey data, GSI API, official K-Arena site, Yokohama City).
- **REPORTED**: credible secondary source (OpenStreetMap, press).
- **ESTIMATED**: derived by me; the derivation is given.

---

## 0. The numbers a modeler needs first

| Item | Value | Confidence | Source |
|---|---|---|---|
| Verified position (area centroid of the roof-outline footprint) | `[139.6307004, 35.4645890]` | ESTIMATED from CONFIRMED polygon | PLATEAU LOD0 footprint, section 4 |
| The task's approximate position (35.4635 N, 139.6300 E) is off by | 136.5 m; the real centroid lies 63.6 m east and 120.8 m north of it (bearing 27.8°) | ESTIMATED | computed |
| Address | 〒220-8507 横浜市西区みなとみらい6-2-14 | CONFIRMED | https://k-arena.com/access/ |
| Plan shape | Symmetric truncated wedge ("fan", 扇形), 6 straight walls + a short truncated stage-end face; all edges straight, no curved walls | CONFIRMED (survey polygon) | PLATEAU LOD0 |
| Footprint area (roof outline) | 16,153.8 m² (PLATEAU 14 vertices); 16,209.5 m² with sharp corners; OSM coarse polygon 15,942 m² | ESTIMATED from polygons | section 4 |
| Perimeter | 512.8 m | ESTIMATED | section 4 |
| Main axis (stage → rear seats / main entrance) | **303.25°** (toward NW). Audience looks toward **123.25°** (SE) | ESTIMATED from CONFIRMED walls (NW wall normal 303.26°, SE face normal 123.23°) | section 4.4 |
| Length along the axis | **138.46 m** (stage-end face to rear NW wall) | ESTIMATED | section 4.4 |
| Maximum width across the axis | **182.2 m** (between the SW corner and the N tip, 105 m from the stage-end face) | ESTIMATED | section 4.4 |
| Width of stage-end (SE) face | 42.4 m between sharp corners (40.5 m straight, with a 7.05 m wide × 7.86 m deep notch in the middle) | ESTIMATED | section 4 |
| Width of rear (NW) wall | 82.3 m | ESTIMATED | section 4 |
| North-south × east-west extent | 152.0 m × 149.5 m | ESTIMATED | section 4 |
| Fan opening angle between the two long side walls | 67.2° (half angles 33.3° and 33.8°) | ESTIMATED | section 4.4 |
| Stage end | **South-east** end (narrow, truncated end). Fan / audience end and all three public entrances are at the wide **north-west** end | CONFIRMED (official LEVEL 3 floor map) + ESTIMATED orientation | section 6 |
| Ground elevation at building | 4.18 m T.P. (PLATEAU wall base); GSI DEM 4.1 m at the centroid | CONFIRMED | sections 5, 8 |
| Highest roof point | 50.36 m T.P. = **46.18 m above ground**, at `[139.6302360, 35.4648398]` (9 m inside the rear wall, on the axis). PLATEAU `measuredHeight` 46.2 m. Official figure "約45 m" | CONFIRMED | PLATEAU LOD2; https://k-arena.com/floor/ |
| Roof slope | About 4.7° to 5° downward from the rear (NW) to the stage end (SE): 46.2 m → 35.5–36.6 m above ground | CONFIRMED (survey) | section 5 |
| Stage-end parapet height | 33.0–33.3 m above ground | CONFIRMED | section 5 |
| Storeys | 9 above ground (OSM `building:levels=9`; official "地上9階") | CONFIRMED | https://k-arena.com/floor/ |
| Site street grid | Site walls and とちのき通り are aligned to true north within 0.1° (south wall 89.92°, west wall 179.92°). The wider Minato Mirai grid further south is rotated (57° / 147°) | ESTIMATED | section 11 |
| Geoid height at the site (ellipsoidal minus T.P.) | ≈ 36.37 m (needed for PLATEAU 3D Tiles, which use ellipsoidal heights) | ESTIMATED | section 9.5 |

**Arena frame** (recommended local frame for the procedural model, section 4.4): origin `S0 = [139.6314284, 35.4641981]` (symmetry axis × stage-end facade), +Y toward bearing 303.25° (stage → rear), +X toward bearing 33.25° (the north-east side, which is audience-left when facing the stage; section 6.3), Z up from 4.18 m T.P.

**Important caveat on the outline:** the surveyed polygon is the **roof edge**. At the rear (NW) the roof eave and the upper stands overhang the LEVEL 3 entrance wall by roughly 18 m on the axis (ESTIMATED from the official cross-section, section 6.6). Do not extrude the roof outline straight down at the rear.

---

## 1. Method, sources and files

### 1.1 Requests made

| Source | What | Endpoint |
|---|---|---|
| Nominatim | Position lookup for "Kアリーナ横浜" | `https://nominatim.openstreetmap.org/search?q=Kアリーナ横浜&format=jsonv2&polygon_geojson=1&extratags=1` |
| Overpass API (OSM base timestamp 2026-11-23T02:31:43Z) | All tagged nodes, all ways, multipolygon / building relations within 600 m of `35.4648594, 139.6306903` | `https://overpass-api.de/api/interpreter` |
| PLATEAU data catalogue | Dataset list, CityGML file list, spatial-ID attributes, composite tilesets | `https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets`, `/datacatalog/citygml/r:139.6295,35.4638,139.6318,35.4656`, `/citygml/spatialid_attributes?sid=...&type=bldg`, `/datacatalog/3dtiles/{id}/tileset.json` |
| PLATEAU assets | `tileset.json` of the 西区 building tilesets; leaf `b3dm` tiles (via WebFetch, batch tables decoded); CityGML of mesh 53391550 | `https://assets.cms.plateau.reearth.io/assets/...` |
| GSI | Elevation API at 26 points; GeoJSON `experimental_fgd` z18 tiles; raster / vector / DEM tile liveness | `https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php`, `https://cyberjapandata.gsi.go.jp/xyz/...` |
| Official K-Arena site | LEVEL 1 / LEVEL 3 floor maps, cross-section, access maps (viewed as images) | `https://k-arena.com/floor/`, `https://k-arena.com/access/`, `https://k-arena.com/news/20250204-1` |
| PLATEAU-Ortho | Aerial ortho tiles z17 / z18 over the site (viewed, mosaicked in the scratchpad only, not saved in the project) | `https://tile.plateauview.mlit.go.jp/tiles/plateau-ortho-2024/{z}/{x}/{y}.png` |

The Overpass query:

```
[out:json][timeout:120];
(
  node(around:600,35.4648594,139.6306903)(if:count_tags()>0);
  way(around:600,35.4648594,139.6306903);
  relation(around:600,35.4648594,139.6306903)[type~"^(multipolygon|building|bridge|tunnel|site)$"][!place][natural!=bay];
);
out body geom qt;
```

(The `[!place][natural!=bay]` filter drops the 24 MB 本州 island relation and the 東京湾 bay relation.)

**Deviation to flag.** The curl guidance for this angle was "JSON / GeoJSON APIs only". To check K-Arena in PLATEAU and to obtain its true roof outline I also downloaded two PLATEAU **CityGML (XML)** files for mesh 53391550 (URLs returned by the PLATEAU JSON API): the building file (35 MB) and the bridge file (1 MB). They are official open data, were parsed as plain text (no XML parser, Python run with `-I`), the K-Arena and annex blocks were extracted, and the 35 MB raw file was then deleted. Tile endpoints of other formats (PNG / JPG / PBF / WebP) were requested only to verify liveness and CORS headers as the task requires.

### 1.2 Files written

Data folder `C:/Users/wsx48/Desktop/K-Arena_Yokohama/research/geo/` (data only, 3.9 MB):

| File | Content |
|---|---|
| `site-context.geojson` | **Main deliverable.** FeatureCollection, 969 features, properties `name, osm_id, kind, height, levels` plus extras (`source`, `ground_elev_tp`, `roof_max_elev_tp`, tags). Kinds: `arena` (PLATEAU outline), `arena_outline_simplified`, `arena_osm`, `hotel`, `office_tower`, `deck`, `annex`, `annex_plateau`, `tent`, `building` / `building_part` (OSM, 152), `building_plateau` (84, true footprints with measured heights), `road` (119), `footway` (262), `steps` (58), `pedestrian_area` (35), `pedestrian_deck_bridge` (48), `railway` (22), `water` (6), `beach`, `park` (7), `landuse` (37), `site`, `poi` (55), `elevator` (8), `parking_entrance` (7), `station` (6), `artwork`, `trees` (MultiPoint, 308 trees within 300 m), `entrance` (4, estimated: three on the roof-edge line plus the main-entrance door line), `arena_axis`, `reference_point`, `roof_point`, `elevation_sample` (26). Context radius 500 m around the centroid |
| `karena-arena-frame.json` | Arena frame: origin, axis, the 14 footprint vertices in frame coordinates, sharp-corner polygon, all LOD2 roof key points (X, Y, z) |
| `plateau/karena_plateau_lod012.json` | K-Arena LOD0 ring, LOD1 summary, every LOD2 boundary surface (13 roof, 21 wall, 1 ground polygons) as `[lon, lat, z]` |
| `plateau/citygml/karena_bldg_4851209b.xml` | Raw CityGML block of the K-Arena building (51 KB) |
| `plateau/citygml/annex_bldg_ba8d96b4.xml`, `plateau/annex_plateau_lod012.json` | Low-rise annex next to the Hilton |
| `plateau/citygml/53391550_brid_6697_op.gml` | Raw PLATEAU bridge CityGML of the mesh |
| `plateau/plateau_bldg_footprints_53391550_near.json` | 96 PLATEAU building footprints within 520 m with heights |
| `plateau/plateau-datasets-yokohama-14100.json`, `plateau-extra-yokohama.json` | Yokohama subset of the PLATEAU catalogue |
| `plateau/tileset_14103_bldg_*.json` | The five 西区 building `tileset.json` files |
| `plateau/spatialid_bldg_z17.json`, `spatialid_other_z17.json`, `citygml-range-karena.json` | PLATEAU API responses |
| `overpass-around600.json` | Raw Overpass response (1.57 MB, 1,663 tagged nodes, 1,327 ways, 23 relations) |
| `nominatim-karena.json` | Raw Nominatim response |
| `gsi-elevation-points.jsonl` | Raw GSI elevation responses |
| `gsi-fgd/*.geojson` | GSI fundamental geospatial data tiles (2015 vintage, no K-Arena; kept only as evidence) |
| `openfreemap/*.json`, `gsi-style/optimal_bvmap_std.json`, `misc/*.json` | Style JSON / TileJSON snapshots |
| `basemap-endpoint-checks.txt` | Log of every liveness / CORS check (HTTP status, content type, CORS header) |

Helper scripts are in `C:/Users/wsx48/Desktop/K-Arena_Yokohama/research/geo-scripts/` (pure Python, no dependencies): `build_site_context.py`, `arena_frame.py`, `footprint_stats.py`, `gml_extract.py`, `gml_building_parse.py`, `gml_bldg_footprints.py`, `lod2_dump.py`, `b3dm_table.py`, `tileset_find.py`, `road_bearings.py`, `mvt_layer_dump.py`, `png_mosaic.py`, `section_measure.py` and others.

---

## 2. Position verification

| Source | `[lon, lat]` | Offset from the PLATEAU centroid | Confidence |
|---|---|---|---|
| PLATEAU footprint area centroid (adopted) | `[139.6307004, 35.4645890]` | 0 | ESTIMATED from CONFIRMED polygon |
| PLATEAU bounding-box centre | `[139.6307285, 35.4647196]` | 2.6 m E, 14.5 m N | CONFIRMED |
| Nominatim (OSM way centre) | `[139.6306903, 35.4648594]` | 0.9 m W, 30.0 m N | REPORTED |
| Wikidata Q117074483 (P625) | `[139.6305883, 35.4645800]` | 10.2 m W, 1.0 m S | REPORTED |
| Task's approximate value | `[139.6300000, 35.4635000]` | 63.6 m W, 120.8 m S (wrong block edge) | n/a |

Geodetic constants at the site (GRS80, latitude 35.46459°), ESTIMATED by formula:

- 1° latitude = 110,949.11 m; 1° longitude = 90,769.19 m.
- Web-Mercator scale factor 1 / cos(lat) = 1.22779; `meterInMercatorCoordinateUnits` = 3.0637190e-8.
- Normalised Web-Mercator (MapLibre `MercatorCoordinate`) of the centroid: x = 0.8878630567, y = 0.3945178843; of `S0`: x = 0.8878650789, y = 0.3945192175.
- Ground resolution of 256 px tiles: z16 1.945 m/px, z17 0.973, z18 0.486, z19 0.243.
- Slippy tiles containing the arena: z14 `14546/6463`; z16 `58186/25855` and `58187/25855`; z17 `116373/51710` and `116374/51710`; z18 x `232747–232748`, y `103419–103420`.
- JGD2011 plane rectangular zone IX (EPSG:6677), approximate: X(north) = −59,381 m, Y(east) = −18,391 m; grid convergence −0.118°.
- 3rd-level mesh code: 53391550.

---

## 3. OpenStreetMap: identification, tags, footprints

All REPORTED (OpenStreetMap contributors, ODbL). Extract of 2026-11-23.

### 3.1 Key elements

| Feature | OSM id | Tags that matter | Nodes | Area / length |
|---|---|---|---|---|
| K-Arena Yokohama (Kアリーナ横浜) | way 934667675 | `amenity=theatre`, `building=retail`, `building:levels=9`, `height=45`, `name=K-Arena Yokohama`, `name:ja=Ｋアリーナ横浜`, `start_date=2023-09-29`, `wikidata=Q117074483` | 7 (coarse) | 15,942 m² |
| Hilton Yokohama (ヒルトン横浜) | way 934667674 | `building=hotel`, `building:levels=26`, `height=99.87`, `opening_date=2023-09-24`, `addr:housenumber=13`, `addr:block_number=2` | 9 | 1,866 m² |
| K Tower Yokohama (Ｋタワー横浜) | way 934667673 | `building=office`, `building:levels=21`, `height=99.87`, `opening_date=2023-08-01`, `addr:housenumber=12` | 6 | 1,303 m² |
| Music Terrace podium / on-site pedestrian deck structure (unnamed) | way 934667677 | `building=commercial`, `building:levels=1`, `height=5`, `opening_date=2023` | 51 | 7,241 m² |
| Takashima Suisaisen Deck (高島水際線デッキ) | way 934667676 | `bridge=yes`, `highway=pedestrian`, `layer=1`, `start_date=2025-03-27` | 10 | 146.3 m line |
| Deck stub joining the above to the site | way 1352486719 | `bridge=yes`, `highway=pedestrian`, `layer=1`, `start_date=2025-03-27` | 2 | 4.2 m |
| Music Terrace site (ミュージックテラス) | way 934667672 | `landuse=retail`, `operator=ケン・コーポレーション`, `opening_date=2023-08-01`, `wikidata=Q123594560` | 35 | 31,384 m² |
| Low-rise annex north of the Hilton (unnamed) | way 1211949300 | `building=yes` | 6 | 630 m² |
| Arena Front (アリーナフロント) | way 1211706048 | `highway=pedestrian`, `area=yes` | 4 | 435 m² |
| Arena Deck (アリーナデッキ) | way 1211706040 | `highway=pedestrian`, `area=yes` | 4 | 301 m² |
| Music Terrace Stage (ミュージックテラスステージ) | way 1211706047 | `highway=pedestrian`, `area=yes` | 4 | 175 m² |
| Music Terrace Plaza (ミュージックテラスプラザ) | way 1211706045 | `highway=pedestrian`, `area=yes` | 4 | 302 m² |
| Music Terrace Square (ミュージックテラススクエア) | way 1211706042 | `highway=pedestrian`, `area=yes` | 5 | 353 m² |
| Big Steps (ビッグステップス) | way 1211706038 | `highway=steps` | 2 | 15.1 m |
| North Gate (ノースゲート) | way 1211706046 | `highway=steps` | 2 | 24.3 m |
| South Gate (サウスゲート) | way 1211706027 | `highway=steps` | 2 | 15.1 m |
| Arena Street (アリーナストリート) | way 1211706034 | `highway=footway` (closed loop around the arena, schematic) | 11 | 490.6 m |
| Tower Street (タワーストリート) | way 1211706037 | `highway=footway` | 3 | 31.6 m |
| Arena Tent (アリーナテント) | way 1211706026 | `building=yes` | 4 | 42.7 m × 2.8 m (119 m²), along the N facade |
| Bay Tent (ベイテント) | way 1211706032 | `building=roof` | 4 | 158 m² |
| Takashima Line freight railway (高島線) | ways 220962685, 220962684 | `railway=rail`, `usage=industrial`, `electrified=contact_line`, `voltage=1500`, `gauge=1067` | 14 | passes 60–100 m NW of the arena |
| Takashima Suisaisen Park (高島水際線公園) | way 222740004 | `leisure=park` | 47 | wraps the N / NE side |
| Katabira river mouth water | relation 13545312 | `natural=water`, `water=river` | 103 | north of the park |

No OSM `entrance=*` node exists on the arena, hotel or tower. There are no `building:part` elements for any Music Terrace building.

### 3.2 Footprint coordinate arrays (OSM)

K-Arena, way 934667675 (coarse; use the PLATEAU outline in section 4 instead):

```json
[[139.6312794,35.4640348],[139.6298944,35.4640420],[139.6298922,35.4645730],[139.6303466,35.4651599],[139.6309827,35.4653841],[139.6311131,35.4651458],[139.6315448,35.4643403],[139.6312794,35.4640348]]
```

Hilton Yokohama, way 934667674 (rectilinear C-shape: 62.6 m east-west × 33.0 m north-south, with a 39 m × 5 m recess on the south-west side):

```json
[[139.6291247,35.4643673],[139.6291583,35.4643674],[139.6292648,35.4643677],[139.6298137,35.4643691],[139.6298148,35.4640727],[139.6297692,35.4640726],[139.6295211,35.4640720],[139.6295210,35.4641192],[139.6291256,35.4641182],[139.6291247,35.4643673]]
```

K Tower Yokohama, way 934667673 (rectangle 41.7 m east-west × 32.0 m north-south):

```json
[[139.6285828,35.4643297],[139.6285853,35.4640433],[139.6286893,35.4640473],[139.6290421,35.4640481],[139.6290412,35.4643314],[139.6288178,35.4643298],[139.6285828,35.4643297]]
```

Music Terrace podium / deck structure, way 934667677 (`height=5`, wraps both towers and runs along the arena's W, NW and N facades and round the N tip):

```json
[[139.6298922,35.4645730],[139.6298944,35.4640420],[139.6298150,35.4640417],[139.6298148,35.4640727],[139.6298137,35.4643691],[139.6291247,35.4643673],[139.6291256,35.4641182],[139.6295210,35.4641192],[139.6295211,35.4640720],[139.6297692,35.4640726],[139.6297694,35.4640200],[139.6294637,35.4640193],[139.6294636,35.4640514],[139.6292322,35.4640509],[139.6292322,35.4640307],[139.6291236,35.4640304],[139.6291237,35.4640109],[139.6286894,35.4640100],[139.6286893,35.4640473],[139.6290421,35.4640481],[139.6290412,35.4643314],[139.6288178,35.4643298],[139.6288128,35.4643686],[139.6288320,35.4643998],[139.6288840,35.4644817],[139.6290628,35.4645876],[139.6291685,35.4645545],[139.6294694,35.4647300],[139.6294378,35.4648470],[139.6295674,35.4649249],[139.6296686,35.4648889],[139.6297784,35.4650247],[139.6298775,35.4649432],[139.6299125,35.4649518],[139.6299938,35.4650777],[139.6302779,35.4651742],[139.6302504,35.4652244],[139.6308358,35.4654268],[139.6308338,35.4654319],[139.6308872,35.4654462],[139.6309429,35.4654482],[139.6309998,35.4654445],[139.6310549,35.4654308],[139.6311090,35.4654078],[139.6311485,35.4653793],[139.6311840,35.4653458],[139.6312106,35.4653059],[139.6312652,35.4652016],[139.6311131,35.4651458],[139.6309827,35.4653841],[139.6303466,35.4651599],[139.6298922,35.4645730]]
```

Takashima Suisaisen Deck centre line, way 934667676 (east end at the K Tower north-west corner, west end on the みなとみらい大橋 approach):

```json
[[139.6288320,35.4643998],[139.6287092,35.4644489],[139.6285771,35.4644805],[139.6284157,35.4644956],[139.6282513,35.4644880],[139.6281014,35.4644584],[139.6279731,35.4644163],[139.6278426,35.4643602],[139.6277640,35.4643182],[139.6273871,35.4640800]]
```

Music Terrace site boundary, way 934667672 (31,384 m²; rounded corners on the north-east and east):

```json
[[139.6313551,35.4639910],[139.6315036,35.4641413],[139.6315461,35.4641941],[139.6315778,35.4642490],[139.6316050,35.4643090],[139.6316175,35.4643700],[139.6316216,35.4644350],[139.6316155,35.4645001],[139.6315992,35.4645634],[139.6315708,35.4646268],[139.6312157,35.4653085],[139.6311886,35.4653485],[139.6311526,35.4653827],[139.6311104,35.4654123],[139.6310577,35.4654361],[139.6310007,35.4654498],[139.6309428,35.4654541],[139.6308854,35.4654509],[139.6308297,35.4654365],[139.6300064,35.4651470],[139.6299416,35.4651235],[139.6298790,35.4650989],[139.6298153,35.4650720],[139.6297602,35.4650471],[139.6297134,35.4650254],[139.6296646,35.4650018],[139.6296168,35.4649761],[139.6295711,35.4649521],[139.6287884,35.4645181],[139.6286698,35.4644433],[139.6285821,35.4643535],[139.6285220,35.4642461],[139.6284959,35.4641337],[139.6284957,35.4639933],[139.6313335,35.4639910],[139.6313551,35.4639910]]
```

Named plazas and stairs:

| Feature | Coordinates |
|---|---|
| アリーナフロント (way 1211706048) | `[[139.6299774,35.4648744],[139.6300877,35.4650202],[139.6303434,35.4650742],[139.6301220,35.4648028],[139.6299774,35.4648744]]` |
| アリーナデッキ (way 1211706040) | `[[139.6298300,35.4646123],[139.6298328,35.4643919],[139.6299367,35.4643919],[139.6299335,35.4647449],[139.6298300,35.4646123]]` |
| ミュージックテラスステージ (way 1211706047) | `[[139.6297408,35.4649338],[139.6296634,35.4648419],[139.6297924,35.4647698],[139.6298699,35.4648618],[139.6297408,35.4649338]]` |
| ミュージックテラスプラザ (way 1211706045) | `[[139.6294807,35.4643528],[139.6294821,35.4641318],[139.6293463,35.4641312],[139.6293450,35.4643522],[139.6294807,35.4643528]]` |
| ミュージックテラススクエア (way 1211706042) | `[[139.6290601,35.4645575],[139.6289198,35.4644658],[139.6288381,35.4643657],[139.6291075,35.4643582],[139.6291153,35.4645434],[139.6290601,35.4645575]]` |
| ビッグステップス (way 1211706038), bottom → top | `[[139.6298798,35.4648917],[139.6300135,35.4648109]]` |
| ノースゲート (way 1211706046), outer → inner | `[[139.6296568,35.4650135],[139.6298798,35.4648917]]` |
| サウスゲート (way 1211706027), north (top) → south (street) | `[[139.6294258,35.4640939],[139.6294271,35.4639578]]` |
| タワーストリート (way 1211706037) | `[[139.6290690,35.4643828],[139.6290699,35.4643423],[139.6290753,35.4640980]]` |
| アリーナストリート (way 1211706034), schematic loop | `[[139.6298420,35.4646039],[139.6298457,35.4640882],[139.6298459,35.4640605],[139.6312749,35.4640490],[139.6315256,35.4643388],[139.6310619,35.4651878],[139.6310193,35.4652657],[139.6309696,35.4653567],[139.6303659,35.4651424],[139.6302479,35.4651024],[139.6300135,35.4648109],[139.6298420,35.4646039]]` |
| アリーナテント (way 1211706026) | `[[139.6303715,35.4652158],[139.6308053,35.4653655],[139.6307933,35.4653886],[139.6303595,35.4652388],[139.6303715,35.4652158]]` |
| ベイテント (way 1211706032) | `[[139.6295884,35.4648583],[139.6294999,35.4647449],[139.6295983,35.4646940],[139.6296868,35.4648074],[139.6295884,35.4648583]]` |
| Low-rise annex (way 1211949300) | `[[139.6295397,35.4646340],[139.6292644,35.4644738],[139.6292648,35.4643677],[139.6291583,35.4643674],[139.6291575,35.4645750],[139.6294448,35.4647422],[139.6295397,35.4646340]]` |

### 3.3 POIs inside the site (OSM nodes)

| Name | `[lon, lat]` | Tags | Note |
|---|---|---|---|
| Arena Bar 7 | `[139.6302336, 35.4640946]` | `amenity=bar` | Mapped at the arena's SW part (LEVEL 7 bar) |
| 音楽・情熱 "Music Passionate" (武蔵野ルネ, 2023) | `[139.6303242, 35.4640955]` | `tourism=artwork`, painting | South side |
| 音楽・平和 "Music Peaceful" (武蔵野ルネ, 2023) | `[139.6311155, 35.4649824]` | `tourism=artwork`, painting | North-east side |
| Ticket counter | `[139.6310699, 35.4650611]` | `shop=ticket` | North-east side |
| P1 parking entrance | `[139.6306171, 35.4652753]` | `amenity=parking_entrance`, 07:00–23:00, fee | On the north facade |
| P2 parking entrance | `[139.6290156, 35.4644504]` | `amenity=parking_entrance`, customers | At Music Terrace Square |
| K-ARENA SHOP | `[139.6293105, 35.4642837]` | `shop=gift`, 13:00–22:00 | Under / beside the Hilton |
| BAYDECK | `[139.6297003, 35.4642551]` | `amenity=bar`, 11:00–23:00 | |
| Parade | `[139.6297015, 35.4641317]` | `amenity=restaurant` | Hilton all-day dining |
| Melody | `[139.6294330, 35.4646714]` | `amenity=bar`, `level=2` | In the annex polygon |
| Ocean Milano | `[139.6292898, 35.4645867]` | `amenity=restaurant`, `level=1` | In the annex polygon |
| ローソン (Lawson) | `[139.6289612, 35.4643121]` | `shop=convenience` | K Tower |
| Elevators (`highway=elevator`) | `[139.6302847, 35.4652012]`, `[139.6311799, 35.4651885]`, `[139.6300171, 35.4653391]`, `[139.6293218, 35.4639170]`, `[139.6297059, 35.4654711]` | | Deck ↔ ground lifts: N-NW corner, NE side, north park side, South Gate, park footbridge |
| Bicycle parking | `[139.6309152, 35.4653812]` | `amenity=bicycle_parking` | North tip |
| Toilets | `[139.6297930, 35.4649997]` (male), `[139.6296808, 35.4648813]` (female) | `amenity=toilets` | By the Music Terrace Stage |

---

## 4. K-Arena footprint analysis (PLATEAU LOD0, official survey outline)

Source: MLIT PLATEAU Yokohama 2024, CityGML mesh 53391550, `bldg:Building gml:id="bldg_4851209b-3d95-4266-986e-d795150ff6be"`, `uro:buildingID 14100-bldg-1007198`, `bldg:lod0FootPrint`. Geometry source per the data-quality attributes: aerial photogrammetry (空中写真測量), map information level 1000 for LOD0 / LOD1 / LOD2. **CONFIRMED.** It is the **roof outline** as seen from above (it matches the roof edge in the 2023 PLATEAU ortho photo to within about 1 m when overlaid). The ground-floor wall line may be set back under overhangs; no open dataset gives the ground-floor line (see section 14).

### 4.1 Outline as a FeatureCollection-ready array (14 vertices, counter-clockwise, closed)

```json
[[139.6314066,35.4641708],[139.6313342,35.4642096],[139.6313767,35.4642627],[139.6314491,35.4642239],[139.6315488,35.4643484],[139.6315522,35.4643557],[139.6315511,35.4643623],[139.6310124,35.4654046],[139.6304023,35.4651936],[139.6299049,35.4645732],[139.6299059,35.4640345],[139.6312888,35.4640361],[139.6312971,35.4640377],[139.6313041,35.4640428],[139.6314066,35.4641708]]
```

### 4.2 Vertex table

E / N are metres east / north of the PLATEAU bounding-box centre `[139.6307285, 35.4647196]`. X / Y are arena-frame coordinates (section 4.4).

| # | `[lon, lat]` | E (m) | N (m) | X (m) | Y (m) | Role |
|---|---|---|---|---|---|---|
| v0 | `[139.6314066, 35.4641708]` | 61.55 | −60.89 | −3.62 | 0.00 | Stage-end face, south lip of notch |
| v1 | `[139.6313342, 35.4642096]` | 54.98 | −56.59 | −3.62 | 7.86 | Notch inner corner |
| v2 | `[139.6313767, 35.4642627]` | 58.84 | −50.69 | 3.43 | 7.86 | Notch inner corner |
| v3 | `[139.6314491, 35.4642239]` | 65.41 | −55.00 | 3.43 | 0.00 | Stage-end face, north lip of notch |
| v4 | `[139.6315488, 35.4643484]` | 74.46 | −41.19 | 19.94 | 0.01 | Start of east corner fillet |
| v5 | `[139.6315522, 35.4643557]` | 74.77 | −40.37 | 20.79 | 0.20 | Fillet |
| v6 | `[139.6315511, 35.4643623]` | 74.67 | −39.64 | 21.35 | 0.68 | End of fillet, start of NE wall |
| v7 | `[139.6310124, 35.4654046]` | 25.77 | 76.00 | 91.25 | 104.98 | **North tip** (NE wall / N wall), 90.0° corner |
| v8 | `[139.6304023, 35.4651936]` | −29.61 | 52.58 | 41.30 | 138.45 | N wall / NW wall corner (146.2°) |
| v9 | `[139.6299049, 35.4645732]` | −74.76 | −16.25 | −41.02 | 138.47 | NW wall / W wall corner (146.7°) |
| v10 | `[139.6299059, 35.4640345]` | −74.67 | −76.01 | −90.95 | 105.63 | **South-west corner** (W wall / S wall), 90.0° corner |
| v11 | `[139.6312888, 35.4640361]` | 50.86 | −75.83 | −21.97 | 0.75 | End of S wall, start of south corner fillet |
| v12 | `[139.6312971, 35.4640377]` | 51.62 | −75.66 | −21.41 | 0.21 | Fillet |
| v13 | `[139.6313041, 35.4640428]` | 52.24 | −75.09 | −20.60 | −0.01 | End of fillet, start of stage-end face |

### 4.3 Edge table (which edges are straight / curved)

| Edge | Length (m) | Bearing (°) | Outward normal (°) | Description |
|---|---|---|---|---|
| v10 → v11 | **125.53** | 89.92 | 179.92 | **South wall**, straight, exactly east-west. Long side wall of the fan |
| v11 → v12 → v13 | 0.78 + 0.84 | 77.0, 48.1 | | Small rounded corner (fillet radius about 1.5 m) |
| v13 → v0 | 16.98 | 33.23 | 123.23 | **Stage-end (SE) face**, south part, straight |
| v0 → v1 → v2 → v3 | 7.86, 7.05, 7.86 | 303.23, 33.23, 123.23 | | Rectangular **notch** in the middle of the stage-end face: 7.05 m wide, 7.86 m deep, centred on the axis |
| v3 → v4 | 16.51 | 33.23 | 123.23 | Stage-end face, north part, straight |
| v4 → v5 → v6 | 0.87 + 0.74 | 20.6, 352.7 | | Small rounded corner |
| v6 → v7 | **125.55** | 337.08 | 67.08 | **North-east wall**, straight. The other long side wall of the fan |
| v7 → v8 | 60.12 | 247.08 | 337.08 | **North wall** (rear facet 3), straight, perpendicular to the NE wall |
| v8 → v9 | **82.32** | 213.26 | 303.26 | **North-west wall** (rear facet 2, the centre rear, main entrance side), straight |
| v9 → v10 | 59.77 | 179.92 | 269.92 | **West wall** (rear facet 1), straight, exactly north-south, perpendicular to the S wall |

Summary of the outline: **every edge is straight**. The plan is a mirror-symmetric fan: two long side walls (125.5 m each) diverging at 67.2° from a short truncated stage-end face (42.4 m between sharp corners), closed at the rear by three facets (59.8 m, 82.3 m, 60.1 m) whose normals step by 33.3° and 33.8°. The only non-sharp corners are the two tiny fillets at the stage end. Sum of straight stage-end parts: 16.98 + 7.05 + 16.51 = 40.54 m. ESTIMATED from the CONFIRMED polygon.

Derived totals: signed area 16,153.8 m² (counter-clockwise); perimeter 512.8 m; lon / lat bounding box `[139.6299049, 35.4640345]` – `[139.6315522, 35.4654046]` = 149.52 m (E-W) × 152.01 m (N-S). The minimum-area oriented bounding box happens to be the N-S / E-W box (149.5 × 152.0 m), because the two right-angle corners (v10, v7) are far apart; the meaningful principal axes are the symmetry axis and its normal.

### 4.4 Arena frame (symmetry axis)

| Quantity | Value | How derived |
|---|---|---|
| Axis bearing, stage → rear | **303.25°** | Outward normal of the NW wall (303.26°) and inward normal of the stage-end face (303.23°) |
| Axis bearing, rear → stage (viewing direction of the audience) | 123.25° | |
| Lateral offset of the symmetry axis from the bbox centre | −13.56 m (toward the SW) | Mean of three estimates: NW wall midpoint (−13.42), stage-end sharp-corner midpoint (−13.85), widest-corner midpoint (−13.41). The roof apex (−13.36) and the notch centre (−13.66) agree |
| `S0`, axis × stage-end face, frame origin (0, 0) | `[139.6314284, 35.4641981]` | |
| `R0`, axis × NW rear wall (0, 138.46) | `[139.6301528, 35.4648823]` | |
| Axial length `S0`–`R0` | 138.46 m | |
| Width across the axis | 182.20 m (bounding), measured between v10 and v7 | |
| Virtual focus of the fan (where the two side-wall lines meet) | about (0, −32 m), i.e. 32 m behind the stage-end face, `≈ [139.6317230, 35.4640400]` | Line intersection: S-wall line hits the axis at Y = −32.7, NE-wall line at Y = −31.2 |

Frame definition: **+Y** along bearing 303.25° (from the stage-end face toward the rear), **+X** along bearing 33.25° (toward the north-east side, i.e. toward 高島水際線公園), Z up, Z = 0 at 4.18 m T.P.

Conversion (ESTIMATED, flat-earth approximation, error below 1 cm over the building):

```
E = 0.54829 * X - 0.83629 * Y        (metres east of S0)
N = 0.83629 * X + 0.54829 * Y        (metres north of S0)
lon = 139.6314284 + E / 90769.19
lat =  35.4641981 + N / 110949.11
```

Sharp-corner design polygon (fillets and notch removed), the cleanest input for procedural modelling:

| Corner | `[lon, lat]` | X (m) | Y (m) |
|---|---|---|---|
| C1, stage-end south corner (S wall × SE face) | `[139.6312987, 35.4640361]` | −21.48 | 0.00 |
| C2, stage-end east corner (SE face × NE wall) | `[139.6315546, 35.4643556]` | 20.90 | 0.00 |
| C3, north tip | `[139.6310124, 35.4654046]` | 91.25 | 104.98 |
| C4, N / NW corner | `[139.6304023, 35.4651936]` | 41.30 | 138.45 |
| C5, NW / W corner | `[139.6299049, 35.4645732]` | −41.02 | 138.47 |
| C6, south-west corner | `[139.6299059, 35.4640345]` | −90.95 | 105.63 |

Edge lengths of this hexagon: C1–C2 42.38 m, C2–C3 126.37 m, C3–C4 60.12 m, C4–C5 82.32 m, C5–C6 59.77 m, C6–C1 126.43 m; area 16,209.5 m². An idealised perfectly symmetric version for modelling: stage face half-width 21.2 m at Y = 0; widest half-width 91.1 m at Y = 105.3; rear half-width 41.2 m at Y = 138.46.

Width of the building across the axis at stations along Y (sharp polygon):

| Y (m from stage-end face) | X min | X max | Width (m) |
|---|---|---|---|
| 0 | −21.5 | 20.9 | 42.4 |
| 10 | −28.1 | 27.6 | 55.7 |
| 20 | −34.6 | 34.3 | 68.9 |
| 30 | −41.2 | 41.0 | 82.2 |
| 40 | −47.8 | 47.7 | 95.5 |
| 50 | −54.4 | 54.4 | 108.8 |
| 60 | −60.9 | 61.1 | 122.1 |
| 70 | −67.5 | 67.8 | 135.3 |
| 80 | −74.1 | 74.5 | 148.6 |
| 90 | −80.7 | 81.2 | 161.9 |
| 100 | −87.3 | 87.9 | 175.2 |
| 105 | −90.5 | 91.2 | 181.8 (maximum) |
| 110 | −84.3 | 83.8 | 168.1 |
| 120 | −69.1 | 68.8 | 137.9 |
| 130 | −53.9 | 53.9 | 107.8 |
| 138.4 | −41.1 | 41.4 | 82.5 |

Width grows by 1.328 m per metre of Y up to Y = 105 m, then shrinks by 3.01 m per metre.

---

## 5. Roof and wall heights (PLATEAU LOD2, aerial photogrammetry)

Source: same building, `bldg:lod2Solid` with 13 `RoofSurface`, 21 `WallSurface`, 1 `GroundSurface` polygons (full coordinates in `plateau/karena_plateau_lod012.json`). **CONFIRMED** survey geometry, but LOD2.0 is a generalisation: walls drop vertically from the roof edge, there are no overhangs, windows or soffits, and the faceted roof approximates the real surface. Heights above ground use the wall base 4.18 m T.P.

### 5.1 Height summary

| Element | Elevation T.P. (m) | Above ground (m) |
|---|---|---|
| Ground (LOD2 base) | 4.18 (LOD1 base 4.23) | 0 |
| Roof apex (highest point) | 50.36 | 46.18 |
| Raised roof, rear edge (NW) | 49.08 – 49.44 | 44.9 – 45.3 |
| Raised roof, side edges at the widest corners | 46.78 (SW), 46.97 (N) | 42.6, 42.8 |
| Raised roof, stage-end edge | 39.67 (S), 40.81 (centre), 39.89 (N) | 35.5, 36.6, 35.7 |
| Perimeter ledge / parapet, rear wall top | 45.76 – 46.27 | 41.6 – 42.1 |
| Perimeter ledge, widest corners | 43.38 (SW), 44.48 (N tip) | 39.2, 40.3 |
| Perimeter ledge, stage-end face top | 37.17 – 37.48 | 33.0 – 33.3 |
| Notch floor at the stage end | 37.77 – 37.82 | 33.6 |
| LOD1 block top (median height) | 44.65 | 40.42 |
| `bldg:measuredHeight` | | 46.2 |

Roof structure, in words: a low **raised roof** (ribbed metal, white to very light grey in the sunlit ortho photo) sits inside a 5 m wide lower perimeter band along the S and W walls (wider at the rear). The raised roof is a shallow faceted fan: its apex is on the symmetry axis 9 m inside the rear wall, and planar facets fall at about 5° toward the stage end and at about 3° toward the two side corners. Short steep faces (35°–37° on the rear, 67°–81° on the sides and the stage end) join the raised roof to the perimeter band. The perimeter band itself is one plane tilted 3.6° down toward bearing 129°. Mean fall of the raised roof along the axis: 9.55 m over 117.4 m = 4.65°. The official cross-section (https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png) shows the same thing: a deep roof truss highest over the LEVEL 7 upper stand at the rear and sloping down toward the stage.

### 5.2 Roof key points in the arena frame

| `[lon, lat]` | X (m) | Y (m) | z T.P. (m) | h above ground (m) | Meaning |
|---|---|---|---|---|---|
| `[139.6302360, 35.4648398]` | 0.20 | 129.55 | 50.36 | 46.18 | **Apex** |
| `[139.6300006, 35.4645482]` | −38.57 | 129.69 | 49.08 | 44.90 | Raised roof, rear-west corner |
| `[139.6304662, 35.4651248]` | 38.10 | 129.42 | 49.44 | 45.26 | Raised roof, rear-north corner |
| `[139.6300025, 35.4640923]` | −80.78 | 101.80 | 46.78 | 42.60 | Raised roof, south-west corner |
| `[139.6309886, 35.4653128]` | 81.54 | 101.20 | 46.97 | 42.79 | Raised roof, north corner |
| `[139.6311821, 35.4640907]` | −22.22 | 12.17 | 39.67 | 35.49 | Raised roof, stage-end south corner |
| `[139.6313168, 35.4642580]` | 0.00 | 12.12 | 40.81 | 36.63 | Raised roof, stage-end centre (ridge) |
| `[139.6314519, 35.4644256]` | 22.28 | 12.06 | 39.89 | 35.71 | Raised roof, stage-end north corner |
| `[139.6299590, 35.4645626]` | −39.30 | 133.72 | 46.27 / 45.47 | 42.09 / 41.29 | Foot of rear steep face (west) |
| `[139.6304347, 35.4651517]` | 39.03 | 133.45 | 46.65 / 45.94 | 42.47 / 41.76 | Foot of rear steep face (north) |
| `[139.6299582, 35.4640792]` | −84.20 | 104.37 | 43.63 / 43.34 | 39.45 / 39.16 | Foot of side steep face (SW) |
| `[139.6309831, 35.4653443]` | 84.19 | 103.53 | 44.42 / 44.35 | 40.24 / 40.17 | Foot of side steep face (N) |
| `[139.6301520, 35.4640790]` | −74.58 | 89.65 | 42.47 | 38.29 | Inner edge of S perimeter band |
| `[139.6311801, 35.4640839]` | −22.95 | 11.91 | 37.91 | 33.73 | Foot of stage-end steep face (S) |
| `[139.6314573, 35.4644281]` | 22.78 | 11.80 | 38.19 | 34.01 | Foot of stage-end steep face (N) |
| `[139.6299049, 35.4645732]` (v9) | −41.02 | 138.47 | 45.76 | 41.58 | Outer rear corner, west |
| `[139.6304023, 35.4651935]` (v8) | 41.30 | 138.45 | 46.27 | 42.09 | Outer rear corner, north |
| `[139.6299059, 35.4640345]` (v10) | −90.95 | 105.63 | 43.38 | 39.20 | Outer SW corner |
| `[139.6310124, 35.4654046]` (v7) | 91.25 | 104.98 | 44.48 | 40.30 | Outer N tip |
| `[139.6312888, 35.4640361]` (v11) | −21.97 | 0.75 | 37.21 | 33.03 | Outer stage-end south corner |
| `[139.6315511, 35.4643623]` (v6) | 21.35 | 0.68 | 37.48 | 33.30 | Outer stage-end east corner |

Raised-roof facets (triangles, all sharing the apex): apex–SW corner–stage-end S corner 4,459 m², tilt 5.1°, faces 132°; apex–stage-end S corner–stage-end centre 1,311 m², 5.5°, faces 156°; apex–stage-end centre–stage-end N corner 1,314 m², 5.2°, faces 97°; apex–stage-end N corner–N corner 4,483 m², 5.0°, faces 116°; apex–rear-west–SW corner 544 m², 2.7°; apex–N corner–rear-north 533 m², 3.2°.

### 5.3 Facade table (LOD2 walls)

| Facade | Outward normal (°) | Length (m) | Top elevation T.P. (m), along the wall | Wall height above ground (m) | Area (m²) |
|---|---|---|---|---|---|
| South wall | 179.9 | 125.5 | 37.21 (stage end) → 43.38 (SW corner) | 33.0 → 39.2 | 4,534 |
| West wall (rear facet 1; South Entrance side) | 269.9 | 59.8 | 43.38 → 45.76 | 39.2 → 41.6 | 2,414 |
| North-west wall (rear facet 2; Main Entrance) | 303.3 | 82.3 | 45.76 → 46.27 | 41.6 → 42.1 | 3,444 |
| North wall (rear facet 3; North Entrance side) | 337.1 | 60.1 | 46.27 → 44.48 | 42.1 → 40.3 | 2,477 |
| North-east wall | 67.1 | 125.6 | 44.48 (N tip) → 37.48 (stage end) | 40.3 → 33.3 | 4,621 |
| Stage-end (SE) face | 123.2 | 17.0 + 16.5 (+ notch) | 37.17 – 37.48 | 33.0 – 33.3 | 561 + 548 (+ notch walls 262, 262, 237) |

---

## 6. Stage end, entrances and the pedestrian decks

### 6.1 Which end is the stage

- **CONFIRMED** by the official LEVEL 3 and LEVEL 1 floor maps (https://k-arena.com/wp-content/themes/k-arena/assets/images/floor/img_floor_map_lv3_sp.jpg, `..._lv1_sp.jpg`): the STAGE is at the narrow truncated end of the fan; the LOWER STAND wraps the wide end; the **Main Entrance (メインエントランス)** is centred on the middle rear facet, the **North Entrance (ノースエントランス)** on one side rear facet and the **South Entrance (サウスエントランス)** on the other.
- Matching the drawing to the surveyed outline (same six-wall shape, side walls drawn 33° off the axis, rear facets 32° off the cross direction): the narrow end is the **south-east** end (stage-end face normal 123.2°), so the **stage is at the SE end**, toward the 関東地方整備局京浜港湾事務所 / port side. **ESTIMATED orientation from CONFIRMED shape.**
- Consistent independent evidence: the roof is lowest at the SE end and highest at the NW end, exactly as in the official cross-section where the roof is highest over the upper stand; rooftop plant and the notch are at the SE end in the ortho photo; OSM's アリーナフロント plaza, ビッグステップス and アリーナデッキ are all on the NW / W side.
- The floor map is a plan with the stage **up**. Up = bearing 123.25° (SE). Left of the drawing = bearing 33.25° (NE): that is where "North Entrance" and door 301 are. Right of the drawing = bearing 213.25° (SW): "South Entrance" and door 304.

### 6.2 Entrance positions

All three entrances are on **LEVEL 3**, the level of the outdoor Arena Deck (CONFIRMED: Travel Watch press tour report, https://travel.watch.impress.co.jp/docs/news/1533996.html; official cross-section labels the outdoor platform at that level "ARENA DECK アリーナデッキ"). Positions below are **ESTIMATED**: centre of the facade for the main entrance, and for the side entrances the fraction along the facet where the arrow sits in the official (schematic) floor map. Expect ±10 m.

| Entrance | `[lon, lat]` | Arena frame (X, Y) | On facade | Faces |
|---|---|---|---|---|
| Main Entrance (メインエントランス) | `[139.6301528, 35.4648823]` (= `R0`) | (0, 138.5) | NW wall, centre | アリーナフロント plaza, bearing 303° |
| North Entrance (ノースエントランス) | `[139.6306829, 35.4652907]` | (64, 123) | N wall, about 54 % of the way from the north tip to the NW wall | 高島水際線公園 side, bearing 337° |
| South Entrance (サウスエントランス) | `[139.6299054, 35.4643254]` | (−64, 123) | W wall, about 54 % of the way from the SW corner to the NW wall | Hilton / アリーナデッキ, bearing 270° |

These three points lie **on the roof-outline line**. The doors themselves are further inside, under the overhang: on the axis the LEVEL 3 entrance wall is about 18 m inside the eave line, at Y ≈ 120 m (section 6.6), so the main entrance doors are near `[139.6303228, 35.4647911]` (X = 0, Y = 120; ESTIMATED ±4 m). The official floor map draws the main entrance as a lobby block projecting outward beyond the rear facet line of the LEVEL 3 plan; the surveyed roof outline has no projection there, so that lobby sits under the roof overhang (ESTIMATED).

Scale note for anyone using the official floor maps: the drawn angles are true, but the LEVEL 3 map stops about 20 m short of the real stage-end facade (drawn stage wall = 0.82 × rear facet; real = 0.49). It is consistent with a to-scale plan of the public areas at roughly 0.34 m per pixel of the 683 px wide image, cropped behind the stage. ESTIMATED.

### 6.3 Audience left / right

Facing the stage (looking toward 123°): audience-left is the **north-east** side (+X in the arena frame, 高島水際線公園 and the water), audience-right is the **south-west** side (−X, the south wall). In Japanese stage terms 下手 (shimote) is the NE side and 上手 (kamite) the SW side. ESTIMATED from the geometry above.

### 6.4 On-site deck (Arena Deck) and the gates

REPORTED (OSM geometry, section 3) unless noted:

- The elevated Music Terrace deck / podium (OSM way 934667677) surrounds the Hilton and the K Tower and continues along the arena's **W, NW and N facades**, ending round the north tip. It meets the arena along about 200 m of facade: the whole W wall (v10–v9), the whole NW wall (v9–v8) and the whole N wall (v8–v7).
- **アリーナデッキ**: the strip between the Hilton east face (lon 139.62981) and the arena W wall (lon 139.62990), from lat 35.46439 to 35.46474.
- **アリーナフロント**: plaza in front of the NW wall, centred about `[139.6301016, 35.4649292]`.
- **ビッグステップス**: grand stair, 15.1 m plan length, from `[139.6298798, 35.4648917]` (lower, beside ミュージックテラスステージ) up to `[139.6300135, 35.4648109]` (Arena Front), climbing toward bearing 126°.
- **ノースゲート**: stair, 24.3 m plan length, from `[139.6296568, 35.4650135]` (the perimeter road sidewalk on the NW side) to `[139.6298798, 35.4648917]`.
- **サウスゲート**: stair, 15.1 m plan length, from the south sidewalk `[139.6294271, 35.4639578]` up (north) to `[139.6294258, 35.4640939]`, then under the Hilton to ミュージックテラスプラザ. The route from 新高島駅 uses it (REPORTED, Oricon / Travel Watch: climb the South Gate stair, pass under the Hilton, the arena entrance is on the right).
- **West Gate (ウエストゲート)**: the deck-level gate at ミュージックテラススクエア by the K Tower north-west corner where 高島水際線デッキ lands, about `[139.6288320, 35.4643998]` (REPORTED: Travel Watch names the West Gate as the planned deck connection; position from OSM).
- Lifts between ground and deck: OSM `highway=elevator` nodes at `[139.6302847, 35.4652012]` (N / NW corner of the arena), `[139.6311799, 35.4651885]` (NE side), `[139.6293218, 35.4639170]` (South Gate).
- Vehicle entrances: P1 at `[139.6306171, 35.4652753]` on the north facade (service way 1211707831 leads in from the perimeter road), P2 at `[139.6290156, 35.4644504]`.

**Deck level (LEVEL 3) height: not published in any open dataset. ESTIMATED 6.5 m ± 1 m above ground (about 10.7 m T.P.).** Reasoning: (a) OSM tags the podium `height=5`, `building:levels=1`; (b) in the official cross-section the deck sits two storeys above grade and scales to 6.2–7.0 m (section 6.6); (c) 高島水際線デッキ arrives at this level after crossing the electrified 高島線 (rail level 3.1 m T.P. per GSI; a bridge over 1,500 V overhead line needs roughly 6 m clearance plus girder depth), which puts its walking surface near 10–11 m T.P.; (d) the stairs have 15–24 m plan lengths, typical of a 6–8 m rise with landings.

### 6.5 Takashima Suisaisen Deck (高島水際線デッキ)

| Fact | Value | Confidence | Source |
|---|---|---|---|
| Type | Pedestrian bridge (人道橋 / 歩道橋) | CONFIRMED | Yokohama City, https://www.city.yokohama.lg.jp/city-info/koho-kocho/press/toshi/2024/20250314.html |
| Bridge length | 130.4 m | CONFIRMED | Yokohama City press material (as quoted in search results for the 2024-05-31 and 2025-03-14 releases) |
| Effective width | 6.0 m (deck part) | CONFIRMED | same |
| Connects | 60・61街区 (Music Terrace / Kアリーナ横浜) with みなとみらい大橋 / みなとみらい大通り; gives a new route to 横浜駅 | CONFIRMED | same; https://www.city.yokohama.lg.jp/kurashi/machizukuri-kankyo/toshiseibi/mm21/takasima-nr.html |
| Opening | Provisional opening 2025-03-27 (delayed from 2024-06-01 because of an abutment design defect) | CONFIRMED | same |
| Route geometry | OSM way 934667676 (146.3 m path): from `[139.6273871, 35.4640800]` on the bridge approach, heading 52° for 43 m, then curving right in a 103 m long arc over the freight railway and the perimeter road, to `[139.6288320, 35.4643998]` at the K Tower NW corner, arriving on a heading of 116° | REPORTED | OSM |
| Ground under the west landing | 8.2 m T.P. (the みなとみらい大橋 approach is on an embankment) | CONFIRMED | GSI elevation API |
| Ground under the east landing | 4.2 m T.P. | CONFIRMED | GSI elevation API |
| Present in PLATEAU 2024 | No (built later) | CONFIRMED | PLATEAU bridge CityGML |

Walking distances stated by the venue: 横浜駅 east exit about 9 minutes, 新高島駅 exit 4 about 5 minutes, みなとみらい駅 exit 2 about 12 minutes (CONFIRMED, https://k-arena.com/access/). Straight-line from the main entrance: 新高島駅 exit 4 `[139.6273182, 35.4620048]` 410 m at bearing 219°.

### 6.6 Rear overhang and deck level scaled from the official cross-section

Source image: https://k-arena.com/wp-content/themes/k-arena/assets/images/img_cross-section.png (1800 × 582 px cutaway along the axis, stage on the right). **ESTIMATED.** Roof silhouette, ground line and deck edge were measured by decoding the PNG (`section_measure.py`); the facade points were read by eye (±10 px). Scaling: horizontally, the roof-eave tip (x = 60 px) to the back wall of the stage house (x ≈ 1790 px) = 138.46 m (surveyed), so 0.0800 m/px; vertically, ground (y = 514 px) to the roof top (y = 0 px) = 46.18 m, so 0.0898 m/px. Cross-checks against the survey: the highest roof point is at x = 160 px, which scales to Y = 130.5 m (PLATEAU apex Y = 129.55 m); the eave tip scales to 42.9 m (PLATEAU rear edge 41.6–42.1 m); the main roof near the stage end scales to 37.4 m (PLATEAU 36.6 m); the lower stage-house roof scales to 34.1 m (PLATEAU perimeter band 33.0–33.7 m); the roof line falls 95 px over 1,400 px = 4.4° (PLATEAU 4.65°). The drawing is a rendering, so allow ±3 m horizontally and ±1 m vertically.

| Feature in the section | Pixel | Arena-frame Y (m) | Height above ground (m) |
|---|---|---|---|
| Roof eave tip at the rear (= surveyed NW roof edge) | x 60, y 36 | 138.5 | 42.9 |
| Roof top, rear (apex line) | x 160, y 0 | 130.5 | 46.2 |
| Top of the inclined rear facade (under the upper stand) | about x 205, y 160 | 126.9 | 31.8 |
| Foot of the inclined rear facade = LEVEL 3 entrance wall | about x 290, y 375–436 | 120.1 | 12.5 down to deck level |
| Arena Deck surface (LEVEL 3), front edge | y 436, from x 43 to about x 290 | 120 to about 140 | **7.0** with the vertical scale, 6.2 with the horizontal scale |
| Main roof near the stage end | x 1600, y 98 | 15.3 | 37.4 |
| Lower stage-house roof | x 1700, y 134 | 7.3 | 34.1 |
| Back wall of the stage house | x ≈ 1790 | 0 | |

Reading: on the axis the LEVEL 3 entrance wall stands about **18 m inside** the roof edge; the rear facade leans outward by about 7 m between 12.5 m and 32 m height (the underside of the upper stand), and the roof eave projects about a further 11.5 m beyond it. The Arena Deck in front of the entrance is about 20 m deep and ends roughly at the eave line before the Big Steps descend. Along the two side rear facets (W and N walls) the overhang is not documented in the section; assume a similar profile.

Cross-reference (not verified in this angle): the sibling report `architecture.md` cites a construction source for a 9,000 mm deep eave (大庇) carried by 24 free-standing columns, 1.2 m square and 30 m tall, on the three rear facets, puts the plaza deck at about +6.2 m, and estimates the rear wall line about 15.5 m inside the eave tip (colonnade set-out about 6.3 m plus the 9.0 m eave). That agrees with the 18 m ± 3 m and 6.2–7.0 m scaled here. It also means the surveyed PLATEAU / OSM outline is the **eave line** on the W, NW and N sides: the enclosed walls there stand roughly 15–18 m inside it, with the colonnade in between.

---

## 7. Site context

### 7.1 Buildings of the Music Terrace

| Building | Footprint source | Size | Height | Levels | Notes |
|---|---|---|---|---|---|
| K-Arena Yokohama | PLATEAU (section 4) | 138.5 × 182.2 m fan | 46.2 m (CONFIRMED) | 9 | |
| Hilton Yokohama | OSM way 934667674 | 62.6 × 33.0 m | 99.87 m (REPORTED, OSM tag) | 26 | East face 8.2 m west of the arena W wall (roof edge). **Not in PLATEAU 2024** |
| K Tower Yokohama | OSM way 934667673 | 41.7 × 32.0 m | 99.87 m (REPORTED, OSM tag; identical to the Hilton tag, treat with caution) | 21 | 7.5 m west of the Hilton. **Not in PLATEAU 2024** |
| Low-rise annex north of the Hilton | PLATEAU `14100-bldg-1007199` and OSM way 1211949300 | 566.6 m², about 29 × 21 m (stepped rectangle), walls at bearings 55° / 145° | 21.4 m: walls to 18.65 m, hipped roof to 21.4 m, ground 4.01 m T.P. (CONFIRMED) | unknown | Pyramid-like roof visible in the ortho photo. OSM maps "Ocean Milano" (level 1) and "Melody" (level 2) inside it. Function not verified |
| Podium / deck | OSM way 934667677 | 7,241 m² | 5 m (REPORTED) | 1 | See 6.4 |

PLATEAU annex outline: `[[139.6294578,35.4646900],[139.6293959,35.4647625],[139.6291730,35.4646354],[139.6292348,35.4645628],[139.6292177,35.4645531],[139.6292885,35.4644700],[139.6295496,35.4646189],[139.6294788,35.4647020],[139.6294578,35.4646900]]`

Site area check: the OSM `landuse` polygon of ミュージックテラス measures 31,384 m² (ESTIMATED from the polygon). The sibling reports `architecture.md` and `official-site.md` quote the official site area as 31,793.97 m² (MLIT certified plan, https://www.mlit.go.jp/common/001273962.pdf; not re-verified here). The two agree within 1.3 %, so the OSM site polygon is a sound site boundary.

### 7.2 Surrounding blocks (what a camera sees)

REPORTED (OSM) and CONFIRMED where PLATEAU heights are quoted.

- **South**: immediately south of the arena's south wall is an undeveloped lot (the rest of 60・61街区; OSM `landuse=greenfield`), 190 m deep down to **とちのき通り** (dual carriageway, exactly east-west at lat 35.46270–35.46280). No car road runs along the arena's south wall.
- **South-west**: 横浜アンパンマンこどもミュージアム＆モール (OSM `height=18`, 3 levels) centred `[139.6288943, 35.4632147]`, and its car parks.
- **West**: 富士フイルムビジネスイノベーション 横浜みなとみらい事業所 (oval low-rise plus a 99 m tower) at `[139.6278696, 35.4634140]`; beyond it 日産自動車グローバル本社 (99 m) and みなとみらい大通り / みなとみらい大橋 (bearing 13.8°) 315 m west.
- **North-west**: the perimeter road, the 高島線 freight railway (60–100 m from the arena, bearing 221°–236°), then the 帷子川 river mouth; 横浜ベイクォーター across the water at 340 m.
- **North / north-east**: 高島水際線公園 (a narrow waterside park with a tidal pond 潮入りの池 to the west), then open water.
- **East**: an undeveloped lot ("HARBOR EDGE PROJECT", OSM `landuse=brownfield`) and the port.
- **South-east**: 関東地方整備局京浜港湾事務所 (16.5 m, PLATEAU) 108 m from the arena; オーケーみなとみらいビル (OSM 52 m, PLATEAU 52.4 m, 11 levels); ブルーハーバータワーみなとみらい (PLATEAU 104.7 m, 27–28 levels).
- **Perimeter road** (OSM ways 25758160 and 25830664, a one-way pair, 30 km/h): comes north along the east side at bearing 0°, curves round the stage end, runs along the NE wall at **337°** for 83 m, turns round the north tip, runs along the N wall at **247°** for 81 m and on at 236°–243° beside the railway to the K Tower, then south along lon 139.62838–139.62843 at 180°.

Tall context buildings with PLATEAU measured heights (from `site-context.geojson`, kind `building_plateau`): 104.7 m (139.6327, 35.4634), 103.0 m, 105.0 m, 103.1 m, 100.0 m, 107.3 m, 106.9 m, 108.2 m (KDDI), 66.6 m, 87.0 m; a 253.1 m communication tower (横浜メディアタワー) 495 m to the south.

### 7.3 Aerial evidence (PLATEAU-Ortho 2023 / 2024 tiles, viewed)

Viewed tiles z17 and z18 around the site and overlaid the vectors (mosaics kept only in the scratchpad). Observations, ESTIMATED from the image:

- The arena roof is a ribbed (standing-seam) metal roof that reads as **white to very light grey** in the sunlit ortho photo, with visible straight fold lines radiating from the rear apex, matching the PLATEAU facets. A darker light-grey perimeter band (gutter / walkway) about 5 m wide runs inside the roof edge. (The sibling report `architecture.md` describes the roofing from ground-level photos as mid-grey; a light silver-grey is a safe texture choice.)
- Rooftop plant (grey boxes) sits on a lower grey roof strip along the stage end (Y from 0 to about 12 m) and in the notch.
- The PLATEAU outline coincides with the roof edge everywhere; the OSM Hilton and K Tower outlines coincide with the tower roofs.
- The deck paving between the Hilton and the arena and in front of the NW wall is light grey; the Music Terrace Stage area has coloured canopies.
- A freight train is visible on the 高島線; the lots south and east of the arena are bare ground.
- The imagery pre-dates 高島水際線デッキ (not visible).

---

## 8. Ground elevation (GSI elevation API)

Source: `https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=..&lat=..&outtype=JSON`. **CONFIRMED** values. `hsrc` = "1m（レーザ）" (1 m airborne-laser DEM) on land, "10m" over water. The DEM is bare earth: buildings and decks are removed, so points under buildings give the ground level.

| Point | `[lon, lat]` | Elevation T.P. (m) | hsrc |
|---|---|---|---|
| Arena, PLATEAU bbox centre | `[139.6307285, 35.4647196]` | 4.1 | 1 m laser |
| アリーナフロント plaza (ground below the deck) | `[139.6301016, 35.4649292]` | 4.1 | 1 m laser |
| アリーナデッキ (ground below the deck) | `[139.6298726, 35.4645507]` | 3.8 | 1 m laser |
| Foot of ビッグステップス | `[139.6298798, 35.4648917]` | 3.4 | 1 m laser |
| Foot of ノースゲート | `[139.6296568, 35.4650135]` | 3.9 | 1 m laser |
| ミュージックテラスステージ | `[139.6297615, 35.4648682]` | 3.9 | 1 m laser |
| ミュージックテラスプラザ | `[139.6294270, 35.4642642]` | 3.0 | 1 m laser |
| ミュージックテラススクエア | `[139.6290168, 35.4644747]` | no value returned | |
| Foot of サウスゲート | `[139.6294271, 35.4639578]` | 5.1 | 1 m laser |
| Vacant lot 12 m south of the arena south wall | `[139.6306000, 35.4638800]` | 5.2 | 1 m laser |
| 3 m south of the arena south wall | `[139.6306000, 35.4639700]` | 4.9 | 1 m laser |
| Outside the arena SW corner | `[139.6297800, 35.4639800]` | 5.1 | 1 m laser |
| Outside the stage-end south corner | `[139.6315500, 35.4640800]` | 3.9 | 1 m laser |
| Perimeter road, east of the NE wall | `[139.6316800, 35.4647000]` | 3.5 | 1 m laser |
| Outside the north tip | `[139.6310500, 35.4655000]` | 3.1 | 1 m laser |
| 高島水際線公園, centre | `[139.6306000, 35.4656000]` | 3.4 | 1 m laser |
| 高島水際線公園, waterfront bank | `[139.6310500, 35.4660500]` | 4.9 | 1 m laser |
| Park edge north-west | `[139.6303000, 35.4658500]` | 3.6 | 1 m laser |
| Hilton, centre (ground) | `[139.6294700, 35.4642200]` | 3.2 | 1 m laser |
| K Tower, centre (ground) | `[139.6288100, 35.4641900]` | 4.8 | 1 m laser |
| 高島水際線デッキ east landing (ground) | `[139.6288320, 35.4643998]` | 4.2 | 1 m laser |
| 高島水際線デッキ west landing (bridge approach) | `[139.6273871, 35.4640800]` | 8.2 | 1 m laser |
| 横浜アンパンマンこどもミュージアム | `[139.6289000, 35.4632000]` | 6.6 | 1 m laser |
| 高島線 freight railway | `[139.6294288, 35.4652966]` | 3.1 | 1 m laser |
| 帷子川 river mouth (water) | `[139.6300000, 35.4667000]` | 4.0 | 10 m (interpolated, unreliable over water) |
| Port water east | `[139.6335000, 35.4650000]` | 0.0 | 10 m |

Modelling values: treat the site as a flat plate at **+4.2 m T.P.** (PLATEAU wall base of the arena 4.18 m; annex 4.01 m; range on the site 3.0–5.2 m, rising gently toward the south). Water level 0 m T.P. (mean sea level; tides ±1 m). The waterfront park bank is about 3–5 m T.P.

---

## 9. PLATEAU (MLIT 3D city model)

### 9.1 Latest Yokohama building datasets

Source: `https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets` (7,776 datasets; 86 for `city_code` 14100), fetched 2026-11-23. **CONFIRMED.** The latest Yokohama release is **year 2024** (`registration_year` 2024, specification 4.1, CityGML package name `14100_yokohama-shi_city_2024_citygml_2_op`). The PLATEAU open-data page also lists only 2024 for 横浜市. 3D Tiles files were last modified 2025-12-01; the CityGML file of the mesh 2026-03-10.

西区 (Nishi-ku, ward code 14103) building model (建築物モデル（西区）), format 3D Tiles 1.0 (`b3dm`), CRS JGD2011:

| Dataset id | LOD | Texture | `tileset.json` URL (direct asset) | Size |
|---|---|---|---|---|
| `14103_bldg_lod1` | 1 | none (flag says true) | `https://assets.cms.plateau.reearth.io/assets/ad/5fd83a-161b-4a01-a666-a3e8c1c23759/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod1/tileset.json` | 10.4 MB |
| `14103_bldg_lod2` | 2 | **with texture** | `https://assets.cms.plateau.reearth.io/assets/4a/84f474-71c4-4b33-a328-0c5798b79f2f/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod2/tileset.json` | 54.8 MB |
| `14103_bldg_lod2_no_texture` | 2 | **no texture** | `https://assets.cms.plateau.reearth.io/assets/72/f0f73f-48ab-4661-a6b6-38290e2e05fb/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod2_no_texture/tileset.json` | 11.0 MB |
| `14103_bldg_lod3` | 3 | with texture | `https://assets.cms.plateau.reearth.io/assets/57/4b4e13-9239-4570-b4c3-18f695ef7035/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod3/tileset.json` | 55.5 MB |
| `14103_bldg_lod3_no_texture` | 3 | no texture | `https://assets.cms.plateau.reearth.io/assets/dc/a3a7d5-e8ef-42f2-a2d2-d82eb77eb9e7/14100_yokohama-shi_city_2024_citygml_2_op_bldg_3dtiles_14103_nishi-ku_lod3_no_texture/tileset.json` | 11.5 MB |

Stable alias URLs (verified HTTP 200, JSON wrapper tileset that points to the asset above):

- `https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/14103-bldg-lod1-texture-2024/tileset.json`
- `https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/14103-bldg-lod2-texture-2024/tileset.json`
- `https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/14103-bldg-lod2-notexture-2024/tileset.json`
- `https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/14103-bldg-lod3-texture-2024/tileset.json`
- `https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/14103-bldg-lod3-notexture-2024/tileset.json`
- The same with `-latest` instead of `-2024` also resolves (verified for `14103-bldg-lod2-texture-latest`, `14103-bldg-lod2-notexture-latest`, `14103-bldg-lod1-latest`).

There is **no building MVT** for Yokohama. MVT exists for roads (`https://assets.cms.plateau.reearth.io/assets/69/36a0fb-7483-4086-9e0e-ef5fa3c3672c/14100_yokohama-shi_city_2024_citygml_2_op_tran_mvt_lod1/{z}/{x}/{y}.mvt`, layer `Road`, zoom 10–16, TileJSON `https://api.plateauview.mlit.go.jp/datacatalog/mvt/14100-tran-lod1-2024/tilejson.json`), land-use zoning (`urf`) and landslide zones (`lsld`).

Other city-wide 3D Tiles (direct asset URLs; their composite aliases return an empty wrapper):

| Dataset | URL |
|---|---|
| Bridges LOD2 (`14100_brid_lod2`) | `https://assets.cms.plateau.reearth.io/assets/6a/6d2bb2-910d-4e78-be9e-b4ac169610d0/14100_yokohama-shi_city_2024_citygml_2_op_brid_3dtiles_lod2/tileset.json` |
| Bridges LOD3 | `https://assets.cms.plateau.reearth.io/assets/e5/3c3edb-548c-4d53-9bff-8085bd64946a/14100_yokohama-shi_city_2024_citygml_2_op_brid_3dtiles_lod3/tileset.json` |
| City furniture LOD2 / LOD3 (`frn`) | `.../assets/1e/88fd6d-21a4-4be5-aa47-456773ef094d/14100_yokohama-shi_city_2024_citygml_2_op_frn_3dtiles_lod2/tileset.json`, `.../assets/b2/ad775b-a4bb-42f3-a86a-22e29d386130/14100_yokohama-shi_city_2024_citygml_2_op_frn_3dtiles_lod3/tileset.json` |
| Vegetation (`veg`) LOD3 plant cover, LOD2 / LOD3 solitary trees | `.../assets/ab/d14d89-0bff-4aa6-b2a2-e638f07edd77/..._veg_PlantCover_3dtiles_lod3/tileset.json`, `.../assets/88/081429-6458-4f96-a761-f0816867941a/..._veg_SolitaryVegetationObject_3dtiles_lod2/tileset.json`, `.../assets/83/75c1ef-9ab7-4e3a-87be-ba98230726d0/..._veg_SolitaryVegetationObject_3dtiles_lod3/tileset.json` |
| Roads LOD3 (`tran`), squares LOD3 (`squr`) | `.../assets/51/8e3f96-c5d3-4d89-9397-0aa810b096f7/..._tran_3dtiles_lod3/tileset.json`, `.../assets/c1/caa807-fdfd-4d82-a2c6-8f1f500c4106/..._squr_3dtiles_lod3/tileset.json` |

All asset and API responses carry `access-control-allow-origin: *` (verified), so they can be streamed from a GitHub Pages site without a key.

### 9.2 Is K-Arena Yokohama in the data?

**Yes. CONFIRMED** three ways (spatial-ID attribute API, decoded `b3dm` batch tables, CityGML):

| Attribute | Value |
|---|---|
| `gml:id` | `bldg_4851209b-3d95-4266-986e-d795150ff6be` |
| `uro:buildingID` | `14100-bldg-1007198` |
| `core:creationDate` | 2024-03-22 |
| `bldg:measuredHeight` | 46.2 m |
| `gml:name`, `bldg:usage`, `bldg:storeysAboveGround` | not filled (null) |
| `uro:lodType` | LOD2.0 (max LOD of mesh 53391550 buildings is 2; no LOD3 here) |
| `uro:surveyYear` | 2020 (refers to the 都市計画基礎調査; the geometry is from later aerial photogrammetry) |
| LOD1 solid bbox | min `[139.6299049, 35.4640345]` alt 4.229; max `[139.6315522, 35.4654046]` alt 44.648 |
| LOD2 z range | 4.176 – 50.359 m T.P. |
| Texture source (LOD2) | aerial photo (空中写真) |

Where it lives in the tilesets: leaf tile `root/0/0` → `data/data0.b3dm` (region lon 139.629684–139.638548, lat 35.464034–35.472058; 6 features; file sizes LOD1 28.7 KB, LOD2 no-texture 31.9 KB, LOD2 textured 240 KB). A coarser copy is in the parent tile `data14.b3dm` (verified) and presumably in the root `data71.b3dm` (refinement is REPLACE). To hide the PLATEAU arena and substitute the detailed model, filter on batch-table `gml_id` (or `uro:BuildingIDAttribute_uro:buildingID`) in every tile.

Also in PLATEAU near the site: the annex `14100-bldg-1007199` (21.4 m) and five small park / utility structures `14100-bldg-1007200` … `1007204` (1.3–4.8 m, all created 2024-03-22).

**Not in PLATEAU 2024: the Hilton Yokohama and the K Tower Yokohama.** No building with a footprint in their positions exists in the CityGML of mesh 53391550, in the leaf tile `data9.b3dm`, or in spatial IDs `20/{0,1,2}/930986..930988/413683`. CONFIRMED absence (as of the files dated 2025-12-01 / 2026-03-10). If PLATEAU tiles are used for context, the two towers must be modelled separately from the OSM outlines.

Also not in PLATEAU: 高島水際線デッキ (opened 2025). The only PLATEAU bridge near the site is the park footbridge over the freight line (`brid_ccdc0328-...`, bbox lon 139.6296041–139.6301315, lat 35.4652973–35.4655068, z 1.74–14.61 m).

### 9.3 Technical notes for loading the tiles (from the decoded files)

CONFIRMED by inspection of `data0.b3dm`:

- glTF 2.0 inside `b3dm`, generator "FME 2024.1.3.0".
- Required extensions: **`KHR_draco_mesh_compression`** and **`CESIUM_RTC`** (a Draco decoder must be registered; three.js `3d-tiles-renderer` needs `DRACOLoader`).
- Attributes: `POSITION`, `NORMAL`, `_BATCHID`. Material: plain PBR (roughness 0, metallic 0) in the no-texture set.
- Batch table (43 properties): `gml_id`, `meshcode`, `feature_type`, `city_code`, `city_name`, `attributes` (nested JSON), `gml:name`, `core:creationDate`, `bldg:measuredHeight` (binary double), `uro:BuildingIDAttribute_uro:buildingID`, flood / tsunami / storm-surge fields, and binary `_x`, `_y`, `_xmin`, `_xmax`, `_ymin`, `_ymax`, `_zmin`, `_zmax`, `_lod`.
- Tileset: 72 tiles, 53 leaves, root geometric error 307.4, `refine: REPLACE`, bounding volumes are `region`.
- `tileset.json` is served as `text/plain`; loaders that insist on a JSON content type need to be told to parse it anyway.

### 9.4 Licence and attribution

- PLATEAU site policy (https://www.mlit.go.jp/plateau/site-policy/, CONFIRMED): content is usable under 公共データ利用規約（第1.0版）(PDL 1.0), stated to be compatible with CC BY 4.0; attribution is mandatory; edited data must be marked as edited. 3D city model data on G空間情報センター are copyright of the respective local government.
- Attribution examples from the policy: 「出典：国土交通省 PLATEAUウェブサイト（URL）」; for processed data 「…（国土交通省）（URL）を加工して作成」.
- Attribution string used in PLATEAU's own TileJSON: `<a href="https://www.mlit.go.jp/plateau/">国土交通省 PLATEAU</a>`.
- The PLATEAU streaming tutorial states the data follow CC BY 4.0-equivalent terms and that the streaming service is experimental (no service-level guarantee, no stated rate limit) (REPORTED, https://github.com/Project-PLATEAU/plateau-streaming-tutorial).
- The Yokohama dataset page on G空間情報センター (`https://www.geospatial.jp/ckan/dataset/plateau-14100-yokohama-shi-2024`) returned HTTP 403 to automated fetching, so its exact licence line was not read.

Suggested credit line (ESTIMATED wording): `3D都市モデル: 国土交通省 PLATEAU（横浜市 2024年度）を加工して作成`.

### 9.5 Height reference

PLATEAU CityGML heights are T.P. elevations. The 3D Tiles use ellipsoidal heights: the leaf tile region is 38.167–86.731 m while the same features are 1.800–50.359 m T.P. in the batch table, giving a geoid height of **36.37 m** (ESTIMATED from those two CONFIRMED numbers; consistent with GSIGEO2011 for Yokohama). When PLATEAU tiles are placed in a scene whose zero is T.P. or the map plane, lower them by 36.37 m (and by a further 4.2 m if the scene's zero is the site ground).

---

## 10. Free basemap sources usable from a static GitHub Pages site without an API key

Every endpoint below was requested on 2026-11-23 with an `Origin: https://example.github.io` header; the full log is `research/geo/basemap-endpoint-checks.txt`. "CORS ok" means the response carried `Access-Control-Allow-Origin: *`.

### 10.1 What actually shows K-Arena

| Layer | Shows the completed Music Terrace? | Evidence |
|---|---|---|
| OpenFreeMap (OSM vector) | **Yes** (coarse 7-point arena polygon, towers, deck, plazas, 高島水際線デッキ) | Decoded tile `14/14546/6463`: building features are merged per height class; the arena is in the `render_height: 45` feature, the towers in `render_height: 100` |
| PLATEAU-Ortho 2023 / 2024 aerial tiles | **Yes** (arena, Hilton, K Tower all complete; no 高島水際線デッキ yet) | Tiles viewed |
| PLATEAU 3D Tiles 2024 | Arena and annex yes; Hilton and K Tower **no** | Section 9.2 |
| GSI 標準地図 `std`, 淡色地図 `pale` | **No** (blank block; tiles last modified 2026-01) | Tiles z16–z18 viewed |
| GSI `seamlessphoto` | **No** (shows the empty lot, about 2019–2020 imagery) | Tiles z16–z17 viewed |
| GSI optimal vector tiles | Almost certainly no (same base data as `std`) | ESTIMATED |
| GSI `experimental_fgd` GeoJSON (z18) | No (features dated 2015) | Files in `gsi-fgd/` |

Recommendation (ESTIMATED): OpenFreeMap as the vector base, PLATEAU-Ortho 2024 as the optional aerial layer, PLATEAU LOD2 tiles (or `site-context.geojson` extrusions) for context massing. Avoid GSI imagery and GSI maps directly under the model because they contradict it.

### 10.2 OpenFreeMap

| Item | Value | Status |
|---|---|---|
| Styles | `https://tiles.openfreemap.org/styles/liberty`, `/styles/bright`, `/styles/positron`, `/styles/dark`, `/styles/fiord` | HTTP 200, `application/json`, CORS ok. `/styles/3d` returned 404 |
| TileJSON | `https://tiles.openfreemap.org/planet` | 200, CORS ok |
| Vector tiles | `https://tiles.openfreemap.org/planet/20261115_080022_pt/{z}/{x}/{y}.pbf` (versioned path, take it from the TileJSON) | 200, `application/vnd.mapbox-vector-tile`, CORS ok; tile `14/14546/6463` is 443 KB |
| Zoom | 0–14 (overzoom beyond); schema OpenMapTiles; `building` layer z13–14 with `render_height`, `render_min_height`, `colour`, `hide_3d` | CONFIRMED from TileJSON |
| Glyphs / sprite | `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`, `https://tiles.openfreemap.org/sprites/ofm_f384/ofm` | 200, CORS ok |
| Shaded relief raster in `liberty` | `https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png`, max zoom 6 | 200 |
| Attribution (from TileJSON) | `OpenFreeMap © OpenMapTiles Data from OpenStreetMap` (links: https://openfreemap.org, https://www.openmaptiles.org/, https://www.openstreetmap.org/copyright) | CONFIRMED |
| Key / registration | None | CONFIRMED by use |

Notes: the `liberty` style has a `building-3d` fill-extrusion layer (opacity 0.8, height from `render_height`). Because buildings are merged by height class and carry no per-building id, the OSM arena block cannot be removed by id. Options: delete the `building-3d` layer and supply your own context massing, or add a filter `["!=", ["get", "render_height"], 45]` (this also hides the few other 45 m buildings in view).

### 10.3 GSI (国土地理院) raster tiles

| Layer | URL template | Zoom (official list) | Verified | Notes |
|---|---|---|---|---|
| 標準地図 | `https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png` | 2–18 | z18 200, z19 404, CORS ok | 256 px PNG |
| 淡色地図 | `https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png` | 2–18 | z18 200, z19 404, CORS ok | |
| 白地図 | `https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png` | 5–14 | z14 200 | |
| English | `https://cyberjapandata.gsi.go.jp/xyz/english/{z}/{x}/{y}.png` | 5–11 | z11 200 | |
| 全国最新写真（シームレス） | `https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg` | 2–18 (photo imagery 14–18) | z18 200, z19 404, CORS ok | Old imagery at this site |
| 電子国土基本図（オルソ画像） | `https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg` | 14–18 | z18 200 | Older still |
| 年度別写真 2019 | `https://cyberjapandata.gsi.go.jp/xyz/nendophoto2019/{z}/{x}/{y}.png` | | z17 200 (2020–2024 return 404 here) | Pre-construction |
| 陰影起伏図 | `https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png` | 2–16 | z16 200 | |

Attribution (CONFIRMED, https://maps.gsi.go.jp/development/ichiran.html): write 「国土地理院」 or 「地理院タイル」 as the source and link to the tile list page `https://maps.gsi.go.jp/development/ichiran.html`. `seamlessphoto` needs the extra credit 「GRUS画像（© Axelspace）」 where such imagery is included, and its low zooms carry Landsat / GEBCO credits. `std` and `pale` at z5–18 are 基本測量成果 (測量法 procedures can apply to reproduction as a map product; plain web display with attribution is the normal use).

### 10.4 GSI optimal vector tiles (最適化ベクトルタイル)

| Item | Value | Status |
|---|---|---|
| Style | `https://gsi-cyberjapan.github.io/optimal_bvmap/style/std.json` (354 KB, 123 layers; only `std.json` and `skeleton.json` exist in the repo; `pale.json` and `blank.json` return 404) | 200, CORS ok |
| Source in the style | `pmtiles://https://cyberjapandata.gsi.go.jp/xyz/optimal_bvmap-v1/optimal_bvmap-v1.pmtiles/{z}/{x}/{y}` (needs the `pmtiles` protocol plugin), zoom 4–16 | Range request returned 206, total size 16.9 GB, CORS ok |
| XYZ form | `https://cyberjapandata.gsi.go.jp/xyz/optimal_bvmap-v1/{z}/{x}/{y}.pbf` | z14, z15, z16 200 (`application/octet-stream`); z17 404 |
| Glyphs / sprite | `https://gsi-cyberjapan.github.io/optimal_bvmap/glyphs/{fontstack}/{range}.pbf`, `https://gsi-cyberjapan.github.io/optimal_bvmap/sprite/std` | 200, CORS ok |
| Source layers | `AdmArea, AdmBdry, Anno, BldA, Cntr, Cstline, Isbt, PwrTrnsmL, RailCL, RailTrCL, RdCL, RdCompt, RdEdg, RvrCL, SpcfArea, StrctArea, StrctLine, TpgphArea, TpgphLine, WA, WL, WRltLine, WStrA, WStrL` | CONFIRMED |
| Attribution in the style | 「国土地理院最適化ベクトルタイル(標準地図風スタイル)」 | CONFIRMED |
| Older vector tiles | `https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf` (z16 200) with styles `https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/std.json`, `/pale.json` (200) | |

### 10.5 PLATEAU-Ortho (aerial imagery that shows the arena)

| Item | Value | Status |
|---|---|---|
| Documented template | `https://api.plateauview.mlit.go.jp/tiles/plateau-ortho-2023/{z}/{x}/{y}.png` | 307 redirect (CORS ok) to the tile host |
| Tile host (direct) | `https://tile.plateauview.mlit.go.jp/tiles/plateau-ortho-2024/{z}/{x}/{y}.png` and `.../plateau-ortho-2023/...` | 2024: z10, z17, z18, z19 200, z20 404. 2023: z17, z18 200, z19 404. Years 2020–2022 and 2025: 404 at this location. CORS ok, `cache-control: public, max-age=3600` |
| Format | PNG 256 px, about 110–130 KB per tile; z19 ≈ 0.24 m/px | |
| Imagery year for Yokohama | 2023 (per the PLATEAU tutorial table) | REPORTED |
| Licence / credit | CC BY 4.0-equivalent per the PLATEAU policy; credit 「国土交通省 Project PLATEAU」 linking https://www.mlit.go.jp/plateau/ | REPORTED (tutorial) |
| Caveat | Described as an experimental service without guarantees. For robustness, a small mosaic of the dozen z18 tiles around the site could be self-hosted with credit | |

### 10.6 Terrain DEM tiles

| Source | URL template | Encoding | Zoom | Verified | Attribution |
|---|---|---|---|---|---|
| GSI DEM10B | `https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png` | GSI PNG | 1–14 | z14 200; z15 404 | 国土地理院 |
| GSI DEM5A | `https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png` | GSI PNG | 1–15 | z15 200; z16 404 | 国土地理院 |
| GSI DEM5B / DEM5C | `.../dem5b_png/...`, `.../dem5c_png/...` | GSI PNG | 1–15 | 404 at this site (no coverage) | |
| GSI DEM1A (1 m laser) | `https://cyberjapandata.gsi.go.jp/xyz/dem1a_png/{z}/{x}/{y}.png` | GSI PNG | 1–17 | z16, z17 200; z18 404 | 国土地理院 |
| GSI text DEM | `https://cyberjapandata.gsi.go.jp/xyz/dem/{z}/{x}/{y}.txt` | CSV text | 1–14 | 200 (updates stopped October 2024) | |
| AIST seamless elevation | `https://tiles.gsj.jp/tiles/elev/land/{z}/{y}/{x}.png` (**y before x**), `.../elev/mixed/...` | GSI PNG | | z14, z15 200, CORS ok | 産総研 地質調査総合センター |
| AWS Terrain Tiles (Mapzen terrarium) | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` (also `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/...`) | Terrarium | 0–15 | z14, z15 200; z16 404; CORS ok | See https://github.com/tilezen/joerd/blob/master/docs/attribution.md; no AWS account needed |
| Mapterhorn | `https://tiles.mapterhorn.com/{z}/{x}/{y}.webp`, TileJSON `https://tiles.mapterhorn.com/tilejson.json` | Terrarium, 512 px WebP | up to 16 at this site | z12, z14, z15, z16 200; z17 404; CORS ok | `© Mapterhorn` (https://mapterhorn.com/attribution) |

GSI PNG encoding (CONFIRMED, https://maps.gsi.go.jp/development/demtile.html): 256 × 256 px, 24-bit; `x = 65536·R + 256·G + B`; if `x < 8388608`, `h = 0.01·x` m; if `x = 8388608` (colour 128, 0, 0) no data; if `x > 8388608`, `h = 0.01·(x − 16777216)` m. In MapLibre this is a `raster-dem` source with `encoding: "custom"`, `redFactor: 655.36`, `greenFactor: 2.56`, `blueFactor: 0.01`, `baseShift: 0` (no-data pixels need masking). Terrarium: `h = R·256 + G + B/256 − 32768`.

Practical note (ESTIMATED): the site is reclaimed flat land between 3 and 5 m T.P., so 3D terrain adds nothing visible. A flat ground plane avoids the model floating or sinking; if terrain is enabled anyway, sample it at `S0` and pin the model to that value.

### 10.7 Protomaps

| Item | Finding | Status |
|---|---|---|
| Hosted API | `https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt` requires a key | 403 without key |
| Daily planet builds | `https://build.protomaps.com/20261122.pmtiles`, 139.7 GB; index `https://build-metadata.protomaps.dev/builds.json` (60 builds, schema version 4.15.2) | Range request works (206) but **no CORS header was returned**, so it cannot be read directly from a web page |
| Old demo bucket | `https://demo-bucket.protomaps.com/v4.pmtiles` | 404 |
| Fonts / sprites | `https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf`, `https://protomaps.github.io/basemaps-assets/sprites/v4/light` | 200, CORS ok |
| Keyless route | Cut a regional extract with the `pmtiles extract` CLI (for example a bounding box of a few kilometres around `139.6307, 35.4646`), commit the `.pmtiles` file and load it with the `pmtiles` JS protocol | ESTIMATED workflow; Protomaps docs say GitHub Pages is an easy host if the file fits |

GitHub Pages limits (CONFIRMED, https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): published site at most 1 GB; source repository recommended at most 1 GB; soft bandwidth limit 100 GB per month; soft limit of 10 builds per hour; deployments time out after 10 minutes. Git itself blocks files over 100 MB (REPORTED, general GitHub rule). A city-centre extract of a few megabytes is far inside these limits.

### 10.8 Others checked (keyless, CORS ok)

| Source | Endpoint | Note |
|---|---|---|
| OSM raster | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | 200; governed by the OSM tile usage policy (not for heavy use) |
| VersaTiles | `https://tiles.versatiles.org/assets/styles/colorful/style.json`, tiles `https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}` | 200 |
| CARTO Voyager GL style | `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json` | 200; CARTO terms apply |
| Esri World Imagery | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | 200 without key, but Esri terms of use apply; not checked whether its imagery shows the arena |
| MapLibre demo tiles | `https://demotiles.maplibre.org/style.json` | 200; world overview only |
| GSI elevation API, Overpass API | | Both return CORS `*`, so they can even be called live from the page |

---

## 11. True-north relation of the street grid

ESTIMATED from OSM road geometry (script `road_bearings.py`) and the surveyed PLATEAU walls.

| Line | Bearing (°) | Source |
|---|---|---|
| Arena south wall | 89.92 | PLATEAU |
| Arena west wall | 179.92 | PLATEAU |
| とちのき通り (main street 200 m south) | 90.0 (segments 89.2–90.05) | OSM |
| Perimeter road on the west side of the K Tower | 179.7 / 359.8 | OSM |
| Hilton and K Tower outlines | 0 / 90 (rectilinear, north-south and east-west) | OSM |
| Arena NE wall and the perimeter road beside it | 337.08 and 336.9 / 157.1 | PLATEAU, OSM |
| Arena N wall and the perimeter road beside it | 247.08 and 246.7 / 66.8 | PLATEAU, OSM |
| Arena NW wall | 213.26 (normal 303.26) | PLATEAU |
| 高島線 freight railway beside the site | 220.7 (north-east of the site) turning to 235.8 (north-west of the site) | OSM |
| 中央市場通り (across the water) | 157 | OSM |
| みなとみらい大通り / みなとみらい大橋 | 13.2–13.9 | OSM |
| すずかけ通り | 78.1 (and 89.7 further east) | OSM |
| いちょう通り and the central Minato Mirai grid further south | 57 and 147 | OSM |
| 首都高速 横羽線 | 68 and 34 | OSM |

Conclusions:

1. **At the site the street / lot grid is aligned with true north to within about 0.1°.** Block 60・61 is laid out on the とちのき通り grid: east-west 90°, north-south 0°. The arena's south and west walls, the Hilton and the K Tower follow it. The measured 89.92° / 179.92° equals the direction of plane-rectangular grid north of zone IX at this longitude (grid convergence −0.118°), i.e. the buildings are probably set out on the survey grid; for modelling treat them as exactly north-south / east-west.
2. The arena's symmetry axis is rotated **56.75° west of north** (bearing 303.25°). Equivalently the stage-to-rear axis is turned 33.25° anticlockwise from "due west".
3. The rest of the arena outline follows the waterfront: the NE wall and N wall are parallel to the perimeter road around 高島水際線公園 (337° and 247°), which is the 67° / 157° waterfront grid of the Portside / 中央卸売市場 side.
4. The Minato Mirai central district grid proper (south of すずかけ通り) is rotated 57° east of north; it is not the grid at the site.
5. On a north-up web map the arena therefore appears as a fan opening toward the upper left (north-west) with its flat base along the bottom (south) edge.

---

## 12. Placing the model on a web map

ESTIMATED guidance from the numbers above.

- Anchor: `S0 = [139.6314284, 35.4641981]`, altitude 4.18 m T.P. (use 0 if the map has no terrain and context massing also starts at 0).
- Model built in the arena frame (X right, Y forward from the stage face toward the rear, Z up): rotate about the vertical axis so that +Y points to bearing 303.25°. In an east-north-up scene that is a rotation of +56.75° anticlockwise seen from above (north turned toward west), since +Y starts at north (0°) and must end at 303.25° = −56.75°.
- MapLibre custom layer: `MercatorCoordinate.fromLngLat([139.6314284, 35.4641981], 4.18)` gives x = 0.8878650789, y = 0.3945192175; scale by `meterInMercatorCoordinateUnits()` = 3.0637190e-8 per metre; Mercator Y points south, so flip the north axis.
- Check points after placement (should land exactly on these): north tip (91.25, 104.98) → `[139.6310124, 35.4654046]`; SW corner (−90.95, 105.63) → `[139.6299059, 35.4640345]`; rear centre (0, 138.46) → `[139.6301528, 35.4648823]`.
- PLATEAU 3D Tiles heights are ellipsoidal: subtract 36.37 m to get T.P.
- Shadow sanity check: the arena is at 35.4646° N; nothing else needed for sun studies.

---

## 13. Source list

| Topic | URL |
|---|---|
| OSM way of the arena | https://www.openstreetmap.org/way/934667675 |
| OSM Hilton, K Tower, podium, deck | https://www.openstreetmap.org/way/934667674, /way/934667673, /way/934667677, /way/934667676 |
| Overpass API | https://overpass-api.de/api/interpreter |
| Nominatim | https://nominatim.openstreetmap.org/ |
| Wikidata item | https://www.wikidata.org/wiki/Q117074483 |
| PLATEAU dataset catalogue API | https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets |
| PLATEAU API documentation | https://docs.plateauview.mlit.go.jp/api/rest/ |
| PLATEAU CityGML, mesh 53391550 (buildings) | https://assets.cms.plateau.reearth.io/assets/04/96d45a-a30b-4c9f-88c0-c1323b5a0f86/14100_yokohama-shi_city_2024_citygml_2_op/udx/bldg/53391550_bldg_6697_op.gml |
| PLATEAU CityGML, mesh 53391550 (bridges) | https://assets.cms.plateau.reearth.io/assets/04/96d45a-a30b-4c9f-88c0-c1323b5a0f86/14100_yokohama-shi_city_2024_citygml_2_op/udx/brid/53391550_brid_6697_op.gml |
| PLATEAU full CityGML package | https://api.plateauview.mlit.go.jp/datacatalog/citygml/14100-latest/citygml.zip (2.78 GB) |
| PLATEAU site policy | https://www.mlit.go.jp/plateau/site-policy/ |
| PLATEAU open data list | https://www.mlit.go.jp/plateau/open-data/ |
| PLATEAU streaming tutorial (ortho, 3D Tiles) | https://github.com/Project-PLATEAU/plateau-streaming-tutorial |
| GSI tile list and attribution rules | https://maps.gsi.go.jp/development/ichiran.html |
| GSI elevation PNG specification | https://maps.gsi.go.jp/development/demtile.html |
| GSI elevation API | https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php |
| GSI optimal vector tiles | https://github.com/gsi-cyberjapan/optimal_bvmap |
| OpenFreeMap | https://openfreemap.org/quick_start/ |
| AWS Terrain Tiles | https://registry.opendata.aws/terrain-tiles/ |
| GitHub Pages limits | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |
| Protomaps hosting notes | https://docs.protomaps.com/pmtiles/cloud-storage |
| K-Arena floor guide (floor maps, cross-section) | https://k-arena.com/floor/ |
| K-Arena access | https://k-arena.com/access/ |
| K-Arena notice on entry / exit routes | https://k-arena.com/news/20250204-1 |
| Travel Watch press-tour report (entrances, gates) | https://travel.watch.impress.co.jp/docs/news/1533996.html |
| Impress Watch on Music Terrace | https://www.watch.impress.co.jp/docs/news/1514134.html |
| Yokohama City: provisional opening of 高島水際線デッキ | https://www.city.yokohama.lg.jp/city-info/koho-kocho/press/toshi/2024/20250314.html |
| Yokohama City: naming rights for 高島水際線デッキ (guideline PDF with drawings, not readable here) | https://www.city.yokohama.lg.jp/kurashi/machizukuri-kankyo/toshiseibi/mm21/takasima-nr.html, https://www.city.yokohama.lg.jp/kurashi/machizukuri-kankyo/toshiseibi/mm21/takasima-nr.files/0006_20260925.pdf |

---

## 14. Gaps, with best estimates

| Gap | Why it could not be closed | Best estimate to use |
|---|---|---|
| Elevation of the Arena Deck / LEVEL 3 entrance floor | No open dataset or official figure found | 6.5 m ± 1 m above ground, i.e. about 10.7 m T.P. (sections 6.4, 6.6) |
| Ground-floor wall line versus roof outline (overhang depths) | PLATEAU LOD2 extrudes walls from the roof edge; OSM is coarser; no dimensioned drawing found | Use the roof outline for the roof and upper volume. On the axis set the LEVEL 3 entrance wall 18 m inside the rear roof edge (Y ≈ 120 m), with the facade leaning out 7 m up to 32 m height and the eave projecting to Y = 138.5 m (section 6.6). Side walls (S and NE) and the stage-end face: assume vertical at the roof edge |
| Exact door positions of the three entrances | No OSM entrance nodes; the official floor map is schematic | Coordinates in section 6.2 (on the roof-edge line, ±10 m along the facade); doors about 18 m further inside |
| Hilton and K Tower 3D shape and exact heights | Absent from PLATEAU 2024 | OSM footprints (about 1–2 m accuracy against the ortho photo); height 99.87 m from OSM tags for both, 26 and 21 levels |
| 高島水際線デッキ 3D geometry (level profile, stairs, lift, piers) | Not in PLATEAU; the city's guideline PDF could not be rendered in this environment (no PDF renderer) | OSM centre line (section 3.2), 6.0 m wide, 130.4 m long, deck surface about 10–11 m T.P. at the Music Terrace end falling to about 8.2 m T.P. at みなとみらい大橋 |
| Loading dock / truck access of the arena | Not tagged in OSM | Stage-end and NE side via the perimeter road (rooftop plant, P1 vehicle entrance on the N facade and the service way there suggest back-of-house on the N / NE / SE sides) |
| Function of the 21.4 m annex beside the Hilton | Unnamed in OSM and PLATEAU | Model as a 33 × 17 m box 18.65 m high with a shallow hipped roof to 21.4 m |
| Acquisition date of the PLATEAU ortho imagery | Only the year (2023) is published | Winter 2023 (long shadows toward the north-north-west) |
| Exact licence line of the Yokohama dataset page | HTTP 403 for automated access | PLATEAU site policy: PDL 1.0, CC BY 4.0-compatible, attribution required |
| Draco-compressed `b3dm` geometry | Not decoded (no Draco decoder); the same geometry was taken from CityGML instead | No loss |
| Geoid height | Derived, not read from GSI's geoid model | 36.37 m |
| Whether newer GSI updates will add the arena | GSI `std` tiles modified 2026-01 still lack it | Re-check before relying on GSI layers |
| Magnetic declination | Not researched (not needed for a true-north web map) | About 8° W in the Tokyo Bay area (general knowledge, unverified) |
