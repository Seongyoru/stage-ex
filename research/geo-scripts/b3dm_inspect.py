# Inspect a b3dm file: header, feature table, batch table (per-feature attrs), glTF structure.
# Usage: b3dm_inspect.py file.b3dm
import json, struct, sys
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], "rb") as f:
    b = f.read()
magic, ver, blen, ftj, ftb, btj, btb = struct.unpack("<4sIIIIII", b[:28])
print("magic", magic, "ver", ver, "len", blen, len(b), "ftj", ftj, "ftb", ftb, "btj", btj, "btb", btb)
o = 28
ft = json.loads(b[o:o+ftj].decode("utf-8")); o += ftj
ftbin = b[o:o+ftb]; o += ftb
bt = json.loads(b[o:o+btj].decode("utf-8")) if btj else {}; o += btj
btbin = b[o:o+btb]; o += btb
print("featureTable", ft)
n = ft.get("BATCH_LENGTH", 0)
print("batch keys", list(bt.keys()))
for i in range(n):
    row = {}
    for k, v in bt.items():
        if isinstance(v, list):
            if k == "attributes":
                continue
            row[k] = v[i]
    print("--- feature", i)
    print(json.dumps(row, ensure_ascii=False))
    if "attributes" in bt:
        print("  attributes:", json.dumps(bt["attributes"][i], ensure_ascii=False)[:3000])
glb = b[o:]
gm, gv, gl = struct.unpack("<4sII", glb[:12])
print("glb", gm, gv, gl, len(glb))
p = 12
chunks = []
while p < len(glb):
    cl, ct = struct.unpack("<I4s", glb[p:p+8])
    chunks.append((ct, glb[p+8:p+8+cl])); p += 8 + cl
g = json.loads(chunks[0][1].decode("utf-8"))
print("gltf keys", list(g.keys()))
print("extensionsUsed", g.get("extensionsUsed"), "extensionsRequired", g.get("extensionsRequired"), "extensions", g.get("extensions"))
print("scenes", g.get("scenes"), "nodes", g.get("nodes"))
print("meshes", json.dumps(g.get("meshes"))[:1500])
print("accessors", json.dumps(g.get("accessors"))[:2500])
print("bufferViews", json.dumps(g.get("bufferViews"))[:1500])
print("materials", json.dumps(g.get("materials"))[:800])
