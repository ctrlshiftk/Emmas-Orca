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

## Friend orca choice

The app stores **one** chosen `orca_profile_id` in the `friend_choice` table (singleton row `id = 1`). The welcome screen appears when no choice is set yet.

## Render free tier: avoid idle spin-down (~15 min)

Render sleeps the web service after inactivity; the first request after that is slow. Options:

1. **GitHub Actions (this repo)** — workflow [`.github/workflows/render-keepalive.yml`](.github/workflows/render-keepalive.yml) runs every **10 minutes** and `GET`s your health URL. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `RENDER_BACKEND_KEEPALIVE_URL`
   - Value: `https://<your-service>.onrender.com/health`  
   If the secret is missing, the workflow exits successfully and does nothing (safe for forks).

2. **External cron** — [cron-job.org](https://cron-job.org), UptimeRobot, etc., hitting `/health` on the same interval (no repo changes).

Upgrading to a paid Render instance removes spin-down if you prefer not to rely on pings.

## Cloud deployment shape

- Deploy backend container to a service like Render, Fly.io, or Railway.
- Use managed Postgres with PostGIS enabled.
- Deploy frontend as static assets (Vercel/Netlify) with `VITE_API_BASE` set to backend URL.
- Keep ingestion enabled on exactly one backend instance to avoid duplicate scheduled jobs.
