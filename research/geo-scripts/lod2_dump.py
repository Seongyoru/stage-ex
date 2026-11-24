# Dump LOD2 surfaces in local E/N/z and axis coords. Usage: lod2_dump.py parsed.json [kind-filter]
import json, sys, math
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(sys.argv[1], encoding="utf-8"))
flt = sys.argv[2] if len(sys.argv) > 2 else ""
MLAT, MLON = d["metres_per_degree"]["lat"], d["metres_per_degree"]["lon"]
LON0, LAT0 = d["local_origin"]
AX = math.radians(303.25)   # axis bearing stage(SE) -> rear(NW)
ux, uy = math.sin(AX), math.cos(AX)
vx, vy = math.cos(AX), -math.sin(AX)   # right of axis direction (bearing 33.25)
def loc(p):
    x = (p[0]-LON0)*MLON; y = (p[1]-LAT0)*MLAT
    return x, y, x*ux + y*uy, x*vx + y*vy
i = 0
for s in d["lod2_surfaces"]:
    if flt and flt not in s["kind"]:
        continue
    for p in s["polygons"]:
        nx, ny, nz = p["normal"]; L = math.sqrt(nx*nx+ny*ny+nz*nz) or 1
        tilt = math.degrees(math.acos(abs(nz)/L)); az = (math.degrees(math.atan2(nx, ny)) + 360) % 360
        print("#%d %s area=%.1f tilt=%.1f az=%.1f holes=%d" % (i, s["kind"], p["area_m2"], tilt, az, len(p["interiors"])))
        for q in p["exterior"][:-1]:
            x, y, u, v = loc(q)
            print("    [%.7f, %.7f] E=%7.2f N=%7.2f | u(axis)=%7.2f v=%7.2f | z=%.2f" % (q[0], q[1], x, y, u, v, q[2]))
        for h in p["interiors"]:
            print("   hole:")
            for q in h[:-1]:
                x, y, u, v = loc(q)
                print("    [%.7f, %.7f] E=%7.2f N=%7.2f | u(axis)=%7.2f v=%7.2f | z=%.2f" % (q[0], q[1], x, y, u, v, q[2]))
        i += 1
