import time

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.api.routes.orcas import router as orca_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.ingest.service import run_ingestion
from app.services.bootstrap import ensure_seed_data

app = FastAPI(title="Emmas Orca API", version="0.1.0")

_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orca_router)


def _wait_for_db(max_attempts: int = 30, delay_seconds: float = 1.0) -> None:
    """Retry until Postgres accepts connections (handles race after healthcheck)."""
    for attempt in range(max_attempts):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except OperationalError:
            if attempt == max_attempts - 1:
                raise
            time.sleep(delay_seconds)


@app.on_event("startup")
def startup() -> None:
    _wait_for_db()
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        ensure_seed_data(db)

    if settings.ingestion_enabled:
        scheduler = BackgroundScheduler()

        def ingest_job() -> None:
            with SessionLocal() as db:
                run_ingestion(db)

        ingest_job()
        scheduler.add_job(ingest_job, "interval", minutes=settings.ingestion_interval_minutes)
        scheduler.start()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
