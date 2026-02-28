"""Beds router using Firebase."""

from fastapi import APIRouter, Depends
from google.cloud.firestore import Client

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.services import bed_service

router = APIRouter(prefix="/beds", tags=["beds"])

@router.get("/")
async def get_beds(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    beds = await bed_service.get_all_beds(db, hospital_id)
    return {
        "success": True,
        "message": "Beds fetched successfully",
        "data": beds,
    }

@router.get("/stats")
async def get_bed_stats(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    beds = await bed_service.get_all_beds(db, hospital_id)
    
    stats = {}
    for b in beds:
        btype = b["bed_type"]
        if btype not in stats: stats[btype] = {"total": 0, "available": 0, "occupied": 0}
        stats[btype]["total"] += 1
        if b["is_available"]: stats[btype]["available"] += 1
        else: stats[btype]["occupied"] += 1
        
    by_type = [
        {"bed_type": k, "total_beds": v["total"], "available_beds": v["available"], "occupied_beds": v["occupied"]}
        for k, v in stats.items()
    ]
    totals = {
        "total_beds": sum(v["total_beds"] for v in by_type),
        "available_beds": sum(v["available_beds"] for v in by_type),
        "occupied_beds": sum(v["occupied_beds"] for v in by_type),
    }

    return {
        "success": True,
        "message": "Bed stats fetched",
        "data": {
            "by_type": by_type,
            "totals": totals,
        },
    }

@router.get("/availability")
async def get_bed_availability(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    beds = await bed_service.get_all_beds(db, hospital_id)
    return {
        "success": True,
        "message": "Availability fetched",
        "data": {
            "icu_available": sum(1 for b in beds if b["bed_type"] == "ICU" and b["is_available"]),
            "hdu_available": sum(1 for b in beds if b["bed_type"] == "HDU" and b["is_available"]),
            "general_available": sum(1 for b in beds if b["bed_type"] == "GEN" and b["is_available"]),
        },
    }
