"""Admission (patient) routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.schemas.admission import (
    AdmissionCreate,
    AdmissionRead,
    VitalsUpdate,
    ClinicalUpdate,
    DischargeRequest,
)
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.services import admission_service

router = APIRouter(prefix="/admissions", tags=["admissions"])


@router.post("/", response_model=ApiResponse[AdmissionRead])
async def create_admission(
    payload: AdmissionCreate,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    try:
        data = await admission_service.create_admission(db, hospital_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"success": True, "message": "Patient admitted successfully", "data": data}


@router.get("/", response_model=PaginatedResponse[AdmissionRead])
async def list_admissions(
    condition: Optional[str] = None,
    minSeverity: Optional[int] = None,
    maxSeverity: Optional[int] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data, total = await admission_service.get_all_admissions(
        db, hospital_id, condition, minSeverity, maxSeverity, limit, offset
    )
    return {
        "success": True,
        "message": "OK",
        "data": data,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "hasMore": offset + limit < total,
        },
    }


@router.get("/{admission_id}", response_model=ApiResponse[AdmissionRead])
async def get_admission(
    admission_id: int,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await admission_service.get_admission_by_id(db, admission_id, hospital_id)
    if not data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "message": "OK", "data": data}


@router.put("/{admission_id}/vitals", response_model=ApiResponse[AdmissionRead])
async def update_vitals(
    admission_id: int,
    payload: VitalsUpdate,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await admission_service.update_vitals(db, admission_id, payload, hospital_id)
    if not data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "message": "Vitals updated", "data": data}


@router.put("/{admission_id}/clinical", response_model=ApiResponse[AdmissionRead])
async def update_clinical(
    admission_id: int,
    payload: ClinicalUpdate,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await admission_service.update_clinical(db, admission_id, payload, hospital_id)
    if not data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "message": "Clinical info updated", "data": data}


@router.post("/{admission_id}/discharge")
async def discharge_patient(
    admission_id: int,
    payload: DischargeRequest = DischargeRequest(),
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await admission_service.discharge_patient(
        db, admission_id, payload.dischargeNotes, hospital_id
    )
    if not data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "message": "Patient discharged", "data": data}


@router.delete("/{admission_id}")
async def delete_admission(
    admission_id: int,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    ok = await admission_service.delete_admission(db, admission_id, hospital_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "message": "Admission deleted"}
