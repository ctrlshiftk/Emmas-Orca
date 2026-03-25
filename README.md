# Emmas Orca MVP

A Python + React MVP for selecting a friend orca and viewing its journey over time on an interactive map.

## Quick start

```bash
docker compose up --build
```

- API: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Backend endpoints

- `GET /health`
- `GET /api/orcas`
- `POST /api/friend-orca` — body `{ "orca_profile_id": <id> }` (only while unset; **409** if already set)
- `GET /api/friend-orca/journey`

## Notes

- **Encounter locations** come from the **Atlist markers JSON** (`ATLIST_MARKERS_URL`), same source as [`../extractLocations.py`](../extractLocations.py): each marker has `lat`/`long`, `tags` (e.g. J Pod), and timestamps from `createdAt`/`updatedAt` or the encounter `name` date.
- Optional HTML scraping (`INGEST_ORCA_NETWORK_HTML`) is off by default; enable only if you still want the legacy regex path.
- Ingestion runs at startup and then on schedule.
- Confirm **terms of use** for any third-party map/API you configure.
- Data quality is source-dependent; confidence is shown per point.
