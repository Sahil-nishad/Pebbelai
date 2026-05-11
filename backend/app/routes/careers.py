import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
import os
import shutil
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import get_settings
from app.db import get_db
from app.models.careers import (
    Application,
    GmailConnection,
    Recruiter,
    RecruiterPost,
    Resume,
)
from app.schemas.careers import (
    AnalyticsSummary,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    GmailConnectionCreate,
    GmailConnectionResponse,
    RecruiterCreate,
    RecruiterPostCreate,
    RecruiterPostResponse,
    RecruiterResponse,
    RecruiterUpdate,
    ResumeCreate,
    ResumeResponse,
    ResumeUpdate,
)
from app.utils.encryption import decrypt_token, encrypt_token
from app.deps import get_current_user
from app.utils.parser import extract_text_from_file, parse_resume_content

router = APIRouter(prefix="/careers", tags=["careers"])


# Resume Endpoints


@router.post("/resume/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    settings = Depends(get_settings),
):
    # Ensure upload directory exists
    upload_path = os.path.join(os.getcwd(), settings.upload_dir)
    os.makedirs(upload_path, exist_ok=True)

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_path, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text and parse with AI
    text_content = extract_text_from_file(file_path)
    parsed_data = await parse_resume_content(text_content)

    # Create database entry
    resume = Resume(
        id=str(uuid.uuid4()),
        user_id=user_id,
        filename=filename,
        original_name=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        mime_type=file.content_type,
        parsed_skills=parsed_data.get("parsed_skills", []),
        parsed_experience=parsed_data.get("parsed_experience", []),
        parsed_education=parsed_data.get("parsed_education", []),
        parsed_projects=parsed_data.get("parsed_projects", []),
        parsed_summary=parsed_data.get("parsed_summary", ""),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.post("/resume", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_resume(data: ResumeCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    resume = Resume(id=str(uuid.uuid4()), user_id=user_id, **data.model_dump())
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/resume", response_model=list[ResumeResponse])
def list_resumes(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).all()


@router.get("/resume/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.patch("/resume/{resume_id}", response_model=ResumeResponse)
def update_resume(resume_id: str, data: ResumeUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(resume, field, value)
    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/resume/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(resume_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()


# Gmail Connection Endpoints


@router.post("/gmail", response_model=GmailConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_gmail_connection(data: GmailConnectionCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    existing = db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Gmail already connected")
    conn = GmailConnection(id=str(uuid.uuid4()), user_id=user_id, **data.model_dump())
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.get("/gmail", response_model=GmailConnectionResponse)
def get_gmail_connection(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    conn = db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="No Gmail connection found")
    return conn


@router.patch("/gmail", response_model=GmailConnectionResponse)
def update_gmail_tokens(
    refresh_token: str,
    access_token: str,
    expires_in: int,
    scopes: list[str],
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    conn = db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="No Gmail connection found")
    conn.encrypted_refresh_token = encrypt_token(refresh_token)
    conn.encrypted_access_token = encrypt_token(access_token)
    conn.token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
    conn.scopes = scopes
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/gmail", status_code=status.HTTP_204_NO_CONTENT)
def delete_gmail_connection(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    conn = db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="No Gmail connection found")
    db.delete(conn)
    db.commit()


# Recruiter Endpoints


@router.post("/recruiters", response_model=RecruiterResponse, status_code=status.HTTP_201_CREATED)
def create_recruiter(data: RecruiterCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    recruiter = Recruiter(id=str(uuid.uuid4()), user_id=user_id, **data.model_dump())
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)
    return recruiter


@router.get("/recruiters", response_model=list[RecruiterResponse])
def list_recruiters(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
):
    query = db.query(Recruiter).filter(Recruiter.user_id == user_id)
    if search:
        query = query.filter(Recruiter.name.ilike(f"%{search}%") | Recruiter.company.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


@router.get("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
def get_recruiter(recruiter_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id, Recruiter.user_id == user_id).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return recruiter


@router.patch("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
def update_recruiter(
    recruiter_id: str,
    data: RecruiterUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id, Recruiter.user_id == user_id).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(recruiter, field, value)
    db.commit()
    db.refresh(recruiter)
    return recruiter


@router.delete("/recruiters/{recruiter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recruiter(recruiter_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id, Recruiter.user_id == user_id).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    db.delete(recruiter)
    db.commit()


# RecruiterPost Endpoints


@router.post("/posts", response_model=RecruiterPostResponse, status_code=status.HTTP_201_CREATED)
def create_recruiter_post(data: RecruiterPostCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    post = RecruiterPost(id=str(uuid.uuid4()), user_id=user_id, **data.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/posts", response_model=list[RecruiterPostResponse])
def list_recruiter_posts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    saved_only: bool = False,
    skip: int = 0,
    limit: int = 20,
):
    query = db.query(RecruiterPost).filter(RecruiterPost.user_id == user_id)
    if saved_only:
        query = query.filter(RecruiterPost.is_saved == True)
    return query.order_by(RecruiterPost.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/posts/{post_id}", response_model=RecruiterPostResponse)
def get_recruiter_post(post_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    post = db.query(RecruiterPost).filter(RecruiterPost.id == post_id, RecruiterPost.user_id == user_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.patch("/posts/{post_id}", response_model=RecruiterPostResponse)
def update_recruiter_post(post_id: str, data: dict, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    post = db.query(RecruiterPost).filter(RecruiterPost.id == post_id, RecruiterPost.user_id == user_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    for field, value in data.items():
        if hasattr(post, field):
            setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post


# Application Endpoints


@router.post("/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(data: ApplicationCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    app = Application(id=str(uuid.uuid4()), user_id=user_id, **data.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/applications", response_model=list[ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
):
    query = db.query(Application).filter(Application.user_id == user_id)
    if status:
        query = query.filter(Application.status == status)
    return query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/applications/{app_id}", response_model=ApplicationResponse)
def get_application(app_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.patch("/applications/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: str,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(app_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()


# Analytics


@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    apps = db.query(Application).filter(Application.user_id == user_id).all()
    total = len(apps)
    sent = sum(1 for a in apps if a.status in ("sent", "replied", "rejected"))
    replied = sum(1 for a in apps if a.status == "replied")
    rejected = sum(1 for a in apps if a.status == "rejected")
    no_response = sum(1 for a in apps if a.status == "no_response")
    pending = sum(1 for a in apps if a.status == "pending")
    response_rate = replied / sent * 100 if sent else 0.0
    scores = [a.ats_score for a in apps if a.ats_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    return AnalyticsSummary(
        total_applications=total,
        sent=sent,
        replied=replied,
        rejected=rejected,
        no_response=no_response,
        pending=pending,
        response_rate=response_rate,
        avg_ats_score=avg_score,
    )