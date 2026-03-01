from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.user_service import user_service
from app.models.user import (
    ProfileUpdate,
    ProfileResponse,
    AddressCreate,
    AddressResponse,
    EmergencyContactCreate,
    EmergencyContactResponse,
    MedicalConditionCreate,
    MedicalConditionResponse,
)

router = APIRouter(prefix="/users", tags=["Users & Profile"])


# ── Profile ──


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    return await user_service.get_profile(user["id"])


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate, user: dict = Depends(get_current_user)
):
    """Update the current user's profile fields."""
    return await user_service.update_profile(user["id"], data)


# ── Addresses ──


@router.get("/me/addresses", response_model=list[AddressResponse])
async def list_addresses(user: dict = Depends(get_current_user)):
    """List all saved addresses for the current user."""
    return await user_service.list_addresses(user["id"])


@router.post("/me/addresses", response_model=AddressResponse, status_code=201)
async def create_address(
    data: AddressCreate, user: dict = Depends(get_current_user)
):
    """Add a new saved address (Home, Work, or custom)."""
    return await user_service.create_address(user["id"], data)


@router.delete("/me/addresses/{address_id}")
async def delete_address(
    address_id: str, user: dict = Depends(get_current_user)
):
    """Remove a saved address."""
    return await user_service.delete_address(user["id"], address_id)


# ── Emergency Contacts ──


@router.get(
    "/me/emergency-contacts", response_model=list[EmergencyContactResponse]
)
async def list_emergency_contacts(user: dict = Depends(get_current_user)):
    """List emergency contacts for the current user."""
    return await user_service.list_emergency_contacts(user["id"])


@router.post(
    "/me/emergency-contacts",
    response_model=EmergencyContactResponse,
    status_code=201,
)
async def create_emergency_contact(
    data: EmergencyContactCreate, user: dict = Depends(get_current_user)
):
    """Add an emergency contact."""
    return await user_service.create_emergency_contact(user["id"], data)


@router.delete("/me/emergency-contacts/{contact_id}")
async def delete_emergency_contact(
    contact_id: str, user: dict = Depends(get_current_user)
):
    """Remove an emergency contact."""
    return await user_service.delete_emergency_contact(user["id"], contact_id)


# ── Medical Conditions ──


@router.get(
    "/me/medical-conditions", response_model=list[MedicalConditionResponse]
)
async def list_medical_conditions(user: dict = Depends(get_current_user)):
    """List medical conditions for the current user."""
    return await user_service.list_medical_conditions(user["id"])


@router.post(
    "/me/medical-conditions",
    response_model=MedicalConditionResponse,
    status_code=201,
)
async def create_medical_condition(
    data: MedicalConditionCreate, user: dict = Depends(get_current_user)
):
    """Add a medical condition or allergy."""
    return await user_service.create_medical_condition(user["id"], data)


@router.delete("/me/medical-conditions/{condition_id}")
async def delete_medical_condition(
    condition_id: str, user: dict = Depends(get_current_user)
):
    """Remove a medical condition."""
    return await user_service.delete_medical_condition(user["id"], condition_id)
