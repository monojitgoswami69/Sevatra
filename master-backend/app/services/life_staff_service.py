"""Staff management service for LifeSevatra — Firestore backed."""

from datetime import datetime, timezone
from typing import Optional
import logging

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

_PLATFORM = "life"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fb_email(real_email: str) -> str:
    return f"{_PLATFORM}.{real_email}"


async def create_staff(db, hospital_id: str, data: dict) -> dict:
    now = _now_iso()
    staff_id = f"STF-{int(datetime.now(timezone.utc).timestamp())}"

    firebase_uid = None
    email = data.get("email")
    password = data.get("password")

    # If email + password provided, create a Firebase Auth user so staff can log in
    if email and password:
        from app.firebase_client import get_firebase_auth
        auth = get_firebase_auth()
        fb_email = _fb_email(email)
        try:
            user = auth.create_user(email=fb_email, password=password)
            # Mark as verified immediately — admin created this account
            auth.update_user(user.uid, email_verified=True)
            firebase_uid = user.uid
        except Exception as e:
            error_str = str(e)
            if "EMAIL_EXISTS" in error_str or "already exists" in error_str.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A login account with this email already exists.",
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_str)

    doc_data = {
        "hospital_id": hospital_id,
        "staff_id": staff_id,
        "full_name": data["fullName"],
        "role": data.get("role", "doctor"),
        "specialty": data.get("specialty", "General"),
        "qualification": data.get("qualification"),
        "experience_years": data.get("experienceYears", 0),
        "contact": data.get("contact"),
        "email": email,
        "on_duty": True,
        "shift": data.get("shift", "day"),
        "max_patients": data.get("maxPatients", 10),
        "current_patient_count": 0,
        "joined_date": now[:10],
        "created_at": now,
        "updated_at": now,
    }

    if firebase_uid:
        doc_data["firebase_uid"] = firebase_uid

    doc_ref = db.collection("life_staff").document()
    doc_ref.set(doc_data)
    doc_data["id"] = doc_ref.id
    return doc_data


async def get_all_staff(
    db, hospital_id: str,
    role: Optional[str] = None,
    on_duty: Optional[bool] = None,
    shift: Optional[str] = None,
) -> list[dict]:
    query = db.collection("life_staff").where("hospital_id", "==", hospital_id)
    if role:
        query = query.where("role", "==", role)
    if on_duty is not None:
        query = query.where("on_duty", "==", on_duty)
    if shift:
        query = query.where("shift", "==", shift)

    docs = query.get()
    return [{"id": d.id, **d.to_dict()} for d in docs]


async def get_staff_by_id(db, staff_id: str, hospital_id: str = None) -> Optional[dict]:
    """Look up a staff member by their human-readable staff_id (e.g. STF-xxx)."""
    docs = (
        db.collection("life_staff")
        .where("staff_id", "==", staff_id)
        .limit(1)
        .get()
    )
    for d in docs:
        data = d.to_dict()
        if hospital_id and data.get("hospital_id") != hospital_id:
            continue
        return {"id": d.id, **data}
    return None


async def get_staff_stats(db, hospital_id: str) -> dict:
    staff = await get_all_staff(db, hospital_id)
    doc_count = sum(1 for s in staff if s.get("role") in ("doctor", "surgeon", "specialist"))
    nurse_count = sum(1 for s in staff if s.get("role") == "nurse")
    on_duty = sum(1 for s in staff if s.get("on_duty"))
    assigned = sum(s.get("current_patient_count", 0) for s in staff)

    return {
        "total_staff": str(len(staff)),
        "total_doctors": str(doc_count),
        "total_nurses": str(nurse_count),
        "on_duty": str(on_duty),
        "off_duty": str(len(staff) - on_duty),
        "total_assigned_patients": str(assigned),
    }


async def get_available_doctors(db, hospital_id: str) -> list[dict]:
    docs = await get_all_staff(db, hospital_id, role="doctor", on_duty=True)
    return [
        d for d in docs
        if d.get("current_patient_count", 0) < d.get("max_patients", 10)
    ]


async def find_best_doctor(db, hospital_id: str) -> Optional[dict]:
    """Find on-duty doctor with lowest patient load."""
    docs = (
        db.collection("life_staff")
        .where("hospital_id", "==", hospital_id)
        .where("role", "==", "doctor")
        .where("on_duty", "==", True)
        .get()
    )
    best = None
    min_load = 9999
    for d in docs:
        staff = {"id": d.id, **d.to_dict()}
        load = staff.get("current_patient_count", 0)
        limit = staff.get("max_patients", 10)
        if load < limit and load < min_load:
            min_load = load
            best = staff
    return best


async def increment_patient_count(db, doc_id: str):
    ref = db.collection("life_staff").document(doc_id)
    doc = ref.get()
    if doc.exists:
        ref.update({
            "current_patient_count": doc.to_dict().get("current_patient_count", 0) + 1,
        })


async def decrement_patient_count(db, doc_id: str):
    ref = db.collection("life_staff").document(doc_id)
    doc = ref.get()
    if doc.exists:
        ref.update({
            "current_patient_count": max(0, doc.to_dict().get("current_patient_count", 0) - 1),
        })
