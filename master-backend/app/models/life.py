"""Pydantic models for the LifeSevatra (hospital management) domain."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ━━━━━━━━━━━━━━━━━━━━━━━━ Hospital Auth ━━━━━━━━━━━━━━━━━━━━━━━━


class HospitalRegisterRequest(BaseModel):
    """Hospital registration — creates Firebase user + hospital profile."""
    hospital_name: str = Field(..., min_length=1, max_length=300)
    email: str = Field(..., min_length=1, max_length=254)
    password: str = Field(..., min_length=6, max_length=128)
    contact: str = Field(..., min_length=1, max_length=20)
    hospital_address: str = Field("", max_length=500)
    icu_beds: int = Field(0, ge=0, le=500)
    hdu_beds: int = Field(0, ge=0, le=500)
    general_beds: int = Field(0, ge=0, le=2000)


class HospitalLoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=254)
    password: str = Field(..., min_length=1)


class HospitalVerifyEmailRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=254)
    token: str = Field(..., min_length=6, max_length=6)


class HospitalResendEmailRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=254)


class HospitalProfileResponse(BaseModel):
    id: str
    hospital_name: str
    email: str
    contact: str
    hospital_address: str = ""
    icu_beds: int = 0
    hdu_beds: int = 0
    general_beds: int = 0
    status: str = "active"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class HospitalProfileUpdate(BaseModel):
    hospital_name: Optional[str] = Field(None, max_length=300)
    contact: Optional[str] = Field(None, max_length=20)
    hospital_address: Optional[str] = Field(None, max_length=500)


# ━━━━━━━━━━━━━━━━━━━━━━━━ Admissions ━━━━━━━━━━━━━━━━━━━━━━━━


class AdmissionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., pattern=r"^(male|female|other)$")
    bloodGroup: Optional[str] = None
    emergencyContact: Optional[str] = None
    presentingAilment: Optional[str] = None
    medicalHistory: Optional[str] = None
    clinicalNotes: Optional[str] = None
    labResults: Optional[str] = None
    heartRate: Optional[float] = None
    spo2: Optional[float] = None
    respRate: Optional[float] = None
    temperature: Optional[float] = None
    bpSystolic: Optional[float] = None
    bpDiastolic: Optional[float] = None
    govIdType: Optional[str] = None
    idPicture: Optional[str] = None
    patientPicture: Optional[str] = None
    guardianName: Optional[str] = None
    guardianRelation: Optional[str] = None
    guardianPhone: Optional[str] = None
    guardianEmail: Optional[str] = None
    whatsappNumber: Optional[str] = None
    address: Optional[str] = None


class VitalsUpdate(BaseModel):
    heartRate: Optional[float] = None
    spo2: Optional[float] = None
    respRate: Optional[float] = None
    temperature: Optional[float] = None
    bpSystolic: Optional[float] = None
    bpDiastolic: Optional[float] = None


class ClinicalUpdate(BaseModel):
    presentingAilment: Optional[str] = None
    medicalHistory: Optional[str] = None
    clinicalNotes: Optional[str] = None
    labResults: Optional[str] = None


class DischargeRequest(BaseModel):
    dischargeNotes: Optional[str] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━ Staff ━━━━━━━━━━━━━━━━━━━━━━━━


class StaffCreate(BaseModel):
    fullName: str = Field(..., min_length=1, max_length=200)
    role: str = Field(..., pattern=r"^(doctor|surgeon|specialist|nurse)$")
    specialty: str = Field(..., min_length=1, max_length=200)
    qualification: Optional[str] = None
    experienceYears: Optional[int] = Field(0, ge=0, le=60)
    contact: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    shift: Optional[str] = Field("day", pattern=r"^(day|night|rotating)$")
    maxPatients: Optional[int] = Field(10, ge=1, le=100)


class StaffUpdate(BaseModel):
    fullName: Optional[str] = Field(None, max_length=200)
    role: Optional[str] = None
    specialty: Optional[str] = None
    qualification: Optional[str] = None
    experienceYears: Optional[int] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    shift: Optional[str] = None
    maxPatients: Optional[int] = None
    onDuty: Optional[bool] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━ Severity ━━━━━━━━━━━━━━━━━━━━━━━━


# ━━━━━━━━━━━━━━━━━━━━━━━━ Doctor Portal ━━━━━━━━━━━━━━━━━━━━━━━━


class ClinicalNoteCreate(BaseModel):
    patient_id: str
    patient_name: str
    note: str = Field(..., min_length=1, max_length=5000)
    type: str = Field("progress", pattern=r"^(observation|prescription|discharge-summary|progress)$")


class ScheduleStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(scheduled|completed|in-progress|cancelled|no-show)$")


class DoctorProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=200)
    specialty: Optional[str] = Field(None, max_length=200)
    qualification: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=60)
    contact: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=2000)
    languages: Optional[list[str]] = None
    consultation_fee: Optional[int] = Field(None, ge=0)
    shift: Optional[str] = Field(None, pattern=r"^(day|night|rotating)$")


# ━━━━━━━━━━━━━━━━━━━━━━━━ Severity ━━━━━━━━━━━━━━━━━━━━━━━━


class SeverityRequest(BaseModel):
    heartRate: Optional[float] = None
    spo2: Optional[float] = None
    respRate: Optional[float] = None
    temperature: Optional[float] = None
    bpSystolic: Optional[float] = None
    bpDiastolic: Optional[float] = None
