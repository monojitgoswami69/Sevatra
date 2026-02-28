"""Admission (patient) management service."""

from datetime import datetime, date
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admission import Admission
from app.schemas.admission import AdmissionCreate, VitalsUpdate, ClinicalUpdate
from app.utils.severity import calculate_severity
from app.services import bed_service, staff_service


async def create_admission(
    db: AsyncSession, hospital_id: int, payload: AdmissionCreate
) -> dict:
    """Create a new admission with auto bed allocation and doctor assignment."""
    now = datetime.utcnow()

    # Calculate severity
    sev = calculate_severity(
        heart_rate=payload.heartRate,
        spo2=payload.spo2,
        resp_rate=payload.respRate,
        temperature=payload.temperature,
        bp_systolic=payload.bpSystolic,
        bp_diastolic=payload.bpDiastolic,
    )

    # Find available bed
    bed_id = await bed_service.find_available_bed(
        db, hospital_id, sev["wardRecommendation"]
    )
    if not bed_id:
        raise ValueError("No beds available")

    # Find best doctor
    doctor = await staff_service.find_best_doctor(db, hospital_id)
    doctor_id = doctor.id if doctor else None
    doctor_name = doctor.full_name if doctor else "Unassigned"

    admission = Admission(
        hospital_id=hospital_id,
        patient_name=payload.name,
        age=payload.age,
        gender=payload.gender,
        blood_group=payload.bloodGroup,
        emergency_contact=payload.emergencyContact,
        address=payload.address,
        gov_id_type=payload.govIdType,
        id_picture_url=payload.idPicture,
        patient_picture_url=payload.patientPicture,
        guardian_name=payload.guardianName,
        guardian_relation=payload.guardianRelation,
        guardian_phone=payload.guardianPhone,
        guardian_email=payload.guardianEmail,
        whatsapp_number=payload.whatsappNumber,
        bed_id=bed_id,
        doctor_id=doctor_id,
        doctor_name=doctor_name,
        admission_date=now,
        heart_rate=payload.heartRate,
        spo2=payload.spo2,
        resp_rate=payload.respRate,
        temperature=payload.temperature,
        bp_systolic=payload.bpSystolic,
        bp_diastolic=payload.bpDiastolic,
        measured_time=now,
        presenting_ailment=payload.presentingAilment,
        medical_history=payload.medicalHistory,
        clinical_notes=payload.clinicalNotes,
        lab_results=payload.labResults,
        severity_score=sev["score"],
        condition=sev["condition"],
        created_at=now,
        updated_at=now,
    )
    db.add(admission)
    await db.flush()
    await db.refresh(admission)

    # Assign bed
    await bed_service.assign_bed(db, hospital_id, bed_id, admission.id)

    # Increment doctor patient count
    if doctor_id:
        await staff_service.increment_patient_count(db, doctor_id)

    return _admission_to_dict(admission)


async def get_all_admissions(
    db: AsyncSession,
    hospital_id: int,
    condition: Optional[str] = None,
    min_severity: Optional[int] = None,
    max_severity: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Get paginated list of admissions."""
    q = select(Admission).where(
        Admission.hospital_id == hospital_id,
        Admission.status == "admitted",
    )
    if condition:
        q = q.where(func.lower(Admission.condition) == condition.lower())
    if min_severity is not None:
        q = q.where(Admission.severity_score >= min_severity)
    if max_severity is not None:
        q = q.where(Admission.severity_score <= max_severity)

    # total count
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # paginated data
    result = await db.execute(
        q.order_by(Admission.id).offset(offset).limit(limit)
    )
    admissions = result.scalars().all()
    return [_admission_to_dict(a) for a in admissions], total


async def get_admission_by_id(db: AsyncSession, admission_id: int, hospital_id: int = None) -> dict | None:
    q = select(Admission).where(Admission.id == admission_id)
    if hospital_id is not None:
        q = q.where(Admission.hospital_id == hospital_id)
    result = await db.execute(q)
    a = result.scalar_one_or_none()
    return _admission_to_dict(a) if a else None


async def update_vitals(
    db: AsyncSession, admission_id: int, vitals: VitalsUpdate, hospital_id: int = None
) -> dict | None:
    q = select(Admission).where(Admission.id == admission_id)
    if hospital_id is not None:
        q = q.where(Admission.hospital_id == hospital_id)
    result = await db.execute(q)
    a = result.scalar_one_or_none()
    if not a:
        return None

    if vitals.heartRate is not None:
        a.heart_rate = vitals.heartRate
    if vitals.spo2 is not None:
        a.spo2 = vitals.spo2
    if vitals.respRate is not None:
        a.resp_rate = vitals.respRate
    if vitals.temperature is not None:
        a.temperature = vitals.temperature
    if vitals.bpSystolic is not None:
        a.bp_systolic = vitals.bpSystolic
    if vitals.bpDiastolic is not None:
        a.bp_diastolic = vitals.bpDiastolic

    a.measured_time = datetime.utcnow()

    # Recalculate severity
    sev = calculate_severity(
        heart_rate=a.heart_rate,
        spo2=a.spo2,
        resp_rate=a.resp_rate,
        temperature=a.temperature,
        bp_systolic=a.bp_systolic,
        bp_diastolic=a.bp_diastolic,
    )
    a.severity_score = sev["score"]
    a.condition = sev["condition"]
    a.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(a)
    return _admission_to_dict(a)


async def update_clinical(
    db: AsyncSession, admission_id: int, payload: ClinicalUpdate, hospital_id: int = None
) -> dict | None:
    q = select(Admission).where(Admission.id == admission_id)
    if hospital_id is not None:
        q = q.where(Admission.hospital_id == hospital_id)
    result = await db.execute(q)
    a = result.scalar_one_or_none()
    if not a:
        return None

    if payload.presentingAilment is not None:
        a.presenting_ailment = payload.presentingAilment
    if payload.medicalHistory is not None:
        a.medical_history = payload.medicalHistory
    if payload.clinicalNotes is not None:
        a.clinical_notes = payload.clinicalNotes
    if payload.labResults is not None:
        a.lab_results = payload.labResults

    a.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(a)
    return _admission_to_dict(a)


async def discharge_patient(
    db: AsyncSession, admission_id: int, discharge_notes: Optional[str] = None, hospital_id: int = None
) -> dict | None:
    q = select(Admission).where(Admission.id == admission_id)
    if hospital_id is not None:
        q = q.where(Admission.hospital_id == hospital_id)
    result = await db.execute(q)
    a = result.scalar_one_or_none()
    if not a:
        return None

    now = datetime.utcnow()
    bed_id = a.bed_id
    doctor_id = a.doctor_id
    hospital_id = a.hospital_id

    a.status = "discharged"
    a.discharge_notes = discharge_notes
    a.discharged_at = now
    a.updated_at = now
    await db.flush()

    # Release bed
    await bed_service.release_bed(db, hospital_id, bed_id)

    # Decrement doctor patient count
    if doctor_id:
        await staff_service.decrement_patient_count(db, doctor_id)

    return {
        "patientId": a.id,
        "patientName": a.patient_name,
        "releasedBed": bed_id,
        "dischargedAt": now.isoformat(),
    }


async def delete_admission(db: AsyncSession, admission_id: int, hospital_id: int = None) -> bool:
    q = select(Admission).where(Admission.id == admission_id)
    if hospital_id is not None:
        q = q.where(Admission.hospital_id == hospital_id)
    result = await db.execute(q)
    a = result.scalar_one_or_none()
    if not a:
        return False

    # Release bed and decrement doctor
    if a.status == "admitted":
        await bed_service.release_bed(db, a.hospital_id, a.bed_id)
        if a.doctor_id:
            await staff_service.decrement_patient_count(db, a.doctor_id)

    await db.delete(a)
    await db.flush()
    return True


def _admission_to_dict(a: Admission) -> dict:
    """Convert to frontend-compatible shape."""
    return {
        "patient_id": a.id,
        "patient_name": a.patient_name,
        "age": a.age,
        "gender": a.gender,
        "blood_group": a.blood_group,
        "emergency_contact": a.emergency_contact,
        "address": a.address,
        "gov_id_type": a.gov_id_type,
        "guardian_name": a.guardian_name,
        "guardian_relation": a.guardian_relation,
        "guardian_phone": a.guardian_phone,
        "guardian_email": a.guardian_email,
        "whatsapp_number": a.whatsapp_number,
        "bed_id": a.bed_id,
        "admission_date": a.admission_date.strftime("%b %d, %Y").replace(" 0", " ") if a.admission_date else "",
        "heart_rate": a.heart_rate,
        "spo2": a.spo2,
        "resp_rate": a.resp_rate,
        "temperature": a.temperature,
        "blood_pressure": {
            "systolic": a.bp_systolic,
            "diastolic": a.bp_diastolic,
        },
        "measured_time": a.measured_time.isoformat() if a.measured_time else "",
        "presenting_ailment": a.presenting_ailment,
        "medical_history": a.medical_history,
        "clinical_notes": a.clinical_notes,
        "lab_results": a.lab_results,
        "severity_score": a.severity_score,
        "condition": a.condition,
        "doctor": a.doctor_name,
        "created_at": a.created_at.isoformat() if a.created_at else "",
        "updated_at": a.updated_at.isoformat() if a.updated_at else "",
    }
