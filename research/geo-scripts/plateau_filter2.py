# Summarise Yokohama PLATEAU entries (datasets, composite, citygml). Usage: plateau_filter2.py all.json out_extra.json
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], encoding="utf-8") as f:
    d = json.load(f)
extra = {}
for k in ("latest_datasets", "composite_tilesets", "citygml", "latest_citygml"):
    v = d[k]
    print(k, type(v).__name__, len(v))
    if isinstance(v, list):
        sel = [x for x in v if "14100" in json.dumps(x, ensure_ascii=False)[:4000] or "14103" in json.dumps(x, ensure_ascii=False)[:4000]]
    else:
        sel = {kk: vv for kk, vv in v.items() if "1410" in kk or "14100" in json.dumps(vv, ensure_ascii=False)[:3000]}
    extra[k] = sel
    print("  selected", len(sel))
with open(sys.argv[2], "w", encoding="utf-8") as f:
    json.dump(extra, f, ensure_ascii=False, indent=1)
for x in d["datasets"]:
    if x.get("city_code") == "14100" and x["type_en"] != "fld" and not (x["type_en"] == "bldg" and x.get("ward_code") not in ("14103", None)):
        print(x["id"], "|", x["name"], "|", x["format"], "| lod", x.get("lod"), "| tex", x.get("texture"), "|", x["url"], "|", x.get("composite_url"), "| layers", x.get("layers"), "| size", x.get("file_size"))
