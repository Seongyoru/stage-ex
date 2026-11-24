# Footprint statistics from karena_plateau_lod012.json: vertices, edges (length, bearing), centroid, area, oriented bbox.
# Usage: footprint_stats.py parsed.json
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(sys.argv[1], encoding="utf-8"))
MLAT, MLON = d["metres_per_degree"]["lat"], d["metres_per_degree"]["lon"]
LON0, LAT0 = d["local_origin"]
ring = d["lod0_exterior"]
pts = [((p[0]-LON0)*MLON, (p[1]-LAT0)*MLAT) for p in ring]
if pts[0] != pts[-1]:
    pts.append(pts[0]); ring = ring + [ring[0]]
n = len(pts) - 1
A = 0; cx = 0; cy = 0
for i in range(n):
    x1, y1 = pts[i]; x2, y2 = pts[i+1]
    c = x1*y2 - x2*y1
    A += c; cx += (x1+x2)*c; cy += (y1+y2)*c
A /= 2; cx /= 6*A; cy /= 6*A
print("signed area %.1f m2 (positive = CCW), perimeter %.1f m" % (A, sum(math.hypot(pts[i+1][0]-pts[i][0], pts[i+1][1]-pts[i][1]) for i in range(n))))
print("centroid local (E,N) = (%.2f, %.2f) m -> lon/lat [%.7f, %.7f]" % (cx, cy, LON0 + cx/MLON, LAT0 + cy/MLAT))
print("ground z of LOD0 ring:", sorted(set(round(p[2], 3) for p in ring)))
print("idx  lon          lat          E(m)     N(m)   | edge->next len(m) bearing(deg)  turn(deg)")
bear = []
for i in range(n):
    dx = pts[i+1][0]-pts[i][0]; dy = pts[i+1][1]-pts[i][1]
    bear.append((math.degrees(math.atan2(dx, dy)) + 360) % 360)
for i in range(n):
    dx = pts[i+1][0]-pts[i][0]; dy = pts[i+1][1]-pts[i][1]
    turn = ((bear[(i+1) % n] - bear[i] + 540) % 360) - 180
    print("%2d  %.7f  %.7f  %8.2f %8.2f | %7.2f  %7.2f   %7.2f" % (i, ring[i][0], ring[i][1], pts[i][0], pts[i][1], math.hypot(dx, dy), bear[i], turn))
# oriented bbox along axis bearings
def obb(axis_bearing):
    t = math.radians(axis_bearing)
    ux, uy = math.sin(t), math.cos(t)        # along-axis unit
    vx, vy = math.cos(t), -math.sin(t)       # right-hand perpendicular (axis + 90 deg)
    us = [x*ux + y*uy for x, y in pts[:-1]]; vs = [x*vx + y*vy for x, y in pts[:-1]]
    return max(us)-min(us), max(vs)-min(vs), min(us), max(us), min(vs), max(vs)
best = None
for b10 in range(0, 1800):
    b = b10/10
    L, W, *_ = obb(b)
    if best is None or L*W < best[0]:
        best = (L*W, b, L, W)
print("min-area oriented bbox: axis bearing %.1f deg, %.2f m along x %.2f m across, area %.0f" % (best[1], best[2], best[3], best[0]))
for b in (123.3, 303.3, 0.0, 90.0):
    L, W, u0, u1, v0, v1 = obb(b)
    print("bbox along bearing %.1f: length %.2f m (u %.2f..%.2f), width %.2f m (v %.2f..%.2f)" % (b, L, u0, u1, W, v0, v1))
lons = [p[0] for p in ring]; lats = [p[1] for p in ring]
print("lon/lat bbox: [%.7f, %.7f] - [%.7f, %.7f]  => %.2f m E-W x %.2f m N-S" % (min(lons), min(lats), max(lons), max(lats), (max(lons)-min(lons))*MLON, (max(lats)-min(lats))*MLAT))
print("coords [lon,lat]:", json.dumps([[round(p[0], 7), round(p[1], 7)] for p in ring]))
