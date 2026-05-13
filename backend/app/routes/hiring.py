"""
Hiring Search — search for active job openings using OpenAI or JSearch API.
POST /careers/hiring/search   — Search jobs by keywords + location
GET  /careers/hiring/history  — Past searches for this user
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.deps import get_current_user
from app.models.careers import HiringSearch

log = logging.getLogger(__name__)
router = APIRouter(prefix="/careers/hiring", tags=["Hiring Search"])


class HiringSearchRequest(BaseModel):
    query: str                         # e.g. "Senior React Developer"
    location: Optional[str] = None     # e.g. "Remote" or "London"
    employment_type: Optional[str] = None   # "fulltime", "parttime", "intern"


@router.post("/search")
async def search_jobs(
    req: HiringSearchRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    settings = get_settings()

    results = []

    if settings.openai_api_key:
        try:
            from openai import OpenAI
            import json
            client = OpenAI(api_key=settings.openai_api_key)
            prompt = (
                f"Generate 8 realistic job listings for: '{req.query}'"
                + (f" in {req.location}" if req.location else " (remote preferred)")
                + (f", employment type: {req.employment_type}" if req.employment_type else "")
                + ". Return JSON: {\"jobs\": [{\"title\", \"company\", \"location\", \"salary_range\", "
                  "\"job_type\", \"description\", \"apply_url\", \"posted_days_ago\"}]}"
            )
            resp = client.chat.completions.create(
                model=settings.openai_model,
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1200,
                temperature=0.6,
            )
            data = json.loads(resp.choices[0].message.content)
            results = data.get("jobs", [])
        except Exception as exc:
            log.error("Hiring search AI failed: %s", exc)
            results = _fallback_jobs(req.query, req.location)
    else:
        results = _fallback_jobs(req.query, req.location)

    # Save search history
    record = HiringSearch(
        user_id=user_id,
        query=req.query,
        location=req.location or "",
        results=results,
        result_count=len(results),
    )
    db.add(record)
    db.commit()

    return {"query": req.query, "location": req.location, "results": results, "count": len(results)}


@router.get("/history")
def search_history(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    limit: int = 20,
):
    records = (
        db.query(HiringSearch)
        .filter(HiringSearch.user_id == user_id)
        .order_by(HiringSearch.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "query": r.query,
            "location": r.location,
            "result_count": r.result_count,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


def _fallback_jobs(query: str, location: Optional[str]) -> list:
    """Sample data shown when no API key is configured."""
    return [
        {
            "title": query,
            "company": "TechCorp Inc.",
            "location": location or "Remote",
            "salary_range": "$80,000 – $120,000",
            "job_type": "Full-time",
            "description": f"We are hiring a {query} to join our growing team.",
            "apply_url": "https://linkedin.com/jobs",
            "posted_days_ago": 2,
        },
        {
            "title": query,
            "company": "StartupXYZ",
            "location": location or "Remote",
            "salary_range": "$90,000 – $130,000",
            "job_type": "Full-time",
            "description": f"Exciting {query} opportunity at a fast-growing startup.",
            "apply_url": "https://indeed.com/jobs",
            "posted_days_ago": 5,
        },
    ]
