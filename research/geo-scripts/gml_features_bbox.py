# List features in a PLATEAU CityGML file with lon/lat/height bbox, name, height, distance from a reference point.
# Usage: gml_features_bbox.py file.gml lon lat maxdist_m
import re, sys, math
sys.stdout.reconfigure(encoding="utf-8")
txt = open(sys.argv[1], encoding="utf-8").read()
lon0, lat0, maxd = float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
MLAT, MLON = 110949.1, 90769.0
blocks = re.findall(r"<core:cityObjectMember>(.*?)</core:cityObjectMember>", txt, re.S)
print("members", len(blocks))
rows = []
for b in blocks:
    m = re.search(r"<([a-z]+:[A-Za-z]+) gml:id=\"([^\"]+)\"", b)
    ftype, gid = m.group(1), m.group(2)
    lat = []; lon = []; hh = []
    for pl in re.findall(r"<gml:posList>(.*?)</gml:posList>", b, re.S):
        v = pl.split()
        lat += [float(x) for x in v[0::3]]; lon += [float(x) for x in v[1::3]]; hh += [float(x) for x in v[2::3]]
    if not lat:
        continue
    cx = (min(lon)+max(lon))/2; cy = (min(lat)+max(lat))/2
    dx = max(min(lon)-lon0, 0, lon0-max(lon))*MLON; dy = max(min(lat)-lat0, 0, lat0-max(lat))*MLAT
    dist = math.hypot(dx, dy)
    if dist > maxd:
        continue
    def g(tag):
        mm = re.search(r"<%s[^>]*>([^<]*)<" % tag, b)
        return mm.group(1).strip() if mm else None
    rows.append((dist, ftype, gid, g("gml:name"), g("bldg:measuredHeight"), g("core:creationDate"), g("uro:buildingID"), g("bldg:storeysAboveGround"), g("bldg:usage"), g("brid:function"), g("brid:yearOfConstruction"),
                 "lon[%.7f..%.7f] lat[%.7f..%.7f] z[%.2f..%.2f] size %.1fx%.1f m" % (min(lon), max(lon), min(lat), max(lat), min(hh), max(hh), (max(lon)-min(lon))*MLON, (max(lat)-min(lat))*MLAT)))
rows.sort()
for r in rows:
    print("%5.0fm | %s | %s | name=%s | h=%s | created=%s | bid=%s | storeys=%s | usage=%s | bridfn=%s yr=%s | %s" % r)
