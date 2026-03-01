"""Pydantic models for the OperatoSevatra domain.

Covers: operator profiles, ambulances, and dashboard stats.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ──


class OperatorType(str, Enum):
    INDIVIDUAL = "individual"
    PROVIDER = "provider"


class AmbulanceType(str, Enum):
    BASIC = "basic"
    ADVANCED = "advanced"
    PATIENT_TRANSPORT = "patient_transport"
    NEONATAL = "neonatal"
    AIR = "air"


class AmbulanceStatus(str, Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    MAINTENANCE = "maintenance"
    OFF_DUTY = "off_duty"


# ── Operator Registration ──


class OperatorRegisterRequest(BaseModel):
    operator_type: OperatorType
    full_name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=10, max_length=20)
    facility_name: Optional[str] = Field(None, max_length=300)
    facility_address: Optional[str] = Field(None, max_length=500)
    facility_phone: Optional[str] = Field(None, max_length=20)
    license_number: Optional[str] = Field(None, max_length=100)


class OperatorProfileResponse(BaseModel):
    id: str
    user_id: str
    operator_type: OperatorType
    full_name: str
    phone: str
    facility_name: Optional[str] = None
    facility_address: Optional[str] = None
    facility_phone: Optional[str] = None
    license_number: Optional[str] = None
    is_verified: bool = False
    ambulance_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class OperatorProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    facility_name: Optional[str] = Field(None, max_length=300)
    facility_address: Optional[str] = Field(None, max_length=500)
    facility_phone: Optional[str] = Field(None, max_length=20)
    license_number: Optional[str] = Field(None, max_length=100)


# ── Ambulance ──


class AmbulanceCreate(BaseModel):
    vehicle_number: str = Field(..., min_length=1, max_length=20)
    ambulance_type: AmbulanceType = AmbulanceType.BASIC
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_year: Optional[int] = Field(None, ge=1990, le=2030)
    has_oxygen: bool = False
    has_defibrillator: bool = False
    has_stretcher: bool = True
    has_ventilator: bool = False
    has_first_aid: bool = True
    driver_name: str = Field(..., min_length=1, max_length=200)
    driver_phone: str = Field(..., min_length=10, max_length=20)
    driver_license_number: str = Field(..., min_length=1, max_length=50)
    driver_experience_years: Optional[int] = Field(None, ge=0, le=50)
    driver_photo_url: Optional[str] = Field(None, max_length=500)
    base_latitude: Optional[float] = Field(None, ge=-90, le=90)
    base_longitude: Optional[float] = Field(None, ge=-180, le=180)
    base_address: Optional[str] = Field(None, max_length=500)
    service_radius_km: Optional[float] = Field(None, ge=1, le=500)
    price_per_km: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)


class AmbulanceUpdate(BaseModel):
    vehicle_number: Optional[str] = Field(None, max_length=20)
    ambulance_type: Optional[AmbulanceType] = None
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_year: Optional[int] = Field(None, ge=1990, le=2030)
    has_oxygen: Optional[bool] = None
    has_defibrillator: Optional[bool] = None
    has_stretcher: Optional[bool] = None
    has_ventilator: Optional[bool] = None
    has_first_aid: Optional[bool] = None
    driver_name: Optional[str] = Field(None, max_length=200)
    driver_phone: Optional[str] = Field(None, max_length=20)
    driver_license_number: Optional[str] = Field(None, max_length=50)
    driver_experience_years: Optional[int] = Field(None, ge=0, le=50)
    driver_photo_url: Optional[str] = Field(None, max_length=500)
    base_latitude: Optional[float] = Field(None, ge=-90, le=90)
    base_longitude: Optional[float] = Field(None, ge=-180, le=180)
    base_address: Optional[str] = Field(None, max_length=500)
    service_radius_km: Optional[float] = Field(None, ge=1, le=500)
    price_per_km: Optional[float] = Field(None, ge=0)
    status: Optional[AmbulanceStatus] = None
    notes: Optional[str] = Field(None, max_length=1000)


class AmbulanceResponse(BaseModel):
    id: str
    operator_id: str
    vehicle_number: str
    ambulance_type: AmbulanceType
    status: AmbulanceStatus
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    has_oxygen: bool = False
    has_defibrillator: bool = False
    has_stretcher: bool = True
    has_ventilator: bool = False
    has_first_aid: bool = True
    driver_name: str
    driver_phone: str
    driver_license_number: str
    driver_experience_years: Optional[int] = None
    driver_photo_url: Optional[str] = None
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None
    base_address: Optional[str] = None
    service_radius_km: Optional[float] = None
    price_per_km: Optional[float] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── Dashboard Stats ──


class DashboardStatsResponse(BaseModel):
    total_ambulances: int = 0
    available_ambulances: int = 0
    on_trip_ambulances: int = 0
    maintenance_ambulances: int = 0
    off_duty_ambulances: int = 0
    total_trips_completed: int = 0
    operator_type: OperatorType
    facility_name: Optional[str] = None
