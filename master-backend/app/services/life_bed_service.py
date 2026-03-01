"""Bed management service for LifeSevatra — Firestore backed."""

from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def generate_beds(db, hospital_id: str, icu: int, hdu: int, gen: int):
    """Bulk-create bed documents for a hospital."""
    beds_ref = db.collection("life_beds")
    counts = {"ICU": icu, "HDU": hdu, "GEN": gen}
    for btype, count in counts.items():
        for i in range(1, count + 1):
            bed_id = f"{btype}-{i:02d}"
            doc_ref = beds_ref.document()
            doc_ref.set({
                "hospital_id": hospital_id,
                "bed_id": bed_id,
                "bed_type": btype,
                "bed_number": i,
                "is_available": True,
                "current_patient_id": None,
                "last_occupied_at": None,
                "patient_name": None,
                "condition": None,
                "created_at": _now_iso(),
            })
    logger.info("Generated %d beds for hospital %s", icu + hdu + gen, hospital_id)


async def get_all_beds(db, hospital_id: str) -> list[dict]:
    docs = db.collection("life_beds").where("hospital_id", "==", hospital_id).get()
    result = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        result.append(x)
    return result


async def find_available_bed(db, hospital_id: str, ward: str) -> Optional[str]:
    """Find one available bed of the given type. ward is ICU/HDU/General."""
    bed_type = "GEN" if ward == "General" else ward
    docs = (
        db.collection("life_beds")
        .where("hospital_id", "==", hospital_id)
        .where("is_available", "==", True)
        .where("bed_type", "==", bed_type)
        .limit(1)
        .get()
    )
    docs = list(docs)
    for d in docs:
        return d.to_dict()["bed_id"]
    return None


async def assign_bed(db, hospital_id: str, bed_id: str, patient_id: str, patient_name: str = None, condition: str = None):
    docs = (
        db.collection("life_beds")
        .where("hospital_id", "==", hospital_id)
        .where("bed_id", "==", bed_id)
        .limit(1)
        .get()
    )
    for d in docs:
        db.collection("life_beds").document(d.id).update({
            "is_available": False,
            "current_patient_id": patient_id,
            "patient_name": patient_name,
            "condition": condition,
            "last_occupied_at": _now_iso(),
        })


async def release_bed(db, hospital_id: str, bed_id: str):
    docs = (
        db.collection("life_beds")
        .where("hospital_id", "==", hospital_id)
        .where("bed_id", "==", bed_id)
        .limit(1)
        .get()
    )
    for d in docs:
        db.collection("life_beds").document(d.id).update({
            "is_available": True,
            "current_patient_id": None,
            "patient_name": None,
            "condition": None,
        })


async def get_bed_stats(db, hospital_id: str) -> dict:
    beds = await get_all_beds(db, hospital_id)
    stats: dict[str, dict] = {}
    for b in beds:
        btype = b["bed_type"]
        if btype not in stats:
            stats[btype] = {"total": 0, "available": 0, "occupied": 0}
        stats[btype]["total"] += 1
        if b["is_available"]:
            stats[btype]["available"] += 1
        else:
            stats[btype]["occupied"] += 1

    by_type = [
        {
            "bed_type": k,
            "total_beds": str(v["total"]),
            "available_beds": str(v["available"]),
            "occupied_beds": str(v["occupied"]),
        }
        for k, v in stats.items()
    ]
    totals = {
        "total_beds": sum(v["total"] for v in stats.values()),
        "available_beds": sum(v["available"] for v in stats.values()),
        "occupied_beds": sum(v["occupied"] for v in stats.values()),
    }
    return {"by_type": by_type, "totals": totals}


async def get_bed_availability(db, hospital_id: str) -> dict:
    beds = await get_all_beds(db, hospital_id)
    return {
        "success": True,
        "message": "Availability fetched",
        "data": {
            "icu_available": sum(1 for b in beds if b["bed_type"] == "ICU" and b["is_available"]),
            "hdu_available": sum(1 for b in beds if b["bed_type"] == "HDU" and b["is_available"]),
            "general_available": sum(1 for b in beds if b["bed_type"] == "GEN" and b["is_available"]),
        },
    }
