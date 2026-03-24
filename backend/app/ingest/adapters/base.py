from dataclasses import dataclass
from datetime import datetime


@dataclass
class NormalizedSighting:
    source: str
    source_record_id: str
    observed_at: datetime
    lat: float
    lng: float
    region: str | None
    pod_or_individual: str | None
    confidence: float
    notes: str | None
    raw_payload: dict


class SightingAdapter:
    source_name: str = "unknown"

    def fetch(self) -> list[NormalizedSighting]:
        raise NotImplementedError
