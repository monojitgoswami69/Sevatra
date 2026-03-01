"""Admission management service for LifeSevatra — Firestore backed."""

from datetime import datetime, timezone
from typing import Optional
import logging

from app.models.life import AdmissionCreate, VitalsUpdate, ClinicalUpdate
from app.utils.severity import calculate_severity
from app.services import life_bed_service, life_staff_service

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_admission(db, hospital_id: str, payload: AdmissionCreate) -> dict:
    now = _now_iso()

    sev = calculate_severity(
        heart_rate=payload.heartRate, spo2=payload.spo2,
        resp_rate=payload.respRate, temperature=payload.temperature,
        bp_systolic=payload.bpSystolic, bp_diastolic=payload.bpDiastolic,
    )

    bed_id = await life_bed_service.find_available_bed(db, hospital_id, sev["wardRecommendation"])
    if not bed_id:
        raise ValueError("No beds available")

    doctor = await life_staff_service.find_best_doctor(db, hospital_id)
    doctor_id = doctor["id"] if doctor else None
    doctor_name = doctor["full_name"] if doctor else "Unassigned"

    data = payload.model_dump(exclude_none=True)
    data.update({
        "hospital_id": hospital_id,
        "bed_id": bed_id,
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "admission_date": now,
        "measured_time": now,
        "severity_score": sev["score"],
        "condition": sev["condition"],
        "status": "admitted",
        "created_at": now,
        "updated_at": now,
    })

    doc_ref = db.collection("life_admissions").document()
    doc_ref.set(data)
    data["id"] = doc_ref.id

    await life_bed_service.assign_bed(
        db, hospital_id, bed_id, doc_ref.id,
        patient_name=payload.name, condition=sev["condition"],
    )
    if doctor_id:
        await life_staff_service.increment_patient_count(db, doctor_id)

    return _format(data)


async def get_all_admissions(
    db, hospital_id: str,
    condition: Optional[str] = None,
    min_severity: Optional[int] = None,
    max_severity: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    query = (
        db.collection("life_admissions")
        .where("hospital_id", "==", hospital_id)
        .where("status", "==", "admitted")
    )
    if condition:
        query = query.where("condition", "==", condition)
    if min_severity is not None:
        query = query.where("severity_score", ">=", min_severity)
    if max_severity is not None:
        query = query.where("severity_score", "<=", max_severity)

    docs = query.get()
    admissions = [{"id": d.id, **d.to_dict()} for d in docs]
    total = len(admissions)
    admissions = admissions[offset:offset + limit]
    return [_format(a) for a in admissions], total


async def get_admission_by_id(db, admission_id: str, hospital_id: str = None) -> Optional[dict]:
    doc = db.collection("life_admissions").document(admission_id).get()
    if not doc.exists:
        return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id:
        return None
    return _format(data)


async def update_vitals(db, admission_id: str, vitals: VitalsUpdate, hospital_id: str = None) -> Optional[dict]:
    ref = db.collection("life_admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id:
        return None

    updates = vitals.model_dump(exclude_unset=True)
    if not updates:
        return _format(data)

    for k, v in updates.items():
        data[k] = v

    sev = calculate_severity(
        heart_rate=data.get("heartRate"), spo2=data.get("spo2"),
        resp_rate=data.get("respRate"), temperature=data.get("temperature"),
        bp_systolic=data.get("bpSystolic"), bp_diastolic=data.get("bpDiastolic"),
    )
    data.update({
        "severity_score": sev["score"],
        "condition": sev["condition"],
        "measured_time": _now_iso(),
        "updated_at": _now_iso(),
    })

    ref.update(data)

    # Update bed condition
    if data.get("bed_id"):
        await life_bed_service.assign_bed(
            db, data["hospital_id"], data["bed_id"], admission_id,
            patient_name=data.get("name") or data.get("patient_name"),
            condition=sev["condition"],
        )

    return _format(data)


async def update_clinical(db, admission_id: str, payload: ClinicalUpdate, hospital_id: str = None) -> Optional[dict]:
    ref = db.collection("life_admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id:
        return None

    updates = payload.model_dump(exclude_unset=True)
    if updates:
        updates["updated_at"] = _now_iso()
        ref.update(updates)
        data.update(updates)
    return _format(data)


async def discharge_patient(db, admission_id: str, discharge_notes: Optional[str] = None, hospital_id: str = None) -> Optional[dict]:
    ref = db.collection("life_admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id:
        return None

    now = _now_iso()
    updates = {
        "status": "discharged",
        "discharge_notes": discharge_notes,
        "discharged_at": now,
        "updated_at": now,
    }
    ref.update(updates)

    if data.get("bed_id"):
        await life_bed_service.release_bed(db, data["hospital_id"], data["bed_id"])
    if data.get("doctor_id"):
        await life_staff_service.decrement_patient_count(db, data["doctor_id"])

    return {
        "patientId": data["id"],
        "patientName": data.get("name") or data.get("patient_name"),
        "releasedBed": data.get("bed_id"),
        "dischargedAt": now,
    }


async def delete_admission(db, admission_id: str, hospital_id: str = None) -> bool:
    ref = db.collection("life_admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists:
        return False
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id:
        return False

    if data.get("status") == "admitted":
        if data.get("bed_id"):
            await life_bed_service.release_bed(db, data["hospital_id"], data["bed_id"])
        if data.get("doctor_id"):
            await life_staff_service.decrement_patient_count(db, data["doctor_id"])

    ref.delete()
    return True


def _format(a: dict) -> dict:
    """Convert internal Firestore doc to the shape the frontend expects."""
    return {
        "patient_id": a.get("id"),
        "patient_name": a.get("name") or a.get("patient_name"),
        "age": a.get("age"),
        "gender": a.get("gender"),
        "blood_group": a.get("bloodGroup") or a.get("blood_group"),
        "emergency_contact": a.get("emergencyContact") or a.get("emergency_contact"),
        "address": a.get("address"),
        "gov_id_type": a.get("govIdType") or a.get("gov_id_type"),
        "guardian_name": a.get("guardianName") or a.get("guardian_name"),
        "guardian_relation": a.get("guardianRelation") or a.get("guardian_relation"),
        "guardian_phone": a.get("guardianPhone") or a.get("guardian_phone"),
        "guardian_email": a.get("guardianEmail") or a.get("guardian_email"),
        "whatsapp_number": a.get("whatsappNumber") or a.get("whatsapp_number"),
        "bed_id": a.get("bed_id"),
        "admission_date": a.get("admission_date", ""),
        "heart_rate": a.get("heartRate") or a.get("heart_rate"),
        "spo2": a.get("spo2"),
        "resp_rate": a.get("respRate") or a.get("resp_rate"),
        "temperature": a.get("temperature"),
        "blood_pressure": {
            "systolic": a.get("bpSystolic") or a.get("bp_systolic"),
            "diastolic": a.get("bpDiastolic") or a.get("bp_diastolic"),
        },
        "measured_time": a.get("measured_time", ""),
        "presenting_ailment": a.get("presentingAilment") or a.get("presenting_ailment"),
        "medical_history": a.get("medicalHistory") or a.get("medical_history"),
        "clinical_notes": a.get("clinicalNotes") or a.get("clinical_notes"),
        "lab_results": a.get("labResults") or a.get("lab_results"),
        "severity_score": a.get("severity_score"),
        "condition": a.get("condition"),
        "doctor": a.get("doctor_name") or a.get("doctor"),
        "created_at": a.get("created_at", ""),
        "updated_at": a.get("updated_at", ""),
    }
