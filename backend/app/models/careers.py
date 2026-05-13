"""
Career module SQLAlchemy models.
All tables use TEXT primary keys (UUID strings) so they work with both
SQLite (local dev) and Postgres (production).
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, Text, DateTime, Integer, Float, Boolean, JSON
from app.db import Base


def _now():
    return datetime.utcnow()


def _uuid():
    return str(uuid.uuid4())


class Resume(Base):
    __tablename__ = "career_resumes"

    id = Column(Text, primary_key=True, default=_uuid)
    user_id = Column(Text, nullable=False, index=True)
    original_name = Column(Text, nullable=False)
    filename = Column(Text, nullable=False)          # stored filename on disk
    file_size = Column(Integer, nullable=True)
    mime_type = Column(Text, nullable=True)
    label = Column(Text, nullable=True)              # e.g. "Software Engineer v2"
    is_primary = Column(Boolean, default=False)

    # AI-parsed fields
    parsed_skills = Column(JSON, default=list)
    parsed_experience = Column(JSON, default=list)
    parsed_education = Column(JSON, default=list)
    parsed_summary = Column(Text, default="")

    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class Recruiter(Base):
    __tablename__ = "career_recruiters"

    id = Column(Text, primary_key=True, default=_uuid)
    user_id = Column(Text, nullable=False, index=True)
    name = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    company = Column(Text, nullable=True)
    linkedin_url = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_contacted = Column(Boolean, default=False)
    last_contacted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class GmailConnection(Base):
    __tablename__ = "career_gmail_connections"

    id = Column(Text, primary_key=True, default=_uuid)
    user_id = Column(Text, nullable=False, unique=True, index=True)
    gmail_address = Column(Text, nullable=False)
    access_token = Column(Text, nullable=True)       # encrypted
    refresh_token = Column(Text, nullable=True)      # encrypted
    token_expiry = Column(DateTime, nullable=True)
    scopes = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class HiringSearch(Base):
    __tablename__ = "career_hiring_searches"

    id = Column(Text, primary_key=True, default=_uuid)
    user_id = Column(Text, nullable=False, index=True)
    query = Column(Text, nullable=False)             # e.g. "senior python engineer remote"
    location = Column(Text, nullable=True)
    results = Column(JSON, default=list)             # list of job dicts
    result_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=_now)
