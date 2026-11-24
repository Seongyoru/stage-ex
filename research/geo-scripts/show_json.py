# Pretty print part of JSON. Usage: show_json.py file key [maxchars]
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
with open(sys.argv[1], encoding="utf-8") as f:
    d = json.load(f)
for k in sys.argv[2].split("."):
    if k == "":
        continue
    d = d[int(k)] if isinstance(d, list) else d[k]
mx = int(sys.argv[3]) if len(sys.argv) > 3 else 6000
print(json.dumps(d, ensure_ascii=False, indent=1)[:mx])
