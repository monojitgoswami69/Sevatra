"""Staff management service using Firestore."""

from datetime import datetime
from google.cloud.firestore import Client

async def get_all_staff(db: Client, hospital_id: int, role: str = None, on_duty: bool = None, shift: str = None) -> list[dict]:
    query = db.collection("staff").where("hospital_id", "==", hospital_id)
    if role: query = query.where("role", "==", role)
    if on_duty is not None: query = query.where("on_duty", "==", on_duty)
    if shift: query = query.where("shift", "==", shift)
    
    docs = query.stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]

async def create_staff(db: Client, hospital_id: int, data: dict) -> dict:
    data["hospital_id"] = hospital_id
    data["created_at"] = datetime.utcnow().isoformat()
    data["current_patients"] = 0
    data["staff_id"] = f"STF-{datetime.utcnow().timestamp()}"
    doc_ref = db.collection("staff").document()
    doc_ref.set(data)
    return {"id": doc_ref.id, **data}

async def get_staff_by_id(db: Client, staff_id: str, hospital_id: int = None) -> dict | None:
    docs = db.collection("staff").where("staff_id", "==", staff_id).limit(1).stream()
    for d in docs:
        if hospital_id and d.to_dict().get("hospital_id") != hospital_id: continue
        return {"id": d.id, **d.to_dict()}
    return None

async def find_best_doctor(db: Client, hospital_id: int) -> dict | None:
    docs = db.collection("staff").where("hospital_id", "==", hospital_id).where("role", "==", "doctor").where("on_duty", "==", True).stream()
    best = None
    min_load = 9999
    for d in docs:
        staff = {"id": d.id, **d.to_dict()}
        load = staff.get("current_patients", 0)
        limit = staff.get("max_patients", 10)
        if load < limit and load < min_load:
            min_load = load
            best = staff
    return best

async def increment_patient_count(db: Client, doc_id: str):
    ref = db.collection("staff").document(doc_id)
    doc = ref.get()
    if doc.exists:
        ref.update({"current_patients": doc.to_dict().get("current_patients", 0) + 1})

async def decrement_patient_count(db: Client, doc_id: str):
    ref = db.collection("staff").document(doc_id)
    doc = ref.get()
    if doc.exists:
        ref.update({"current_patients": max(0, doc.to_dict().get("current_patients", 0) - 1)})
