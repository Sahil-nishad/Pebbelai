from fastapi import Header, HTTPException, status
from app.config import get_settings


async def verify_internal(x_internal_key: str = Header(None)) -> None:
    """Verify the request came from our own Vercel frontend."""
    settings = get_settings()
    if settings.internal_api_key and x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


async def get_current_user(
    x_user_id: str = Header(None),
    x_internal_key: str = Header(None),
) -> str:
    """Extract user ID and verify internal key."""
    settings = get_settings()
    if settings.internal_api_key and x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return x_user_id