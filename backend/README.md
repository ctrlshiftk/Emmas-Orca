# Emmas Orca Backend

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run ingestion manually

```bash
python -c "from app.db.session import SessionLocal; from app.ingest.service import run_ingestion; db=SessionLocal(); print(run_ingestion(db)); db.close()"
```
