# Pure-Python PNG tile mosaic with optional polygon overlay (no external libs).
# Usage: png_mosaic.py out.png zoom scale spec.json
#  spec.json: {"tiles": {"x/y": "path.png", ...}, "polylines": [{"color":[r,g,b], "pts":[[lon,lat],...]}], "points": [{"color":[r,g,b],"pt":[lon,lat]}]}
import sys, zlib, struct, json, math
def read_png(path):
    b = open(path, "rb").read()
    assert b[:8] == b"\x89PNG\r\n\x1a\n", "not png"
    p = 8; idat = b""; plte = None; trns = None
    while p < len(b):
        ln, typ = struct.unpack(">I4s", b[p:p+8]); data = b[p+8:p+8+ln]; p += 12 + ln
        if typ == b"IHDR":
            w, h, bd, ct, cm, fm, im = struct.unpack(">IIBBBBB", data)
        elif typ == b"PLTE":
            plte = data
        elif typ == b"IDAT":
            idat += data
        elif typ == b"IEND":
            break
    assert bd == 8 and im == 0, "unsupported png (bitdepth %d interlace %d)" % (bd, im)
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]
    raw = zlib.decompress(idat); stride = w * ch
    out = bytearray(h * stride); prev = bytearray(stride); q = 0
    for y in range(h):
        ft = raw[q]; q += 1
        line = bytearray(raw[q:q+stride]); q += stride
        if ft == 1:
            for i in range(ch, stride): line[i] = (line[i] + line[i-ch]) & 255
        elif ft == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 255
        elif ft == 3:
            for i in range(stride):
                a = line[i-ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif ft == 4:
            for i in range(stride):
                a = line[i-ch] if i >= ch else 0; bb = prev[i]; c = prev[i-ch] if i >= ch else 0
                pa = abs(bb - c); pb = abs(a - c); pc = abs(a + bb - 2*c)
                pr = a if (pa <= pb and pa <= pc) else (bb if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y*stride:(y+1)*stride] = line; prev = line
    rgb = bytearray(w * h * 3)
    for i in range(w * h):
        if ct == 2: rgb[3*i:3*i+3] = out[3*i:3*i+3]
        elif ct == 6: rgb[3*i:3*i+3] = out[4*i:4*i+3]
        elif ct == 3: k = out[i] * 3; rgb[3*i:3*i+3] = plte[k:k+3]
        elif ct == 0: rgb[3*i:3*i+3] = bytes([out[i]]) * 3
        elif ct == 4: rgb[3*i:3*i+3] = bytes([out[2*i]]) * 3
    return w, h, rgb
def write_png(path, w, h, rgb):
    raw = bytearray()
    for y in range(h):
        raw.append(0); raw += rgb[y*w*3:(y+1)*w*3]
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    open(path, "wb").write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(raw), 6)) + chunk(b"IEND", b""))
if __name__ == "__main__":
    outp, z, scale = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    spec = json.load(open(sys.argv[4], encoding="utf-8"))
    keys = [tuple(int(v) for v in k.split("/")) for k in spec["tiles"]]
    x0 = min(k[0] for k in keys); x1 = max(k[0] for k in keys); y0 = min(k[1] for k in keys); y1 = max(k[1] for k in keys)
    T = 256; W = (x1-x0+1)*T; H = (y1-y0+1)*T
    img = bytearray(b"\x40" * (W*H*3))
    for k, path in spec["tiles"].items():
        tx, ty = [int(v) for v in k.split("/")]
        w, h, rgb = read_png(path)
        for yy in range(h):
            o = ((ty-y0)*T + yy) * W * 3 + (tx-x0)*T*3
            img[o:o+w*3] = rgb[yy*w*3:(yy+1)*w*3]
    # upscale
    if scale > 1:
        W2, H2 = W*scale, H*scale; big = bytearray(W2*H2*3)
        for yy in range(H2):
            sy = yy // scale; row = bytearray(W2*3)
            for xx in range(W):
                px = img[(sy*W+xx)*3:(sy*W+xx)*3+3]
                row[xx*scale*3:(xx+1)*scale*3] = px * scale
            big[yy*W2*3:(yy+1)*W2*3] = row
        img, W, H = big, W2, H2
    n = 2 ** z
    def px(lon, lat):
        x = (lon + 180) / 360 * n; y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
        return (x - x0) * T * scale, (y - y0) * T * scale
    def dot(x, y, c, r=0):
        for dy in range(-r, r+1):
            for dx in range(-r, r+1):
                xi, yi = int(x)+dx, int(y)+dy
                if 0 <= xi < W and 0 <= yi < H:
                    img[(yi*W+xi)*3:(yi*W+xi)*3+3] = bytes(c)
    for pl in spec.get("polylines", []):
        pts = [px(*p) for p in pl["pts"]]
        for i in range(len(pts)-1):
            (xa, ya), (xb, yb) = pts[i], pts[i+1]
            steps = int(max(abs(xb-xa), abs(yb-ya))) + 1
            for s in range(steps+1):
                t = s/steps; dot(xa+(xb-xa)*t, ya+(yb-ya)*t, pl["color"], pl.get("r", 0))
    for pt in spec.get("points", []):
        x, y = px(*pt["pt"]); dot(x, y, pt["color"], pt.get("r", 3))
    write_png(outp, W, H, img)
    print("wrote", outp, W, H, "origin tile", x0, y0)
