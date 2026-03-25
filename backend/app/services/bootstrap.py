from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import FriendChoice, OrcaProfile


SEED_ORCAS = [
    ("Tahlequah (J35)", "J Pod", "Southern Resident known individual."),
    ("Luna", "L Pod", "Community-favorite orca profile for demo."),
    ("Kiki", "K Pod", "Demo profile when IDs are uncertain."),
    ("Bigg Scout", "Bigg's Killer Whales", "Profile inferred from Bigg's-tagged encounters."),
]


def ensure_seed_data(db: Session) -> None:
    if db.get(FriendChoice, 1) is None:
        db.add(FriendChoice(id=1, orca_profile_id=None))

    existing = set(db.scalars(select(OrcaProfile.display_name)).all())
    for name, pod, desc in SEED_ORCAS:
        if name not in existing:
            db.add(OrcaProfile(display_name=name, pod=pod, description=desc))
    db.commit()
