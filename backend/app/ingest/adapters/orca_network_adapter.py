from datetime import datetime, timezone
import hashlib
import re
from dateutil import parser as dt_parser
import requests

from app.core.config import settings
from app.ingest.adapters.base import NormalizedSighting, SightingAdapter


COORD_PATTERN = re.compile(r"(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)")
POD_PATTERN = re.compile(r"\b([JKLTMN])\s*pod\b", re.IGNORECASE)
TAG_PATTERN = re.compile(r"<[^>]+>")


class OrcaNetworkAdapter(SightingAdapter):
    source_name = "orca_network"

    @staticmethod
    def _normalize_line(raw_line: str) -> str:
        # Source pages are usually HTML; keep parsing resilient with plain-text extraction.
        return TAG_PATTERN.sub(" ", raw_line).strip()

    def fetch(self) -> list[NormalizedSighting]:
        response = requests.get(settings.sightings_source_url, timeout=20)
        response.raise_for_status()
        text = response.text

        sightings: list[NormalizedSighting] = []
        for idx, raw_line in enumerate(text.splitlines()):
            line = self._normalize_line(raw_line)
            if not line:
                continue
            match = COORD_PATTERN.search(line)
            if not match:
                continue

            lat = float(match.group(1))
            lng = float(match.group(2))
            when = datetime.now(timezone.utc).replace(tzinfo=None)
            date_match = re.search(r"(\w+\s+\d{1,2},\s+\d{4})", line)
            if date_match:
                try:
                    when = dt_parser.parse(date_match.group(1)).replace(tzinfo=None)
                except (ValueError, TypeError):
                    pass

            pod = None
            pod_match = POD_PATTERN.search(line)
            if pod_match:
                pod = f"{pod_match.group(1).upper()} Pod"

            stable_hash = hashlib.sha1(line.encode("utf-8")).hexdigest()[:12]
            sightings.append(
                NormalizedSighting(
                    source=self.source_name,
                    source_record_id=f"line-{idx}-{stable_hash}",
                    observed_at=when,
                    lat=lat,
                    lng=lng,
                    region=None,
                    pod_or_individual=pod,
                    confidence=0.6 if pod else 0.45,
                    notes=line.strip()[:400],
                    raw_payload={"line": line.strip(), "index": idx},
                )
            )
        return sightings
