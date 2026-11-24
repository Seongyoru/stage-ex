# Filter PLATEAU datacatalog JSON for Yokohama (city_code 14100). Usage: plateau_filter.py all.json out.json
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], encoding="utf-8") as f:
    d = json.load(f)
ds = d["datasets"]
print("total datasets", len(ds), "top keys", list(d.keys()))
yk = [x for x in ds if x.get("city_code") == "14100"]
print("yokohama datasets", len(yk))
from collections import Counter
print(Counter((x["type_en"], x.get("format"), x.get("year")) for x in yk))
with open(sys.argv[2], "w", encoding="utf-8") as f:
    json.dump({"datasets": yk}, f, ensure_ascii=False, indent=1)
for x in yk:
    if x["type_en"] == "bldg" and (x.get("ward_code") in ("14103", None)):
        print(json.dumps(x, ensure_ascii=False))
