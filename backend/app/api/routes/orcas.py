from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.entities import OrcaProfile, Sighting, User, UserFriendOrca
from app.schemas.orca import FriendOrcaJourneyOut, JourneyPoint, OrcaProfileOut, SetFriendOrcaIn

router = APIRouter(prefix="/api", tags=["orcas"])
KNOWN_TAGS = {
    "Bigg's Killer Whales",
    "J Pod",
    "K Pod",
    "L Pod",
    "Northern Resident Killer Whales",
    "Southern Resident Killer Whales",
}
POD_TO_REQUIRED_TAG = {
    "J Pod": "J Pod",
    "K Pod": "K Pod",
    "L Pod": "L Pod",
    "Bigg's Killer Whales": "Bigg's Killer Whales",
}


def _row_tags(row: Sighting) -> set[str]:
    tags: set[str] = set()
    payload = row.raw_payload or {}
    normalized = payload.get("normalized_tags") or []
    for tag in normalized:
        if isinstance(tag, str) and tag in KNOWN_TAGS:
            tags.add(tag)

    # Backward compatibility: rows ingested before normalized_tags.
    raw_tags = payload.get("tags") or []
    for tag in raw_tags:
        if isinstance(tag, str):
            cleaned = tag.strip()
            if cleaned in KNOWN_TAGS:
                tags.add(cleaned)

    if row.pod_or_individual:
        for part in row.pod_or_individual.split(","):
            cleaned = part.strip()
            if cleaned in KNOWN_TAGS:
                tags.add(cleaned)
    return tags


@router.get("/orcas", response_model=list[OrcaProfileOut])
def list_orcas(db: Session = Depends(get_db)) -> list[OrcaProfileOut]:
    rows = db.scalars(select(OrcaProfile).order_by(OrcaProfile.display_name)).all()
    return [OrcaProfileOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("/me/friend-orca")
def set_friend_orca(payload: SetFriendOrcaIn, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.name == payload.user_name))
    if not user:
        user = User(name=payload.user_name)
        db.add(user)
        db.flush()

    orca = db.get(OrcaProfile, payload.orca_profile_id)
    if not orca:
        raise HTTPException(status_code=404, detail="Orca profile not found")

    rel = db.scalar(select(UserFriendOrca).where(UserFriendOrca.user_id == user.id))
    if not rel:
        rel = UserFriendOrca(user_id=user.id, orca_profile_id=orca.id)
        db.add(rel)
    else:
        rel.orca_profile_id = orca.id

    db.commit()
    return {"status": "ok", "friend_orca_id": orca.id}


@router.get("/me/friend-orca/journey", response_model=FriendOrcaJourneyOut)
def get_journey(
    user_name: str = Query(default="demo"),
    from_date: datetime | None = Query(default=None, alias="from"),
    to_date: datetime | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
) -> FriendOrcaJourneyOut:
    user = db.scalar(select(User).where(User.name == user_name))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    rel = db.scalar(select(UserFriendOrca).where(UserFriendOrca.user_id == user.id))
    if not rel:
        raise HTTPException(status_code=404, detail="Friend orca not set")

    orca = db.get(OrcaProfile, rel.orca_profile_id)
    if not orca:
        raise HTTPException(status_code=404, detail="Friend orca profile missing")

    q = select(Sighting)
    if from_date:
        q = q.where(Sighting.observed_at >= from_date)
    if to_date:
        q = q.where(Sighting.observed_at <= to_date)

    required_tag = POD_TO_REQUIRED_TAG.get(orca.pod or "")
    points = []
    for row in db.scalars(q.order_by(Sighting.observed_at.asc())).all():
        if not required_tag:
            points.append(row)
            continue
        tags = _row_tags(row)
        if required_tag in tags:
            points.append(row)

    return FriendOrcaJourneyOut(
        orca=OrcaProfileOut.model_validate(orca, from_attributes=True),
        points=[
            JourneyPoint(
                observed_at=p.observed_at,
                lat=p.lat,
                lng=p.lng,
                region=p.region,
                confidence=p.confidence,
                notes=p.notes,
            )
            for p in points
        ],
    )
