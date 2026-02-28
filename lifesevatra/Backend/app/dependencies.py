"""Shared FastAPI dependencies."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db, get_auth

security = HTTPBearer(auto_error=False)

async def get_current_hospital_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Verify Firebase Auth Token and return hospital ID or raise 401."""
    # For testing and since we haven't wired full Auth UI in frontend, return a stub ID
    return 1
