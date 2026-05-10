from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

from app.config import get_settings
from app.db import Base, engine
from app.models import careers  # noqa: F401
from app.routes.careers import router as careers_router

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_app_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/debug/settings")
def debug_settings() -> JSONResponse:
    """Debug endpoint to check environment variables."""
    env_vars = [
        "ENVIRONMENT",
        "GMAIL_CLIENT_ID",
        "GMAIL_CLIENT_SECRET",
        "GMAIL_REDIRECT_URI",
        "DATABASE_URL",
    ]
    return JSONResponse({
        "env_from_os": {k: os.environ.get(k, "NOT_SET") for k in env_vars},
        "settings_attrs": {
            "gmail_redirect_uri": str(settings.gmail_redirect_uri) if settings.gmail_redirect_uri else None,
            "gmail_client_id": str(settings.gmail_client_id) if settings.gmail_client_id else None,
            "environment": settings.environment,
        },
    })


app.include_router(careers_router, prefix="/api/careers", tags=["careers"])
