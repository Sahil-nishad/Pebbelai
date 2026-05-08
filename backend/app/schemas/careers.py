from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class ResumeRead(BaseModel):
    id: str
    file_url: str
    parsed_name: str | None
    extracted_skills: list[str]
    extracted_projects: list[str]
    extracted_education: list[str]
    extracted_experience: list[dict[str, Any]]
    created_at: datetime


class MatchResult(BaseModel):
    score: int
    missing_skills: list[str]
    summary: str


class RecruiterFeedItem(BaseModel):
    recruiter_post_id: str
    recruiter_id: str | None = None
    recruiter_name: str
    company: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    location: str | None = None
    source_url: str
    source_platform: str | None = None
    post_content: str
    extracted_skills: list[str]
    match: MatchResult


class RecruiterSearchRequest(BaseModel):
    query_terms: list[str] = Field(default_factory=list)
    location: str | None = None
    limit: int = Field(default=10, ge=1, le=25)


class GenerateEmailRequest(BaseModel):
    recruiter_post_id: str
    resume_id: str
    custom_notes: str | None = Field(default=None, max_length=800)


class GeneratedEmailResponse(BaseModel):
    subject: str
    body: str
    match: MatchResult


class SendEmailRequest(BaseModel):
    recruiter_post_id: str
    resume_id: str
    subject: str = Field(min_length=3, max_length=255)
    body: str = Field(min_length=10, max_length=5000)


class ApplicationRead(BaseModel):
    id: str
    recruiter_id: str | None = None
    recruiter_post_id: str | None = None
    email_subject: str
    email_body: str
    match_percentage: int
    missing_skills: list[str]
    match_summary: str | None
    sent_status: str
    reply_status: str
    created_at: datetime


class PatchReplyStatus(BaseModel):
    """Request body for PATCH /applications/{id}/reply"""
    reply_status: str = Field(
        description="One of: pending, replied, rejected, no_response",
        pattern=r"^(pending|replied|rejected|no_response)$",
    )


class DashboardAnalytics(BaseModel):
    total_applications: int
    pending_replies: int
    recruiter_responses: int
    response_rate: float
    recent_outreach: list[ApplicationRead]


class FollowUpRead(BaseModel):
    id: str
    application_id: str
    subject: str
    body: str
    sent_status: str
    gmail_message_id: str | None
    created_at: datetime


class SendFollowUpRequest(BaseModel):
    application_id: str
    subject: str = Field(min_length=3, max_length=255)
    body: str = Field(min_length=10, max_length=5000)


class GmailConnectionRead(BaseModel):
    id: str
    email: str
    is_active: bool
    created_at: datetime


class GmailOAuthInitiate(BaseModel):
    auth_url: str
