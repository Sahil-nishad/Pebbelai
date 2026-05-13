"""
Resume Vault — upload, list, delete, set primary.
POST   /careers/resume/upload   — Upload PDF/DOCX → AI parse → save
GET    /careers/resume           — List all resumes for user
DELETE /careers/resume/{id}      — Delete a resume
PATCH  /careers/resume/{id}/primary — Set as primary resume
"""
import os
import shutil
import uuid
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.deps import get_current_user
from app.models.careers import Resume

log = logging.getLogger(__name__)
router = APIRouter(prefix="/careers/resume", tags=["Resume"])


def _parse_with_ai(text: str, settings) -> dict:
    """Use OpenAI to extract structured data from resume text."""
    if not settings.openai_api_key or not text.strip():
        return {"parsed_skills": [], "parsed_experience": [], "parsed_education": [], "parsed_summary": ""}

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a resume parser. Extract data from the resume text and return ONLY a JSON object with:\n"
                        "- parsed_skills: array of skill strings\n"
                        "- parsed_experience: array of {title, company, duration, description} objects\n"
                        "- parsed_education: array of {degree, institution, year} objects\n"
                        "- parsed_summary: short 2-sentence professional summary string"
                    ),
                },
                {"role": "user", "content": text[:12000]},
            ],
            max_tokens=1500,
            temperature=0,
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as exc:
        log.warning("AI parse failed: %s", exc)
        return {"parsed_skills": [], "parsed_experience": [], "parsed_education": [], "parsed_summary": ""}


def _extract_text(file_path: str, mime_type: str) -> str:
    """Extract plain text from PDF or DOCX."""
    try:
        if "pdf" in mime_type or file_path.endswith(".pdf"):
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            return "\n".join(page.get_text() for page in doc)
        elif "word" in mime_type or file_path.endswith(".docx"):
            from docx import Document
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs)
    except Exception as exc:
        log.warning("Text extraction failed: %s", exc)
    return ""


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    settings = get_settings()

    # Validate file type
    allowed = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in allowed and not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    # Validate file size
    contents = await file.read()
    if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.max_upload_size_mb}MB limit.")

    # Save file to disk
    upload_path = os.path.join(os.getcwd(), settings.upload_dir)
    os.makedirs(upload_path, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_path, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract text + AI parse
    text = _extract_text(file_path, file.content_type or "")
    parsed = _parse_with_ai(text, settings)

    # Save to DB
    resume = Resume(
        user_id=user_id,
        original_name=file.filename,
        filename=filename,
        file_size=len(contents),
        mime_type=file.content_type,
        parsed_skills=parsed.get("parsed_skills", []),
        parsed_experience=parsed.get("parsed_experience", []),
        parsed_education=parsed.get("parsed_education", []),
        parsed_summary=parsed.get("parsed_summary", ""),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "id": resume.id,
        "original_name": resume.original_name,
        "file_size": resume.file_size,
        "parsed_skills": resume.parsed_skills,
        "parsed_experience": resume.parsed_experience,
        "parsed_education": resume.parsed_education,
        "parsed_summary": resume.parsed_summary,
        "is_primary": resume.is_primary,
        "created_at": resume.created_at.isoformat(),
    }


@router.get("")
def list_resumes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    resumes = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "original_name": r.original_name,
            "file_size": r.file_size,
            "parsed_skills": r.parsed_skills or [],
            "parsed_experience": r.parsed_experience or [],
            "parsed_education": r.parsed_education or [],
            "parsed_summary": r.parsed_summary or "",
            "is_primary": r.is_primary,
            "created_at": r.created_at.isoformat(),
        }
        for r in resumes
    ]


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Delete file from disk
    try:
        settings = get_settings()
        file_path = os.path.join(os.getcwd(), settings.upload_dir, resume.filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as exc:
        log.warning("Could not delete file: %s", exc)

    db.delete(resume)
    db.commit()


@router.patch("/{resume_id}/primary")
def set_primary_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    # Clear current primary
    db.query(Resume).filter(Resume.user_id == user_id).update({"is_primary": False})
    # Set new primary
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume.is_primary = True
    db.commit()
    return {"id": resume.id, "is_primary": True}
