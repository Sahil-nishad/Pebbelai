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


# Debug endpoint - NO AUTH to test env vars
@app.get("/debug/env")
def debug_env() -> JSONResponse:
    """Debug endpoint - no auth required."""
    s = get_settings()  # Fresh instance
    return JSONResponse({
        "gmail_client_id": s.gmail_client_id,
        "gmail_redirect_uri": s.gmail_redirect_uri,
        "careers_internal_api_key": s.careers_internal_api_key[:8] + "..." if s.careers_internal_api_key else None,
        "environment": s.environment,
    })


app.include_router(careers_router, prefix="/api/careers", tags=["careers"])
