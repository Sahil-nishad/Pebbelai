from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "PebelAI Careers API"
    environment: Literal["development", "staging", "production"] = "development"
    database_url: str = Field(default="sqlite:///./storage/careers.db")
    redis_url: str = Field(default="redis://localhost:6379/0")
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    careers_internal_api_key: str = "change-me"
    upload_dir: Path = Field(default=Path("storage/resumes"))
    max_upload_size_mb: int = 8
    recruiter_search_per_run: int = 12
    recruiter_search_delay_ms: int = 1800
    gmail_client_id: str | None = None
    gmail_client_secret: str | None = None
    gmail_redirect_uri: str | None = None
    gmail_refresh_token: str | None = None
    gmail_sender_email: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_pass: str | None = None
    smtp_from_email: str | None = None
    encryption_secret: str = "development-secret"
    allowed_resume_extensions: tuple[str, ...] = (".pdf", ".docx")
    frontend_app_url: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.parent.mkdir(parents=True, exist_ok=True)
    return settings
