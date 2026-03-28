import logging
from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


def get_db() -> Generator[Session, None, None]:
    try:
        db = SessionLocal()
    except OperationalError:
        logger.exception("Failed to open database session")
        raise HTTPException(
            status_code=503,
            detail="Database is temporarily unavailable. Please try again in a moment.",
        )
    try:
        yield db
    except OperationalError:
        logger.exception("Database connection lost during request")
        raise HTTPException(
            status_code=503,
            detail="Database connection was lost. Please try again in a moment.",
        )
    finally:
        db.close()
