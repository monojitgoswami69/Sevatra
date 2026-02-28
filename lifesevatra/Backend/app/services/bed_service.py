"""Bed management service."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bed import Bed
from app.models.admission import Admission


async def generate_beds_for_hospital(
    db: AsyncSession, hospital_id: int, icu: int, hdu: int, general: int
) -> list[Bed]:
    """Create bed rows when a hospital registers."""
    beds: list[Bed] = []
    for i in range(1, icu + 1):
        beds.append(
            Bed(
                hospital_id=hospital_id,
                bed_id=f"ICU-{str(i).zfill(2)}",
                bed_type="ICU",
                bed_number=i,
            )
        )
    for i in range(1, hdu + 1):
        beds.append(
            Bed(
                hospital_id=hospital_id,
                bed_id=f"HDU-{str(i).zfill(2)}",
                bed_type="HDU",
                bed_number=i,
            )
        )
    for i in range(1, general + 1):
        beds.append(
            Bed(
                hospital_id=hospital_id,
                bed_id=f"GEN-{str(i).zfill(2)}",
                bed_type="GENERAL",
                bed_number=i,
            )
        )
    db.add_all(beds)
    await db.flush()
    return beds


async def get_all_beds(db: AsyncSession, hospital_id: int) -> list[dict]:
    """Return all beds with patient info."""
    result = await db.execute(
        select(Bed).where(Bed.hospital_id == hospital_id).order_by(Bed.bed_id)
    )
    beds = result.scalars().all()
    out = []
    for b in beds:
        patient_name = None
        condition = None
        last_occ = None
        if b.current_patient_id:
            p_result = await db.execute(
                select(Admission).where(Admission.id == b.current_patient_id)
            )
            p = p_result.scalar_one_or_none()
            if p:
                patient_name = p.patient_name
                condition = p.condition
                last_occ = p.created_at.isoformat() if p.created_at else None
        out.append(
            {
                "bed_id": b.bed_id,
                "bed_type": b.bed_type,
                "bed_number": b.bed_number,
                "is_available": b.is_available,
                "current_patient_id": b.current_patient_id,
                "last_occupied_at": last_occ,
                "patient_name": patient_name,
                "condition": condition,
            }
        )
    return out


async def get_bed_stats(db: AsyncSession, hospital_id: int) -> dict:
    """Aggregate bed stats by type."""
    result = await db.execute(
        select(Bed).where(Bed.hospital_id == hospital_id)
    )
    beds = result.scalars().all()

    type_map: dict[str, dict] = {}
    for b in beds:
        bt = b.bed_type
        if bt not in type_map:
            type_map[bt] = {"total": 0, "available": 0, "occupied": 0}
        type_map[bt]["total"] += 1
        if b.is_available:
            type_map[bt]["available"] += 1
        else:
            type_map[bt]["occupied"] += 1

    by_type = [
        {
            "bed_type": bt,
            "total_beds": str(v["total"]),
            "available_beds": str(v["available"]),
            "occupied_beds": str(v["occupied"]),
        }
        for bt, v in type_map.items()
    ]

    total = sum(v["total"] for v in type_map.values())
    avail = sum(v["available"] for v in type_map.values())
    occ = sum(v["occupied"] for v in type_map.values())

    return {
        "by_type": by_type,
        "totals": {"total_beds": total, "available_beds": avail, "occupied_beds": occ},
    }


async def get_bed_availability(db: AsyncSession, hospital_id: int) -> dict:
    """Overall availability summary."""
    result = await db.execute(
        select(Bed).where(Bed.hospital_id == hospital_id).order_by(Bed.bed_number)
    )
    beds = result.scalars().all()
    total = len(beds)
    occupied = sum(1 for b in beds if not b.is_available)
    available_beds = [b for b in beds if b.is_available]
    lowest = available_beds[0].bed_number if available_beds else 0
    highest = available_beds[-1].bed_number if available_beds else 0
    avail_range = f"{lowest}-{highest}" if available_beds else "None"
    return {
        "occupiedBeds": occupied,
        "lowestBedId": lowest,
        "highestBedId": highest,
        "availableBedRange": avail_range,
    }


async def find_available_bed(
    db: AsyncSession, hospital_id: int, ward_recommendation: str
) -> str | None:
    """Find the lowest-numbered available bed matching the ward recommendation."""
    ward_priority = {
        "ICU": ["ICU", "HDU", "GENERAL"],
        "HDU": ["HDU", "GENERAL", "ICU"],
        "General": ["GENERAL", "HDU", "ICU"],
    }
    priorities = ward_priority.get(ward_recommendation, ["GENERAL", "HDU", "ICU"])

    for ward_type in priorities:
        result = await db.execute(
            select(Bed)
            .where(
                Bed.hospital_id == hospital_id,
                Bed.bed_type == ward_type,
                Bed.is_available == True,
            )
            .order_by(Bed.bed_number)
            .limit(1)
        )
        bed = result.scalar_one_or_none()
        if bed:
            return bed.bed_id
    return None


async def assign_bed(
    db: AsyncSession, hospital_id: int, bed_id: str, patient_id: int
) -> bool:
    """Mark a bed as occupied by a patient. Returns False if bed not found."""
    from datetime import datetime

    result = await db.execute(
        select(Bed).where(Bed.hospital_id == hospital_id, Bed.bed_id == bed_id)
    )
    bed = result.scalar_one_or_none()
    if not bed:
        return False
    bed.is_available = False
    bed.current_patient_id = patient_id
    bed.last_occupied_at = datetime.utcnow()
    await db.flush()
    return True


async def release_bed(db: AsyncSession, hospital_id: int, bed_id: str) -> bool:
    """Release a bed. Returns False if bed not found."""
    result = await db.execute(
        select(Bed).where(Bed.hospital_id == hospital_id, Bed.bed_id == bed_id)
    )
    bed = result.scalar_one_or_none()
    if not bed:
        return False
    bed.is_available = True
    bed.current_patient_id = None
    await db.flush()
    return True
