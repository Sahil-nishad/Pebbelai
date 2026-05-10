import base64
from typing import Optional

from cryptography.fernet import Fernet

from app.config import get_settings

settings = get_settings()


def _get_encryption_key() -> bytes:
    if not settings.encryption_key:
        raise ValueError("ENCRYPTION_KEY not configured")
    return base64.urlsafe_b64encode(settings.encryption_key.encode("utf-8")[:32].ljust(32, b"0")[:32])


_fernet: Optional[Fernet] = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_get_encryption_key())
    return _fernet


def encrypt_token(token: str) -> str:
    return _get_fernet().encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode("utf-8")).decode("utf-8")