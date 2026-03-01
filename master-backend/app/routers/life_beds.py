"""Bed management routes for LifeSevatra."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.firebase_client import get_db
from app.dependencies_life import get_current_hospital
from app.services import life_bed_service as svc

router = APIRouter(prefix="/life/beds", tags=["Life — Beds"])


@router.get("/")
async def list_beds(hospital: dict = Depends(get_current_hospital)):
    """Return every bed for this hospital with occupancy details."""
    db = get_db()
    return await svc.get_all_beds(db, hospital["id"])


@router.get("/stats")
async def bed_stats(hospital: dict = Depends(get_current_hospital)):
    """Aggregate bed counts: total / occupied / available per ward type."""
    db = get_db()
    return await svc.get_bed_stats(db, hospital["id"])


@router.get("/availability")
async def bed_availability(hospital: dict = Depends(get_current_hospital)):
    """Availability summary per ward type."""
    db = get_db()
    return await svc.get_bed_availability(db, hospital["id"])


@router.put("/{bed_id}/assign")
async def assign_bed(
    bed_id: str,
    body: dict,
    hospital: dict = Depends(get_current_hospital),
):
    """Manually assign a bed to a patient."""
    db = get_db()
    try:
        await svc.assign_bed(
            db, hospital["id"], bed_id,
            patient_id=body.get("patient_id", ""),
            patient_name=body.get("patient_name", ""),
            condition=body.get("condition", "Stable"),
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return {"detail": "Bed assigned"}


@router.put("/{bed_id}/release")
async def release_bed(
    bed_id: str,
    hospital: dict = Depends(get_current_hospital),
):
    """Release a bed back to the available pool."""
    db = get_db()
    await svc.release_bed(db, hospital["id"], bed_id)
    return {"detail": "Bed released"}
