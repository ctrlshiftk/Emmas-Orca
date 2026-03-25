from datetime import datetime

from pydantic import BaseModel


class OrcaProfileOut(BaseModel):
    id: int
    display_name: str
    pod: str | None = None
    description: str | None = None


class SetFriendOrcaChoiceIn(BaseModel):
    orca_profile_id: int


class JourneyPoint(BaseModel):
    observed_at: datetime
    lat: float
    lng: float
    region: str | None = None
    confidence: float
    notes: str | None = None


class FriendOrcaJourneyOut(BaseModel):
    orca: OrcaProfileOut
    points: list[JourneyPoint]
