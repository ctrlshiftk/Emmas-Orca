from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import FriendChoice, OrcaProfile


SEED_ORCAS = [
    ("Oreo (J22)", "J Pod", "Hat nen coolen Namen."),
    ("Coho (L108)", "L Pod", "Sein kleiner Bruder heisst Keta."),
    ("Nova (J51)", "J Pod", "Hat die jüngste Mutter überhaupt."),
    ("Kelp (K42)", "K Pod", "Sein Bruder ist verloren gegangen :("),
]


def ensure_seed_data(db: Session) -> None:
    if db.get(FriendChoice, 1) is None:
        db.add(FriendChoice(id=1, orca_profile_id=None))

    existing = set(db.scalars(select(OrcaProfile.display_name)).all())
    for name, pod, desc in SEED_ORCAS:
        if name not in existing:
            db.add(OrcaProfile(display_name=name, pod=pod, description=desc))
    db.commit()
