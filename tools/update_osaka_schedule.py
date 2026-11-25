"""Refresh Osaka-jo Hall arena performances from the operator's public monthly calendar."""

import json
import re
from datetime import date, datetime, timedelta, timezone
from html import unescape
from pathlib import Path
from urllib.request import urlopen

SOURCE = "https://www.osaka-johall.com/event/"
OUTPUT = Path(__file__).resolve().parents[1] / "src/data/osaka-schedule.json"


def month_events(year, month):
    url = f"{SOURCE}?ym={year}{month:02}&genre=1"
    with urlopen(url, timeout=25) as response:
        html = response.read().decode("utf-8")
    heading = f"{year}年{month}月"
    if heading not in html or 'class="box-center event-box' not in html:
        raise ValueError(f"Unexpected monthly calendar for {year}-{month:02}")
    rows = re.split(r'<li class="event-detail ([^"]+)">', html)
    for kind, row in zip(rows[1::2], rows[2::2]):
        if "place-arena" not in kind.split():
            continue
        days = re.search(r'<span class="date-num">(.+?)</span>', row, re.S)
        name = re.search(r'<dt class="event-ttl">(.*?)</dt>', row, re.S)
        if not days or not name:
            raise ValueError("Incomplete event row")
        title = unescape(re.sub(r"<[^>]+>", "", name[1])).strip()
        times = re.findall(r'開演</span>\s*<span class="d-txt">([^<]*)', row)
        starts = [t for field in times for t in re.findall(r'\b\d{1,2}:\d{2}\b', field)]
        day_numbers = [int(n) for n in re.findall(r'\d+', re.sub(r'<[^>]+>', '', days[1]))]
        if len(day_numbers)==2 and re.search(r'[～〜~–-]',days[1]):
            day_numbers=range(day_numbers[0],day_numbers[1]+1)
        for day in day_numbers:
            yield dict(date=date(year,month,day).isoformat(), title=title, starts=starts, url=url+"#search")


def main():
    today=datetime.now(timezone(timedelta(hours=9))).date()
    events=[]
    for offset in range(3):
        y,m=divmod(today.year*12+today.month-1+offset,12)
        events.extend(e for e in month_events(y,m+1) if e["date"]>=today.isoformat())
    tmp=OUTPUT.with_suffix(".tmp")
    tmp.write_text(json.dumps(dict(checkedOn=today.isoformat(),events=events),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    tmp.replace(OUTPUT)
    print(f"Osaka: {len(events)} public arena performance dates")


if __name__=="__main__":
    main()
