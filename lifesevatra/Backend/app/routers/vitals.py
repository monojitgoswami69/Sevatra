"""Vitals and severity calculation router."""

from fastapi import APIRouter
from app.schemas.severity import SeverityResult
from app.schemas.common import ApiResponse
from app.utils.severity import calculate_severity

router = APIRouter(prefix="/vitals", tags=["vitals"])

@router.post("/calculate-severity", response_model=ApiResponse[SeverityResult])
async def post_calculate_severity(payload: dict):
    # payload is dict to be flexible for test cases
    sev = calculate_severity(
        heart_rate=payload.get("heartRate"),
        spo2=payload.get("spo2"),
        resp_rate=payload.get("respRate"),
        temperature=payload.get("temperature"),
        bp_systolic=payload.get("bpSystolic"),
        bp_diastolic=payload.get("bpDiastolic"),
    )
    return {
        "success": True,
        "message": "Severity calculated successfully",
        "data": sev,
    }
