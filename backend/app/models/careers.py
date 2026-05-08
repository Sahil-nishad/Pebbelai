import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    file_url: Mapped[str] = mapped_column(String(500))
    parsed_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    extracted_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    extracted_projects: Mapped[list[str]] = mapped_column(JSON, default=list)
    extracted_education: Mapped[list[str]] = mapped_column(JSON, default=list)
    extracted_experience: Mapped[list[dict]] = mapped_column(JSON, default=list)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    applications: Mapped[list["Application"]] = relationship(back_populates="resume")


class Recruiter(Base):
    __tablename__ = "recruiters"
    __table_args__ = (UniqueConstraint("email", name="uq_recruiters_email"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recruiter_name: Mapped[str] = mapped_column(String(200))
    company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(160), nullable=True)

    posts: Mapped[list["RecruiterPost"]] = relationship(back_populates="recruiter")
    applications: Mapped[list["Application"]] = relationship(back_populates="recruiter")


class RecruiterPost(Base):
    __tablename__ = "recruiter_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recruiter_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True)
    role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    post_content: Mapped[str] = mapped_column(Text)
    extracted_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    extracted_email_candidates: Mapped[list[str]] = mapped_column(JSON, default=list)
    source_url: Mapped[str] = mapped_column(String(1000))
    source_platform: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    recruiter: Mapped[Recruiter | None] = relationship(back_populates="posts")
    applications: Mapped[list["Application"]] = relationship(back_populates="recruiter_post")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    recruiter_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True)
    recruiter_post_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("recruiter_posts.id", ondelete="SET NULL"), nullable=True)
    resume_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    email_subject: Mapped[str] = mapped_column(String(255))
    email_body: Mapped[str] = mapped_column(Text)
    match_percentage: Mapped[int] = mapped_column(Integer, default=0)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    match_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_status: Mapped[str] = mapped_column(String(50), default="draft")
    reply_status: Mapped[str] = mapped_column(String(50), default="pending")
    gmail_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    recruiter: Mapped[Recruiter | None] = relationship(back_populates="applications")
    recruiter_post: Mapped[RecruiterPost | None] = relationship(back_populates="applications")
    resume: Mapped[Resume | None] = relationship(back_populates="applications")
    followups: Mapped[list["FollowUp"]] = relationship(back_populates="application")


class GmailConnection(Base):
    __tablename__ = "gmail_connections"
    __table_args__ = (UniqueConstraint("user_id", name="uq_gmail_connections_user"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    email: Mapped[str] = mapped_column(String(255))
    refresh_token: Mapped[str] = mapped_column(Text)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class FollowUp(Base):
    """Tracks follow-up emails sent after an application has no reply."""
    __tablename__ = "followups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"))
    subject: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    sent_status: Mapped[str] = mapped_column(String(50), default="pending")
    gmail_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    application: Mapped[Application] = relationship(back_populates="followups")
