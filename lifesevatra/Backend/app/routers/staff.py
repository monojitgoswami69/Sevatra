"""Staff management routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.schemas.common import ApiResponse
from app.schemas.staff import StaffCreate, StaffRead, StaffUpdate, StaffStatsData
from app.services import staff_service

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/")
async def list_staff(
    role: Optional[str] = None,
    specialty: Optional[str] = None,
    onDuty: Optional[bool] = None,
    shift: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await staff_service.get_all_staff(
        db, hospital_id, role, specialty, onDuty, shift
    )
    return {"success": True, "message": "OK", "data": data}


@router.get("/stats", response_model=ApiResponse[StaffStatsData])
async def staff_stats(
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await staff_service.get_staff_stats(db, hospital_id)
    return {"success": True, "message": "OK", "data": data}


@router.get("/available-doctors")
async def available_doctors(
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await staff_service.get_available_doctors(db, hospital_id)
    return {"success": True, "message": "OK", "data": data}


@router.get("/{staff_id}", response_model=ApiResponse[StaffRead])
async def get_staff(
    staff_id: str,
    db: AsyncSession = Depends(get_db),
):
    data = await staff_service.get_staff_by_id(db, staff_id)
    if not data:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"success": True, "message": "OK", "data": data}


@router.post("/", response_model=ApiResponse[StaffRead])
async def create_staff(
    payload: StaffCreate,
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await staff_service.create_staff(db, hospital_id, payload)
    return {"success": True, "message": "Staff member added", "data": data}


@router.put("/{staff_id}", response_model=ApiResponse[StaffRead])
async def update_staff(
    staff_id: str,
    payload: StaffUpdate,
    db: AsyncSession = Depends(get_db),
):
    data = await staff_service.update_staff(db, staff_id, payload)
    if not data:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"success": True, "message": "Staff updated", "data": data}


@router.patch("/{staff_id}/duty", response_model=ApiResponse[StaffRead])
async def toggle_duty(
    staff_id: str,
    onDuty: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    data = await staff_service.toggle_duty(db, staff_id, onDuty)
    if not data:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"success": True, "message": "Duty status updated", "data": data}


@router.delete("/{staff_id}")
async def delete_staff(
    staff_id: str,
    db: AsyncSession = Depends(get_db),
):
    ok = await staff_service.delete_staff(db, staff_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"success": True, "message": "Staff removed"}
