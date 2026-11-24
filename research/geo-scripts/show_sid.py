# Summarise PLATEAU spatialid_attributes JSON. Usage: show_sid.py file.json
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], encoding="utf-8") as f:
    d = json.load(f)
print("features", len(d))
for x in d:
    bb = x.get("_bbox")
    keys = [k for k in x.keys() if k not in ("_bbox",)]
    extra = {k: x[k] for k in keys if not k.startswith("uro:") or k in ("uro:buildingIDAttribute", "uro:buildingDetailAttribute")}
    print(json.dumps(extra, ensure_ascii=False)[:700])
    if bb:
        print("   bbox", json.dumps(bb))
    others = [k for k in keys if k.startswith("uro:") and k not in ("uro:buildingIDAttribute", "uro:buildingDetailAttribute")]
    if others:
        print("   other keys:", others)
