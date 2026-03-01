from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
