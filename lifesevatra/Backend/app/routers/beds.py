"""Bed management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.schemas.common import ApiResponse
from app.schemas.bed import BedRead, BedStatsData, BedAvailabilityData
from app.services import bed_service

router = APIRouter(prefix="/beds", tags=["beds"])


@router.get("/")
async def list_beds(
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await bed_service.get_all_beds(db, hospital_id)
    return {"success": True, "message": "OK", "count": len(data), "data": data}


@router.get("/stats", response_model=ApiResponse[BedStatsData])
async def bed_stats(
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await bed_service.get_bed_stats(db, hospital_id)
    return {"success": True, "message": "OK", "data": data}


@router.get("/availability", response_model=ApiResponse[BedAvailabilityData])
async def bed_availability(
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await bed_service.get_bed_availability(db, hospital_id)
    return {"success": True, "message": "OK", "data": data}


@router.put("/{bed_id}/assign")
async def assign_bed(
    bed_id: str,
    patient_id: int = 0,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    if patient_id <= 0:
        raise HTTPException(status_code=400, detail="Valid patient_id is required")
    ok = await bed_service.assign_bed(db, hospital_id, bed_id, patient_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Bed not found")
    return {"success": True, "message": "Bed assigned"}


@router.put("/{bed_id}/release")
async def release_bed(
    bed_id: str,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    ok = await bed_service.release_bed(db, hospital_id, bed_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Bed not found")
    return {"success": True, "message": "Bed released"}
