# Compact inspection of a PLATEAU b3dm: per-feature key attributes + glTF structure.
# Usage: b3dm_inspect2.py file.b3dm
import json, struct, sys
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], "rb") as f:
    b = f.read()
magic, ver, blen, ftj, ftb, btj, btb = struct.unpack("<4sIIIIII", b[:28])
o = 28
ft = json.loads(b[o:o+ftj].decode("utf-8")); o += ftj
o += ftb
bt = json.loads(b[o:o+btj].decode("utf-8")) if btj else {}; o += btj
btbin = b[o:o+btb]; o += btb
n = ft.get("BATCH_LENGTH", 0)
print("featureTable", ft, "batchTableBinary bytes", btb)
def short(k):
    return not any(s in k for s in ("浸水", "土砂", "帷子川"))
for k, v in bt.items():
    if not isinstance(v, list):
        print("binary/other batch prop", k, v)
for i in range(n):
    row = {k: v[i] for k, v in bt.items() if isinstance(v, list) and k != "attributes" and short(k)}
    print("--- feature", i, json.dumps(row, ensure_ascii=False))
    if "attributes" in bt:
        a = bt["attributes"][i]
        def strip(x):
            if isinstance(x, dict):
                return {k: strip(v) for k, v in x.items() if short(k) and "RiskAttribute" not in k and "DisasterRisk" not in k}
            if isinstance(x, list):
                return [strip(v) for v in x]
            return x
        print("   attrs:", json.dumps(strip(a), ensure_ascii=False)[:2500])
glb = b[o:]
p = 12
chunks = []
while p < len(glb):
    cl, ct = struct.unpack("<I4s", glb[p:p+8])
    chunks.append((ct, glb[p+8:p+8+cl])); p += 8 + cl
g = json.loads(chunks[0][1].decode("utf-8"))
print("gltf keys", list(g.keys()), "asset", g.get("asset"))
print("extensionsUsed", g.get("extensionsUsed"), "extensionsRequired", g.get("extensionsRequired"), "extensions", json.dumps(g.get("extensions"))[:500])
print("scenes", g.get("scenes"), "nodes", json.dumps(g.get("nodes"))[:600])
print("meshes", json.dumps(g.get("meshes"))[:1200])
print("accessors", json.dumps(g.get("accessors"))[:2500])
print("bufferViews", json.dumps(g.get("bufferViews"))[:1200])
print("materials", json.dumps(g.get("materials"))[:800])
print("chunks", [(c[0], len(c[1])) for c in chunks])
