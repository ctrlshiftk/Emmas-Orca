from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ingest.adapters.atlist_adapter import AtlistMarkersAdapter
from app.ingest.adapters.orca_network_adapter import OrcaNetworkAdapter
from app.core.config import settings
from app.models.entities import Sighting


def _is_duplicate(db: Session, source: str, source_record_id: str) -> bool:
    return (
        db.scalar(
            select(Sighting).where(
                Sighting.source == source,
                Sighting.source_record_id == source_record_id,
            )
        )
        is not None
    )


def run_ingestion(db: Session) -> int:
    rows: list = []
    if settings.atlist_markers_url.strip():
        rows.extend(AtlistMarkersAdapter().fetch())
    if settings.ingest_orca_network_html:
        rows.extend(OrcaNetworkAdapter().fetch())

    inserted = 0

    for row in rows:
        if _is_duplicate(db, row.source, row.source_record_id):
            continue
        db.add(
            Sighting(
                source=row.source,
                source_record_id=row.source_record_id,
                observed_at=row.observed_at,
                lat=row.lat,
                lng=row.lng,
                region=row.region,
                pod_or_individual=row.pod_or_individual,
                confidence=row.confidence,
                notes=row.notes,
                raw_payload=row.raw_payload,
            )
        )
        inserted += 1

    db.commit()
    return inserted
