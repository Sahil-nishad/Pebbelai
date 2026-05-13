"""
PebelAI Careers Backend — FastAPI entry point.
"""
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import Base, engine
from app.routes import resume_router, recruiters_router, hiring_router, gmail_router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="PebelAI Careers API",
    version="2.0.0",
    description="Resume parsing, recruiter search, hiring search, Gmail integration.",
)

# CORS — allow Vercel frontend
allowed_origins = [settings.frontend_app_url]
if settings.environment != "production":
    allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(resume_router)
app.include_router(recruiters_router)
app.include_router(hiring_router)
app.include_router(gmail_router)


@app.on_event("startup")
def initialize_database() -> None:
    """Create all tables on startup if they don't exist."""
    os.makedirs(os.path.join(os.getcwd(), settings.upload_dir), exist_ok=True)
    Base.metadata.create_all(bind=engine)
    log.info("✅ Database tables initialized")


@app.get("/health")
def healthcheck() -> dict:
    return {
        "status": "ok",
        "version": "2.0.0",
        "environment": settings.environment,
    }


@app.get("/")
def root():
    return {"message": "PebelAI Careers API is running. Visit /docs for the API explorer."}