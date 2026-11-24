# Dump geometry + tags + metric stats for given OSM element ids. Usage: dump_ways.py data.json id [id...]
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
path = sys.argv[1]
ids = set(int(x) for x in sys.argv[2:])
with open(path, encoding="utf-8") as f:
    d = json.load(f)
LAT0 = 35.4646
MLAT = 110940.0
MLON = 111320.0 * math.cos(math.radians(LAT0))
def area_len(pts):
    xy = [((lo - 139.63) * MLON, (la - LAT0) * MLAT) for lo, la in pts]
    L = sum(math.hypot(xy[i+1][0]-xy[i][0], xy[i+1][1]-xy[i][1]) for i in range(len(xy)-1))
    A = 0.0
    if pts[0] == pts[-1]:
        for i in range(len(xy)-1):
            A += xy[i][0]*xy[i+1][1] - xy[i+1][0]*xy[i][1]
        A = abs(A)/2
    return A, L
for e in d["elements"]:
    if e["id"] in ids and e["type"] in ("way", "relation"):
        print("==", e["type"], e["id"], json.dumps(e.get("tags", {}), ensure_ascii=False))
        if e["type"] == "way":
            pts = [(p["lon"], p["lat"]) for p in e["geometry"]]
            A, L = area_len(pts)
            print("  nodes=%d closed=%s area=%.0f m2 length=%.1f m" % (len(pts), pts[0] == pts[-1], A, L))
            print("  node_ids:", e.get("nodes"))
            print("  coords:", json.dumps([[round(a, 7), round(b, 7)] for a, b in pts]))
        else:
            for m in e["members"]:
                print("  member", m["type"], m["ref"], m.get("role"), len(m.get("geometry") or []))
