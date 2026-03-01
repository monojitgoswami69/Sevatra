"""Scheduled ambulance booking CRUD."""

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.ambi.services.booking_service import booking_service
from app.ambi.models import BookingCreate, BookingUpdate, BookingResponse

router = APIRouter(prefix="/bookings", tags=["Scheduled Bookings"])


@router.post("/", response_model=BookingResponse, status_code=201)
async def create_booking(data: BookingCreate, user: dict = Depends(get_current_user)):
    """Create a new scheduled transport booking."""
    return await booking_service.create_booking(user["id"], data)


@router.get("/", response_model=list[BookingResponse])
async def list_bookings(
    limit: int = Query(default=20, le=100, ge=1),
    offset: int = Query(default=0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List the current user's bookings, most recent first."""
    return await booking_service.list_bookings(user["id"], limit, offset)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    return await booking_service.get_booking(user["id"], booking_id)


@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str, data: BookingUpdate, user: dict = Depends(get_current_user),
):
    """Update a booking. Only pending or confirmed bookings can be modified."""
    return await booking_service.update_booking(user["id"], booking_id, data)


@router.delete("/{booking_id}", response_model=BookingResponse)
async def cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    """Cancel a booking."""
    return await booking_service.cancel_booking(user["id"], booking_id)
