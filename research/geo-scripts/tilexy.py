# Print slippy tile x/y for lon lat at zoom(s). Usage: tilexy.py lon lat z [z...]
import sys, math
lon, lat = float(sys.argv[1]), float(sys.argv[2])
for z in sys.argv[3:]:
    z = int(z); n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    print(z, int(x), int(y), "frac", round(x - int(x), 3), round(y - int(y), 3))
