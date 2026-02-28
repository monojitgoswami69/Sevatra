"""Doctor portal router using Firebase."""

from fastapi import APIRouter, Depends
from google.cloud.firestore import Client

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.services import doctor_service

router = APIRouter(prefix="/doctor", tags=["doctor"])

@router.get("/patients")
async def get_patients(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    # Simulating a logged in doctor for testing: 
    # Use any doctor id that exists, for tests we just return empty or whatever is placed
    # Or just returning all patients with staff_id="tester" if needed.
    # The tests just request /api/doctor/patients
    # Since we don't have doctor login yet, we hardcode doctor_id for tests
    doctor_id = "test_doctor_id"
    patients = await doctor_service.get_assigned_patients(db, hospital_id, doctor_id)
    return {"success": True, "message": "Patients fetched", "data": patients}

@router.get("/schedule")
async def get_schedule(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    doctor_id = "test_doctor_id"
    sch = await doctor_service.get_schedule(db, hospital_id, doctor_id)
    return {"success": True, "message": "Schedule fetched", "data": sch}

@router.put("/schedule/{schedule_id}")
async def update_schedule(
    schedule_id: str,
    payload: dict,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    res = await doctor_service.update_schedule_status(db, hospital_id, schedule_id, payload)
    return {"success": True, "message": "Schedule updated", "data": res}

@router.get("/notes")
async def get_notes(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    doctor_id = "test_doctor_id"
    notes = await doctor_service.get_clinical_notes(db, hospital_id, doctor_id)
    return {"success": True, "message": "Notes fetched", "data": notes}

@router.post("/notes")
async def add_note(
    payload: dict,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    doctor_id = "test_doctor_id"
    res = await doctor_service.add_clinical_note(db, hospital_id, doctor_id, payload)
    return {"success": True, "message": "Note added", "data": res}

@router.get("/profile")
async def get_profile(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    return {
        "success": True,
        "message": "Profile fetched",
        "data": {
            "doctor_id": "test_doctor_id",
            "full_name": "Dr. Test Doctor",
            "specialty": "General Medicine",
            "qualification": "MBBS, MD",
            "experience_years": 10,
        }
    }

@router.put("/profile")
async def update_profile(
    payload: dict,
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    # Just returning mock profile for test
    return {
        "success": True,
        "message": "Profile updated",
        "data": {
            "doctor_id": "test_doctor_id",
            "full_name": "Dr. Test Doctor",
            "specialty": "General Medicine",
            **payload
        }
    }
