"""Admissions router using Firebase."""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from google.cloud.firestore import Client

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.schemas.admission import AdmissionCreate, VitalsUpdate, ClinicalUpdate, DischargeRequest
from app.schemas.common import ApiResponse
from app.services import admission_service

router = APIRouter(prefix="/admissions", tags=["admissions"])

@router.post("/", response_model=ApiResponse[dict])
async def create_admission(
    payload: AdmissionCreate,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    try:
        data = await admission_service.create_admission(db, hospital_id, payload)
        return {"success": True, "message": "Patient admitted successfully", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=ApiResponse[list[dict]])
async def get_admissions(
    condition: Optional[str] = Query(None),
    minSeverity: Optional[int] = Query(None),
    maxSeverity: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    admissions, total = await admission_service.get_all_admissions(
        db, hospital_id, condition, minSeverity, maxSeverity, limit, offset
    )
    return {
        "success": True,
        "message": "Admissions fetched successfully",
        "data": admissions,
        "pagination": {"total": total, "limit": limit, "offset": offset},
    }

@router.get("/{admission_id}")
async def get_admission(
    admission_id: str,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    a = await admission_service.get_admission_by_id(db, str(admission_id), hospital_id)
    if not a: raise HTTPException(status_code=404, detail="Admission not found")
    return {"success": True, "message": "Fetched successfully", "data": a}

@router.put("/{admission_id}/vitals")
async def update_vitals(
    admission_id: str,
    payload: VitalsUpdate,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    a = await admission_service.update_vitals(db, str(admission_id), payload, hospital_id)
    if not a: raise HTTPException(status_code=404, detail="Admission not found")
    return {"success": True, "message": "Vitals updated", "data": a}

@router.put("/{admission_id}/clinical")
async def update_clinical(
    admission_id: str,
    payload: ClinicalUpdate,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    a = await admission_service.update_clinical(db, str(admission_id), payload, hospital_id)
    if not a: raise HTTPException(status_code=404, detail="Admission not found")
    return {"success": True, "message": "Clinical details updated", "data": a}

@router.post("/{admission_id}/discharge")
async def discharge_patient(
    admission_id: str,
    payload: DischargeRequest,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    res = await admission_service.discharge_patient(db, str(admission_id), payload.dischargeNotes, hospital_id)
    if not res: raise HTTPException(status_code=404, detail="Admission not found")
    return {"success": True, "message": "Patient discharged", "data": res}

@router.delete("/{admission_id}")
async def delete_admission(
    admission_id: str,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    ok = await admission_service.delete_admission(db, str(admission_id), hospital_id)
    if not ok: raise HTTPException(status_code=404, detail="Admission not found")
    return {"success": True, "message": "Admission deleted"}
