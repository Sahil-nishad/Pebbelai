from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.careers import Application, FollowUp, Resume
from app.services.gmail_service import GmailService


class FollowUpService:
    """Generates and sends follow-up emails for unanswered applications."""

    def __init__(self) -> None:
        self.gmail = GmailService()

    def send_followup(
        self,
        *,
        db: Session,
        user_id: str,
        application_id: str,
        subject: str,
        body: str,
    ) -> FollowUp:
        application = db.get(Application, application_id)
        if not application or application.user_id != user_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Application not found.")

        resume_path: Path | None = None
        if application.resume_id:
            resume = db.get(Resume, application.resume_id)
            if resume:
                resume_path = Path(resume.file_url)

        recruiter_email: str | None = None
        if application.recruiter_id:
            from app.models.careers import Recruiter
            recruiter = db.get(Recruiter, application.recruiter_id)
            if recruiter:
                recruiter_email = recruiter.email

        message_id: str | None = None
        status = "pending"
        if recruiter_email:
            try:
                message_id = self.gmail.send_message(
                    to_email=recruiter_email,
                    subject=subject,
                    body=body,
                    resume_path=resume_path,
                )
                status = "sent"
            except Exception:
                status = "failed"

        followup = FollowUp(
            user_id=user_id,
            application_id=application_id,
            subject=subject,
            body=body,
            sent_status=status,
            gmail_message_id=message_id,
        )
        db.add(followup)
        db.commit()
        db.refresh(followup)
        return followup

    def list_followups(self, db: Session, user_id: str, application_id: str | None = None) -> list[FollowUp]:
        query = select(FollowUp).where(FollowUp.user_id == user_id).order_by(FollowUp.created_at.desc())
        if application_id:
            query = query.where(FollowUp.application_id == application_id)
        return list(db.scalars(query))

    def generate_followup_body(self, original_subject: str, recruiter_name: str | None) -> dict[str, str]:
        """Simple template-based follow-up (no additional API calls)."""
        name = recruiter_name or "there"
        subject = f"Re: {original_subject}"
        body = (
            f"Hi {name},\n\n"
            "I wanted to follow up on my previous email regarding the opportunity. "
            "I remain very interested and would love to connect if you have a moment.\n\n"
            "Please let me know if you need any additional information.\n\n"
            "Best regards"
        )
        return {"subject": subject, "body": body}
