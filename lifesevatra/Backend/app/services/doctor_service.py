"""Doctor-portal service."""

from datetime import datetime, date
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admission import Admission
from app.models.staff import Staff
from app.models.clinical_note import ClinicalNote
from app.models.schedule import ScheduleSlot
from app.schemas.clinical_note import ClinicalNoteCreate
from app.services.admission_service import _admission_to_dict


async def get_doctor_patients(db: AsyncSession, doctor_id: int) -> list[dict]:
    result = await db.execute(
        select(Admission).where(
            Admission.doctor_id == doctor_id,
            Admission.status == "admitted",
        )
    )
    return [_admission_to_dict(a) for a in result.scalars().all()]


async def get_schedule(
    db: AsyncSession, doctor_id: int, target_date: Optional[date] = None
) -> list[dict]:
    d = target_date or date.today()
    result = await db.execute(
        select(ScheduleSlot)
        .where(ScheduleSlot.doctor_id == doctor_id, ScheduleSlot.date == d)
        .order_by(ScheduleSlot.time)
    )
    slots = result.scalars().all()
    return [
        {
            "id": s.id,
            "time": s.time,
            "patient_name": s.patient_name,
            "patient_id": s.patient_id,
            "type": s.type,
            "status": s.status,
            "notes": s.notes,
        }
        for s in slots
    ]


async def update_schedule_slot(
    db: AsyncSession, slot_id: int, status: Optional[str] = None, notes: Optional[str] = None
) -> dict | None:
    result = await db.execute(select(ScheduleSlot).where(ScheduleSlot.id == slot_id))
    s = result.scalar_one_or_none()
    if not s:
        return None
    if status is not None:
        s.status = status
    if notes is not None:
        s.notes = notes
    await db.flush()
    await db.refresh(s)
    return {
        "id": s.id,
        "time": s.time,
        "patient_name": s.patient_name,
        "patient_id": s.patient_id,
        "type": s.type,
        "status": s.status,
        "notes": s.notes,
    }


async def get_clinical_notes(db: AsyncSession, doctor_id: int) -> list[dict]:
    result = await db.execute(
        select(ClinicalNote)
        .where(ClinicalNote.doctor_id == doctor_id)
        .order_by(ClinicalNote.created_at.desc())
    )
    notes = result.scalars().all()
    return [_note_to_dict(n) for n in notes]


async def create_clinical_note(
    db: AsyncSession, doctor_id: int, payload: ClinicalNoteCreate
) -> dict:
    note = ClinicalNote(
        admission_id=payload.admission_id,
        doctor_id=doctor_id,
        patient_name=payload.patient_name,
        note=payload.note,
        type=payload.type,
        created_at=datetime.utcnow(),
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return _note_to_dict(note)


async def get_doctor_profile(db: AsyncSession, doctor_id: int) -> dict | None:
    result = await db.execute(select(Staff).where(Staff.id == doctor_id))
    s = result.scalar_one_or_none()
    if not s:
        return None
    return {
        "id": s.id,
        "staff_id": s.staff_id,
        "full_name": s.full_name,
        "specialty": s.specialty,
        "qualification": s.qualification,
        "experience_years": s.experience_years,
        "contact": s.contact,
        "email": s.email,
        "on_duty": s.on_duty,
        "shift": s.shift,
        "max_patients": s.max_patients,
        "current_patient_count": s.current_patient_count,
        "joined_date": s.joined_date.isoformat() if s.joined_date else "",
        "bio": s.bio,
        "languages": s.languages or [],
        "consultation_fee": float(s.consultation_fee) if s.consultation_fee else 0,
    }


async def update_doctor_profile(
    db: AsyncSession, doctor_id: int, updates: dict
) -> dict | None:
    result = await db.execute(select(Staff).where(Staff.id == doctor_id))
    s = result.scalar_one_or_none()
    if not s:
        return None

    allowed = [
        "full_name", "specialty", "qualification", "experience_years",
        "contact", "email", "bio", "languages", "consultation_fee",
        "shift", "on_duty",
    ]
    for key in allowed:
        if key in updates:
            setattr(s, key, updates[key])

    s.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(s)
    return await get_doctor_profile(db, doctor_id)


def _note_to_dict(n: ClinicalNote) -> dict:
    return {
        "id": n.id,
        "patient_id": n.admission_id,
        "patient_name": n.patient_name,
        "note": n.note,
        "type": n.type,
        "created_at": n.created_at.isoformat() if n.created_at else "",
    }
