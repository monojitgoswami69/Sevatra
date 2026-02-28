"""Dashboard aggregation service using Firestore."""

from datetime import datetime, timedelta
from google.cloud.firestore import Client

async def get_dashboard_stats(db: Client, hospital_id: int) -> dict:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    admissions_query = db.collection("admissions").where("hospital_id", "==", hospital_id)
    admitted_docs = admissions_query.where("status", "==", "admitted").stream()
    
    total = 0
    critical = 0
    admitted_today = 0
    bed_ids = []
    
    for d in admitted_docs:
        total += 1
        data = d.to_dict()
        if data.get("severity_score", 0) >= 8: critical += 1
        if data.get("admission_date", "") >= today_start: admitted_today += 1
        if data.get("bed_id"): bed_ids.append(data["bed_id"])
        
    discharged_docs = admissions_query.where("status", "==", "discharged").stream()
    discharged_today = sum(1 for d in discharged_docs if d.to_dict().get("discharged_at", "") >= today_start)
    
    icu_occ = sum(1 for b in bed_ids if str(b).startswith("ICU"))
    hdu_occ = sum(1 for b in bed_ids if str(b).startswith("HDU"))
    gen_occ = sum(1 for b in bed_ids if str(b).startswith("GEN"))
    
    return {
        "totalPatients": total,
        "criticalPatients": critical,
        "admittedToday": admitted_today,
        "dischargedToday": discharged_today,
        "bedOccupancy": {
            "icuOccupied": icu_occ,
            "hduOccupied": hdu_occ,
            "generalOccupied": gen_occ,
        },
    }
