# Walk a 3D Tiles tileset.json and list tiles whose region contains lon/lat. Usage: tileset_find.py tileset.json lon lat
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], encoding="utf-8") as f:
    t = json.load(f)
lon, lat = math.radians(float(sys.argv[2])), math.radians(float(sys.argv[3]))
print("asset", t.get("asset"), "geometricError", t.get("geometricError"))
print("property keys:", len(t.get("properties", {})))
cnt = [0, 0]
def walk(n, depth, path):
    cnt[0] += 1
    bv = n.get("boundingVolume", {})
    reg = bv.get("region")
    inside = True
    if reg:
        inside = reg[0] <= lon <= reg[2] and reg[1] <= lat <= reg[3]
    c = n.get("content")
    if c:
        cnt[1] += 1
    if inside:
        if reg:
            r = [round(math.degrees(v), 6) for v in reg[:4]] + [round(reg[4], 1), round(reg[5], 1)]
        else:
            r = list(bv.keys())
        print("  " * depth + "tile", path, "ge=%s" % n.get("geometricError"), "region(deg)=", r, "content=", (c or {}).get("uri") or (c or {}).get("url"))
        for i, ch in enumerate(n.get("children", [])):
            walk(ch, depth + 1, path + "/" + str(i))
walk(t["root"], 0, "root")
print("total tiles", cnt[0], "with content", cnt[1])
