"""Staff management service."""

from datetime import datetime
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
from app.schemas.staff import StaffCreate, StaffUpdate


def _generate_staff_id(role: str, seq: int) -> str:
    prefix = "NUR" if role == "nurse" else "DOC"
    return f"{prefix}-{str(seq).zfill(3)}"


async def _next_sequence(db: AsyncSession, hospital_id: int) -> int:
    result = await db.execute(
        select(func.count()).select_from(Staff).where(Staff.hospital_id == hospital_id)
    )
    return result.scalar() + 1


async def get_all_staff(
    db: AsyncSession,
    hospital_id: int,
    role: Optional[str] = None,
    specialty: Optional[str] = None,
    on_duty: Optional[bool] = None,
    shift: Optional[str] = None,
) -> list[dict]:
    q = select(Staff).where(Staff.hospital_id == hospital_id)
    if role:
        q = q.where(Staff.role == role)
    if specialty:
        q = q.where(Staff.specialty.ilike(f"%{specialty}%"))
    if on_duty is not None:
        q = q.where(Staff.on_duty == on_duty)
    if shift:
        q = q.where(Staff.shift == shift)

    result = await db.execute(q.order_by(Staff.id))
    staff = result.scalars().all()
    return [_staff_to_dict(s) for s in staff]


async def get_staff_by_id(db: AsyncSession, staff_id: str) -> dict | None:
    result = await db.execute(select(Staff).where(Staff.staff_id == staff_id))
    s = result.scalar_one_or_none()
    return _staff_to_dict(s) if s else None


async def create_staff(
    db: AsyncSession, hospital_id: int, payload: StaffCreate
) -> dict:
    seq = await _next_sequence(db, hospital_id)
    now = datetime.utcnow()
    member = Staff(
        hospital_id=hospital_id,
        staff_id=_generate_staff_id(payload.role, seq),
        full_name=payload.fullName,
        role=payload.role,
        specialty=payload.specialty,
        qualification=payload.qualification,
        experience_years=payload.experienceYears or 0,
        contact=payload.contact,
        email=payload.email,
        on_duty=True,
        shift=payload.shift or "day",
        max_patients=payload.maxPatients or 10,
        current_patient_count=0,
        created_at=now,
        updated_at=now,
    )
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return _staff_to_dict(member)


async def update_staff(
    db: AsyncSession, staff_id: str, payload: StaffUpdate
) -> dict | None:
    result = await db.execute(select(Staff).where(Staff.staff_id == staff_id))
    s = result.scalar_one_or_none()
    if not s:
        return None

    if payload.fullName is not None:
        s.full_name = payload.fullName
    if payload.role is not None:
        s.role = payload.role
    if payload.specialty is not None:
        s.specialty = payload.specialty
    if payload.qualification is not None:
        s.qualification = payload.qualification
    if payload.experienceYears is not None:
        s.experience_years = payload.experienceYears
    if payload.contact is not None:
        s.contact = payload.contact
    if payload.email is not None:
        s.email = payload.email
    if payload.shift is not None:
        s.shift = payload.shift
    if payload.maxPatients is not None:
        s.max_patients = payload.maxPatients
    if payload.onDuty is not None:
        s.on_duty = payload.onDuty

    s.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(s)
    return _staff_to_dict(s)


async def delete_staff(db: AsyncSession, staff_id: str) -> bool:
    result = await db.execute(select(Staff).where(Staff.staff_id == staff_id))
    s = result.scalar_one_or_none()
    if not s:
        return False
    await db.delete(s)
    await db.flush()
    return True


async def toggle_duty(db: AsyncSession, staff_id: str, on_duty: Optional[bool] = None) -> dict | None:
    result = await db.execute(select(Staff).where(Staff.staff_id == staff_id))
    s = result.scalar_one_or_none()
    if not s:
        return None
    s.on_duty = on_duty if on_duty is not None else (not s.on_duty)
    s.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(s)
    return _staff_to_dict(s)


async def get_available_doctors(
    db: AsyncSession, hospital_id: int
) -> list[dict]:
    result = await db.execute(
        select(Staff).where(
            Staff.hospital_id == hospital_id,
            Staff.role.in_(["doctor", "surgeon", "specialist"]),
            Staff.on_duty == True,
            Staff.current_patient_count < Staff.max_patients,
        )
    )
    staff = result.scalars().all()
    return [_staff_to_dict(s) for s in staff]


async def find_best_doctor(db: AsyncSession, hospital_id: int) -> Staff | None:
    """Find the on-duty doctor with the fewest patients."""
    result = await db.execute(
        select(Staff)
        .where(
            Staff.hospital_id == hospital_id,
            Staff.role.in_(["doctor", "surgeon", "specialist"]),
            Staff.on_duty == True,
            Staff.current_patient_count < Staff.max_patients,
        )
        .order_by(Staff.current_patient_count)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def increment_patient_count(db: AsyncSession, doctor_id: int) -> None:
    result = await db.execute(select(Staff).where(Staff.id == doctor_id))
    s = result.scalar_one_or_none()
    if s:
        s.current_patient_count += 1
        await db.flush()


async def decrement_patient_count(db: AsyncSession, doctor_id: int) -> None:
    result = await db.execute(select(Staff).where(Staff.id == doctor_id))
    s = result.scalar_one_or_none()
    if s and s.current_patient_count > 0:
        s.current_patient_count -= 1
        await db.flush()


async def get_staff_stats(db: AsyncSession, hospital_id: int) -> dict:
    result = await db.execute(
        select(Staff).where(Staff.hospital_id == hospital_id)
    )
    staff = result.scalars().all()
    doctors = [s for s in staff if s.role in ("doctor", "surgeon", "specialist")]
    nurses = [s for s in staff if s.role == "nurse"]
    return {
        "total_staff": str(len(staff)),
        "total_doctors": str(len(doctors)),
        "total_nurses": str(len(nurses)),
        "on_duty": str(sum(1 for s in staff if s.on_duty)),
        "off_duty": str(sum(1 for s in staff if not s.on_duty)),
        "total_assigned_patients": str(sum(s.current_patient_count for s in staff)),
    }


def _staff_to_dict(s: Staff) -> dict:
    return {
        "id": s.id,
        "staff_id": s.staff_id,
        "full_name": s.full_name,
        "role": s.role,
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
        "created_at": s.created_at.isoformat() if s.created_at else "",
        "updated_at": s.updated_at.isoformat() if s.updated_at else "",
    }
