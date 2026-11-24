# Parse an extracted PLATEAU bldg:Building block: LOD0 footprint, LOD1 solid, LOD2 boundary surfaces -> JSON summary.
# Coordinates in the GML are "lat lon h" (EPSG:6697). Output [lon, lat, h].
# Usage: gml_building_parse.py block.xml out.json
import re, sys, json, math
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], encoding="utf-8") as f:
    blk = f.read()
LAT0, LON0 = 35.4647196, 139.6307285
MLAT = 110940.6
MLON = 111320.0 * math.cos(math.radians(LAT0)) * (1 - 0.0011)  # refined below with proper formula
# proper metres-per-degree on GRS80 at LAT0
a = 6378137.0; f_ = 1/298.257222101; e2 = f_*(2-f_)
phi = math.radians(LAT0)
M = a*(1-e2)/(1-e2*math.sin(phi)**2)**1.5
N = a/math.sqrt(1-e2*math.sin(phi)**2)
MLAT = M*math.pi/180; MLON = N*math.cos(phi)*math.pi/180
def ring(poslist):
    v = [float(x) for x in poslist.split()]
    return [[v[i+1], v[i], v[i+2]] for i in range(0, len(v), 3)]
def xy(p):
    return ((p[0]-LON0)*MLON, (p[1]-LAT0)*MLAT)
def area2d(r):
    s = 0
    for i in range(len(r)-1):
        x1, y1 = xy(r[i]); x2, y2 = xy(r[i+1])
        s += x1*y2 - x2*y1
    return s/2
def poly_normal_area(r):
    # Newell normal in local metres
    nx = ny = nz = 0.0
    for i in range(len(r)-1):
        x1, y1 = xy(r[i]); z1 = r[i][2]
        x2, y2 = xy(r[i+1]); z2 = r[i+1][2]
        nx += (y1-y2)*(z1+z2); ny += (z1-z2)*(x1+x2); nz += (x1-x2)*(y1+y2)
    A = math.sqrt(nx*nx+ny*ny+nz*nz)/2
    return (nx, ny, nz), A
out = {"metres_per_degree": {"lat": MLAT, "lon": MLON}, "local_origin": [LON0, LAT0]}
m = re.search(r"<bldg:measuredHeight[^>]*>([^<]+)<", blk); out["measuredHeight"] = float(m.group(1)) if m else None
for tag in ("core:creationDate", "uro:buildingID", "uro:surveyYear", "uro:lodType", "uro:lod1HeightType", "bldg:usage", "bldg:storeysAboveGround", "bldg:storeysBelowGround", "bldg:class", "gml:name"):
    m = re.search(r"<%s[^>]*>([^<]*)<" % tag, blk); out[tag] = m.group(1) if m else None
# LOD0
m = re.search(r"<bldg:lod0FootPrint>(.*?)</bldg:lod0FootPrint>", blk, re.S)
if not m:
    m = re.search(r"<bldg:lod0RoofEdge>(.*?)</bldg:lod0RoofEdge>", blk, re.S)
lod0 = m.group(1)
ext = re.search(r"<gml:exterior>.*?<gml:posList>(.*?)</gml:posList>", lod0, re.S).group(1)
out["lod0_exterior"] = ring(ext)
out["lod0_interiors"] = [ring(x) for x in re.findall(r"<gml:interior>.*?<gml:posList>(.*?)</gml:posList>", lod0, re.S)]
out["lod0_area_m2"] = abs(area2d(out["lod0_exterior"]))
# LOD1 solid
m = re.search(r"<bldg:lod1Solid>(.*?)</bldg:lod1Solid>", blk, re.S)
if m:
    rings = [ring(x) for x in re.findall(r"<gml:posList>(.*?)</gml:posList>", m.group(1), re.S)]
    zs = [p[2] for r in rings for p in r]
    out["lod1"] = {"faces": len(rings), "zmin": min(zs), "zmax": max(zs)}
# LOD2 boundary surfaces
surfs = []
for kind in ("RoofSurface", "WallSurface", "GroundSurface", "OuterFloorSurface", "OuterCeilingSurface", "ClosureSurface"):
    for sm in re.finditer(r"<bldg:%s gml:id=\"([^\"]+)\">(.*?)</bldg:%s>" % (kind, kind), blk, re.S):
        polys = []
        for pm in re.finditer(r"<gml:Polygon[^>]*>(.*?)</gml:Polygon>", sm.group(2), re.S):
            e = ring(re.search(r"<gml:exterior>.*?<gml:posList>(.*?)</gml:posList>", pm.group(1), re.S).group(1))
            ins = [ring(x) for x in re.findall(r"<gml:interior>.*?<gml:posList>(.*?)</gml:posList>", pm.group(1), re.S)]
            (nx, ny, nz), A = poly_normal_area(e)
            zs = [p[2] for p in e]
            polys.append({"exterior": e, "interiors": ins, "area_m2": A, "normal": [nx, ny, nz], "zmin": min(zs), "zmax": max(zs), "n": len(e)-1})
        surfs.append({"kind": kind, "id": sm.group(1), "polygons": polys})
out["lod2_surfaces"] = surfs
with open(sys.argv[2], "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
print({k: out[k] for k in out if k not in ("lod0_exterior", "lod0_interiors", "lod2_surfaces")})
print("LOD0 exterior vertices:", len(out["lod0_exterior"])-1, "interiors:", len(out["lod0_interiors"]), "area m2: %.1f" % out["lod0_area_m2"])
for s in surfs:
    for p in s["polygons"]:
        nx, ny, nz = p["normal"]; L = math.sqrt(nx*nx+ny*ny+nz*nz) or 1
        tilt = math.degrees(math.acos(abs(nz)/L))
        az = (math.degrees(math.atan2(nx, ny)) + 360) % 360
        cx = sum(xy(q)[0] for q in p["exterior"][:-1])/p["n"]; cy = sum(xy(q)[1] for q in p["exterior"][:-1])/p["n"]
        print("%-14s n=%-3d area=%8.1f z=[%.2f..%.2f] tilt=%5.1f az=%5.1f centroid_local=(%.1f,%.1f) holes=%d" % (s["kind"], p["n"], p["area_m2"], p["zmin"], p["zmax"], tilt, az, cx, cy, len(p["interiors"])))
