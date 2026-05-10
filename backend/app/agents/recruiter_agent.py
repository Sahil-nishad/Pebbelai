"""
RecruiterOutreachAgent — orchestrates the full recruiter discovery → email generation pipeline.

Usage (via Celery or manual invocation):
    from app.agents.recruiter_agent import RecruiterOutreachAgent
    agent = RecruiterOutreachAgent()
    results = await agent.run(query_terms=["data analyst hiring"], limit=5)
"""
import asyncio
from pathlib import Path

from app.services.email_generator import EmailGeneratorService
from app.services.matching import MatchingService
from app.services.recruiter_search import RecruiterSearchService
from app.services.resume_parser import ResumeParserService


class RecruiterOutreachAgent:
    """End-to-end agent: discover recruiters → score → generate personalised outreach."""

    def __init__(self) -> None:
        self.resume_parser = ResumeParserService()
        self.search_service = RecruiterSearchService()
        self.matching_service = MatchingService()
        self.email_service = EmailGeneratorService()

    async def run(
        self,
        *,
        query_terms: list[str] | None = None,
        resume_path: Path | None = None,
        location: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """
        1. Search for recruiters via Playwright.
        2. If a resume path is provided, parse it and score each result.
        3. Generate a cold email draft for each recruiter post.
        Returns a list of enriched result dicts ready for DB persistence.
        """
        safe_terms = query_terms or ["hiring", "data analyst hiring", "business analyst hiring"]

        # Step 1: discover recruiter posts
        results = await self.search_service.search(safe_terms, location=location, limit=limit)

        # Step 2: parse resume if available
        resume_data: dict = {}
        resume_skills: list[str] = []
        if resume_path and resume_path.exists():
            resume_data = self.resume_parser.parse(resume_path)
            resume_skills = resume_data.get("skills", [])

        enriched: list[dict] = []
        for result in results:
            # Step 3: score each post against resume
            match = self.matching_service.score(
                resume_skills,
                result.get("extracted_skills", []),
                result.get("role"),
                result.get("company"),
            )

            # Step 4: generate cold email draft (only if score is worth pursuing)
            email_draft: dict | None = None
            if match["score"] >= 30:
                email_draft = self.email_service.generate(
                    recruiter_name=result.get("recruiter_name", "there"),
                    company=result.get("company"),
                    role=result.get("role"),
                    resume=resume_data,
                    post={"post_content": result.get("post_content", "")},
                    match=match,
                )

            enriched.append({
                **result,
                "match": match,
                "email_draft": email_draft,
            })

        # Sort by match score descending
        enriched.sort(key=lambda r: r["match"]["score"], reverse=True)
        return enriched
