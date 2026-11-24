# Extract one cityObjectMember block by gml:id from a PLATEAU CityGML file (plain text scan, no XML parser).
# Usage: gml_extract.py in.gml gml_id out.xml
import re, sys
sys.stdout.reconfigure(encoding="utf-8")
src, gid, out = sys.argv[1], sys.argv[2], sys.argv[3]
with open(src, encoding="utf-8") as f:
    txt = f.read()
print("chars", len(txt))
members = [m.start() for m in re.finditer(r"<core:cityObjectMember>", txt)]
print("cityObjectMembers", len(members))
pos = txt.find('gml:id="%s"' % gid)
print("pos", pos)
start = txt.rfind("<core:cityObjectMember>", 0, pos)
end = txt.find("</core:cityObjectMember>", pos) + len("</core:cityObjectMember>")
blk = txt[start:end]
with open(out, "w", encoding="utf-8") as f:
    f.write(blk)
print("block chars", len(blk))
from collections import Counter
tags = Counter(re.findall(r"<([A-Za-z]+:[A-Za-z0-9_]+)[ >/]", blk))
for k, v in sorted(tags.items(), key=lambda kv: -kv[1]):
    print("  ", k, v)
