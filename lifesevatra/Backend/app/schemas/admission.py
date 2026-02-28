"""Admission / patient schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BloodPressure(BaseModel):
    systolic: Optional[float] = None
    diastolic: Optional[float] = None


class AdmissionCreate(BaseModel):
    name: str
    age: int
    gender: str  # male|female|other
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


class AdmissionRead(BaseModel):
    """Matches the frontend AdmittedPatient interface."""
    patient_id: int
    patient_name: str
    age: int
    gender: str
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    gov_id_type: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[str] = None
    whatsapp_number: Optional[str] = None
    bed_id: str
    admission_date: str
    heart_rate: Optional[float] = None
    spo2: Optional[float] = None
    resp_rate: Optional[float] = None
    temperature: Optional[float] = None
    blood_pressure: BloodPressure
    measured_time: str
    presenting_ailment: Optional[str] = None
    medical_history: Optional[str] = None
    clinical_notes: Optional[str] = None
    lab_results: Optional[str] = None
    severity_score: int
    condition: str
    doctor: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class AdmissionUpdate(BaseModel):
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None


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


class BedOccupancy(BaseModel):
    icuOccupied: int
    hduOccupied: int
    generalOccupied: int


class DashboardStatsData(BaseModel):
    totalPatients: int
    criticalPatients: int
    admittedToday: int
    dischargedToday: int
    bedOccupancy: BedOccupancy
