import asyncio
import os
from pathlib import Path
from urllib.parse import quote_plus

from playwright.async_api import async_playwright

from app.config import get_settings
from app.services.matching import MatchingService
from app.services.recruiter_extraction import RecruiterExtractionService


class RecruiterSearchService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.extractor = RecruiterExtractionService()
        self.matching = MatchingService()

    async def search(self, query_terms: list[str], location: str | None = None, limit: int = 10) -> list[dict]:
        safe_terms = query_terms or [
            "hiring",
            "we are hiring",
            "send cv",
            "urgent hiring",
            "data analyst hiring",
            "business analyst hiring",
            "power bi hiring",
        ]
        results: list[dict] = []
        async with async_playwright() as playwright:
            launch_kwargs = {"headless": True}
            chrome_fallback = self._chrome_fallback_path()
            if chrome_fallback:
                launch_kwargs["executable_path"] = chrome_fallback
            browser = await playwright.chromium.launch(**launch_kwargs)
            page = await browser.new_page()
            for term in safe_terms[:4]:
                query = f'{term} "{location}" recruiter email' if location else f"{term} recruiter email"
                await page.goto(f"https://www.bing.com/search?q={quote_plus(query)}", wait_until="domcontentloaded")
                await page.wait_for_timeout(self.settings.recruiter_search_delay_ms)
                cards = await page.locator("li.b_algo").all()
                for card in cards[: min(limit, self.settings.recruiter_search_per_run)]:
                    title = await card.locator("h2").inner_text() if await card.locator("h2").count() else ""
                    snippet = await card.locator(".b_caption").inner_text() if await card.locator(".b_caption").count() else ""
                    link = await card.locator("h2 a").get_attribute("href") if await card.locator("h2 a").count() else None
                    combined = f"{title}\n{snippet}"
                    emails = self.extractor.extract_emails(combined)
                    results.append(
                        {
                            "recruiter_name": title.split("-")[0][:120] or "Hiring Team",
                            "company": self._guess_company(title, snippet),
                            "email": emails[0] if emails else None,
                            "designation": "Recruiter",
                            "role": self._guess_role(combined),
                            "location": location,
                            "post_content": combined[:4000],
                            "extracted_skills": self.matching.extract_requirement_skills(combined),
                            "source_url": link or "https://www.bing.com",
                            "source_platform": "bing",
                            "linkedin_url": self.extractor.extract_linkedin_url(combined),
                        }
                    )
                    if len(results) >= limit:
                        break
                if len(results) >= limit:
                    break
                await asyncio.sleep(self.settings.recruiter_search_delay_ms / 1000)
            await browser.close()
        return results[:limit]

    def _chrome_fallback_path(self) -> str | None:
        base = Path(os.environ.get("USERPROFILE", "")) / "AppData" / "Local" / "ms-playwright"
        candidates = sorted(base.glob("chromium-*/chrome-win/chrome.exe"), reverse=True)
        return str(candidates[0]) if candidates else None

    def _guess_company(self, title: str, snippet: str) -> str | None:
        for text in (title, snippet):
            if " at " in text.lower():
                return text.split(" at ", 1)[-1].split(" - ", 1)[0][:160].strip()
        return None

    def _guess_role(self, text: str) -> str | None:
        for marker in ("Data Analyst", "Business Analyst", "Power BI", "Engineer", "Developer", "Scientist"):
            if marker.lower() in text.lower():
                return marker
        return None
