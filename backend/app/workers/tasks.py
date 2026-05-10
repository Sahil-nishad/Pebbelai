import asyncio

from app.services.recruiter_search import RecruiterSearchService
from app.workers.celery_app import celery_app


@celery_app.task(name="careers.refresh_recruiter_posts")
def refresh_recruiter_posts(query_terms: list[str] | None = None) -> list[dict]:
    service = RecruiterSearchService()
    return asyncio.run(service.search(query_terms or [], limit=10))

