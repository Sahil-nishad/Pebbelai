from fastapi import Header, HTTPException, status

from app.config import get_settings

settings = get_settings()


async def get_current_user(x_user_id: str = Header(None)) -> str:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return x_user_id