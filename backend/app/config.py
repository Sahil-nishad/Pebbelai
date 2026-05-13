from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "PebelAI Careers API"
    environment: str = "development"

    # Database — Supabase Postgres URL
    database_url: str = Field(default="sqlite:///./storage/db.sqlite")

    # OpenAI for resume parsing
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    # Security — must match CAREERS_INTERNAL_API_KEY on Vercel
    internal_api_key: str | None = None

    # CORS
    frontend_app_url: str = "http://localhost:3000"

    # Google OAuth for Gmail
    google_client_id: str | None = None
    google_client_secret: str | None = None

    # File uploads
    upload_dir: str = "storage/resumes"
    max_upload_size_mb: int = 8

    @property
    def pg_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://") and "+psycopg" not in url:
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()