"""
Gmail OAuth Connection
GET  /careers/gmail/status      — Check if Gmail is connected
GET  /careers/gmail/auth-url    — Get Google OAuth URL to start connection
POST /careers/gmail/callback    — Handle OAuth callback, save tokens
DELETE /careers/gmail/disconnect — Disconnect Gmail
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.deps import get_current_user
from app.models.careers import GmailConnection

log = logging.getLogger(__name__)
router = APIRouter(prefix="/careers/gmail", tags=["Gmail"])

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
]


class GmailCallbackRequest(BaseModel):
    code: str
    redirect_uri: str


@router.get("/status")
def gmail_status(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    conn = db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()
    if not conn or not conn.is_active:
        return {"connected": False, "gmail_address": None}
    return {
        "connected": True,
        "gmail_address": conn.gmail_address,
        "connected_since": conn.created_at.isoformat(),
        "scopes": conn.scopes or [],
    }


@router.get("/auth-url")
def get_auth_url(
    redirect_uri: str = Query(...),
    user_id: str = Depends(get_current_user),
):
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(
            status_code=501,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Render.",
        )

    try:
        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uris": [redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = redirect_uri
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=user_id,
        )
        return {"auth_url": auth_url}
    except Exception as exc:
        log.error("Gmail auth URL error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate OAuth URL")


@router.post("/callback")
def gmail_callback(
    req: GmailCallbackRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth not configured.")

    try:
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uris": [req.redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = req.redirect_uri
        flow.fetch_token(code=req.code)
        creds = flow.credentials

        # Get email address
        service = build("oauth2", "v2", credentials=creds)
        user_info = service.userinfo().get().execute()
        gmail_address = user_info.get("email", "")

        # Save or update connection
        conn = db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()
        if conn:
            conn.gmail_address = gmail_address
            conn.access_token = creds.token
            conn.refresh_token = creds.refresh_token or conn.refresh_token
            conn.token_expiry = creds.expiry
            conn.scopes = list(creds.scopes or SCOPES)
            conn.is_active = True
        else:
            conn = GmailConnection(
                user_id=user_id,
                gmail_address=gmail_address,
                access_token=creds.token,
                refresh_token=creds.refresh_token,
                token_expiry=creds.expiry,
                scopes=list(creds.scopes or SCOPES),
                is_active=True,
            )
            db.add(conn)

        db.commit()
        db.refresh(conn)

        return {
            "connected": True,
            "gmail_address": conn.gmail_address,
            "message": f"Successfully connected {conn.gmail_address}",
        }

    except Exception as exc:
        log.error("Gmail callback error: %s", exc)
        raise HTTPException(status_code=500, detail=f"OAuth failed: {exc}")


@router.delete("/disconnect", status_code=200)
def disconnect_gmail(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    conn = db.query(GmailConnection).filter(GmailConnection.user_id == user_id).first()
    if conn:
        conn.is_active = False
        conn.access_token = None
        conn.refresh_token = None
        db.commit()
    return {"connected": False, "message": "Gmail disconnected successfully"}
