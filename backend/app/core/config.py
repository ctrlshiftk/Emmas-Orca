from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+pysqlite:///./emmas_orca.db"
    ingestion_enabled: bool = False
    ingestion_interval_minutes: int = 1440
    atlist_markers_url: str = (
        # "https://api.atlist.com/v1/map/6d677a80-8764-481c-9228-abcb73cc56eb/markers"
        "https://api.atlist.com/v1/map/4fdb0211-7443-48fb-9334-2c401932b4ba/markers"
    )
    # Optional fallback: regex-scrape HTML (often low yield); off by default
    ingest_orca_network_html: bool = False
    sightings_source_url: str = "https://www.orcanetwork.org/sightings/"
    # Comma-separated; browser blocks fetch from Vite unless origin is listed here
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
