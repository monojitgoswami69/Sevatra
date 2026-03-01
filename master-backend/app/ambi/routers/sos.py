"""Emergency SOS endpoints — NO AUTHENTICATION REQUIRED."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.dependencies import get_optional_current_user
from app.ambi.services.sos_service import sos_service
from app.ambi.models import (
    SosActivateRequest,
    SosVerifyRequest,
    SosCancelRequest,
    SosResponse,
)

router = APIRouter(prefix="/sos", tags=["Emergency SOS"])


class SosSendOtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)


@router.post("/activate", response_model=SosResponse, status_code=201)
async def activate_sos(
    data: SosActivateRequest,
    user: dict | None = Depends(get_optional_current_user),
):
    """Initiate an emergency SOS event.

    Auth is optional — logged-in users get auto-dispatch and a booking
    history entry; unauthenticated callers proceed through the OTP flow.
    """
    return await sos_service.activate(data, user_id=user["id"] if user else None)


@router.post("/{sos_id}/send-otp")
async def send_sos_otp(sos_id: str, data: SosSendOtpRequest):
    """Send OTP to the caller's phone for SOS verification."""
    return await sos_service.send_verification(sos_id, data.phone)


@router.post("/{sos_id}/verify")
async def verify_sos(sos_id: str, data: SosVerifyRequest):
    """Verify the SOS event with OTP. Dispatches ambulance on success."""
    return await sos_service.verify(sos_id, data.phone, data.otp_code)


@router.get("/{sos_id}/status", response_model=SosResponse)
async def get_sos_status(sos_id: str):
    """Get the current status of an SOS event."""
    return await sos_service.get_status(sos_id)


@router.post("/{sos_id}/cancel", response_model=SosResponse)
async def cancel_sos(sos_id: str, data: SosCancelRequest):
    """Cancel an active SOS event."""
    return await sos_service.cancel(sos_id, data)
