"""Staff management service for LifeSevatra — Firestore backed.

Fixes applied:
- Replaced local ``_now_iso()`` with ``now_iso()`` from ``firebase_client``.
- ``get_staff_stats``: returns integer counts instead of string-wrapped numbers.
- ``create_staff``: accepts typed ``StaffCreate`` model instead of raw dict.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.firebase_client import now_iso

logger = logging.getLogger(__name__)

_PLATFORM = "life"


def _fb_email(real_email: str) -> str:
    return f"{_PLATFORM}.{real_email}"


async def create_staff(db, hospital_id: str, data) -> dict:
    """Create a new staff member. ``data`` is a ``StaffCreate`` model."""
    now = now_iso()
    staff_id = f"STF-{int(datetime.now(timezone.utc).timestamp())}"

    firebase_uid = None
    email = data.email if hasattr(data, "email") else data.get("email")
    password = data.password if hasattr(data, "password") else data.get("password")

    if email and password:
        from app.firebase_client import get_firebase_auth

        auth = get_firebase_auth()
        fb_email = _fb_email(email)
        try:
            user = auth.create_user(email=fb_email, password=password)
            auth.update_user(user.uid, email_verified=True)
            firebase_uid = user.uid
        except Exception as e:
            error_str = str(e)
            if "EMAIL_EXISTS" in error_str or "already exists" in error_str.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A login account with this email already exists.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=error_str
            )

    # Support both Pydantic model and raw dict access
    _get = (
        (lambda k, d=None: getattr(data, k, d))
        if hasattr(data, "model_dump")
        else (lambda k, d=None: data.get(k, d))
    )

    doc_data = {
        "hospital_id": hospital_id,
        "staff_id": staff_id,
        "full_name": _get("fullName"),
        "role": _get("role", "doctor"),
        "specialty": _get("specialty", "General"),
        "qualification": _get("qualification"),
        "experience_years": _get("experienceYears", 0),
        "contact": _get("contact"),
        "email": email,
        "on_duty": True,
        "shift": _get("shift", "day"),
        "max_patients": _get("maxPatients", 10),
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
    db,
    hospital_id: str,
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


async def get_staff_by_id(
    db, staff_id: str, hospital_id: str = None
) -> Optional[dict]:
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
    doc_count = sum(
        1
        for s in staff
        if s.get("role") in ("doctor", "surgeon", "specialist")
    )
    nurse_count = sum(1 for s in staff if s.get("role") == "nurse")
    on_duty = sum(1 for s in staff if s.get("on_duty"))
    assigned = sum(s.get("current_patient_count", 0) for s in staff)

    # FIX: return integer counts, not string-wrapped numbers
    return {
        "total_staff": len(staff),
        "total_doctors": doc_count,
        "total_nurses": nurse_count,
        "on_duty": on_duty,
        "off_duty": len(staff) - on_duty,
        "total_assigned_patients": assigned,
    }


async def get_available_doctors(db, hospital_id: str) -> list[dict]:
    docs = await get_all_staff(db, hospital_id, role="doctor", on_duty=True)
    return [
        d
        for d in docs
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
        ref.update(
            {
                "current_patient_count": doc.to_dict().get(
                    "current_patient_count", 0
                )
                + 1,
            }
        )


async def decrement_patient_count(db, doc_id: str):
    ref = db.collection("life_staff").document(doc_id)
    doc = ref.get()
    if doc.exists:
        ref.update(
            {
                "current_patient_count": max(
                    0,
                    doc.to_dict().get("current_patient_count", 0) - 1,
                ),
            }
        )
