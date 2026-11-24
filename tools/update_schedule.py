"""Refresh the public performance dates used by the static K-Arena site."""

import json
import re
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from subprocess import check_output
from urllib.parse import urljoin, urlsplit


SOURCE = "https://k-arena.com/schedule/"
OUTPUT = Path(__file__).resolve().parents[1] / "src" / "data" / "k-arena-schedule.json"


class ScheduleParser(HTMLParser):
    fields = {
        "schedule-list-item__date": "date",
        "schedule-list-item__title": "title",
        "schedule-list-item__artist": "artist",
        "schedule-list-item__open-start": "times",
    }

    def __init__(self):
        super().__init__()
        self.rows = []
        self.row = None
        self.field = self.field_tag = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()
        if tag == "li" and "schedule-list-item" in classes:
            self.row = {}
        if self.row is None:
            return
        if tag == "a" and "schedule-list-item__link" in classes:
            self.row["url"] = urljoin(SOURCE, attrs["href"])
        for cls in classes:
            if cls in self.fields:
                self.field = self.fields[cls]
                self.field_tag = tag
                self.row[self.field] = ""
        if self.field and tag in ("br", "p"):
            self.row[self.field] += " "

    def handle_data(self, data):
        if self.field:
            self.row[self.field] += data

    def handle_endtag(self, tag):
        if self.row is None:
            return
        if tag == self.field_tag:
            self.field = self.field_tag = None
        if tag == "li":
            self.rows.append(self.row)
            self.row = None


def fetch_month(year, month):
    url = f"{SOURCE}?y={year}&m={month}"
    html = check_output(["curl", "--fail", "--silent", "--show-error", "--location",
                         "--max-time", "30", "--retry", "2", url]).decode("utf-8")
    parser = ScheduleParser()
    parser.feed(html)
    if not parser.rows and not re.search(r'class="block__lead-4">\s*Coming Soon', html, re.I):
        raise ValueError(f"Unrecognized schedule at {url}")
    events = []
    for raw in parser.rows:
        row = {key: " ".join(value.split()) for key, value in raw.items()}
        day = datetime.strptime(row["date"][:10], "%Y.%m.%d").date()
        if (day.year, day.month) != (year, month) or not row["title"]:
            raise ValueError(f"Unexpected event at {url}")
        if row["title"] == "企業利用":
            continue
        link = row.get("url", url)
        dest = urlsplit(link)
        if dest.scheme != "https" or dest.hostname != "k-arena.com" or not dest.path.startswith("/schedule/"):
            link = url
        events.append(dict(date=day.isoformat(), title=row["title"], artist=row.get("artist", ""),
                           starts=re.findall(r"\bSTART\s*([0-2]?\d:[0-5]\d)", row.get("times", ""), re.I),
                           url=link))
    return events


def main():
    today = datetime.now(timezone(timedelta(hours=9))).date()
    events = []
    for offset in range(3):
        year, month0 = divmod(today.year * 12 + today.month - 1 + offset, 12)
        events.extend(fetch_month(year, month0 + 1))
    upcoming = sorted((e for e in events if date.fromisoformat(e["date"]) >= today),
                      key=lambda e: (e["date"], e["starts"]))
    snapshot = dict(checkedOn=today.isoformat(), events=upcoming)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUTPUT.with_suffix(".tmp")
    tmp.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(OUTPUT)
    print(f"{today}: saved {len(upcoming)} public performance dates")


if __name__ == "__main__":
    main()
