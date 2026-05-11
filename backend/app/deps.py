from fastapi import Header, HTTPException, status
import os

from app.config import get_settings

settings = get_settings()


async def get_current_user(
    x_user_id: str = Header(None),
    x_internal_key: str = Header(None)
) -> str:
    if settings.environment == "production":
        internal_key = os.getenv("CAREERS_INTERNAL_API_KEY")
        if internal_key and x_internal_key != internal_key:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid internal key")
            
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return x_user_id