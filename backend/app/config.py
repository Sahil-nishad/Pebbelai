from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "PebelAI API"
    environment: Literal["development", "staging", "production"] = "development"
    database_url: str = Field(default="sqlite:///./storage/db.sqlite")
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    frontend_app_url: str = "http://localhost:3000"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value


def get_settings() -> Settings:
    return Settings()