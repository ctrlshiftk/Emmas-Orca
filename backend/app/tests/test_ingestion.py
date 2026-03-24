from datetime import datetime

from app.ingest.adapters.base import NormalizedSighting
from app.ingest.service import _is_duplicate
from app.models.entities import Sighting


def test_duplicate_check_by_source_record(session):
    session.add(
        Sighting(
            source="x",
            source_record_id="a",
            observed_at=datetime(2025, 1, 1),
            lat=1.0,
            lng=2.0,
            region=None,
            pod_or_individual=None,
            confidence=0.5,
            notes=None,
            raw_payload={},
        )
    )
    session.commit()

    assert _is_duplicate(session, "x", "a")


def test_duplicate_distinct_ids_not_duplicate(session):
    session.add(
        Sighting(
            source="x",
            source_record_id="b",
            observed_at=datetime(2025, 1, 1, 10, 0),
            lat=1.0,
            lng=2.0,
            region=None,
            pod_or_individual=None,
            confidence=0.5,
            notes=None,
            raw_payload={},
        )
    )
    session.commit()

    assert not _is_duplicate(session, "x", "c")
