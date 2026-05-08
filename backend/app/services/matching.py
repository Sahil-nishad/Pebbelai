from collections import Counter


class MatchingService:
    def score(self, resume_skills: list[str], post_skills: list[str], role: str | None, company: str | None) -> dict:
        normalized_resume = {skill.lower() for skill in resume_skills}
        normalized_post = {skill.lower() for skill in post_skills}
        overlap = normalized_resume & normalized_post
        missing = sorted(skill.title() for skill in normalized_post - normalized_resume)
        score = 0
        if normalized_post:
            score = round((len(overlap) / max(len(normalized_post), 1)) * 100)
        elif normalized_resume:
            score = 65

        summary_parts = [
            f"Strong overlap on {', '.join(sorted(skill.title() for skill in overlap)[:4])}." if overlap else "Limited direct overlap found.",
            f"Target role: {role}." if role else None,
            f"Company context: {company}." if company else None,
        ]
        summary = " ".join(part for part in summary_parts if part)
        return {"score": min(max(score, 0), 100), "missing_skills": missing[:8], "summary": summary}

    def extract_requirement_skills(self, text: str) -> list[str]:
        words = Counter(word.strip(".,").title() for word in text.split() if len(word) > 3)
        skills = [word for word, count in words.items() if count > 1]
        return skills[:12]

