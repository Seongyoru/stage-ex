# Extract LOD0 footprints + heights of PLATEAU buildings near a point into a JSON list.
# Usage: gml_bldg_footprints.py file.gml lon lat maxdist_m out.json
import re, sys, math, json
sys.stdout.reconfigure(encoding="utf-8")
txt = open(sys.argv[1], encoding="utf-8").read()
lon0, lat0, maxd, outp = float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
MLAT, MLON = 110949.1, 90769.0
blocks = re.findall(r"<core:cityObjectMember>(.*?)</core:cityObjectMember>", txt, re.S)
res = []
def g(tag, b):
    mm = re.search(r"<%s[^>]*>([^<]*)<" % tag, b)
    return mm.group(1).strip() if mm else None
def ringll(pl):
    v = [float(x) for x in pl.split()]
    return [[round(v[i+1], 7), round(v[i], 7)] for i in range(0, len(v), 3)], [v[i+2] for i in range(0, len(v), 3)]
for b in blocks:
    m = re.search(r"<bldg:Building gml:id=\"([^\"]+)\"", b)
    if not m:
        continue
    gid = m.group(1)
    name = g("gml:name", b); _bm = re.search(r"<uro:buildingID>([^<]*)<", b); bid = _bm.group(1).strip() if _bm else None; created = g("core:creationDate", b)
    storeys = g("bldg:storeysAboveGround", b); usage = g("bldg:usage", b)
    # split into the building itself and its parts
    segs = re.split(r"(?=<bldg:BuildingPart )", b)
    for si, seg in enumerate(segs):
        pid = None
        if si > 0:
            pm = re.search(r"<bldg:BuildingPart gml:id=\"([^\"]+)\"", seg); pid = pm.group(1) if pm else None
        f0 = re.search(r"<bldg:lod0(?:FootPrint|RoofEdge)>(.*?)</bldg:lod0(?:FootPrint|RoofEdge)>", seg, re.S)
        if not f0:
            continue
        ext = re.search(r"<gml:exterior>.*?<gml:posList>(.*?)</gml:posList>", f0.group(1), re.S)
        ring, _ = ringll(ext.group(1))
        holes = [ringll(x)[0] for x in re.findall(r"<gml:interior>.*?<gml:posList>(.*?)</gml:posList>", f0.group(1), re.S)]
        zs = []
        for tag in ("lod2Solid", "lod2MultiSurface", "lod1Solid"):
            for sm in re.finditer(r"<bldg:%s>(.*?)</bldg:%s>" % (tag, tag), seg, re.S):
                for pl in re.findall(r"<gml:posList>(.*?)</gml:posList>", sm.group(1), re.S):
                    zs += ringll(pl)[1]
            if zs and tag.startswith("lod2"):
                pass
        z1 = []
        sm = re.search(r"<bldg:lod1Solid>(.*?)</bldg:lod1Solid>", seg, re.S)
        if sm:
            for pl in re.findall(r"<gml:posList>(.*?)</gml:posList>", sm.group(1), re.S):
                z1 += ringll(pl)[1]
        mh = g("bldg:measuredHeight", seg)
        lons = [p[0] for p in ring]; lats = [p[1] for p in ring]
        dx = max(min(lons)-lon0, 0, lon0-max(lons))*MLON; dy = max(min(lats)-lat0, 0, lat0-max(lats))*MLAT
        d = math.hypot(dx, dy)
        if d > maxd:
            continue
        has2 = "lod2Solid" in seg or "lod2MultiSurface" in seg
        res.append({"gml_id": gid, "part_id": pid, "buildingID": bid, "name": name, "measuredHeight": float(mh) if mh else None,
                    "created": created, "storeys": storeys, "usage": usage, "has_lod2": has2,
                    "z_ground": round(min(zs), 2) if zs else None, "z_top": round(max(zs), 2) if zs else None,
                    "lod1_top": round(max(z1), 2) if z1 else None,
                    "dist_m": round(d, 1), "ring": ring, "holes": holes})
res.sort(key=lambda r: r["dist_m"])
json.dump(res, open(outp, "w", encoding="utf-8"), ensure_ascii=False)
print("buildings/parts within", maxd, "m:", len(res))
for r in res:
    print("%5.0fm h=%s top=%s gnd=%s lod2=%s n=%d %s %s %s part=%s" % (r["dist_m"], r["measuredHeight"], r["z_top"], r["z_ground"], r["has_lod2"], len(r["ring"])-1, r["buildingID"], r["name"], r["created"], (r["part_id"] or "")[-8:]))
