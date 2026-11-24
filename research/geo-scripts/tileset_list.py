# List all tiles of a 3D Tiles tileset.json that intersect a lon/lat box. Usage: tileset_list.py tileset.json lonmin latmin lonmax latmax
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], encoding="utf-8") as f:
    t = json.load(f)
lo0, la0, lo1, la1 = [math.radians(float(v)) for v in sys.argv[2:6]]
tot = [0]
def walk(n, depth, path):
    tot[0] += 1
    reg = n.get("boundingVolume", {}).get("region")
    hit = reg and not (reg[2] < lo0 or reg[0] > lo1 or reg[3] < la0 or reg[1] > la1)
    c = n.get("content")
    if hit:
        r = [round(math.degrees(v), 6) for v in reg[:4]] + [round(reg[4], 1), round(reg[5], 1)]
        print("  " * depth + path, "ge=%.1f" % n.get("geometricError", -1), r, (c or {}).get("uri"), "children=%d" % len(n.get("children", [])))
    for i, ch in enumerate(n.get("children", [])):
        walk(ch, depth + 1, path + "/" + str(i))
walk(t["root"], 0, "root")
print("total tiles", tot[0])
