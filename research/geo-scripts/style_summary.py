# Summarise a MapLibre style JSON / TileJSON. Usage: style_summary.py file.json
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(sys.argv[1], encoding="utf-8"))
if "tilejson" in d:
    print("tilejson", d.get("tilejson"), "tiles", d.get("tiles"), "minzoom", d.get("minzoom"), "maxzoom", d.get("maxzoom"), "bounds", d.get("bounds"))
    print("attribution:", d.get("attribution"))
    print("layers:", [(l["id"], l.get("minzoom"), l.get("maxzoom")) for l in d.get("vector_layers", [])])
    for l in d.get("vector_layers", []):
        if l["id"] == "building":
            print("building fields", l.get("fields"))
else:
    print("version", d.get("version"), "name", d.get("name"))
    print("sources:", json.dumps(d.get("sources"), ensure_ascii=False)[:900])
    print("glyphs:", d.get("glyphs")); print("sprite:", d.get("sprite"))
    print("layers:", len(d.get("layers", [])), "types:", sorted(set(l["type"] for l in d["layers"])))
    for l in d["layers"]:
        if l["type"] == "fill-extrusion" or "building" in l["id"]:
            print("  bldg layer:", json.dumps(l, ensure_ascii=False)[:600])
