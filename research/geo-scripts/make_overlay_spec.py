# Build overlay spec for png_mosaic.py from OSM + PLATEAU extracts.
# Usage: make_overlay_spec.py overpass.json karena_plateau.json plateau_footprints.json tiles.json out_spec.json
import json, sys
osm = json.load(open(sys.argv[1], encoding="utf-8"))
ka = json.load(open(sys.argv[2], encoding="utf-8"))
pf = json.load(open(sys.argv[3], encoding="utf-8"))
tiles = json.load(open(sys.argv[4], encoding="utf-8"))
ways = {e["id"]: e for e in osm["elements"] if e["type"] == "way"}
def w(i):
    return [[p["lon"], p["lat"]] for p in ways[i]["geometry"]]
pl = []
pl.append({"color": [255, 0, 0], "pts": [[p[0], p[1]] for p in ka["lod0_exterior"]], "r": 0})
for s in ka["lod2_surfaces"]:
    for p in s["polygons"]:
        if s["kind"] == "RoofSurface":
            for h in p["interiors"]:
                pl.append({"color": [255, 255, 0], "pts": [[q[0], q[1]] for q in h]})
            if p["n"] == 3:
                pl.append({"color": [255, 160, 0], "pts": [[q[0], q[1]] for q in p["exterior"]]})
for i, c in ((934667674, [0, 255, 255]), (934667673, [0, 255, 255]), (934667677, [0, 255, 0]), (1211949300, [255, 0, 255]), (934667676, [255, 255, 255]), (1352486719, [255, 255, 255]),
             (1211706048, [0, 128, 255]), (1211706040, [0, 128, 255]), (1211706047, [0, 128, 255]), (1211706045, [0, 128, 255]), (1211706042, [0, 128, 255]),
             (1211706038, [255, 128, 128]), (1211706046, [255, 128, 128]), (1211706027, [255, 128, 128]), (1211706026, [200, 200, 0]), (1211706032, [200, 200, 0]), (934667675, [128, 0, 0])):
    if i in ways:
        pl.append({"color": c, "pts": w(i)})
for b in pf:
    if b["measuredHeight"] in (21.4,):
        pl.append({"color": [255, 0, 128], "pts": b["ring"]})
json.dump({"tiles": tiles, "polylines": pl}, open(sys.argv[5], "w", encoding="utf-8"))
print("polylines", len(pl))
