"""Doctor portal router for LifeSevatra.

All endpoints require staff (doctor) authentication via ``get_current_staff``.
Prefix: ``/api/v1/life/doctor``
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional

from app.firebase_client import get_db
from app.dependencies_life import get_current_staff
from app.models.life import ClinicalNoteCreate, ScheduleStatusUpdate, DoctorProfileUpdate
from app.services import life_doctor_service as svc

router = APIRouter(prefix="/life/doctor", tags=["Life – Doctor Portal"])


# ── Patients ──


@router.get("/patients")
async def my_patients(staff: dict = Depends(get_current_staff)):
    db = get_db()
    patients = await svc.get_doctor_patients(db, staff["id"], staff["hospital_id"])
    return {"patients": patients, "total": len(patients)}


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str, staff: dict = Depends(get_current_staff)):
    db = get_db()
    doc = db.collection("life_admissions").document(patient_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Patient not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return data


# ── Schedule ──


@router.get("/schedule")
async def get_schedule(staff: dict = Depends(get_current_staff)):
    db = get_db()
    slots = await svc.get_schedule(db, staff["id"])
    return {"schedule": slots}


@router.post("/schedule", status_code=201)
async def create_schedule(data: dict, staff: dict = Depends(get_current_staff)):
    db = get_db()
    slot = await svc.create_schedule_slot(db, staff["id"], staff["hospital_id"], data)
    return slot


@router.put("/schedule/{schedule_id}")
async def update_schedule(
    schedule_id: str,
    body: ScheduleStatusUpdate,
    staff: dict = Depends(get_current_staff),
):
    db = get_db()
    result = await svc.update_schedule_status(db, schedule_id, staff["id"], body.status)
    if not result:
        raise HTTPException(status_code=404, detail="Schedule slot not found or not yours")
    return result


# ── Clinical Notes ──


@router.get("/notes")
async def get_notes(
    patient_id: Optional[str] = Query(None),
    note_type: Optional[str] = Query(None, alias="type"),
    staff: dict = Depends(get_current_staff),
):
    db = get_db()
    notes = await svc.get_clinical_notes(db, staff["id"], patient_id, note_type)
    return {"notes": notes, "total": len(notes)}


@router.post("/notes", status_code=201)
async def add_note(body: ClinicalNoteCreate, staff: dict = Depends(get_current_staff)):
    db = get_db()
    note = await svc.add_clinical_note(
        db, staff["id"], staff.get("full_name", "Doctor"), body.model_dump()
    )
    return note


# ── Profile ──


@router.get("/profile")
async def get_profile(staff: dict = Depends(get_current_staff)):
    db = get_db()
    profile = await svc.get_doctor_profile(db, staff["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile")
async def update_profile(body: DoctorProfileUpdate, staff: dict = Depends(get_current_staff)):
    db = get_db()
    updated = await svc.update_doctor_profile(db, staff["id"], body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found")
    return updated
