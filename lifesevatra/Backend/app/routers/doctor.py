"""Doctor portal routes."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.clinical_note import ClinicalNoteCreate, ClinicalNoteRead
from app.schemas.schedule import ScheduleSlotRead, ScheduleSlotUpdate
from app.services import doctor_service

router = APIRouter(prefix="/doctor", tags=["doctor"])


# Stub: hardcoded doctor id until auth is wired up
def _get_doctor_id() -> int:
    return 1


@router.get("/patients")
async def get_patients(
    db: AsyncSession = Depends(get_db),
    doctor_id: int = Depends(_get_doctor_id),
):
    data = await doctor_service.get_doctor_patients(db, doctor_id)
    return {"success": True, "message": "OK", "data": data}


@router.get("/schedule")
async def get_schedule(
    target_date: Optional[date] = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
    doctor_id: int = Depends(_get_doctor_id),
):
    data = await doctor_service.get_schedule(db, doctor_id, target_date)
    return {"success": True, "message": "OK", "data": data}


@router.put("/schedule/{slot_id}")
async def update_schedule_slot(
    slot_id: int,
    payload: ScheduleSlotUpdate,
    db: AsyncSession = Depends(get_db),
):
    data = await doctor_service.update_schedule_slot(
        db, slot_id, payload.status, payload.notes
    )
    if not data:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"success": True, "message": "Slot updated", "data": data}


@router.get("/notes")
async def get_notes(
    db: AsyncSession = Depends(get_db),
    doctor_id: int = Depends(_get_doctor_id),
):
    data = await doctor_service.get_clinical_notes(db, doctor_id)
    return {"success": True, "message": "OK", "data": data}


@router.post("/notes", response_model=ApiResponse[ClinicalNoteRead])
async def create_note(
    payload: ClinicalNoteCreate,
    db: AsyncSession = Depends(get_db),
    doctor_id: int = Depends(_get_doctor_id),
):
    data = await doctor_service.create_clinical_note(db, doctor_id, payload)
    return {"success": True, "message": "Note created", "data": data}


@router.get("/profile")
async def get_profile(
    db: AsyncSession = Depends(get_db),
    doctor_id: int = Depends(_get_doctor_id),
):
    data = await doctor_service.get_doctor_profile(db, doctor_id)
    if not data:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"success": True, "message": "OK", "data": data}


@router.put("/profile")
async def update_profile(
    updates: dict,
    db: AsyncSession = Depends(get_db),
    doctor_id: int = Depends(_get_doctor_id),
):
    data = await doctor_service.update_doctor_profile(db, doctor_id, updates)
    if not data:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"success": True, "message": "Profile updated", "data": data}
