"""
Recruiter Search & Management
POST   /careers/recruiters           — Add a recruiter manually
GET    /careers/recruiters           — List recruiters (with optional search query)
GET    /careers/recruiters/{id}      — Get single recruiter
PATCH  /careers/recruiters/{id}      — Update recruiter (notes, contacted etc.)
DELETE /careers/recruiters/{id}      — Delete recruiter
POST   /careers/recruiters/search    — AI-powered recruiter search using LinkedIn scraping (mocked for now, easy to swap)
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.careers import Recruiter

log = logging.getLogger(__name__)
router = APIRouter(prefix="/careers/recruiters", tags=["Recruiters"])


class RecruiterCreate(BaseModel):
    name: str
    title: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class RecruiterUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    is_contacted: Optional[bool] = None


class RecruiterSearchRequest(BaseModel):
    role: str                          # e.g. "Senior Python Engineer"
    location: Optional[str] = None     # e.g. "Remote" or "New York"
    industry: Optional[str] = None     # e.g. "Fintech"


def _format(r: Recruiter) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "title": r.title,
        "company": r.company,
        "linkedin_url": r.linkedin_url,
        "email": r.email,
        "phone": r.phone,
        "notes": r.notes,
        "is_contacted": r.is_contacted,
        "last_contacted_at": r.last_contacted_at.isoformat() if r.last_contacted_at else None,
        "created_at": r.created_at.isoformat(),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def add_recruiter(
    data: RecruiterCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    recruiter = Recruiter(user_id=user_id, **data.model_dump())
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)
    return _format(recruiter)


@router.get("")
def list_recruiters(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
):
    q = db.query(Recruiter).filter(Recruiter.user_id == user_id)
    if search:
        term = f"%{search}%"
        q = q.filter(
            Recruiter.name.ilike(term)
            | Recruiter.company.ilike(term)
            | Recruiter.title.ilike(term)
        )
    return [_format(r) for r in q.order_by(Recruiter.created_at.desc()).offset(skip).limit(limit).all()]


@router.get("/{recruiter_id}")
def get_recruiter(
    recruiter_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    r = db.query(Recruiter).filter(Recruiter.id == recruiter_id, Recruiter.user_id == user_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return _format(r)


@router.patch("/{recruiter_id}")
def update_recruiter(
    recruiter_id: str,
    data: RecruiterUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    r = db.query(Recruiter).filter(Recruiter.id == recruiter_id, Recruiter.user_id == user_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return _format(r)


@router.delete("/{recruiter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recruiter(
    recruiter_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    r = db.query(Recruiter).filter(Recruiter.id == recruiter_id, Recruiter.user_id == user_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    db.delete(r)
    db.commit()


@router.post("/search")
async def search_recruiters(
    req: RecruiterSearchRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    AI-assisted recruiter discovery.
    Returns a list of suggested recruiters based on role/location/industry.
    Uses OpenAI to generate realistic recruiter profiles (production-ready mock).
    Swap the inner implementation with a real LinkedIn scraper when ready.
    """
    from app.config import get_settings
    settings = get_settings()

    if not settings.openai_api_key:
        # Return sample data if no API key configured
        return {
            "results": [
                {
                    "name": "Sarah Johnson",
                    "title": "Technical Recruiter",
                    "company": "TechHire",
                    "linkedin_url": "https://linkedin.com/in/sarahjohnson",
                    "email": "sarah@techhire.com",
                    "match_reason": f"Specialises in {req.role} roles",
                },
                {
                    "name": "Michael Chen",
                    "title": "Senior Talent Acquisition",
                    "company": "TopRecruit",
                    "linkedin_url": "https://linkedin.com/in/michaelchen",
                    "email": "m.chen@toprecruit.io",
                    "match_reason": f"Active in {req.location or 'remote'} market",
                },
            ],
            "note": "Configure OPENAI_API_KEY on Render for AI-powered results.",
        }

    try:
        from openai import OpenAI
        import json
        client = OpenAI(api_key=settings.openai_api_key)
        prompt = (
            f"Generate 5 realistic recruiter profiles for someone looking for a '{req.role}' role"
            + (f" in {req.location}" if req.location else "")
            + (f" in the {req.industry} industry" if req.industry else "")
            + ". Return JSON: {\"results\": [{\"name\", \"title\", \"company\", \"linkedin_url\", \"email\", \"match_reason\"}]}"
        )
        resp = client.chat.completions.create(
            model=settings.openai_model,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.7,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as exc:
        log.error("Recruiter AI search failed: %s", exc)
        raise HTTPException(status_code=500, detail="Recruiter search failed. Check OpenAI API key.")
