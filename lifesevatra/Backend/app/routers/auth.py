"""Auth routes — stub for now, will be replaced with Supabase Auth / OAuth."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.hospital import Hospital
from app.schemas.hospital import HospitalCreate, HospitalRead, HospitalLogin, AuthResponse
from app.schemas.common import ApiResponse
from app.services.bed_service import generate_beds_for_hospital

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=ApiResponse[HospitalRead])
async def register(payload: HospitalCreate, db: AsyncSession = Depends(get_db)):
    """Register a new hospital and auto-generate beds."""
    hospital = Hospital(
        hospital_name=payload.hospital_name,
        email=payload.email,
        contact=payload.contact,
        hospital_address=payload.hospital_address,
        icu_beds=payload.icu_beds,
        hdu_beds=payload.hdu_beds,
        general_beds=payload.general_beds,
    )
    db.add(hospital)
    await db.flush()
    await db.refresh(hospital)

    # Auto-generate bed rows
    await generate_beds_for_hospital(
        db, hospital.id, payload.icu_beds, payload.hdu_beds, payload.general_beds
    )

    return {
        "success": True,
        "message": "Hospital registered successfully",
        "data": hospital,
    }


@router.post("/login")
async def login(payload: HospitalLogin, db: AsyncSession = Depends(get_db)):
    """Stub login — returns a placeholder token.

    Will be replaced with Supabase Auth / OAuth later.
    """
    from sqlalchemy import select

    result = await db.execute(
        select(Hospital).where(Hospital.email == payload.email)
    )
    hospital = result.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Stub: no password verification yet
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "token": "stub-jwt-token",
            "hospital": {
                "id": hospital.id,
                "hospital_name": hospital.hospital_name,
                "email": hospital.email,
                "contact": hospital.contact,
                "hospital_address": hospital.hospital_address,
                "icu_beds": hospital.icu_beds,
                "hdu_beds": hospital.hdu_beds,
                "general_beds": hospital.general_beds,
                "created_at": hospital.created_at.isoformat(),
            },
        },
    }
