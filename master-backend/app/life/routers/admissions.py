"""Admission CRUD routes for LifeSevatra.

Fix: ``discharge_notes`` attribute access changed to ``dischargeNotes``
to match the Pydantic model field name.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.firebase_client import get_db
from app.life.dependencies import get_current_hospital
from app.life.models import AdmissionCreate, ClinicalUpdate, DischargeRequest, VitalsUpdate
from app.life.services import admission_service as svc

router = APIRouter(prefix="/life/admissions", tags=["Life — Admissions"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_admission(
    payload: AdmissionCreate,
    hospital: dict = Depends(get_current_hospital),
):
    """Admit a new patient — calculates severity, assigns bed & doctor."""
    db = get_db()
    try:
        return await svc.create_admission(db, hospital["id"], payload)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.get("/")
async def list_admissions(
    condition: Optional[str] = Query(None),
    min_severity: Optional[int] = Query(None),
    max_severity: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    hospital: dict = Depends(get_current_hospital),
):
    """List admitted patients with optional filters."""
    db = get_db()
    admissions, total = await svc.get_all_admissions(
        db, hospital["id"], condition, min_severity, max_severity, limit, offset,
    )
    return {"admissions": admissions, "total": total}


@router.get("/{admission_id}")
async def get_admission(
    admission_id: str,
    hospital: dict = Depends(get_current_hospital),
):
    db = get_db()
    result = await svc.get_admission_by_id(db, admission_id, hospital["id"])
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admission not found")
    return result


@router.put("/{admission_id}/vitals")
async def update_vitals(
    admission_id: str,
    payload: VitalsUpdate,
    hospital: dict = Depends(get_current_hospital),
):
    """Update vital signs — automatically recalculates severity."""
    db = get_db()
    result = await svc.update_vitals(db, admission_id, payload, hospital["id"])
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admission not found")
    return result


@router.put("/{admission_id}/clinical")
async def update_clinical(
    admission_id: str,
    payload: ClinicalUpdate,
    hospital: dict = Depends(get_current_hospital),
):
    """Update clinical notes, diagnosis, lab results."""
    db = get_db()
    result = await svc.update_clinical(db, admission_id, payload, hospital["id"])
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admission not found")
    return result


@router.post("/{admission_id}/discharge")
async def discharge_patient(
    admission_id: str,
    payload: DischargeRequest = None,
    hospital: dict = Depends(get_current_hospital),
):
    """Discharge a patient — releases bed and unassigns doctor."""
    db = get_db()
    # FIX: was ``payload.discharge_notes`` — model field is ``dischargeNotes``
    notes = payload.dischargeNotes if payload else None
    result = await svc.discharge_patient(db, admission_id, notes, hospital["id"])
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admission not found")
    return result


@router.delete("/{admission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admission(
    admission_id: str,
    hospital: dict = Depends(get_current_hospital),
):
    """Delete an admission record. If currently admitted, bed is released."""
    db = get_db()
    deleted = await svc.delete_admission(db, admission_id, hospital["id"])
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admission not found")
