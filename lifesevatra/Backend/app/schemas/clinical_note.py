"""Clinical note schemas."""

from datetime import datetime
from pydantic import BaseModel


class ClinicalNoteCreate(BaseModel):
    admission_id: int
    patient_name: str
    note: str
    type: str  # observation|prescription|discharge-summary|progress


class ClinicalNoteRead(BaseModel):
    id: int
    patient_id: int  # maps from admission_id for frontend compat
    patient_name: str
    note: str
    type: str
    created_at: str

    class Config:
        from_attributes = True
