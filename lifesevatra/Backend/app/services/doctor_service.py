"""Doctor portal service using Firestore."""

from datetime import datetime
from google.cloud.firestore import Client

async def get_assigned_patients(db: Client, hospital_id: int, doctor_id: str) -> list[dict]:
    docs = db.collection("admissions").where("hospital_id", "==", hospital_id).where("doctor_id", "==", doctor_id).where("status", "==", "admitted").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]

async def get_schedule(db: Client, hospital_id: int, doctor_id: str) -> list[dict]:
    docs = db.collection("schedules").where("hospital_id", "==", hospital_id).where("doctor_id", "==", doctor_id).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]

async def get_clinical_notes(db: Client, hospital_id: int, doctor_id: str) -> list[dict]:
    docs = db.collection("clinical_notes").where("hospital_id", "==", hospital_id).where("doctor_id", "==", doctor_id).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]

async def update_schedule_status(db: Client, hospital_id: int, schedule_id: str, data: dict) -> dict:
    ref = db.collection("schedules").document(schedule_id)
    doc = ref.get()
    if not doc.exists: return None
    ref.update(data)
    return {"id": doc.id, **doc.to_dict(), **data}

async def add_clinical_note(db: Client, hospital_id: int, doctor_id: str, data: dict) -> dict:
    data.update({
        "hospital_id": hospital_id,
        "doctor_id": doctor_id,
        "created_at": datetime.utcnow().isoformat()
    })
    doc_ref = db.collection("clinical_notes").document()
    doc_ref.set(data)
    return {"id": doc_ref.id, **data}
