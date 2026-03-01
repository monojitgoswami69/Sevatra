"""Shared authentication dependencies.

Provides ``get_current_user`` — validates Firebase ID tokens from
the Authorization header and returns the decoded user payload.
"""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.firebase_client import get_firebase_auth

logger = logging.getLogger(__name__)
security = HTTPBearer()

_PLATFORM_PREFIXES = ("ambi.", "operato.", "life.")


def _strip_platform_prefix(email: str) -> str:
    """Strip the platform prefix that was added for Firebase Auth isolation."""
    for prefix in _PLATFORM_PREFIXES:
        if email.startswith(prefix):
            return email[len(prefix):]
    return email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validate the Firebase ID token and return the user payload."""
    token = credentials.credentials

    try:
        auth = get_firebase_auth()
        decoded = auth.verify_id_token(token)
        raw_email = decoded.get("email", "")
        return {
            "id": decoded["uid"],
            "email": _strip_platform_prefix(raw_email),
            "phone": decoded.get("phone_number", ""),
        }
    except Exception as e:
        logger.warning("Token verification failed: %s", e)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )


# ── Optional variant (for endpoints that work with or without auth) ──

_optional_security = HTTPBearer(auto_error=False)


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_optional_security),
) -> dict | None:
    """Return the authenticated user if a valid token is present, else *None*.

    Unlike ``get_current_user`` this never raises 401 — endpoints that use it
    remain accessible to unauthenticated callers.
    """
    if credentials is None:
        return None

    token = credentials.credentials
    try:
        auth = get_firebase_auth()
        decoded = auth.verify_id_token(token)
        raw_email = decoded.get("email", "")
        return {
            "id": decoded["uid"],
            "email": _strip_platform_prefix(raw_email),
            "phone": decoded.get("phone_number", ""),
        }
    except Exception as e:
        logger.debug("Optional token verification failed: %s", e)
        return None
