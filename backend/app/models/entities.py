from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)


class OrcaProfile(Base):
    __tablename__ = "orca_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    pod: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class UserFriendOrca(Base):
    __tablename__ = "user_friend_orca"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_friend"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    orca_profile_id: Mapped[int] = mapped_column(ForeignKey("orca_profiles.id"), nullable=False)

    user: Mapped[User] = relationship()
    orca_profile: Mapped[OrcaProfile] = relationship()


class FriendChoice(Base):
    """Singleton row (id=1): which orca the app tracks for the single recipient."""

    __tablename__ = "friend_choice"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    orca_profile_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("orca_profiles.id"), nullable=True
    )

    orca_profile: Mapped[OrcaProfile | None] = relationship()


class Sighting(Base):
    __tablename__ = "sightings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    source_record_id: Mapped[str] = mapped_column(String(128), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    region: Mapped[str | None] = mapped_column(String(128), nullable=True)
    pod_or_individual: Mapped[str | None] = mapped_column(String(128), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False)

    __table_args__ = (
        UniqueConstraint("source", "source_record_id", name="uq_source_record"),
    )
