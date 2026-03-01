"""Vitals / severity-calculator route for LifeSevatra."""

from fastapi import APIRouter
from app.models.life import SeverityRequest
from app.utils.severity import calculate_severity

router = APIRouter(prefix="/life/vitals", tags=["Life — Vitals"])


@router.post("/calculate-severity")
async def calc_severity(payload: SeverityRequest):
    """Calculate severity score from raw vital signs (no auth required)."""
    return calculate_severity(
        heart_rate=payload.heartRate,
        spo2=payload.spo2,
        resp_rate=payload.respRate,
        temperature=payload.temperature,
        bp_systolic=payload.bpSystolic,
        bp_diastolic=payload.bpDiastolic,
    )
