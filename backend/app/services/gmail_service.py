import base64
import smtplib
from email.message import EmailMessage
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import get_settings


class GmailService:
    SEND_SCOPE = ["https://www.googleapis.com/auth/gmail.send"]

    def build_client(self, refresh_token: str | None = None):
        settings = get_settings()
        if not settings.gmail_client_id or not settings.gmail_client_secret or not (refresh_token or settings.gmail_refresh_token):
            return None
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token or settings.gmail_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.gmail_client_id,
            client_secret=settings.gmail_client_secret,
            scopes=self.SEND_SCOPE,
        )
        return build("gmail", "v1", credentials=credentials, cache_discovery=False)

    def send_message(self, *, to_email: str, subject: str, body: str, resume_path: Path | None, refresh_token: str | None = None) -> str:
        settings = get_settings()
        message = EmailMessage()
        message["To"] = to_email
        message["From"] = settings.gmail_sender_email or settings.smtp_from_email or settings.smtp_user or "careers@localhost"
        message["Subject"] = subject
        message.set_content(body)

        if resume_path and resume_path.exists():
            payload = resume_path.read_bytes()
            message.add_attachment(
                payload,
                maintype="application",
                subtype="octet-stream",
                filename=resume_path.name,
            )

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        service = self.build_client(refresh_token=refresh_token)
        if service is not None:
            response = service.users().messages().send(userId="me", body={"raw": raw}).execute()
            return str(response["id"])

        if settings.smtp_host and settings.smtp_user and settings.smtp_pass:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_pass)
                server.send_message(message)
            return f"smtp-{subject[:24]}"

        return f"local-{subject[:24]}"
