from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import OrcaProfile, User


SEED_ORCAS = [
    ("Tahlequah (J35)", "J Pod", "Southern Resident known individual."),
    ("Luna", "L Pod", "Community-favorite orca profile for demo."),
    ("Kiki", "K Pod", "Demo profile when IDs are uncertain."),
    ("Bigg Scout", "Bigg's Killer Whales", "Profile inferred from Bigg's-tagged encounters."),
]


def ensure_seed_data(db: Session) -> None:
    if not db.scalar(select(User).where(User.name == "demo")):
        db.add(User(name="demo"))

    existing = set(db.scalars(select(OrcaProfile.display_name)).all())
    for name, pod, desc in SEED_ORCAS:
        if name not in existing:
            db.add(OrcaProfile(display_name=name, pod=pod, description=desc))
    db.commit()
