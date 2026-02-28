"""Admission management service using Firestore."""

from datetime import datetime
from typing import Optional
from google.cloud.firestore import Client

from app.schemas.admission import AdmissionCreate, VitalsUpdate, ClinicalUpdate
from app.utils.severity import calculate_severity
from app.services import bed_service, staff_service

async def create_admission(db: Client, hospital_id: int, payload: AdmissionCreate) -> dict:
    now = datetime.utcnow()
    
    sev = calculate_severity(
        heart_rate=payload.heartRate, spo2=payload.spo2, resp_rate=payload.respRate,
        temperature=payload.temperature, bp_systolic=payload.bpSystolic, bp_diastolic=payload.bpDiastolic
    )
    
    bed_id = await bed_service.find_available_bed(db, hospital_id, sev["wardRecommendation"])
    if not bed_id:
        raise ValueError("No beds available")
        
    doctor = await staff_service.find_best_doctor(db, hospital_id)
    doctor_id = doctor["id"] if doctor else None
    doctor_name = doctor["full_name"] if doctor else "Unassigned"
    
    data = payload.model_dump(by_alias=False, exclude_none=True)
    data.update({
        "hospital_id": hospital_id,
        "bed_id": bed_id,
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "admission_date": now.isoformat(),
        "severity_score": sev["score"],
        "condition": sev["condition"],
        "status": "admitted",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    })
    
    doc_ref = db.collection("admissions").document()
    doc_ref.set(data)
    
    await bed_service.assign_bed(db, hospital_id, bed_id, doc_ref.id)
    if doctor_id:
        await staff_service.increment_patient_count(db, doctor_id)
        
    data["id"] = doc_ref.id
    return _format(data)

async def get_all_admissions(
    db: Client, hospital_id: int, condition: Optional[str] = None,
    min_severity: Optional[int] = None, max_severity: Optional[int] = None,
    limit: int = 100, offset: int = 0
) -> tuple[list[dict], int]:
    query = db.collection("admissions").where("hospital_id", "==", hospital_id).where("status", "==", "admitted")
    if condition: query = query.where("condition", "==", condition)
    if min_severity is not None: query = query.where("severity_score", ">=", min_severity)
    if max_severity is not None: query = query.where("severity_score", "<=", max_severity)
    
    docs = query.stream()
    admissions = []
    for d in docs:
        x = {"id": d.id, **d.to_dict()}
        admissions.append(x)
        
    total = len(admissions)
    admissions = admissions[offset:offset+limit]
    return [_format(a) for a in admissions], total

async def get_admission_by_id(db: Client, admission_id: str, hospital_id: int = None) -> dict | None:
    doc = db.collection("admissions").document(admission_id).get()
    if not doc.exists: return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id: return None
    return _format(data)

async def update_vitals(db: Client, admission_id: str, vitals: VitalsUpdate, hospital_id: int = None) -> dict | None:
    ref = db.collection("admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists: return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id: return None
    
    updates = vitals.model_dump(exclude_unset=True)
    if not updates: return _format(data)
    
    for k, v in updates.items(): data[k] = v
    
    sev = calculate_severity(
        heart_rate=data.get("heartRate"), spo2=data.get("spo2"), resp_rate=data.get("respRate"),
        temperature=data.get("temperature"), bp_systolic=data.get("bpSystolic"), bp_diastolic=data.get("bpDiastolic")
    )
    data.update({
        "severity_score": sev["score"],
        "condition": sev["condition"],
        "measured_time": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    ref.update(data)
    return _format(data)

async def update_clinical(db: Client, admission_id: str, payload: ClinicalUpdate, hospital_id: int = None) -> dict | None:
    ref = db.collection("admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists: return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id: return None
    
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        updates["updated_at"] = datetime.utcnow().isoformat()
        ref.update(updates)
        data.update(updates)
    return _format(data)

async def discharge_patient(db: Client, admission_id: str, discharge_notes: Optional[str] = None, hospital_id: int = None) -> dict | None:
    ref = db.collection("admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists: return None
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id: return None
    
    now = datetime.utcnow().isoformat()
    
    updates = {
        "status": "discharged",
        "discharge_notes": discharge_notes,
        "discharged_at": now,
        "updated_at": now
    }
    ref.update(updates)
    
    if data.get("bed_id"):
        await bed_service.release_bed(db, data["hospital_id"], data["bed_id"])
    if data.get("doctor_id"):
        await staff_service.decrement_patient_count(db, data["doctor_id"])
        
    return {
        "patientId": data["id"],
        "patientName": data.get("name") or data.get("patient_name"),
        "releasedBed": data.get("bed_id"),
        "dischargedAt": now
    }

async def delete_admission(db: Client, admission_id: str, hospital_id: int = None) -> bool:
    ref = db.collection("admissions").document(admission_id)
    doc = ref.get()
    if not doc.exists: return False
    data = {"id": doc.id, **doc.to_dict()}
    if hospital_id and data.get("hospital_id") != hospital_id: return False
    
    if data.get("status") == "admitted":
        if data.get("bed_id"): await bed_service.release_bed(db, data["hospital_id"], data["bed_id"])
        if data.get("doctor_id"): await staff_service.decrement_patient_count(db, data["doctor_id"])
        
    ref.delete()
    return True

def _format(a: dict) -> dict:
    return {
        "patient_id": a.get("id"),
        "patient_name": a.get("name") or a.get("patient_name"),
        "age": a.get("age"),
        "gender": a.get("gender"),
        "bed_id": a.get("bed_id"),
        "admission_date": a.get("admission_date", ""),
        "heart_rate": a.get("heartRate"),
        "spo2": a.get("spo2"),
        "resp_rate": a.get("respRate"),
        "temperature": a.get("temperature"),
        "blood_pressure": {
            "systolic": a.get("bpSystolic"),
            "diastolic": a.get("bpDiastolic"),
        },
        "measured_time": a.get("measured_time", ""),
        "presenting_ailment": a.get("presentingAilment"),
        "medical_history": a.get("medicalHistory"),
        "clinical_notes": a.get("clinicalNotes"),
        "lab_results": a.get("labResults"),
        "severity_score": a.get("severity_score"),
        "condition": a.get("condition"),
        "doctor": a.get("doctor_name"),
        "created_at": a.get("created_at", ""),
        "updated_at": a.get("updated_at", ""),
    }
