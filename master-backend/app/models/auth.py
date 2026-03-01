from pydantic import BaseModel, Field
from typing import Optional


class SignupRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=254)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=200)
    platform: str = Field("ambi", pattern=r"^(ambi|operato|life)$")


class GoogleSignupRequest(BaseModel):
    """Google Sign-In: exchange Google credential JWT for Firebase tokens."""
    id_token: str = Field(..., description="Google credential JWT from client")
    full_name: Optional[str] = Field(None, max_length=200)
    platform: str = Field("ambi", pattern=r"^(ambi|operato|life)$")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=254)
    password: str = Field(..., min_length=1)
    platform: str = Field("ambi", pattern=r"^(ambi|operato|life)$")


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class TokenResponse(BaseModel):
    """Returned for token refresh — no user data included."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Registration flow responses ──

class SignupStepResponse(BaseModel):
    """Returned after initial signup — no tokens yet, email verification required."""
    user_id: str
    email: str
    step: str = "verify_email"
    message: str = "Verification code sent to your email"


class VerifyEmailRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=254)
    token: str = Field(..., min_length=6, max_length=6)
    platform: str = Field("ambi", pattern=r"^(ambi|operato|life)$")


class VerifyEmailResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    step: str = "done"
    message: str = "Email verified! Registration complete."


class ResendEmailRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=254)
    platform: str = Field("ambi", pattern=r"^(ambi|operato|life)$")


class VerifyPhoneRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    code: str = Field(..., min_length=4, max_length=8)


class VerifyPhoneResponse(BaseModel):
    success: bool
    message: str
    fully_registered: bool = True


# ── OTP ──

class OtpSendRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    purpose: str = Field(default="sos_verification")


class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    code: str = Field(..., min_length=4, max_length=8)
    purpose: str = Field(default="sos_verification")


class OtpResponse(BaseModel):
    success: bool
    message: str


class RefreshRequest(BaseModel):
    refresh_token: str
