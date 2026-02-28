"""Bed schemas."""

from typing import Optional
from pydantic import BaseModel


class BedRead(BaseModel):
    bed_id: str
    bed_type: str  # ICU|HDU|GENERAL
    bed_number: int
    is_available: bool
    current_patient_id: Optional[int] = None
    last_occupied_at: Optional[str] = None
    patient_name: Optional[str] = None
    condition: Optional[str] = None

    class Config:
        from_attributes = True


class BedStatsType(BaseModel):
    bed_type: str
    total_beds: str
    available_beds: str
    occupied_beds: str


class BedStatsTotals(BaseModel):
    total_beds: int
    available_beds: int
    occupied_beds: int


class BedStatsData(BaseModel):
    by_type: list[BedStatsType]
    totals: BedStatsTotals


class BedAvailabilityData(BaseModel):
    occupiedBeds: int
    lowestBedId: int
    highestBedId: int
    availableBedRange: str
