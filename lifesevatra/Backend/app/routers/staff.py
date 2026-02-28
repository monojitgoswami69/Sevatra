"""Staff router using Firebase."""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from google.cloud.firestore import Client

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.schemas.staff import StaffCreate, StaffUpdate
from app.services import staff_service

router = APIRouter(prefix="/staff", tags=["staff"])

@router.post("/")
async def create_staff(
    payload: StaffCreate,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await staff_service.create_staff(db, hospital_id, payload.model_dump(exclude_unset=True))
    return {"success": True, "message": "Staff added", "data": data}

@router.get("/")
async def get_all_staff(
    role: Optional[str] = Query(None),
    onDuty: Optional[bool] = Query(None),
    shift: Optional[str] = Query(None),
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    staff = await staff_service.get_all_staff(db, hospital_id, role, onDuty, shift)
    return {"success": True, "message": "Staff fetched", "data": staff}

@router.get("/stats")
async def get_staff_stats(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    staff = await staff_service.get_all_staff(db, hospital_id)
    doc_count = sum(1 for s in staff if s.get("role") == "doctor")
    nurse_count = sum(1 for s in staff if s.get("role") in ("nurse", "staff"))
    on_duty = sum(1 for s in staff if s.get("on_duty"))
    off_duty = len(staff) - on_duty
    
    return {
        "success": True,
        "message": "Staff stats fetched",
        "data": {
            "total_staff": len(staff),
            "total_doctors": doc_count,
            "total_nurses": nurse_count,
            "on_duty": on_duty,
            "off_duty": off_duty,
        }
    }

@router.get("/available-doctors")
async def get_available_doctors(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    docs = await staff_service.get_all_staff(db, hospital_id, role="doctor", on_duty=True)
    res = [d for d in docs if d.get("current_patients", 0) < d.get("max_patients", 10)]
    return {"success": True, "message": "Available doctors fetched", "data": res}

@router.get("/{staff_id}")
async def get_staff(
    staff_id: str,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    s = await staff_service.get_staff_by_id(db, staff_id, hospital_id)
    if not s: raise HTTPException(status_code=404, detail="Staff not found")
    return {"success": True, "message": "Staff fetched", "data": s}

@router.put("/{staff_id}")
async def update_staff(
    staff_id: str,
    payload: StaffUpdate,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    s = await staff_service.get_staff_by_id(db, staff_id, hospital_id)
    if not s: raise HTTPException(status_code=404, detail="Staff not found")
    
    updates = payload.model_dump(exclude_unset=True)
    db.collection("staff").document(s["id"]).update(updates)
    s.update(updates)
    return {"success": True, "message": "Staff updated", "data": s}

@router.patch("/{staff_id}/duty")
async def toggle_duty(
    staff_id: str,
    onDuty: bool = Query(...),
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    s = await staff_service.get_staff_by_id(db, staff_id, hospital_id)
    if not s: raise HTTPException(status_code=404, detail="Staff not found")
    
    db.collection("staff").document(s["id"]).update({"on_duty": onDuty})
    s["on_duty"] = onDuty
    return {"success": True, "message": "Duty updated", "data": s}

@router.delete("/{staff_id}")
async def delete_staff(
    staff_id: str,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    s = await staff_service.get_staff_by_id(db, staff_id, hospital_id)
    if not s: raise HTTPException(status_code=404, detail="Staff not found")
    
    db.collection("staff").document(s["id"]).delete()
    return {"success": True, "message": "Staff deleted"}
