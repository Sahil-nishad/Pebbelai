from pathlib import Path
import re
import logging

import fitz
import spacy
from spacy.language import Language
from docx import Document

logger = logging.getLogger(__name__)


class ResumeParserService:
    def __init__(self) -> None:
        self.nlp = self._load_nlp()

    def _load_nlp(self) -> Language:
        try:
            return spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model en_core_web_sm is not installed; using a blank English pipeline.")
            nlp = spacy.blank("en")
            if "sentencizer" not in nlp.pipe_names:
                nlp.add_pipe("sentencizer")
            return nlp

    def parse(self, file_path: Path) -> dict:
        text = self._extract_text(file_path)
        doc = self.nlp(text)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        skills = self._extract_skills(text)
        projects = self._extract_bullets(lines, ("project", "projects"))
        education = self._extract_bullets(lines, ("education", "university", "college", "bachelor", "master"))
        experience = self._extract_experience(lines)
        name = next((ent.text for ent in doc.ents if ent.label_ == "PERSON"), lines[0] if lines else None)
        return {
            "name": name,
            "skills": skills,
            "projects": projects,
            "education": education,
            "experience": experience,
            "raw_text": text,
        }

    def _extract_text(self, file_path: Path) -> str:
        if file_path.suffix.lower() == ".pdf":
            with fitz.open(file_path) as document:
                return "\n".join(page.get_text("text") for page in document)
        if file_path.suffix.lower() == ".docx":
            document = Document(file_path)
            return "\n".join(paragraph.text for paragraph in document.paragraphs)
        raise ValueError("Unsupported resume format.")

    def _extract_skills(self, text: str) -> list[str]:
        canonical_skills = {
            "python", "sql", "power bi", "excel", "tableau", "machine learning", "data analysis",
            "fastapi", "next.js", "postgresql", "redis", "celery", "playwright", "nlp", "spacy",
            "openai", "javascript", "typescript", "react", "analytics", "etl", "aws",
        }
        lowered = text.lower()
        hits = [skill.title() for skill in canonical_skills if skill in lowered]
        return sorted(set(hits))

    def _extract_bullets(self, lines: list[str], keywords: tuple[str, ...]) -> list[str]:
        output: list[str] = []
        for line in lines:
            lowered = line.lower()
            if any(keyword in lowered for keyword in keywords):
                output.append(line[:220])
        return output[:8]

    def _extract_experience(self, lines: list[str]) -> list[dict]:
        experience: list[dict] = []
        role_regex = re.compile(r"(?P<title>[A-Za-z0-9 /&-]{3,60})\s+\|\s+(?P<company>[A-Za-z0-9 .,&-]{2,80})")
        for line in lines:
            match = role_regex.search(line)
            if match:
                experience.append(
                    {
                        "title": match.group("title").strip(),
                        "company": match.group("company").strip(),
                        "summary": line[:220],
                    }
                )
        return experience[:8]

