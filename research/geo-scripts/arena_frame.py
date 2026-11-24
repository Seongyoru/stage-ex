# Derive the K-Arena "arena frame" (axis, symmetry line, sharp-corner polygon, widths) from the PLATEAU LOD0/LOD2 extract.
# Usage: arena_frame.py karena_plateau_lod012.json out_frame.json
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(sys.argv[1], encoding="utf-8"))
MLAT, MLON = d["metres_per_degree"]["lat"], d["metres_per_degree"]["lon"]
LON0, LAT0 = d["local_origin"]
ring = d["lod0_exterior"]
P = [((p[0]-LON0)*MLON, (p[1]-LAT0)*MLAT) for p in ring[:-1]]
def ll(e, n):
    return [round(LON0 + e/MLON, 7), round(LAT0 + n/MLAT, 7)]
def bearing(a, b):
    return math.degrees(math.atan2(b[0]-a[0], b[1]-a[1])) % 360
def dist(a, b):
    return math.hypot(b[0]-a[0], b[1]-a[1])
def isect(p1, p2, p3, p4):
    x1, y1 = p1; x2, y2 = p2; x3, y3 = p3; x4, y4 = p4
    den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
    px = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4))/den
    py = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4))/den
    return (px, py)
# wall lines (indices from footprint_stats output)
S_wall = (P[10], P[11]); W_wall = (P[9], P[10]); NW_wall = (P[8], P[9]); N_wall = (P[7], P[8]); NE_wall = (P[6], P[7]); SE_face = (P[13], P[0]); SE_face2 = (P[3], P[4])
walls = {"S": S_wall, "W": W_wall, "NW": NW_wall, "N": N_wall, "NE": NE_wall, "SE(a)": SE_face, "SE(b)": SE_face2}
print("wall bearings / lengths / outward normals:")
for k, (a, b) in walls.items():
    br = bearing(a, b); print("  %-6s bearing %.2f (reverse %.2f)  length %.2f m  outward normal %.2f" % (k, br, (br+180) % 360, dist(a, b), (br+90) % 360))
cS = isect(*S_wall, *SE_face); cE = isect(*NE_wall, *SE_face2)
sharp = [("C1 S-SE corner (sharp)", cS), ("C2 E corner SE-NE (sharp)", cE), ("C3 N tip (NE-N)", P[7]), ("C4 N-NW corner", P[8]), ("C5 NW-W corner", P[9]), ("C6 SW corner (W-S)", P[10])]
axis = (bearing(*NW_wall) + 90) % 360   # outward normal of NW wall = direction stage -> rear
axis2 = (bearing(*SE_face) + 270) % 360
print("NW wall outward normal %.3f ; SE face inward normal %.3f" % (axis, axis2))
AX = 303.25
t = math.radians(AX); ux, uy = math.sin(t), math.cos(t)       # +u: stage -> rear
vx, vy = math.sin(t + math.pi/2), math.cos(t + math.pi/2)        # +v: bearing AX+90 = 33.25 (NE side)
def uv(p):
    return (p[0]*ux + p[1]*uy, p[0]*vx + p[1]*vy)
uvP = [uv(p) for p in P]
u_se = sum(uv(p)[0] for p in (P[13], P[0], P[3], P[4]))/4
u_nw = sum(uv(p)[0] for p in (P[8], P[9]))/2
v_nw_mid = (uv(P[8])[1] + uv(P[9])[1])/2
v_se_mid = (uv(cS)[1] + uv(cE)[1])/2
v_rear_corners_mid = (uv(P[7])[1] + uv(P[10])[1])/2
print("u of SE face %.2f, u of NW wall %.2f => axial length %.2f m" % (u_se, u_nw, u_nw-u_se))
print("v of symmetry candidates: NW wall mid %.2f, SE sharp-corner mid %.2f, widest-corner mid %.2f" % (v_nw_mid, v_se_mid, v_rear_corners_mid))
v0 = (v_nw_mid + v_se_mid + v_rear_corners_mid)/3
print("adopted symmetry-axis offset v0 = %.2f m" % v0)
def frame(p):
    u, v = uv(p); return (v - v0, u - u_se)     # X lateral (+ toward bearing 33.25), Y from stage face toward rear
def unframe(X, Y):
    u = Y + u_se; v = X + v0
    return (u*ux + v*vx, u*uy + v*vy)
O = unframe(0, 0); R = unframe(0, u_nw-u_se)
print("ORIGIN S0 (axis x SE face): local E,N = (%.2f, %.2f) lon/lat %s" % (O[0], O[1], ll(*O)))
print("REAR point R0 (axis x NW wall): lon/lat %s ; bearing S0->R0 = %.2f ; distance %.2f" % (ll(*R), bearing(O, R), dist(O, R)))
print("footprint vertices in ARENA FRAME (X lateral +NE, Y from SE face toward NW rear):")
out = {"axis_bearing_stage_to_rear_deg": AX, "origin_S0_lonlat": ll(*O), "rear_R0_lonlat": ll(*R), "axial_length_m": round(u_nw-u_se, 2), "vertices": [], "sharp_corners": []}
for i, p in enumerate(P):
    X, Y = frame(p); print("  v%-2d %s  X=%8.2f  Y=%8.2f" % (i, ll(*p), X, Y)); out["vertices"].append({"i": i, "lonlat": ll(*p), "X": round(X, 2), "Y": round(Y, 2)})
print("sharp-corner (7-gon, fillets & notch removed):")
for nm, p in sharp:
    X, Y = frame(p); print("  %-28s %s  E=%7.2f N=%7.2f  X=%8.2f  Y=%8.2f" % (nm, ll(*p), p[0], p[1], X, Y)); out["sharp_corners"].append({"name": nm, "lonlat": ll(*p), "X": round(X, 2), "Y": round(Y, 2)})
sp = [p for _, p in sharp]
A = 0
for i in range(len(sp)):
    x1, y1 = sp[i]; x2, y2 = sp[(i+1) % len(sp)]; A += x1*y2 - x2*y1
print("sharp polygon area %.1f m2; edges:" % abs(A/2))
for i in range(len(sp)):
    a, b = sp[i], sp[(i+1) % len(sp)]
    print("   %s -> %s : %.2f m bearing %.2f" % (sharp[i][0][:2], sharp[(i+1) % len(sp)][0][:2], dist(a, b), bearing(a, b)))
print("width across axis at stations (from sharp polygon):")
def width_at(Y):
    xs = []
    F = [frame(p) for p in sp]
    for i in range(len(F)):
        (xa, ya), (xb, yb) = F[i], F[(i+1) % len(F)]
        if (ya - Y)*(yb - Y) <= 0 and ya != yb:
            xs.append(xa + (xb-xa)*(Y-ya)/(yb-ya))
    return (min(xs), max(xs)) if xs else None
for Y in (0.01, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 104, 105, 106, 110, 120, 130, 138.4):
    w = width_at(Y)
    if w: print("   Y=%6.1f  X from %7.2f to %7.2f  width %.2f" % (Y, w[0], w[1], w[1]-w[0]))
# roof key points in frame
print("LOD2 roof key vertices in arena frame (X, Y, z T.P., height above ground 4.18):")
seen = {}
for s in d["lod2_surfaces"]:
    if s["kind"] != "RoofSurface": continue
    for pg in s["polygons"]:
        for q in pg["exterior"][:-1] + [x for h in pg["interiors"] for x in h[:-1]]:
            key = (round(q[0], 7), round(q[1], 7), round(q[2], 2))
            if key in seen: continue
            p = ((q[0]-LON0)*MLON, (q[1]-LAT0)*MLAT); X, Y = frame(p); seen[key] = (X, Y)
rk = sorted(seen.items(), key=lambda kv: (round(kv[1][1]), kv[1][0]))
out["roof_points"] = []
for (lo, la, z), (X, Y) in rk:
    print("   [%.7f, %.7f]  X=%8.2f Y=%8.2f  z=%.2f  h=%.2f" % (lo, la, X, Y, z, z-4.18)); out["roof_points"].append({"lonlat": [lo, la], "X": round(X, 2), "Y": round(Y, 2), "z_tp": z, "h_above_ground": round(z-4.18, 2)})
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
