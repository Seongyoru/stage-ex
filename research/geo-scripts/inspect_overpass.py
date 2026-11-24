# Inspect an Overpass JSON dump: element counts and largest elements.
import sys as _s; _s.stdout.reconfigure(encoding="utf-8")
import json, sys
path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    d = json.load(f)
els = d["elements"]
from collections import Counter
print("counts", Counter(e["type"] for e in els))
sizes = []
for e in els:
    s = len(json.dumps(e))
    sizes.append((s, e["type"], e["id"], (e.get("tags") or {}).get("name"), (e.get("tags") or {}).get("type"), {k: v for k, v in (e.get("tags") or {}).items() if k in ("natural", "landuse", "boundary", "place", "water", "route", "building")}))
sizes.sort(reverse=True)
for s in sizes[:25]:
    print(s)
