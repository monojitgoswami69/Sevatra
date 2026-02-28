"""Schedule slot schemas."""

from datetime import date
from typing import Optional
from pydantic import BaseModel


class ScheduleSlotRead(BaseModel):
    id: int
    time: str
    patient_name: Optional[str] = None
    patient_id: Optional[int] = None
    type: str  # consultation|follow-up|procedure|rounds|break
    status: str  # scheduled|completed|in-progress|cancelled|no-show
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ScheduleSlotUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
