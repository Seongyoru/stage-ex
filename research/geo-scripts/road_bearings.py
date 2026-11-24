# Length-weighted bearing statistics of OSM roads near a point. Usage: road_bearings.py overpass.json lon lat radius
import json, sys, math
from collections import defaultdict
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(sys.argv[1], encoding="utf-8"))
lon0, lat0, rad = float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
MLAT, MLON = 110949.1, 90769.0
hist = defaultdict(float); named = defaultdict(lambda: defaultdict(float))
car = ("motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link")
segs = []
for e in d["elements"]:
    if e["type"] != "way": continue
    t = e.get("tags", {})
    if t.get("highway") not in car: continue
    g = e["geometry"]
    for i in range(len(g)-1):
        x1 = (g[i]["lon"]-lon0)*MLON; y1 = (g[i]["lat"]-lat0)*MLAT; x2 = (g[i+1]["lon"]-lon0)*MLON; y2 = (g[i+1]["lat"]-lat0)*MLAT
        if math.hypot((x1+x2)/2, (y1+y2)/2) > rad: continue
        L = math.hypot(x2-x1, y2-y1)
        if L < 8: continue
        b = math.degrees(math.atan2(x2-x1, y2-y1)) % 180
        hist[round(b % 90)] += L
        nm = t.get("name") or ("(unnamed %s way %d)" % (t.get("highway"), e["id"]))
        named[nm][round(b, 0)] += L
        segs.append((L, b, nm, e["id"]))
tot = sum(hist.values())
print("length-weighted histogram of bearing mod 90 (deg : metres):")
for k in sorted(hist, key=lambda k: -hist[k])[:14]:
    print("  %2d : %.0f m (%.1f%%)" % (k, hist[k], 100*hist[k]/tot))
print("per road dominant bearings (mod 180):")
for nm, h in sorted(named.items(), key=lambda kv: -sum(kv[1].values()))[:28]:
    top = sorted(h.items(), key=lambda kv: -kv[1])[:3]
    print("  %-40s total %.0f m : %s" % (nm, sum(h.values()), ", ".join("%.0f deg (%.0f m)" % (b, L) for b, L in top)))
print("longest straight segments:")
for L, b, nm, i in sorted(segs, reverse=True)[:25]:
    print("  %.1f m  bearing %.2f  %s (way %d)" % (L, b, nm, i))
