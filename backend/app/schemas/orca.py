from datetime import datetime

from pydantic import BaseModel, field_validator


class OrcaProfileOut(BaseModel):
    id: int
    display_name: str
    pod: str | None = None
    description: str | None = None


class SetFriendOrcaChoiceIn(BaseModel):
    orca_profile_id: int
    friend_nickname: str

    @field_validator("friend_nickname", mode="before")
    @classmethod
    def normalize_nickname(cls, v: object) -> str:
        if v is None:
            raise ValueError("friend_nickname is required")
        if not isinstance(v, str):
            raise ValueError("friend_nickname must be a string")
        s = v.strip()
        if not s:
            raise ValueError("friend_nickname must not be empty")
        return s

    @field_validator("friend_nickname")
    @classmethod
    def nickname_length(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError("friend_nickname must be at most 128 characters")
        return v


class JourneyPoint(BaseModel):
    observed_at: datetime
    lat: float
    lng: float
    region: str | None = None
    confidence: float
    notes: str | None = None


class FriendOrcaJourneyOut(BaseModel):
    orca: OrcaProfileOut
    friend_nickname: str | None = None
    points: list[JourneyPoint]
