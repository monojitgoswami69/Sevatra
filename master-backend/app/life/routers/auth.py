"""Hospital authentication routes for LifeSevatra.

Fix: replaced raw ``body: dict`` with ``RefreshTokenRequest`` model.
"""

from fastapi import APIRouter, HTTPException, status

from app.life.models import (
    HospitalLoginRequest,
    HospitalRegisterRequest,
    HospitalResendEmailRequest,
    HospitalVerifyEmailRequest,
    RefreshTokenRequest,
)
from app.life.services.auth_service import life_auth_service

router = APIRouter(prefix="/life/auth", tags=["Life — Auth"])


@router.post("/register")
async def register(data: HospitalRegisterRequest):
    """Register a new hospital account. Sends an email verification OTP."""
    return await life_auth_service.register(data)


@router.post("/login")
async def login(data: HospitalLoginRequest):
    """Login with email & password. Requires verified email."""
    return await life_auth_service.login(data.email, data.password)


@router.post("/verify-email")
async def verify_email(data: HospitalVerifyEmailRequest):
    """Verify the email OTP sent during registration."""
    return await life_auth_service.verify_email(data.email, data.token)


@router.post("/resend-email")
async def resend_email(data: HospitalResendEmailRequest):
    """Resend the email verification OTP."""
    return await life_auth_service.resend_email_code(data.email)


@router.post("/refresh-token")
async def refresh_token(body: RefreshTokenRequest):
    """Exchange a refresh token for a new access token."""
    return await life_auth_service.refresh_token(body.refresh_token)
