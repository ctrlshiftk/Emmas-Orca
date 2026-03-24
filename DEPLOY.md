# Deploying Emmas Orca MVP

## Local production-like run

```bash
docker compose up --build -d
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Postgres/PostGIS: `localhost:5432`

## Ingestion schedule

The backend uses APScheduler:
- First ingestion run at API startup.
- Repeats every `INGESTION_INTERVAL_MINUTES` (default `1440` for daily sync).

Environment variables:
- `DATABASE_URL`
- `INGESTION_ENABLED`
- `INGESTION_INTERVAL_MINUTES`
- `ATLIST_MARKERS_URL` (primary encounter markers JSON)
- `INGEST_ORCA_NETWORK_HTML` (optional legacy HTML scrape; default false)
- `SIGHTINGS_SOURCE_URL` (only if HTML ingest enabled)
- `CORS_ORIGINS`

## Cloud deployment shape

- Deploy backend container to a service like Render, Fly.io, or Railway.
- Use managed Postgres with PostGIS enabled.
- Deploy frontend as static assets (Vercel/Netlify) with `VITE_API_BASE` set to backend URL.
- Keep ingestion enabled on exactly one backend instance to avoid duplicate scheduled jobs.
