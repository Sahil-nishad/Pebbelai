from pathlib import Path

from openai import OpenAI

from app.config import get_settings


class EmailGeneratorService:
    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.openai_model
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.prompt_template = Path(__file__).resolve().parents[1] / "prompts" / "cold_email.md"

    def generate(self, *, recruiter_name: str, company: str | None, role: str | None, resume: dict, post: dict, match: dict, custom_notes: str | None = None) -> dict:
        if not self.client:
            return self._fallback(recruiter_name, company, role, resume, match)

        prompt = self.prompt_template.read_text(encoding="utf-8").format(
            recruiter_name=recruiter_name or "there",
            company=company or "your team",
            role=role or "the opportunity",
            resume_skills=", ".join(resume.get("skills", [])[:8]),
            resume_projects="; ".join(resume.get("projects", [])[:3]),
            experience="; ".join(item.get("title", "") for item in resume.get("experience", [])[:3]),
            post_excerpt=post.get("post_content", "")[:1200],
            match_summary=match.get("summary", ""),
            custom_notes=custom_notes or "None",
        )
        response = self.client.responses.create(
            model=self.model,
            input=prompt,
            temperature=0.5,
        )
        content = response.output_text.strip()
        subject, _, body = content.partition("\n")
        subject = subject.replace("Subject:", "").strip() or f"Application for {role or 'your opening'}"
        return {"subject": subject[:255], "body": body.strip() or content}

    def _fallback(self, recruiter_name: str, company: str | None, role: str | None, resume: dict, match: dict) -> dict:
        skills = ", ".join(resume.get("skills", [])[:4])
        project = next(iter(resume.get("projects", [])), "recent analytics work")
        subject = f"Interest in {role or 'your open role'} at {company or 'your team'}"
        body = (
            f"Hi {recruiter_name or 'there'},\n\n"
            f"I’m reaching out about the {role or 'open opportunity'} at {company or 'your team'}. "
            f"My background aligns well with your needs, especially in {skills or 'data and product work'}. "
            f"I recently worked on {project}, which maps closely to the role requirements. "
            f"I’d love to share how I can contribute.\n\n"
            f"Best,\n{resume.get('name') or 'Candidate'}"
        )
        return {"subject": subject[:255], "body": body[:1200]}

