from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Resume(Base):
    __tablename__ = "career_resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    original_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(512))
    file_size: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(50))

    # Parsed data (stored as JSON)
    parsed_skills: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    parsed_experience: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    parsed_education: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    parsed_projects: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    parsed_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class GmailConnection(Base):
    __tablename__ = "career_gmail_connections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, unique=True)

    email: Mapped[str] = mapped_column(String(255))
    encrypted_refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    token_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Daily limits
    emails_sent_today: Mapped[int] = mapped_column(Integer, default=0)
    daily_limit: Mapped[int] = mapped_column(Integer, default=25)
    last_email_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Recruiter(Base):
    __tablename__ = "career_recruiters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)

    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Metadata
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class RecruiterPost(Base):
    __tablename__ = "career_recruiter_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    recruiter_id: Mapped[str] = mapped_column(String(36), index=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)

    # Post content
    title: Mapped[str] = mapped_column(String(255))
    company: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    post_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Extracted data
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    required_skills: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    experience_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    salary_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # ATS matching
    ats_match_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Status
    is_saved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Application(Base):
    __tablename__ = "career_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    recruiter_post_id: Mapped[str] = mapped_column(String(36), index=True)
    resume_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Email content
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, sent, replied, rejected, no_response

    # Tracking
    ats_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Follow-up
    follow_up_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    follow_up_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )