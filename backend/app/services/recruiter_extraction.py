import re
from email.utils import parseaddr


class RecruiterExtractionService:
    EMAIL_REGEX = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
    LINKEDIN_REGEX = re.compile(r"https?://(?:[\w]+\.)?linkedin\.com/[^\s)]+", re.IGNORECASE)

    def extract_emails(self, text: str) -> list[str]:
        candidates = {self._cleanup_email(match.group(0)) for match in self.EMAIL_REGEX.finditer(text)}
        return [email for email in sorted(candidates) if self._is_valid_email(email)]

    def extract_linkedin_url(self, text: str) -> str | None:
        match = self.LINKEDIN_REGEX.search(text)
        return match.group(0) if match else None

    def _cleanup_email(self, email: str) -> str:
        return email.strip(".,;:()[]{}<>").lower()

    def _is_valid_email(self, email: str) -> bool:
        _, parsed = parseaddr(email)
        return bool(parsed) and "." in parsed.split("@")[-1]

