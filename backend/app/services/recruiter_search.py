import asyncio
import os
import re
from pathlib import Path
from urllib.parse import quote_plus, urlparse

from playwright.async_api import async_playwright

from app.config import get_settings
from app.services.matching import MatchingService
from app.services.recruiter_extraction import RecruiterExtractionService


class RecruiterSearchService:
    JOB_SITES = (
        ("linkedin", "linkedin.com"),
        ("indeed", "indeed.com"),
        ("naukri", "naukri.com"),
        ("wellfound", "wellfound.com"),
        ("glassdoor", "glassdoor.com"),
        ("careers", None),
    )

    def __init__(self) -> None:
        self.settings = get_settings()
        self.extractor = RecruiterExtractionService()
        self.matching = MatchingService()

    async def search(
        self,
        query_terms: list[str],
        location: str | None = None,
        limit: int = 10,
        resume_skills: list[str] | None = None,
        resume_experience: list[dict] | None = None,
    ) -> list[dict]:
        search_terms = self._build_search_terms(query_terms, resume_skills or [], resume_experience or [])
        search_queries = self._build_search_queries(search_terms, location, limit)
        results: list[dict] = []
        seen_urls: set[str] = set()

        async with async_playwright() as playwright:
            launch_kwargs = {"headless": True}
            chrome_fallback = self._chrome_fallback_path()
            if chrome_fallback:
                launch_kwargs["executable_path"] = chrome_fallback
            browser = await playwright.chromium.launch(**launch_kwargs)
            page = await browser.new_page()

            for query in search_queries:
                if len(results) >= limit:
                    break

                await page.goto(f"https://www.bing.com/search?q={quote_plus(query)}", wait_until="domcontentloaded")
                await page.wait_for_timeout(self.settings.recruiter_search_delay_ms)
                cards = await page.locator("li.b_algo").all()

                for card in cards:
                    if len(results) >= limit:
                        break

                    item = await self._parse_result_card(card, location)
                    if not item:
                        continue

                    normalized_url = item["source_url"].split("#", 1)[0]
                    if normalized_url in seen_urls:
                        continue
                    seen_urls.add(normalized_url)
                    results.append(item)

                await asyncio.sleep(self.settings.recruiter_search_delay_ms / 1000)

            await browser.close()

        return results[:limit]

    async def _parse_result_card(self, card, location: str | None) -> dict | None:
        title_locator = card.locator("h2")
        link_locator = card.locator("h2 a")
        snippet_locator = card.locator(".b_caption")

        title = await title_locator.inner_text() if await title_locator.count() else ""
        snippet = await snippet_locator.inner_text() if await snippet_locator.count() else ""
        link = await link_locator.get_attribute("href") if await link_locator.count() else None
        if not title and not snippet:
            return None

        combined = f"{title}\n{snippet}".strip()
        emails = self.extractor.extract_emails(combined)
        linkedin_url = self.extractor.extract_linkedin_url(f"{combined}\n{link or ''}")

        return {
            "recruiter_name": self._guess_recruiter_name(title, snippet),
            "company": self._guess_company(title, snippet),
            "email": emails[0] if emails else None,
            "designation": "Recruiter",
            "role": self._guess_role(combined),
            "location": location or self._guess_location(combined),
            "post_content": combined[:4000],
            "extracted_skills": self.matching.extract_requirement_skills(combined),
            "source_url": link or "https://www.bing.com",
            "source_platform": self._detect_platform(link),
            "linkedin_url": linkedin_url,
        }

    def _build_search_terms(
        self,
        query_terms: list[str],
        resume_skills: list[str],
        resume_experience: list[dict],
    ) -> list[str]:
        normalized = [term.strip() for term in query_terms if term.strip()]
        if normalized:
            return normalized[:6]

        resume_roles = [
            str(item.get("title", "")).strip()
            for item in resume_experience
            if isinstance(item, dict) and item.get("title")
        ]
        seeds = normalized + resume_roles[:2] + resume_skills[:6]

        if not seeds:
            return [
                "data analyst hiring",
                "business analyst hiring",
                "power bi hiring",
            ]

        derived: list[str] = []
        for seed in seeds:
            lower_seed = seed.lower()
            if "hiring" in lower_seed or "recruiter" in lower_seed or "opening" in lower_seed:
                derived.append(seed)
            else:
                derived.append(f"{seed} hiring")

        unique_terms: list[str] = []
        seen: set[str] = set()
        for term in derived:
            key = term.lower()
            if key not in seen:
                seen.add(key)
                unique_terms.append(term)
        return unique_terms[:6]

    def _build_search_queries(self, search_terms: list[str], location: str | None, limit: int) -> list[str]:
        queries: list[str] = []
        max_terms = max(1, min(len(search_terms), 3))
        per_site = max(1, min(limit, self.settings.recruiter_search_per_run))

        for term in search_terms[:max_terms]:
            base = f'{term} "{location}"' if location else term
            for site_label, domain in self.JOB_SITES:
                if len(queries) >= max_terms * len(self.JOB_SITES):
                    break
                if domain:
                    queries.append(f'site:{domain} {base} ("hiring" OR "send cv" OR recruiter OR "apply")')
                else:
                    queries.append(f'{base} ("careers" OR "we are hiring" OR recruiter OR "send cv")')
            if len(queries) >= per_site:
                continue
        return queries

    def _chrome_fallback_path(self) -> str | None:
        base = Path(os.environ.get("USERPROFILE", "")) / "AppData" / "Local" / "ms-playwright"
        candidates = sorted(base.glob("chromium-*/chrome-win/chrome.exe"), reverse=True)
        return str(candidates[0]) if candidates else None

    def _guess_recruiter_name(self, title: str, snippet: str) -> str:
        title_head = title.split(" - ", 1)[0].split(" | ", 1)[0].strip()
        if title_head:
            return title_head[:120]
        sentence = snippet.split(".", 1)[0].strip()
        return sentence[:120] or "Hiring Team"

    def _guess_company(self, title: str, snippet: str) -> str | None:
        for text in (title, snippet):
            if " at " in text.lower():
                return text.split(" at ", 1)[-1].split(" - ", 1)[0][:160].strip()

        company_match = re.search(r"(?:join|with|for)\s+([A-Z][A-Za-z0-9&.,' -]{2,80})", snippet)
        if company_match:
            return company_match.group(1).strip()
        return None

    def _guess_role(self, text: str) -> str | None:
        markers = (
            "Data Analyst",
            "Business Analyst",
            "Power BI Developer",
            "Power BI Analyst",
            "Data Engineer",
            "Software Engineer",
            "Backend Developer",
            "Frontend Developer",
            "Python Developer",
            "Product Analyst",
            "Data Scientist",
        )
        lowered = text.lower()
        for marker in markers:
            if marker.lower() in lowered:
                return marker
        return None

    def _guess_location(self, text: str) -> str | None:
        location_markers = ("remote", "hybrid", "bangalore", "bengaluru", "mumbai", "delhi", "pune", "hyderabad", "chennai")
        lowered = text.lower()
        for marker in location_markers:
            if marker in lowered:
                return marker.title()
        return None

    def _detect_platform(self, url: str | None) -> str:
        if not url:
            return "bing"
        hostname = urlparse(url).hostname or ""
        hostname = hostname.lower()
        for platform, domain in self.JOB_SITES:
            if domain and domain in hostname:
                return platform
        return hostname.replace("www.", "") or "web"
