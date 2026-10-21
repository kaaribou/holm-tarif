"""Plages heures creuses : lecture, état à un instant donné, prochaine bascule."""
from __future__ import annotations

import re
from datetime import datetime, timedelta

_RANGE = re.compile(r"^\s*(\d{1,2})\s*[:hH]\s*(\d{2})?\s*-\s*(\d{1,2})\s*[:hH]\s*(\d{2})?\s*$")


def parse_ranges(text: str) -> list[tuple[int, int]]:
    """« 14:58-16:58, 23:28-05:28 » -> [(898, 1018), (1408, 328)] (minutes depuis minuit)."""
    out: list[tuple[int, int]] = []
    for part in re.split(r"[;,\n]+", str(text or "")):
        if not part.strip():
            continue
        m = _RANGE.match(part.replace("–", "-"))
        if not m:
            raise ValueError(part.strip())
        h1, m1, h2, m2 = int(m.group(1)), int(m.group(2) or 0), int(m.group(3)), int(m.group(4) or 0)
        if h1 > 24 or h2 > 24 or m1 > 59 or m2 > 59:
            raise ValueError(part.strip())
        a, b = (h1 * 60 + m1) % 1440, (h2 * 60 + m2) % 1440
        if a == b:
            raise ValueError(part.strip())
        out.append((a, b))
    if not out:
        raise ValueError("vide")
    return out


def format_ranges(ranges: list[tuple[int, int]]) -> str:
    f = lambda x: f"{x // 60:02d}:{x % 60:02d}"
    return ", ".join(f"{f(a)}-{f(b)}" for a, b in ranges)


def in_hc(minute: int, ranges: list[tuple[int, int]]) -> bool:
    for a, b in ranges:
        if (a < b and a <= minute < b) or (a > b and (minute >= a or minute < b)):
            return True
    return False


def is_hc(now: datetime, ranges: list[tuple[int, int]]) -> bool:
    return in_hc(now.hour * 60 + now.minute, ranges)


def next_change(now: datetime, ranges: list[tuple[int, int]]) -> tuple[datetime, bool]:
    """Prochaine bascule après `now` (heure locale, avec fuseau) : (instant, True si on passe en HC)."""
    current = is_hc(now, ranges)
    marks = sorted({m for r in ranges for m in r})
    day0 = now.replace(hour=0, minute=0, second=0, microsecond=0)
    for d in range(3):
        base = day0 + timedelta(days=d)
        for m in marks:
            # construit l'heure murale du jour (gère les changements d'heure)
            cand = (base + timedelta(minutes=m)).replace(hour=m // 60, minute=m % 60)
            if cand <= now:
                continue
            if in_hc(m, ranges) != current:
                return cand, not current
    return now + timedelta(days=1), current
