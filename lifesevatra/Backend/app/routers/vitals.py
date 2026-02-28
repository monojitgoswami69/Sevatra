"""Vitals / severity calculation route."""

from fastapi import APIRouter
from app.schemas.severity import VitalSigns, SeverityResult
from app.schemas.common import ApiResponse
from app.utils.severity import calculate_severity, validate_vitals

router = APIRouter(prefix="/vitals", tags=["vitals"])


@router.post("/calculate-severity", response_model=ApiResponse[SeverityResult])
async def calc_severity(payload: VitalSigns):
    """Stateless severity score calculation."""
    result = calculate_severity(
        heart_rate=payload.heartRate,
        spo2=payload.spo2,
        resp_rate=payload.respRate,
        temperature=payload.temperature,
        bp_systolic=payload.bpSystolic,
        bp_diastolic=payload.bpDiastolic,
    )
    return {"success": True, "message": "OK", "data": result}


@router.post("/validate")
async def validate_vital_signs(payload: VitalSigns):
    """Validate that vital sign values are within plausible instrument ranges."""
    result = validate_vitals(
        heart_rate=payload.heartRate,
        spo2=payload.spo2,
        resp_rate=payload.respRate,
        temperature=payload.temperature,
        bp_systolic=payload.bpSystolic,
        bp_diastolic=payload.bpDiastolic,
    )
    return {"success": True, "message": "OK", "data": result}
