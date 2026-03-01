"""Doctor-portal service for LifeSevatra — Firestore backed.

Fixes applied:
- Replaced local ``_now_iso()`` with ``now_iso()`` from ``firebase_client``.
- ``get_doctor_patients``: queries ``doctor_id`` (the field written by
  ``admission_service``) instead of the non-existent ``assigned_doctor_id``.
"""

import logging
from typing import Optional

from app.firebase_client import now_iso

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━ Patients ━━━━━━━━━━━━━━━━━━━━━━━━


async def get_doctor_patients(
    db, staff_doc_id: str, hospital_id: str
) -> list[dict]:
    """Return all admissions where the assigned doctor matches this staff member.

    FIX: ``admission_service.create_admission`` writes the field as
    ``doctor_id``, so we query on that — not ``assigned_doctor_id``.
    """
    docs = (
        db.collection("life_admissions")
        .where("hospital_id", "==", hospital_id)
        .where("doctor_id", "==", staff_doc_id)
        .get()
    )
    results = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        results.append(data)
    return results


# ━━━━━━━━━━━━━━━━━━━━━━━━ Schedule ━━━━━━━━━━━━━━━━━━━━━━━━


async def get_schedule(db, staff_doc_id: str) -> list[dict]:
    """Get schedule entries for a doctor."""
    docs = (
        db.collection("life_schedules")
        .where("doctor_id", "==", staff_doc_id)
        .order_by("time")
        .get()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


async def create_schedule_slot(
    db, staff_doc_id: str, hospital_id: str, data: dict
) -> dict:
    now = now_iso()
    doc_data = {
        "doctor_id": staff_doc_id,
        "hospital_id": hospital_id,
        "time": data.get("time", ""),
        "patient_name": data.get("patient_name", ""),
        "patient_id": data.get("patient_id"),
        "type": data.get("type", "checkup"),
        "status": "scheduled",
        "notes": data.get("notes", ""),
        "created_at": now,
        "updated_at": now,
    }
    doc_ref = db.collection("life_schedules").document()
    doc_ref.set(doc_data)
    doc_data["id"] = doc_ref.id
    return doc_data


async def update_schedule_status(
    db, schedule_id: str, staff_doc_id: str, new_status: str
) -> dict:
    ref = db.collection("life_schedules").document(schedule_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    if data.get("doctor_id") != staff_doc_id:
        return None
    ref.update({"status": new_status, "updated_at": now_iso()})
    data["status"] = new_status
    data["id"] = doc.id
    return data


# ━━━━━━━━━━━━━━━━━━━━━━━━ Clinical Notes ━━━━━━━━━━━━━━━━━━━━━━━━


async def get_clinical_notes(
    db,
    staff_doc_id: str,
    patient_id: Optional[str] = None,
    note_type: Optional[str] = None,
) -> list[dict]:
    """Return clinical notes written by this doctor."""
    query = db.collection("life_clinical_notes").where(
        "doctor_id", "==", staff_doc_id
    )
    if patient_id:
        query = query.where("patient_id", "==", patient_id)
    if note_type:
        query = query.where("type", "==", note_type)
    docs = query.get()
    return [{"id": d.id, **d.to_dict()} for d in docs]


async def add_clinical_note(
    db, staff_doc_id: str, doctor_name: str, data: dict
) -> dict:
    now = now_iso()
    doc_data = {
        "doctor_id": staff_doc_id,
        "doctor_name": doctor_name,
        "patient_id": data["patient_id"],
        "patient_name": data["patient_name"],
        "note": data["note"],
        "type": data.get("type", "progress"),
        "created_at": now,
    }
    doc_ref = db.collection("life_clinical_notes").document()
    doc_ref.set(doc_data)
    doc_data["id"] = doc_ref.id
    return doc_data


# ━━━━━━━━━━━━━━━━━━━━━━━━ Profile ━━━━━━━━━━━━━━━━━━━━━━━━


async def get_doctor_profile(db, staff_doc_id: str) -> Optional[dict]:
    ref = db.collection("life_staff").document(staff_doc_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data


async def update_doctor_profile(
    db, staff_doc_id: str, updates: dict
) -> Optional[dict]:
    ref = db.collection("life_staff").document(staff_doc_id)
    doc = ref.get()
    if not doc.exists:
        return None

    allowed = {
        "full_name",
        "specialty",
        "qualification",
        "experience_years",
        "contact",
        "email",
        "bio",
        "languages",
        "consultation_fee",
        "shift",
    }
    clean = {k: v for k, v in updates.items() if k in allowed and v is not None}
    clean["updated_at"] = now_iso()

    ref.update(clean)
    updated = ref.get().to_dict()
    updated["id"] = staff_doc_id
    return updated
