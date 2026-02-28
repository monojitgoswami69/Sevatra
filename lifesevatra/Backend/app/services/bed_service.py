"""Bed management service using Firestore."""

from datetime import datetime
from typing import Optional
from google.cloud.firestore import Client

async def generate_beds_for_hospital(db: Client, hospital_id: int, icu: int, hdu: int, gen: int):
    batch = db.batch()
    beds_ref = db.collection("beds")
    
    counts = {"ICU": icu, "HDU": hdu, "GEN": gen}
    for btype, count in counts.items():
        for i in range(1, count + 1):
            bed_id = f"{btype}-{i:02d}"
            doc_ref = beds_ref.document()
            batch.set(doc_ref, {
                "hospital_id": hospital_id,
                "bed_id": bed_id,
                "bed_type": btype,
                "bed_number": i,
                "is_available": True,
                "current_patient_id": None,
                "last_occupied_at": None,
                "created_at": datetime.utcnow().isoformat()
            })
    batch.commit()

async def get_all_beds(db: Client, hospital_id: int) -> list[dict]:
    docs = db.collection("beds").where("hospital_id", "==", hospital_id).stream()
    # we simulate async by not awaiting since mock is sync and firestore client is sync
    res = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        res.append(x)
    return res

async def find_available_bed(db: Client, hospital_id: int, bed_type: str) -> Optional[str]:
    print("FIND BED FOR WARD:", bed_type)
    if bed_type == 'General':
        bed_type = 'GEN'
    docs = db.collection("beds").where("hospital_id", "==", hospital_id).where("is_available", "==", True).where("bed_type", "==", bed_type).limit(1).stream()
    docs = list(docs)
    print("FOUND BEDS:", len(docs))
    for d in docs:
        return d.to_dict()["bed_id"]
    return None

async def assign_bed(db: Client, hospital_id: int, bed_id: str, patient_id: str):
    docs = db.collection("beds").where("hospital_id", "==", hospital_id).where("bed_id", "==", bed_id).limit(1).stream()
    for d in docs:
        db.collection("beds").document(d.id).update({
            "is_available": False,
            "current_patient_id": patient_id,
            "last_occupied_at": datetime.utcnow().isoformat()
        })

async def release_bed(db: Client, hospital_id: int, bed_id: str):
    docs = db.collection("beds").where("hospital_id", "==", hospital_id).where("bed_id", "==", bed_id).limit(1).stream()
    for d in docs:
        db.collection("beds").document(d.id).update({
            "is_available": True,
            "current_patient_id": None
        })
