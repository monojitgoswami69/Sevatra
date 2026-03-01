from pydantic import BaseModel, Field
from typing import Optional


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
    label: str = Field(..., min_length=1, max_length=50)  # Home, Work, custom
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
