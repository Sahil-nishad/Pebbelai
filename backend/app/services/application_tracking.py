from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.careers import Application


class ApplicationTrackingService:
    def list_applications(self, db: Session, user_id: str) -> list[Application]:
        return list(
            db.scalars(
                select(Application).where(Application.user_id == user_id).order_by(Application.created_at.desc())
            )
        )

    def analytics(self, db: Session, user_id: str) -> dict:
        total = db.scalar(select(func.count()).select_from(Application).where(Application.user_id == user_id)) or 0
        pending = db.scalar(
            select(func.count()).select_from(Application).where(Application.user_id == user_id, Application.reply_status == "pending")
        ) or 0
        replies = db.scalar(
            select(func.count()).select_from(Application).where(Application.user_id == user_id, Application.reply_status == "replied")
        ) or 0
        recent = self.list_applications(db, user_id)[:6]
        response_rate = round((replies / total) * 100, 2) if total else 0.0
        return {
            "total_applications": total,
            "pending_replies": pending,
            "recruiter_responses": replies,
            "response_rate": response_rate,
            "recent_outreach": recent,
        }
