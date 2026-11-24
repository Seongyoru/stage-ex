# Build research/geo/site-context.geojson from the OSM Overpass extract + PLATEAU extracts + derived frame + GSI elevations.
# Usage: build_site_context.py overpass.json karena_plateau.json plateau_footprints.json frame.json elev.jsonl out.geojson
import json
import math
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")
osm = json.load(open(sys.argv[1], encoding="utf-8"))
ka = json.load(open(sys.argv[2], encoding="utf-8"))
pf = json.load(open(sys.argv[3], encoding="utf-8"))
fr = json.load(open(sys.argv[4], encoding="utf-8"))
elev = [json.loads(line) for line in open(sys.argv[5], encoding="utf-8") if line.strip()]
outp = sys.argv[6]

C_LON, C_LAT = 139.6307004, 35.4645890  # PLATEAU footprint centroid
MLAT, MLON = 110949.1, 90769.0
R_CTX = 500.0


def r7(p):
    return [round(p[0], 7), round(p[1], 7)]


def dmin(pts):
    return min(math.hypot((p[0] - C_LON) * MLON, (p[1] - C_LAT) * MLAT) for p in pts)


def num(v):
    try:
        return float(str(v).replace("m", "").strip())
    except Exception:
        return None


feats = []


def add(geom_type, coords, name, osm_id, kind, height=None, levels=None, **extra):
    props = {"name": name, "osm_id": osm_id, "kind": kind, "height": height, "levels": levels}
    props.update({k: v for k, v in extra.items() if v is not None})
    feats.append({"type": "Feature", "properties": props, "geometry": {"type": geom_type, "coordinates": coords}})


# ---- 1. key footprints -------------------------------------------------
ring = [r7(p) for p in ka["lod0_exterior"]]
add("Polygon", [ring], "Kアリーナ横浜 (K-Arena Yokohama)", "way/934667675", "arena", 46.2, 9,
    source="PLATEAU 2024 Yokohama LOD0 footprint (roof outline), gml:id bldg_4851209b-3d95-4266-986e-d795150ff6be, buildingID 14100-bldg-1007198",
    ground_elev_tp=4.18, roof_max_elev_tp=50.36, lod1_top_elev_tp=44.65, area_m2=16153.8,
    osm_height_tag="45", osm_levels_tag="9", axis_bearing_stage_to_rear=303.25, stage_end="SE",
    note="osm_id refers to the equivalent (coarser) OSM way")
sharp = [c["lonlat"] for c in fr["sharp_corners"]]
add("Polygon", [sharp + [sharp[0]]], "K-Arena simplified 6-corner design outline (fillets and SE notch removed)", None,
    "arena_outline_simplified", 46.2, 9, source="derived from PLATEAU LOD0", area_m2=16209.5)

ways = {e["id"]: e for e in osm["elements"] if e["type"] == "way"}
rels = [e for e in osm["elements"] if e["type"] == "relation"]


def wcoords(i):
    return [r7((p["lon"], p["lat"])) for p in ways[i]["geometry"]]


add("Polygon", [wcoords(934667675)], "K-Arena Yokohama (OSM outline, coarse 7-node)", "way/934667675", "arena_osm", 45, 9,
    source="OpenStreetMap", area_m2=15942)
KEY = {
    934667674: ("ヒルトン横浜 (Hilton Yokohama)", "hotel"),
    934667673: ("Kタワー横浜 (K Tower Yokohama)", "office_tower"),
    934667677: ("ミュージックテラス 低層デッキ/基壇 (Music Terrace podium / pedestrian deck structure, unnamed in OSM)", "deck"),
    1211949300: ("Music Terrace low-rise annex (unnamed in OSM; PLATEAU 14100-bldg-1007199)", "annex"),
    1211706026: ("アリーナテント (Arena Tent)", "tent"),
    1211706032: ("ベイテント (Bay Tent)", "tent"),
    459275387: ("高島水際線公園 トイレ", "toilets"),
}
used = {934667675}
for i, (nm, kind) in KEY.items():
    t = ways[i].get("tags", {})
    add("Polygon", [wcoords(i)], nm, "way/%d" % i, kind, num(t.get("height")), num(t.get("building:levels")),
        source="OpenStreetMap", osm_tags=t)
    used.add(i)
for b in pf:
    if b["buildingID"] == "14100-bldg-1007199":
        add("Polygon", [b["ring"]], "Music Terrace low-rise annex (PLATEAU LOD0)", None, "annex_plateau", b["measuredHeight"], None,
            source="PLATEAU 2024 buildingID 14100-bldg-1007199", ground_elev_tp=b["z_ground"], roof_max_elev_tp=b["z_top"])

# ---- 2. OSM ways: buildings, roads, footways, steps, rail, water, parks ----
CAR = ("motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link", "secondary", "secondary_link",
       "tertiary", "tertiary_link", "unclassified", "residential", "service", "living_street")
for e in osm["elements"]:
    if e["type"] != "way" or e["id"] in used:
        continue
    t = e.get("tags", {})
    g = [r7((p["lon"], p["lat"])) for p in e["geometry"]]
    if dmin(g) > R_CTX:
        continue
    closed = len(g) > 3 and g[0] == g[-1]
    wid = "way/%d" % e["id"]
    nm = t.get("name")
    h = num(t.get("height"))
    lv = num(t.get("building:levels"))
    hw = t.get("highway")
    if "building" in t or "building:part" in t:
        kind = "building_part" if "building:part" in t else "building"
        add("Polygon" if closed else "LineString", [g] if closed else g, nm, wid, kind, h, lv, source="OpenStreetMap",
            building=t.get("building") or t.get("building:part"), colour=t.get("building:colour"),
            roof_colour=t.get("roof:colour"), layer=t.get("layer"))
    elif hw in CAR:
        add("LineString", g, nm, wid, "road", None, None, source="OpenStreetMap", highway=hw, oneway=t.get("oneway"),
            lanes=t.get("lanes"), bridge=t.get("bridge"), tunnel=t.get("tunnel"), layer=t.get("layer"),
            surface=t.get("surface"), maxspeed=t.get("maxspeed"))
    elif hw == "pedestrian" and t.get("bridge") == "yes":
        add("Polygon" if closed else "LineString", [g] if closed else g, nm, wid, "pedestrian_deck_bridge", None, None,
            source="OpenStreetMap", layer=t.get("layer"), start_date=t.get("start_date"))
    elif hw == "pedestrian":
        add("Polygon" if closed else "LineString", [g] if closed else g, nm, wid, "pedestrian_area", None, None,
            source="OpenStreetMap", layer=t.get("layer"))
    elif hw == "steps":
        add("LineString", g, nm, wid, "steps", None, None, source="OpenStreetMap", bridge=t.get("bridge"),
            layer=t.get("layer"), incline=t.get("incline"))
    elif hw in ("footway", "path", "cycleway", "corridor", "elevator"):
        add("LineString", g, nm, wid, "footway", None, None, source="OpenStreetMap", highway=hw, footway=t.get("footway"),
            bridge=t.get("bridge"), layer=t.get("layer"), incline=t.get("incline"), note=t.get("note"))
    elif "railway" in t:
        add("LineString", g, nm, wid, "railway", None, None, source="OpenStreetMap", railway=t.get("railway"),
            usage=t.get("usage"), bridge=t.get("bridge"), tunnel=t.get("tunnel"), layer=t.get("layer"))
    elif t.get("natural") in ("water", "coastline", "beach") or "waterway" in t:
        kind = "beach" if t.get("natural") == "beach" else "water"
        add("Polygon" if closed else "LineString", [g] if closed else g, nm, wid, kind, None, None, source="OpenStreetMap",
            natural=t.get("natural"), water=t.get("water"), waterway=t.get("waterway"))
    elif (t.get("leisure") in ("park", "garden", "pitch", "playground")
          or t.get("landuse") in ("grass", "retail", "brownfield", "greenfield", "construction", "commercial", "residential")
          or t.get("natural") in ("grassland", "wood", "scrub")):
        if t.get("leisure") == "park":
            kind = "park"
        elif nm == "ミュージックテラス":
            kind = "site"
        else:
            kind = "landuse"
        add("Polygon" if closed else "LineString", [g] if closed else g, nm, wid, kind, None, None, source="OpenStreetMap",
            leisure=t.get("leisure"), landuse=t.get("landuse"), natural=t.get("natural"), operator=t.get("operator"))
    elif t.get("amenity") == "parking":
        add("Polygon" if closed else "LineString", [g] if closed else g, nm, wid, "parking", None, None, source="OpenStreetMap")


def assemble(members):
    segs = [[r7((p["lon"], p["lat"])) for p in m["geometry"]] for m in members if m.get("geometry")]
    rings = []
    while segs:
        cur = segs.pop(0)
        changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for k, s in enumerate(segs):
                if s[0] == cur[-1]:
                    cur += s[1:]
                    segs.pop(k)
                    changed = True
                    break
                if s[-1] == cur[-1]:
                    cur += s[::-1][1:]
                    segs.pop(k)
                    changed = True
                    break
        rings.append(cur)
    return rings


for r in rels:
    t = r.get("tags", {})
    if t.get("type") != "multipolygon":
        continue
    if not (t.get("natural") == "water" or t.get("leisure") == "park"):
        continue
    kind = "water" if t.get("natural") == "water" else "park"
    outer = assemble([m for m in r["members"] if m["type"] == "way" and m.get("role") == "outer"])
    inner = assemble([m for m in r["members"] if m["type"] == "way" and m.get("role") == "inner"])
    for o in outer:
        if dmin(o) > R_CTX + 200:
            continue
        if o[0] == o[-1]:
            add("Polygon", [o] + [i for i in inner if i[0] == i[-1]], t.get("name"), "relation/%d" % r["id"], kind, None, None,
                source="OpenStreetMap", water=t.get("water"))
        else:
            add("LineString", o, t.get("name"), "relation/%d" % r["id"], kind, None, None, source="OpenStreetMap",
                water=t.get("water"), note="unclosed ring (clipped by extract)")

# ---- 3. PLATEAU context buildings (true footprints + measured heights) ----
for b in pf:
    if b["buildingID"] in ("14100-bldg-1007198", "14100-bldg-1007199"):
        continue
    if dmin(b["ring"]) > R_CTX:
        continue
    add("Polygon", [b["ring"]] + b["holes"], b["name"], None, "building_plateau", b["measuredHeight"], None,
        source="PLATEAU 2024 Yokohama LOD0", plateau_building_id=b["buildingID"], gml_id=b["gml_id"], part_id=b["part_id"],
        ground_elev_tp=b["z_ground"], roof_max_elev_tp=b["z_top"])

# ---- 4. POIs ----
for e in osm["elements"]:
    if e["type"] != "node":
        continue
    t = e.get("tags", {})
    if t.get("natural") == "tree":
        continue
    p = (e["lon"], e["lat"])
    d = dmin([p])
    keep = False
    if d <= 300 and (t.get("name") or t.get("highway") == "elevator" or t.get("shop") or t.get("entrance")
                     or t.get("amenity") in ("toilets", "parking_entrance", "bicycle_parking")):
        keep = True
    if d <= 600 and (t.get("railway") in ("station", "subway_entrance") or t.get("public_transport") == "station"):
        keep = True
    if not keep:
        continue
    kind = "poi"
    if t.get("highway") == "elevator":
        kind = "elevator"
    elif t.get("amenity") == "parking_entrance":
        kind = "parking_entrance"
    elif t.get("railway") in ("station", "subway_entrance"):
        kind = "station"
    elif t.get("entrance"):
        kind = "entrance_osm"
    elif t.get("tourism") == "artwork":
        kind = "artwork"
    tags = {k: v for k, v in t.items() if not k.startswith("name:") and k != "source"}
    add("Point", r7(p), t.get("name"), "node/%d" % e["id"], kind, None, num(t.get("level")), source="OpenStreetMap", osm_tags=tags)
trees = [r7((e["lon"], e["lat"])) for e in osm["elements"]
         if e["type"] == "node" and e.get("tags", {}).get("natural") == "tree" and dmin([(e["lon"], e["lat"])]) <= 300]
add("MultiPoint", trees, "trees (OSM natural=tree) within 300 m", None, "trees", None, None, source="OpenStreetMap", count=len(trees))

# ---- 5. derived reference geometry ----
S0 = fr["origin_S0_lonlat"]
R0 = fr["rear_R0_lonlat"]
add("LineString", [S0, R0], "K-Arena symmetry axis: stage end (SE) -> rear / main entrance (NW)", None, "arena_axis", None, None,
    source="derived from PLATEAU LOD0", bearing_deg=303.25, length_m=fr["axial_length_m"], confidence="ESTIMATED")
add("Point", S0, "S0 arena-frame origin (axis x SE stage-end facade)", None, "reference_point", None, None,
    source="derived", confidence="ESTIMATED")
add("Point", R0, "R0 axis x NW rear facade = Main Entrance centre (LEVEL 3, deck level)", None, "entrance", None, 3,
    source="derived: centre of NW facade; official LV3 floor map shows Main Entrance centred on the rear facet", confidence="ESTIMATED")
add("Point", [139.6303228, 35.4647911], "Main Entrance doors, LEVEL 3 wall line under the roof overhang (arena frame X=0, Y=120)", None, "entrance", None, 3,
    source="derived: official cross-section scaled by the surveyed 138.46 m axis length puts the LEVEL 3 rear wall about 18 m inside the roof edge",
    confidence="ESTIMATED", deck_height_above_ground_m=6.5)
v = {x["i"]: x["lonlat"] for x in fr["vertices"]}


def lerp(a, b, f):
    return r7((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f))


add("Point", lerp(v[7], v[8], 0.54), "North Entrance (ノースエントランス), LEVEL 3, on N facet", None, "entrance", None, 3,
    source="derived: position along N facet scaled from official LV3 floor map (schematic)", confidence="ESTIMATED")
add("Point", lerp(v[10], v[9], 0.54), "South Entrance (サウスエントランス), LEVEL 3, on W facet", None, "entrance", None, 3,
    source="derived: position along W facet scaled from official LV3 floor map (schematic)", confidence="ESTIMATED")
add("Point", [139.6307285, 35.4647196], "PLATEAU bbox centre of K-Arena (local origin of E/N tables in geo-data.md)", None,
    "reference_point", None, None, source="PLATEAU")
add("Point", [C_LON, C_LAT], "K-Arena footprint centroid (area-weighted, PLATEAU LOD0)", None, "reference_point", None, None,
    source="derived")
for rp in fr["roof_points"]:
    if abs(rp["z_tp"] - 50.36) < 0.01:
        add("Point", rp["lonlat"], "roof apex (highest point) z=50.36 m T.P. / 46.18 m above ground", None, "roof_point", 46.18, None,
            source="PLATEAU LOD2", elev_tp=50.36)
for e in elev:
    r = e.get("result") or {}
    add("Point", r7((e["lon"], e["lat"])), "GSI elevation sample: " + e["name"], None, "elevation_sample", None, None,
        source="GSI getelevation API", elev_tp=r.get("elevation"), hsrc=r.get("hsrc"))

fc = {
    "type": "FeatureCollection",
    "name": "k-arena-yokohama-site-context",
    "metadata": {
        "generated": "2026-11-23",
        "crs": "EPSG:4326 lon,lat (JGD2011 ~ WGS84)",
        "sources": [
            "OpenStreetMap contributors (ODbL) via Overpass API, extract 2026-11-23",
            "MLIT PLATEAU 3D city model Yokohama 2024 (CityGML mesh 53391550)",
            "GSI elevation API (DEM 1m laser)",
        ],
        "height_note": "height = metres above local ground where known; *_elev_tp = elevation above Tokyo Peil (T.P.)",
        "context_radius_m": R_CTX,
    },
    "features": feats,
}
json.dump(fc, open(outp, "w", encoding="utf-8"), ensure_ascii=False)
c = Counter(f["properties"]["kind"] for f in feats)
print("features", len(feats))
print(sorted(c.items(), key=lambda kv: -kv[1]))
