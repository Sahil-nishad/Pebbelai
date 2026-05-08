from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import AuthenticatedUser, db_session, get_current_user
from app.models.careers import Application, Recruiter, RecruiterPost, Resume
from app.schemas.careers import (
    ApplicationRead,
    DashboardAnalytics,
    GenerateEmailRequest,
    GeneratedEmailResponse,
    RecruiterFeedItem,
    RecruiterSearchRequest,
    ResumeRead,
    SendEmailRequest,
)
from app.services.application_tracking import ApplicationTrackingService
from app.services.email_generator import EmailGeneratorService
from app.services.gmail_service import GmailService
from app.services.matching import MatchingService
from app.services.recruiter_search import RecruiterSearchService
from app.services.resume_parser import ResumeParserService
from app.utils.security import enforce_rate_limit, stable_filename, validate_resume_upload

router = APIRouter()

resume_parser = ResumeParserService()
recruiter_search = RecruiterSearchService()
matching_service = MatchingService()
email_generator = EmailGeneratorService()
gmail_service = GmailService()
tracking_service = ApplicationTrackingService()


def serialize_resume(resume: Resume) -> ResumeRead:
    return ResumeRead.model_validate(resume, from_attributes=True)


def serialize_application(application: Application) -> ApplicationRead:
    return ApplicationRead.model_validate(application, from_attributes=True)


@router.post("/resume", response_model=ResumeRead)
async def upload_resume(
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> ResumeRead:
    enforce_rate_limit(f"resume:{user.id}", limit=8, window_seconds=3600)
    await validate_resume_upload(file)

    from app.config import get_settings

    settings = get_settings()
    filename = stable_filename(user.id, file.filename or "resume.pdf")
    destination = settings.upload_dir / filename
    destination.write_bytes(await file.read())

    parsed = resume_parser.parse(destination)
    resume = Resume(
        user_id=user.id,
        file_url=str(destination),
        parsed_name=parsed.get("name"),
        extracted_skills=parsed.get("skills", []),
        extracted_projects=parsed.get("projects", []),
        extracted_education=parsed.get("education", []),
        extracted_experience=parsed.get("experience", []),
        raw_text=parsed.get("raw_text"),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return serialize_resume(resume)


@router.get("/resume", response_model=list[ResumeRead])
def list_resumes(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> list[ResumeRead]:
    resumes = list(db.scalars(select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc())))
    return [serialize_resume(resume) for resume in resumes]


@router.post("/recruiters/search", response_model=list[RecruiterFeedItem])
async def search_recruiters(
    payload: RecruiterSearchRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> list[RecruiterFeedItem]:
    enforce_rate_limit(f"search:{user.id}", limit=12, window_seconds=3600)
    latest_resume = db.scalar(select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()))
    resume_skills = latest_resume.extracted_skills if latest_resume else []

    results = await recruiter_search.search(payload.query_terms, payload.location, payload.limit)
    items: list[RecruiterFeedItem] = []

    for result in results:
        recruiter = None
        if result.get("email"):
            recruiter = db.scalar(select(Recruiter).where(Recruiter.email == result["email"]))
        if not recruiter:
            recruiter = Recruiter(
                recruiter_name=result["recruiter_name"],
                company=result.get("company"),
                email=result.get("email"),
                linkedin_url=result.get("linkedin_url"),
                designation=result.get("designation"),
            )
            db.add(recruiter)
            db.flush()

        post = RecruiterPost(
            recruiter_id=recruiter.id,
            role=result.get("role"),
            location=result.get("location"),
            post_content=result["post_content"],
            extracted_skills=result.get("extracted_skills", []),
            extracted_email_candidates=[result["email"]] if result.get("email") else [],
            source_url=result["source_url"],
            source_platform=result.get("source_platform"),
        )
        db.add(post)
        db.flush()

        match = matching_service.score(resume_skills, post.extracted_skills, post.role, recruiter.company)
        items.append(
            RecruiterFeedItem(
                recruiter_post_id=post.id,
                recruiter_id=recruiter.id,
                recruiter_name=recruiter.recruiter_name,
                company=recruiter.company,
                email=recruiter.email,
                role=post.role,
                location=post.location,
                source_url=post.source_url,
                source_platform=post.source_platform,
                post_content=post.post_content,
                extracted_skills=post.extracted_skills,
                match=match,
            )
        )

    db.commit()
    return items


@router.get("/recruiters", response_model=list[RecruiterFeedItem])
def list_recruiters(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> list[RecruiterFeedItem]:
    latest_resume = db.scalar(select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()))
    resume_skills = latest_resume.extracted_skills if latest_resume else []
    posts = list(db.scalars(select(RecruiterPost).order_by(RecruiterPost.created_at.desc()).limit(20)))
    items: list[RecruiterFeedItem] = []
    for post in posts:
        recruiter = db.get(Recruiter, post.recruiter_id) if post.recruiter_id else None
        if not recruiter:
            continue
        match = matching_service.score(resume_skills, post.extracted_skills, post.role, recruiter.company)
        items.append(
            RecruiterFeedItem(
                recruiter_post_id=post.id,
                recruiter_id=recruiter.id,
                recruiter_name=recruiter.recruiter_name,
                company=recruiter.company,
                email=recruiter.email,
                role=post.role,
                location=post.location,
                source_url=post.source_url,
                source_platform=post.source_platform,
                post_content=post.post_content,
                extracted_skills=post.extracted_skills,
                match=match,
            )
        )
    return items


@router.post("/outreach/generate", response_model=GeneratedEmailResponse)
def generate_outreach_email(
    payload: GenerateEmailRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> GeneratedEmailResponse:
    resume = db.get(Resume, payload.resume_id)
    post = db.get(RecruiterPost, payload.recruiter_post_id)
    if not resume or str(resume.user_id) != user.id:
        raise HTTPException(status_code=404, detail="Resume not found.")
    if not post:
        raise HTTPException(status_code=404, detail="Recruiter post not found.")
    recruiter = db.get(Recruiter, post.recruiter_id) if post.recruiter_id else None
    match = matching_service.score(resume.extracted_skills, post.extracted_skills, post.role, recruiter.company if recruiter else None)
    generated = email_generator.generate(
        recruiter_name=recruiter.recruiter_name if recruiter else "there",
        company=recruiter.company if recruiter else None,
        role=post.role,
        resume={
            "name": resume.parsed_name,
            "skills": resume.extracted_skills,
            "projects": resume.extracted_projects,
            "experience": resume.extracted_experience,
        },
        post={"post_content": post.post_content},
        match=match,
        custom_notes=payload.custom_notes,
    )
    return GeneratedEmailResponse(subject=generated["subject"], body=generated["body"], match=match)


@router.post("/outreach/send", response_model=ApplicationRead)
def send_outreach_email(
    payload: SendEmailRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> ApplicationRead:
    enforce_rate_limit(f"send:{user.id}", limit=25, window_seconds=86400)
    resume = db.get(Resume, payload.resume_id)
    post = db.get(RecruiterPost, payload.recruiter_post_id)
    if not resume or str(resume.user_id) != user.id:
        raise HTTPException(status_code=404, detail="Resume not found.")
    if not post:
        raise HTTPException(status_code=404, detail="Recruiter post not found.")
    recruiter = db.get(Recruiter, post.recruiter_id) if post.recruiter_id else None
    if not recruiter or not recruiter.email:
        raise HTTPException(status_code=400, detail="Recruiter email is not available.")

    match = matching_service.score(resume.extracted_skills, post.extracted_skills, post.role, recruiter.company)
    message_id = gmail_service.send_message(
        to_email=recruiter.email,
        subject=payload.subject,
        body=payload.body,
        resume_path=Path(resume.file_url),
    )
    application = Application(
        user_id=user.id,
        recruiter_id=recruiter.id,
        recruiter_post_id=post.id,
        resume_id=resume.id,
        email_subject=payload.subject,
        email_body=payload.body,
        match_percentage=match["score"],
        missing_skills=match["missing_skills"],
        match_summary=match["summary"],
        sent_status="sent",
        reply_status="pending",
        gmail_message_id=message_id,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return serialize_application(application)


@router.get("/applications", response_model=list[ApplicationRead])
def get_applications(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> list[ApplicationRead]:
    applications = tracking_service.list_applications(db, user.id)
    return [serialize_application(application) for application in applications]


@router.get("/analytics", response_model=DashboardAnalytics)
def dashboard_analytics(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(db_session),
) -> DashboardAnalytics:
    analytics = tracking_service.analytics(db, user.id)
    analytics["recent_outreach"] = [serialize_application(item) for item in analytics["recent_outreach"]]
    return DashboardAnalytics(**analytics)
