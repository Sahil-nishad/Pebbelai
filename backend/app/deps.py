from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db


@dataclass(slots=True)
class AuthenticatedUser:
    id: str
    email: str


def get_current_user(
    x_pebel_user_id: str | None = Header(default=None),
    x_pebel_user_email: str | None = Header(default=None),
    x_internal_service_key: str | None = Header(default=None),
) -> AuthenticatedUser:
    settings = get_settings()
    if x_internal_service_key != settings.careers_internal_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service credentials.")
    if not x_pebel_user_id or not x_pebel_user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user context.")
    return AuthenticatedUser(id=x_pebel_user_id, email=x_pebel_user_email)


def db_session(db: Session = Depends(get_db)) -> Session:
    return db

