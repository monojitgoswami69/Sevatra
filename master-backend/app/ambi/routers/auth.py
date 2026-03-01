"""Authentication routes for AmbiSevatra + OperatoSevatra.

Covers signup, email verification, login, token refresh, logout,
general-purpose OTP (SOS), and cron-based cleanup of unverified users.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.ambi.models import (
    SignupRequest,
    GoogleSignupRequest,
    LoginRequest,
    SignupStepResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    ResendEmailRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    OtpResponse,
    AuthResponse,
    TokenResponse,
    RefreshRequest,
)
from app.ambi.services.auth_service import auth_service
from app.ambi.services.twilio_service import twilio_service
from app.core.dependencies import get_current_user
from app.config import get_settings

_security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Registration Flow ──


@router.post("/signup", response_model=SignupStepResponse)
async def signup(data: SignupRequest):
    """Step 1: Create account with email_verified=False.

    Creates the user in Firebase Auth immediately but blocks login
    until email is verified via OTP.
    """
    return await auth_service.signup(data)


@router.post("/signup/google", response_model=AuthResponse)
async def signup_google(data: GoogleSignupRequest):
    """Register or login via Google Sign-In.

    Frontend sends the Google credential JWT. Backend verifies it and
    creates a platform-specific Firebase Auth user.
    """
    return await auth_service.google_signup(data.id_token, data.full_name, data.platform)


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(data: VerifyEmailRequest):
    """Step 2: Verify email with the 6-digit code from the inbox.

    On success, marks email as verified and returns access + refresh tokens.
    """
    return await auth_service.verify_email(data.email, data.token, data.platform)


@router.post("/resend-email")
async def resend_email(data: ResendEmailRequest):
    """Resend the email verification code."""
    return await auth_service.resend_email_code(data.email, data.platform)


# ── Login / Token ──


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """Authenticate with email and password. Rejects unverified emails."""
    return await auth_service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest):
    """Refresh the access token using a refresh token."""
    return await auth_service.refresh_token(data.refresh_token)


# ── Session Management ──


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    user: dict = Depends(get_current_user),
):
    """Sign out the current user."""
    return await auth_service.logout(credentials.credentials)


# ── General OTP (for SOS etc.) ──


@router.post("/otp/send", response_model=OtpResponse)
async def send_otp(data: OtpSendRequest):
    """Send an OTP to the given phone number (general purpose)."""
    result = await twilio_service.send_otp(data.phone, data.purpose)
    return OtpResponse(**result)


@router.post("/otp/verify", response_model=OtpResponse)
async def verify_otp(data: OtpVerifyRequest):
    """Verify an OTP code (general purpose)."""
    result = await twilio_service.verify_otp(data.phone, data.code, data.purpose)
    return OtpResponse(**result)


# ── Internal / Cron ──


@router.post("/internal/cleanup")
async def cleanup_unverified(x_cron_secret: str = Header(None)):
    """Delete unverified users older than the configured TTL.

    Protected by X-Cron-Secret header.
    """
    settings = get_settings()
    if not settings.cron_secret or x_cron_secret != settings.cron_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing cron secret",
        )
    return await auth_service.cleanup_unverified_users()
