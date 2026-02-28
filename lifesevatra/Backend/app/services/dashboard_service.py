"""Dashboard aggregation service."""

from datetime import datetime, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admission import Admission


async def get_dashboard_stats(db: AsyncSession, hospital_id: int) -> dict:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Total admitted patients
    total_q = select(func.count()).select_from(Admission).where(
        Admission.hospital_id == hospital_id,
        Admission.status == "admitted",
    )
    total = (await db.execute(total_q)).scalar() or 0

    # Critical patients
    critical_q = select(func.count()).select_from(Admission).where(
        Admission.hospital_id == hospital_id,
        Admission.status == "admitted",
        Admission.severity_score >= 8,
    )
    critical = (await db.execute(critical_q)).scalar() or 0

    # Admitted today
    admitted_today_q = select(func.count()).select_from(Admission).where(
        Admission.hospital_id == hospital_id,
        Admission.status == "admitted",
        Admission.admission_date >= today_start,
    )
    admitted_today = (await db.execute(admitted_today_q)).scalar() or 0

    # Discharged today
    discharged_today_q = select(func.count()).select_from(Admission).where(
        Admission.hospital_id == hospital_id,
        Admission.status == "discharged",
        Admission.discharged_at >= today_start,
    )
    discharged_today = (await db.execute(discharged_today_q)).scalar() or 0

    # Bed occupancy by type
    all_admitted = await db.execute(
        select(Admission.bed_id).where(
            Admission.hospital_id == hospital_id,
            Admission.status == "admitted",
        )
    )
    bed_ids = [row[0] for row in all_admitted.all()]
    icu_occ = sum(1 for b in bed_ids if b.startswith("ICU"))
    hdu_occ = sum(1 for b in bed_ids if b.startswith("HDU"))
    gen_occ = sum(1 for b in bed_ids if b.startswith("GEN"))

    return {
        "totalPatients": total,
        "criticalPatients": critical,
        "admittedToday": admitted_today,
        "dischargedToday": discharged_today,
        "bedOccupancy": {
            "icuOccupied": icu_occ,
            "hduOccupied": hdu_occ,
            "generalOccupied": gen_occ,
        },
    }
