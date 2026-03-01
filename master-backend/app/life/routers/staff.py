"""Staff management routes for LifeSevatra.

Fix: replaced raw ``body: dict`` with ``DutyToggleRequest`` model.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.firebase_client import get_db
from app.life.dependencies import get_current_hospital
from app.life.models import DutyToggleRequest, StaffCreate, StaffUpdate
from app.life.services import staff_service as svc

router = APIRouter(prefix="/life/staff", tags=["Life — Staff"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: StaffCreate,
    hospital: dict = Depends(get_current_hospital),
):
    """Add a doctor or nurse to this hospital."""
    db = get_db()
    return await svc.create_staff(db, hospital["id"], payload)


@router.get("/")
async def list_staff(hospital: dict = Depends(get_current_hospital)):
    db = get_db()
    return await svc.get_all_staff(db, hospital["id"])


@router.get("/stats")
async def staff_stats(hospital: dict = Depends(get_current_hospital)):
    """Doctor/nurse counts and on-duty status."""
    db = get_db()
    return await svc.get_staff_stats(db, hospital["id"])


@router.get("/available-doctors")
async def available_doctors(hospital: dict = Depends(get_current_hospital)):
    """Doctors currently on duty with the least patient load."""
    db = get_db()
    return await svc.get_available_doctors(db, hospital["id"])


@router.get("/{staff_id}")
async def get_staff(
    staff_id: str,
    hospital: dict = Depends(get_current_hospital),
):
    db = get_db()
    staff = await svc.get_staff_by_id(db, staff_id)
    if not staff or staff.get("hospital_id") != hospital["id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")
    return staff


@router.put("/{staff_id}")
async def update_staff(
    staff_id: str,
    payload: StaffUpdate,
    hospital: dict = Depends(get_current_hospital),
):
    db = get_db()
    existing = await svc.get_staff_by_id(db, staff_id)
    if not existing or existing.get("hospital_id") != hospital["id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return existing
    ref = db.collection("life_staff").document(staff_id)
    ref.update(updates)
    return {**existing, **updates}


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    staff_id: str,
    hospital: dict = Depends(get_current_hospital),
):
    db = get_db()
    existing = await svc.get_staff_by_id(db, staff_id)
    if not existing or existing.get("hospital_id") != hospital["id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")
    db.collection("life_staff").document(staff_id).delete()


@router.patch("/{staff_id}/duty")
async def toggle_duty(
    staff_id: str,
    body: DutyToggleRequest,
    hospital: dict = Depends(get_current_hospital),
):
    """Toggle on_duty status for a staff member."""
    db = get_db()
    existing = await svc.get_staff_by_id(db, staff_id)
    if not existing or existing.get("hospital_id") != hospital["id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")

    on_duty = body.on_duty if body.on_duty is not None else not existing.get("on_duty", False)
    db.collection("life_staff").document(staff_id).update({"on_duty": on_duty})
    return {**existing, "on_duty": on_duty}
