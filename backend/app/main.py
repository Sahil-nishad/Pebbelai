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


# Debug endpoint - WITH auth to see what's failing
@app.get("/debug/auth-check")
def debug_auth(
    x_pebel_user_id: str | None = Header(default=None),
    x_pebel_user_email: str | None = Header(default=None),
    x_internal_service_key: str | None = Header(default=None),
) -> JSONResponse:
    """Debug endpoint to check auth headers."""
    s = get_settings()
    return JSONResponse({
        "received_headers": {
            "x_pebel_user_id": x_pebel_user_id,
            "x_pebel_user_email": x_pebel_user_email,
            "x_internal_service_key": x_internal_service_key,
        },
        "expected_key": s.careers_internal_api_key[:8] + "..." if s.careers_internal_api_key else None,
        "key_matches": x_internal_service_key == s.careers_internal_api_key if x_internal_service_key and s.careers_internal_api_key else False,
    })


app.include_router(careers_router, prefix="/api/careers", tags=["careers"])
