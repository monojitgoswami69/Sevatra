"""Pydantic models for the AmbiSevatra domain.

Covers: authentication, user profiles, bookings, SOS events, and OTP.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ━━━━━━━━━━━━━━━━━━━━━━━━ Authentication ━━━━━━━━━━━━━━━━━━━━━━━━


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


class RefreshRequest(BaseModel):
    refresh_token: str


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


# ── Registration flow ──


class SignupStepResponse(BaseModel):
    """After initial signup — no tokens yet, email verification required."""
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


# ━━━━━━━━━━━━━━━━━━━━━━━━ User Profile ━━━━━━━━━━━━━━━━━━━━━━━━


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[str] = Field(None, max_length=30)
    blood_group: Optional[str] = Field(None, max_length=5)


class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone_verified: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AddressCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=50)
    address: str = Field(..., min_length=1, max_length=500)
    icon: str = Field(default="location_on", max_length=50)


class AddressResponse(BaseModel):
    id: str
    user_id: str
    label: str
    address: str
    icon: str
    created_at: Optional[str] = None


class EmergencyContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=1, max_length=20)


class EmergencyContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    created_at: Optional[str] = None


class MedicalConditionCreate(BaseModel):
    condition: str = Field(..., min_length=1, max_length=200)


class MedicalConditionResponse(BaseModel):
    id: str
    user_id: str
    condition: str
    created_at: Optional[str] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━ Bookings ━━━━━━━━━━━━━━━━━━━━━━━━


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingCreate(BaseModel):
    patient_name: str = Field(..., min_length=1, max_length=200)
    patient_phone: str = Field(..., min_length=1, max_length=20)
    patient_age: Optional[int] = Field(None, ge=0, le=150)
    patient_gender: Optional[str] = Field(None, max_length=30)
    pickup_address: str = Field(..., min_length=1, max_length=500)
    destination: str = Field(..., min_length=1, max_length=500)
    scheduled_date: str = Field(..., description="YYYY-MM-DD")
    scheduled_time: str = Field(..., description="HH:MM (24h)")
    reason: Optional[str] = Field(None, max_length=500)
    special_needs: Optional[dict] = Field(default_factory=dict)
    additional_notes: Optional[str] = Field(None, max_length=1000)
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Pickup GPS lat for ambulance assignment")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Pickup GPS lng for ambulance assignment")


class BookingUpdate(BaseModel):
    patient_name: Optional[str] = Field(None, max_length=200)
    patient_phone: Optional[str] = Field(None, max_length=20)
    patient_age: Optional[int] = Field(None, ge=0, le=150)
    patient_gender: Optional[str] = Field(None, max_length=30)
    pickup_address: Optional[str] = Field(None, max_length=500)
    destination: Optional[str] = Field(None, max_length=500)
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    reason: Optional[str] = Field(None, max_length=500)
    special_needs: Optional[dict] = None
    additional_notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[BookingStatus] = None


# ── Assigned Ambulance (embedded in bookings & SOS) ──


class AssignedAmbulance(BaseModel):
    ambulance_id: str
    vehicle_number: str
    ambulance_type: str = "basic"
    driver_name: str = ""
    driver_phone: str = ""
    driver_photo_url: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    has_oxygen: bool = False
    has_defibrillator: bool = False
    has_stretcher: bool = True
    has_ventilator: bool = False
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None
    base_address: Optional[str] = None
    distance_km: Optional[float] = None
    operator_id: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    user_id: str
    patient_name: str
    patient_phone: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    pickup_address: str
    destination: str
    scheduled_date: str
    scheduled_time: str
    reason: Optional[str] = None
    special_needs: Optional[dict] = None
    additional_notes: Optional[str] = None
    status: BookingStatus
    assigned_ambulance: Optional[AssignedAmbulance] = None
    booking_type: Optional[str] = None
    sos_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━ SOS ━━━━━━━━━━━━━━━━━━━━━━━━


class SosStatus(str, Enum):
    INITIATED = "initiated"
    COUNTDOWN = "countdown"
    OTP_SENT = "otp_sent"
    VERIFIED = "verified"
    DISPATCHED = "dispatched"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class SosActivateRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = Field(None, max_length=500)


class SosVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    otp_code: str = Field(..., min_length=4, max_length=8)


class SosCancelRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class SosResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    status: SosStatus
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    verified_phone: Optional[str] = None
    cancel_reason: Optional[str] = None
    assigned_ambulance: Optional[AssignedAmbulance] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
