# Measure key pixel extents in the official cross-section PNG (pure Python PNG decode with alpha).
# Usage: section_measure.py image.png
import sys, zlib, struct
b = open(sys.argv[1], "rb").read()
p = 8; idat = b""
while p < len(b):
    ln, typ = struct.unpack(">I4s", b[p:p+8]); data = b[p+8:p+8+ln]; p += 12 + ln
    if typ == b"IHDR": w, h, bd, ct, cm, fm, im = struct.unpack(">IIBBBBB", data)
    elif typ == b"IDAT": idat += data
print("size", w, h, "bitdepth", bd, "colortype", ct, "interlace", im)
ch = {0: 1, 2: 3, 4: 2, 6: 4}[ct]
raw = zlib.decompress(idat); stride = w * ch
rows = []; prev = bytearray(stride); q = 0
for y in range(h):
    ft = raw[q]; q += 1; line = bytearray(raw[q:q+stride]); q += stride
    if ft == 1:
        for i in range(ch, stride): line[i] = (line[i] + line[i-ch]) & 255
    elif ft == 2:
        for i in range(stride): line[i] = (line[i] + prev[i]) & 255
    elif ft == 3:
        for i in range(stride): line[i] = (line[i] + (((line[i-ch] if i >= ch else 0) + prev[i]) >> 1)) & 255
    elif ft == 4:
        for i in range(stride):
            a = line[i-ch] if i >= ch else 0; bb = prev[i]; c = prev[i-ch] if i >= ch else 0
            pa = abs(bb-c); pb = abs(a-c); pc = abs(a+bb-2*c)
            line[i] = (line[i] + (a if (pa <= pb and pa <= pc) else (bb if pb <= pc else c))) & 255
    rows.append(line); prev = line
def px(x, y):
    o = x*ch; r = rows[y][o:o+ch]
    return tuple(r)
def opaque(x, y):
    v = px(x, y)
    if ch == 4: return v[3] > 40
    return sum(v[:3]) > 60
# overall opaque bbox
xs = [x for y in range(h) for x in range(w) if opaque(x, y)] if False else None
minx = min((x for y in range(0, h, 2) for x in range(0, w, 2) if opaque(x, y)), default=None)
cols = [any(opaque(x, y) for y in range(0, h, 2)) for x in range(w)]
rws = [any(opaque(x, y) for x in range(0, w, 2)) for y in range(h)]
print("opaque x range", cols.index(True), w-1-cols[::-1].index(True), "y range", rws.index(True), h-1-rws[::-1].index(True))
# per-column top-most opaque y (roof silhouette) sampled
for x in list(range(0, 400, 20)) + list(range(400, w, 100)) + [w-40, w-20, w-5]:
    if x >= w: continue
    ys = [y for y in range(h) if opaque(x, y)]
    print("x=%4d top y=%s bottom y=%s topcolor=%s" % (x, ys[0] if ys else None, ys[-1] if ys else None, px(x, ys[0]) if ys else None))
# purple deck platform: find pixels with purple-ish colour in the left 320 px, report y histogram
from collections import Counter
cy = Counter(); cx = Counter()
for y in range(h):
    for x in range(0, 330):
        v = px(x, y)
        if (ch < 4 or v[3] > 200) and v[2] > 150 and v[0] > 110 and v[1] < 120 and v[2] - v[1] > 70:
            cy[y] += 1; cx[x] += 1
ys = sorted(cy); print("purple(deck) y range", ys[0] if ys else None, ys[-1] if ys else None, "x range", min(cx) if cx else None, max(cx) if cx else None)
print("purple rows with most pixels:", cy.most_common(6))
