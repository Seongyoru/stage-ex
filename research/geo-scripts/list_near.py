# List OSM elements near a point with tags. Usage: list_near.py data.json lon lat radius_m [filter]
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
path, lon0, lat0, rad = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
flt = sys.argv[5] if len(sys.argv) > 5 else ""
with open(path, encoding="utf-8") as f:
    d = json.load(f)
mlat = 110940.0
mlon = 111320.0 * math.cos(math.radians(lat0))
def dist(lon, lat):
    return math.hypot((lon - lon0) * mlon, (lat - lat0) * mlat)
rows = []
for e in d["elements"]:
    tags = e.get("tags") or {}
    if e["type"] == "node":
        pts = [(e["lon"], e["lat"])]
    elif e["type"] == "way":
        pts = [(p["lon"], p["lat"]) for p in e.get("geometry", [])]
    else:
        pts = []
        for m in e.get("members", []):
            for p in m.get("geometry", []) or []:
                pts.append((p["lon"], p["lat"]))
            if "lon" in m:
                pts.append((m["lon"], m["lat"]))
    if not pts:
        continue
    dmin = min(dist(*p) for p in pts)
    if dmin > rad:
        continue
    ts = json.dumps(tags, ensure_ascii=False)
    if flt and flt not in ts:
        continue
    cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
    rows.append((dmin, e["type"], e["id"], len(pts), round(cx, 7), round(cy, 7), ts))
rows.sort()
for r in rows:
    print("%6.0fm %-8s %-12s n=%-4d c=[%.7f,%.7f] %s" % r)
