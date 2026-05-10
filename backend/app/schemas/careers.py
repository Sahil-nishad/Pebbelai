from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# Resume Schemas


class ResumeBase(BaseModel):
    filename: str
    original_name: str
    file_path: str
    file_size: int
    mime_type: str


class ResumeCreate(ResumeBase):
    user_id: str


class ResumeUpdate(BaseModel):
    parsed_skills: Optional[list[str]] = None
    parsed_experience: Optional[list[dict]] = None
    parsed_education: Optional[list[dict]] = None
    parsed_projects: Optional[list[dict]] = None
    parsed_summary: Optional[str] = None


class ResumeResponse(ResumeBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    parsed_skills: list[str]
    parsed_experience: list[dict]
    parsed_education: list[dict]
    parsed_projects: list[dict]
    parsed_summary: Optional[str]
    created_at: datetime
    updated_at: datetime


# GmailConnection Schemas


class GmailConnectionBase(BaseModel):
    email: str


class GmailConnectionCreate(GmailConnectionBase):
    user_id: str


class GmailConnectionResponse(GmailConnectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    scopes: list[str]
    is_active: bool
    emails_sent_today: int
    daily_limit: int
    token_expiry: Optional[datetime]
    created_at: datetime
    updated_at: datetime


# Recruiter Schemas


class RecruiterBase(BaseModel):
    name: str
    email: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None


class RecruiterCreate(RecruiterBase):
    user_id: str


class RecruiterUpdate(BaseModel):
    is_verified: Optional[bool] = None
    notes: Optional[str] = None


class RecruiterResponse(RecruiterBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    is_verified: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


# RecruiterPost Schemas


class RecruiterPostBase(BaseModel):
    recruiter_id: str
    title: str
    company: str
    content: str
    post_url: Optional[str] = None


class RecruiterPostCreate(RecruiterPostBase):
    user_id: str


class RecruiterPostResponse(RecruiterPostBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    location: Optional[str]
    required_skills: list[str]
    experience_level: Optional[str]
    salary_range: Optional[str]
    ats_match_score: Optional[int]
    is_saved: bool
    created_at: datetime


# Application Schemas


class ApplicationBase(BaseModel):
    recruiter_post_id: str
    resume_id: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    user_id: str


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    status: str
    ats_score: Optional[int]
    sent_at: Optional[datetime]
    replied_at: Optional[datetime]
    follow_up_sent: bool
    follow_up_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


# Analytics Schemas


class AnalyticsSummary(BaseModel):
    total_applications: int
    sent: int
    replied: int
    rejected: int
    no_response: int
    pending: int
    response_rate: float
    avg_ats_score: float