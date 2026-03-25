"""Lightweight additive schema fixes for existing DBs (create_all does not alter columns)."""

from sqlalchemy import text
from sqlalchemy.engine import Engine


def ensure_friend_choice_nickname_column(engine: Engine) -> None:
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE friend_choice ADD COLUMN IF NOT EXISTS "
                    "friend_nickname VARCHAR(128)"
                )
            )
        return

    if engine.dialect.name == "sqlite":
        with engine.begin() as conn:
            rows = conn.execute(text("PRAGMA table_info(friend_choice)")).fetchall()
            col_names = {r[1] for r in rows}
            if "friend_nickname" not in col_names:
                conn.execute(
                    text("ALTER TABLE friend_choice ADD COLUMN friend_nickname VARCHAR(128)")
                )
        return


def ensure_orca_profile_matriline_column(engine: Engine) -> None:
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE orca_profiles ADD COLUMN IF NOT EXISTS "
                    "matriline VARCHAR(64)"
                )
            )
        return

    if engine.dialect.name == "sqlite":
        with engine.begin() as conn:
            rows = conn.execute(text("PRAGMA table_info(orca_profiles)")).fetchall()
            col_names = {r[1] for r in rows}
            if "matriline" not in col_names:
                conn.execute(
                    text("ALTER TABLE orca_profiles ADD COLUMN matriline VARCHAR(64)")
                )
        return
