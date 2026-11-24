# Minimal Mapbox Vector Tile decoder (pure Python): list features of one layer whose bbox touches a lon/lat window.
# Usage: mvt_layer_dump.py tile.pbf z x y layer lonmin latmin lonmax latmax
import sys, gzip, math, json
sys.stdout.reconfigure(encoding="utf-8")
data = open(sys.argv[1], "rb").read()
if data[:2] == b"\x1f\x8b":
    data = gzip.decompress(data)
z, tx, ty = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
layer_name = sys.argv[5]
win = [float(v) for v in sys.argv[6:10]]
def varint(b, p):
    r = 0; s = 0
    while True:
        c = b[p]; p += 1
        r |= (c & 0x7F) << s; s += 7
        if not c & 0x80:
            return r, p
def fields(b):
    p = 0
    while p < len(b):
        k, p = varint(b, p); fn, wt = k >> 3, k & 7
        if wt == 0:
            v, p = varint(b, p)
        elif wt == 2:
            ln, p = varint(b, p); v = b[p:p+ln]; p += ln
        elif wt == 5:
            v = b[p:p+4]; p += 4
        elif wt == 1:
            v = b[p:p+8]; p += 8
        else:
            raise ValueError("wiretype %d" % wt)
        yield fn, wt, v
import struct
def value(b):
    for fn, wt, v in fields(b):
        if fn == 1: return v.decode("utf-8")
        if fn == 2: return struct.unpack("<f", v)[0]
        if fn == 3: return struct.unpack("<d", v)[0]
        if fn in (4, 5): return v
        if fn == 6: return (v >> 1) ^ -(v & 1)
        if fn == 7: return bool(v)
names = []
for fn, wt, v in fields(data):
    if fn != 3: continue
    lname = None; keys = []; vals = []; feats = []; extent = 4096
    for f2, w2, v2 in fields(v):
        if f2 == 1: lname = v2.decode()
        elif f2 == 2: feats.append(v2)
        elif f2 == 3: keys.append(v2.decode())
        elif f2 == 4: vals.append(value(v2))
        elif f2 == 5: extent = v2
    names.append((lname, len(feats)))
    if lname != layer_name: continue
    n = 2 ** z
    for fb in feats:
        tags = []; geom = []; gt = 0; fid = None
        for f3, w3, v3 in fields(fb):
            if f3 == 1: fid = v3
            elif f3 == 2:
                p = 0
                while p < len(v3):
                    t, p = varint(v3, p); tags.append(t)
            elif f3 == 3: gt = v3
            elif f3 == 4:
                p = 0
                while p < len(v3):
                    t, p = varint(v3, p); geom.append(t)
        x = y = 0; i = 0; pts = []
        while i < len(geom):
            cmd = geom[i] & 7; cnt = geom[i] >> 3; i += 1
            if cmd in (1, 2):
                for _ in range(cnt):
                    dx = (geom[i] >> 1) ^ -(geom[i] & 1); dy = (geom[i+1] >> 1) ^ -(geom[i+1] & 1); i += 2
                    x += dx; y += dy
                    lon = (tx + x/extent) / n * 360 - 180
                    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (ty + y/extent) / n))))
                    pts.append((lon, lat))
        if not pts: continue
        lo0 = min(p[0] for p in pts); lo1 = max(p[0] for p in pts); la0 = min(p[1] for p in pts); la1 = max(p[1] for p in pts)
        if lo1 < win[0] or lo0 > win[2] or la1 < win[1] or la0 > win[3]: continue
        props = {keys[tags[j]]: vals[tags[j+1]] for j in range(0, len(tags), 2)}
        print("feature id", fid, "type", gt, "npts", len(pts), "bbox lon %.6f..%.6f lat %.6f..%.6f" % (lo0, lo1, la0, la1), json.dumps(props, ensure_ascii=False))
print("layers:", names)
