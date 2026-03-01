from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.services.operator_service import operator_service
from app.models.operator import (
    OperatorRegisterRequest,
    OperatorProfileResponse,
    OperatorProfileUpdate,
    AmbulanceCreate,
    AmbulanceUpdate,
    AmbulanceResponse,
    AmbulanceStatus,
    DashboardStatsResponse,
)

router = APIRouter(prefix="/operator", tags=["Operator & Ambulance Management"])


# ── Operator Profile ──

@router.post("/register", response_model=OperatorProfileResponse, status_code=201)
async def register_operator(data: OperatorRegisterRequest, user: dict = Depends(get_current_user)):
    """Register as an ambulance operator (individual or provider)."""
    return await operator_service.register_operator(user["id"], data)


@router.get("/profile", response_model=OperatorProfileResponse)
async def get_operator_profile(user: dict = Depends(get_current_user)):
    """Get your operator profile."""
    return await operator_service.get_operator_profile(user["id"])


@router.put("/profile", response_model=OperatorProfileResponse)
async def update_operator_profile(data: OperatorProfileUpdate, user: dict = Depends(get_current_user)):
    """Update your operator profile."""
    return await operator_service.update_operator_profile(user["id"], data)


@router.get("/check")
async def check_operator_status(user: dict = Depends(get_current_user)):
    """Check if the current user is registered as an operator."""
    return await operator_service.check_is_operator(user["id"])


# ── Dashboard ──

@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard(user: dict = Depends(get_current_user)):
    """Get operator dashboard statistics."""
    return await operator_service.get_dashboard_stats(user["id"])


# ── Ambulance CRUD ──

@router.post("/ambulances", response_model=AmbulanceResponse, status_code=201)
async def create_ambulance(data: AmbulanceCreate, user: dict = Depends(get_current_user)):
    """Register a new ambulance."""
    return await operator_service.create_ambulance(user["id"], data)


@router.get("/ambulances", response_model=list[AmbulanceResponse])
async def list_ambulances(user: dict = Depends(get_current_user)):
    """List all your ambulances."""
    return await operator_service.list_ambulances(user["id"])


@router.get("/ambulances/{ambulance_id}", response_model=AmbulanceResponse)
async def get_ambulance(ambulance_id: str, user: dict = Depends(get_current_user)):
    """Get a single ambulance by ID."""
    return await operator_service.get_ambulance(user["id"], ambulance_id)


@router.patch("/ambulances/{ambulance_id}", response_model=AmbulanceResponse)
async def update_ambulance(ambulance_id: str, data: AmbulanceUpdate, user: dict = Depends(get_current_user)):
    """Update ambulance details."""
    return await operator_service.update_ambulance(user["id"], ambulance_id, data)


@router.delete("/ambulances/{ambulance_id}")
async def delete_ambulance(ambulance_id: str, user: dict = Depends(get_current_user)):
    """Delete an ambulance."""
    return await operator_service.delete_ambulance(user["id"], ambulance_id)


@router.patch("/ambulances/{ambulance_id}/status", response_model=AmbulanceResponse)
async def toggle_ambulance_status(
    ambulance_id: str,
    new_status: AmbulanceStatus = Query(..., description="New status"),
    user: dict = Depends(get_current_user),
):
    """Quick status toggle for an ambulance."""
    return await operator_service.update_ambulance_status(user["id"], ambulance_id, new_status)
