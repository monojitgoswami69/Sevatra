from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
