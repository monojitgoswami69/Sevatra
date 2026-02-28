"""Hospital schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class HospitalCreate(BaseModel):
    hospital_name: str
    email: str
    contact: str
    hospital_address: str
    icu_beds: int = 0
    hdu_beds: int = 0
    general_beds: int = 0


class HospitalRead(BaseModel):
    id: int
    hospital_name: str
    email: str
    contact: str
    hospital_address: str
    icu_beds: int
    hdu_beds: int
    general_beds: int
    created_at: datetime

    class Config:
        from_attributes = True


class HospitalLogin(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    hospital: HospitalRead
