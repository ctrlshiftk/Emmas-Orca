"""Ingest encounter markers from Atlist JSON API (annotated map)."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from html import unescape

import requests
from dateutil.parser import isoparse
from dateutil import parser as dt_parser

from app.core.config import settings
from app.ingest.adapters.base import NormalizedSighting, SightingAdapter

TAG_STRIP = re.compile(r"<[^>]+>")
LOCATION_DESCR = re.compile(r"LocationDescr:\s*</strong>\s*([^<]+)", re.IGNORECASE)
PODS_HTML = re.compile(r"Pods:\s*</strong>\s*([^<]+)", re.IGNORECASE)
NAME_DATE = re.compile(r"^\s*Encounter\s*#\s*\d+\s*-\s*(.+)$", re.IGNORECASE)
KNOWN_TAGS = (
    "Bigg's Killer Whales",
    "J Pod",
    "K Pod",
    "L Pod",
    "Northern Resident Killer Whales",
    "Southern Resident Killer Whales",
)


class AtlistMarkersAdapter(SightingAdapter):
    source_name = "atlist_markers"

    def fetch(self) -> list[NormalizedSighting]:
        url = settings.atlist_markers_url.strip()
        if not url:
            return []

        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        markers = data.get("markers") or []
        out: list[NormalizedSighting] = []

        for m in markers:
            if not m.get("useCoordinates"):
                continue
            lat = m.get("lat")
            lng = m.get("long")
            if lat is None or lng is None:
                continue
            mid = m.get("id")
            if not mid:
                continue

            observed_at, time_conf = self._observed_at(m)
            normalized_tags = self._normalized_tags(m)
            pod_or_individual = ", ".join(normalized_tags) if normalized_tags else None
            region = self._region(m.get("notes") or "")
            notes_text = self._plain_notes(m)

            conf = 0.88 * time_conf
            if pod_or_individual:
                conf = min(0.95, conf + 0.05)

            out.append(
                NormalizedSighting(
                    source=self.source_name,
                    source_record_id=str(mid),
                    observed_at=observed_at,
                    lat=float(lat),
                    lng=float(lng),
                    region=region,
                    pod_or_individual=pod_or_individual,
                    confidence=round(conf, 3),
                    notes=notes_text[:2000] if notes_text else m.get("name"),
                    raw_payload={
                        **(m if isinstance(m, dict) else {}),
                        "normalized_tags": normalized_tags,
                    },
                )
            )
        return out

    def _observed_at(self, marker: dict) -> tuple[datetime, float]:
        """Returns (naive datetime, multiplier for time confidence)."""
        for key in ("createdAt", "updatedAt"):
            raw = marker.get(key)
            if raw:
                try:
                    dt = isoparse(str(raw))
                    if dt.tzinfo is not None:
                        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                    return dt, 1.0
                except (ValueError, TypeError):
                    pass

        name = marker.get("name") or ""
        m = NAME_DATE.match(name.strip())
        if m:
            try:
                dt = dt_parser.parse(m.group(1).strip(), fuzzy=False)
                return dt.replace(tzinfo=None) if dt.tzinfo is None else dt.astimezone(timezone.utc).replace(tzinfo=None), 0.9
            except (ValueError, TypeError):
                pass

        if " - " in name:
            tail = name.split(" - ", 1)[1].strip()
            try:
                dt = dt_parser.parse(tail, fuzzy=True)
                naive = dt.replace(tzinfo=None) if dt.tzinfo is None else dt.astimezone(timezone.utc).replace(tzinfo=None)
                return naive, 0.82
            except (ValueError, TypeError):
                pass

        return datetime.now(timezone.utc).replace(tzinfo=None), 0.35

    def _normalized_tags(self, marker: dict) -> list[str]:
        tags = marker.get("tags") or []
        parts: list[str] = []
        seen: set[str] = set()

        for t in tags:
            if not isinstance(t, str):
                continue
            s = t.strip()
            if re.match(r"^[JKL]\s*Pod$", s, re.IGNORECASE):
                label = f"{s[0].upper()} Pod"
            elif "Bigg" in s:
                label = "Bigg's Killer Whales"
            elif "Northern Resident" in s:
                label = "Northern Resident Killer Whales"
            elif "Southern Resident" in s and "Killer" in s:
                label = "Southern Resident Killer Whales"
            else:
                continue
            if label not in seen:
                seen.add(label)
                parts.append(label)

        if parts:
            return [t for t in KNOWN_TAGS if t in parts]

        notes = marker.get("notes") or ""
        m = PODS_HTML.search(notes)
        if m:
            pod_text = unescape(TAG_STRIP.sub(" ", m.group(1))).strip().lower()
            inferred: list[str] = []
            if "bigg" in pod_text:
                inferred.append("Bigg's Killer Whales")
            if re.search(r"\bj\b", pod_text):
                inferred.append("J Pod")
            if re.search(r"\bk\b", pod_text):
                inferred.append("K Pod")
            if re.search(r"\bl\b", pod_text):
                inferred.append("L Pod")
            if "northern resident" in pod_text:
                inferred.append("Northern Resident Killer Whales")
            if "southern resident" in pod_text:
                inferred.append("Southern Resident Killer Whales")
            return [t for t in KNOWN_TAGS if t in inferred]
        return []

    def _region(self, html_notes: str) -> str | None:
        m = LOCATION_DESCR.search(html_notes)
        if m:
            return unescape(TAG_STRIP.sub(" ", m.group(1))).strip()[:300] or None
        return None

    def _plain_notes(self, marker: dict) -> str:
        name = marker.get("name") or ""
        notes_html = marker.get("notes") or ""
        plain = TAG_STRIP.sub(" ", notes_html)
        plain = unescape(re.sub(r"\s+", " ", plain)).strip()
        if name and plain:
            return f"{name}\n{plain}"
        return name or plain
