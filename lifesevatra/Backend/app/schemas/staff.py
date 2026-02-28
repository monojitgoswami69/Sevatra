"""Staff schemas."""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class StaffCreate(BaseModel):
    fullName: str
    role: str  # doctor|surgeon|specialist|nurse
    specialty: str
    qualification: Optional[str] = None
    experienceYears: Optional[int] = 0
    contact: Optional[str] = None
    email: Optional[str] = None
    shift: Optional[str] = "day"  # day|night|rotating
    maxPatients: Optional[int] = 10


class StaffRead(BaseModel):
    id: int
    staff_id: str
    full_name: str
    role: str
    specialty: str
    qualification: Optional[str] = None
    experience_years: int
    contact: Optional[str] = None
    email: Optional[str] = None
    on_duty: bool
    shift: str
    max_patients: int
    current_patient_count: int
    joined_date: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class StaffUpdate(BaseModel):
    fullName: Optional[str] = None
    role: Optional[str] = None
    specialty: Optional[str] = None
    qualification: Optional[str] = None
    experienceYears: Optional[int] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    shift: Optional[str] = None
    maxPatients: Optional[int] = None
    onDuty: Optional[bool] = None


class StaffStatsData(BaseModel):
    total_staff: str
    total_doctors: str
    total_nurses: str
    on_duty: str
    off_duty: str
    total_assigned_patients: str
