import hashlib
import time
from collections import defaultdict, deque

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

_RATE_LIMIT_BUCKETS: dict[str, deque[float]] = defaultdict(deque)


def enforce_rate_limit(identifier: str, limit: int, window_seconds: int) -> None:
    now = time.time()
    bucket = _RATE_LIMIT_BUCKETS[identifier]
    while bucket and bucket[0] <= now - window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded.")
    bucket.append(now)


async def validate_resume_upload(upload: UploadFile) -> None:
    settings = get_settings()
    suffix = "." + upload.filename.rsplit(".", 1)[-1].lower() if upload.filename and "." in upload.filename else ""
    if suffix not in settings.allowed_resume_extensions:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
    data = await upload.read()
    await upload.seek(0)
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds the configured size limit.")


def stable_filename(user_id: str, original_name: str) -> str:
    suffix = "." + original_name.rsplit(".", 1)[-1].lower()
    digest = hashlib.sha256(f"{user_id}:{original_name}:{time.time()}".encode("utf-8")).hexdigest()[:24]
    return f"{digest}{suffix}"

