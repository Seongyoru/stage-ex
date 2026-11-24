# Print a compact per-feature table from a PLATEAU b3dm batch table (JSON + binary props).
# Usage: b3dm_table.py file.b3dm
import json, struct, sys
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], "rb") as f:
    b = f.read()
magic, ver, blen, ftj, ftb, btj, btb = struct.unpack("<4sIIIIII", b[:28])
o = 28
ft = json.loads(b[o:o+ftj].decode("utf-8")); o += ftj + ftb
bt = json.loads(b[o:o+btj].decode("utf-8")) if btj else {}; o += btj
btbin = b[o:o+btb]; o += btb
n = ft.get("BATCH_LENGTH", 0)
fmt = {"DOUBLE": ("d", 8), "FLOAT": ("f", 4), "BYTE": ("b", 1), "UNSIGNED_BYTE": ("B", 1), "SHORT": ("h", 2), "UNSIGNED_SHORT": ("H", 2), "INT": ("i", 4), "UNSIGNED_INT": ("I", 4)}
binp = {}
for k, v in bt.items():
    if isinstance(v, dict) and "byteOffset" in v:
        c, s = fmt[v["componentType"]]
        binp[k] = list(struct.unpack_from("<%d%s" % (n, c), btbin, v["byteOffset"]))
print("n", n, "RTC/feature table", ft)
for i in range(n):
    a = bt.get("attributes", [None]*n)[i] or {}
    row = {
        "gml_id": bt["gml_id"][i], "name": bt.get("gml:name", [None]*n)[i],
        "bid": bt.get("uro:BuildingIDAttribute_uro:buildingID", [None]*n)[i],
        "h": binp.get("bldg:measuredHeight", [None]*n)[i],
        "created": bt.get("core:creationDate", [None]*n)[i],
        "survey": bt.get("uro:BuildingDetailAttribute_uro:surveyYear", [None]*n)[i],
        "lodType": bt.get("uro:lodType", [None]*n)[i],
        "usage": a.get("bldg:usage"), "storeys": a.get("bldg:storeysAboveGround"), "ug": a.get("bldg:storeysBelowGround"),
    }
    for k in ("_x", "_y", "_xmin", "_xmax", "_ymin", "_ymax", "_zmin", "_zmax", "_lod"):
        if k in binp:
            row[k] = round(binp[k][i], 7) if isinstance(binp[k][i], float) else binp[k][i]
    print(json.dumps(row, ensure_ascii=False))
