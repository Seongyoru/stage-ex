# Print per-segment length/bearing of given OSM ways. Usage: way_segments.py overpass.json id [id...]
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(sys.argv[1], encoding="utf-8"))
ids = set(int(x) for x in sys.argv[2:])
MLAT, MLON = 110949.1, 90769.0
for e in d["elements"]:
    if e["type"] == "way" and e["id"] in ids:
        g = e["geometry"]
        print("== way", e["id"], json.dumps(e.get("tags", {}), ensure_ascii=False))
        tot = 0
        for i in range(len(g)-1):
            dx = (g[i+1]["lon"]-g[i]["lon"])*MLON; dy = (g[i+1]["lat"]-g[i]["lat"])*MLAT
            L = math.hypot(dx, dy); tot += L
            if L >= 6:
                print("   [%.7f, %.7f] -> [%.7f, %.7f]  %.1f m  bearing %.1f" % (g[i]["lon"], g[i]["lat"], g[i+1]["lon"], g[i+1]["lat"], L, math.degrees(math.atan2(dx, dy)) % 360))
        print("   total %.1f m, nodes %d" % (tot, len(g)))
