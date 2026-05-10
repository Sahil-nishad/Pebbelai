from fastapi import FastAPI, Header
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


# Unauthed check - no auth required
@app.get("/debug/env")
def debug_env() -> JSONResponse:
    """Check env vars - no auth."""
    s = get_settings()
    return JSONResponse({
        "env_vars": {
            "gmail_client_id_set": bool(s.gmail_client_id),
            "gmail_redirect_uri": s.gmail_redirect_uri,
            "internal_api_key_set": bool(s.careers_internal_api_key),
            "internal_api_key_value": s.careers_internal_api_key,
            "environment": s.environment,
        },
        "from_os": {
            "GMAIL_CLIENT_ID": os.environ.get("GMAIL_CLIENT_ID", "NOT_SET"),
            "CAREERS_INTERNAL_API_KEY": os.environ.get("CAREERS_INTERNAL_API_KEY", "NOT_SET"),
        }
    })


app.include_router(careers_router, prefix="/api/careers", tags=["careers"])
