from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery_app = Celery("pebelai_careers", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    beat_schedule={
        "refresh-recruiter-posts-every-6h": {
            "task": "careers.refresh_recruiter_posts",
            "schedule": crontab(minute=0, hour="*/6"),
            "kwargs": {"query_terms": None},
        },
    },
    timezone="UTC",
)

