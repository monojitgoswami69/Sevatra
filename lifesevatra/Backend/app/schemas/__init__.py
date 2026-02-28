from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.hospital import (
    HospitalCreate,
    HospitalRead,
    HospitalLogin,
    AuthResponse,
)
from app.schemas.admission import (
    AdmissionCreate,
    AdmissionRead,
    AdmissionUpdate,
    VitalsUpdate,
    ClinicalUpdate,
    DischargeRequest,
    DashboardStatsData,
    BedOccupancy,
)
from app.schemas.bed import BedRead, BedStatsType, BedStatsData, BedAvailabilityData
from app.schemas.staff import (
    StaffCreate,
    StaffRead,
    StaffUpdate,
    StaffStatsData,
)
from app.schemas.clinical_note import ClinicalNoteCreate, ClinicalNoteRead
from app.schemas.schedule import ScheduleSlotRead, ScheduleSlotUpdate
from app.schemas.severity import VitalSigns, SeverityResult

__all__ = [
    "ApiResponse",
    "PaginatedResponse",
    "PaginationMeta",
    "HospitalCreate",
    "HospitalRead",
    "HospitalLogin",
    "AuthResponse",
    "AdmissionCreate",
    "AdmissionRead",
    "AdmissionUpdate",
    "VitalsUpdate",
    "ClinicalUpdate",
    "DischargeRequest",
    "DashboardStatsData",
    "BedOccupancy",
    "BedRead",
    "BedStatsType",
    "BedStatsData",
    "BedAvailabilityData",
    "StaffCreate",
    "StaffRead",
    "StaffUpdate",
    "StaffStatsData",
    "ClinicalNoteCreate",
    "ClinicalNoteRead",
    "ScheduleSlotRead",
    "ScheduleSlotUpdate",
    "VitalSigns",
    "SeverityResult",
]
