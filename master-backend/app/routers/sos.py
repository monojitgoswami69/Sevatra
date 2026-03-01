from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.sos_service import sos_service
from app.models.sos import (
    SosActivateRequest,
    SosVerifyRequest,
    SosCancelRequest,
    SosResponse,
)

router = APIRouter(prefix="/sos", tags=["Emergency SOS"])


class SosSendOtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)


@router.post("/activate", response_model=SosResponse, status_code=201)
async def activate_sos(data: SosActivateRequest):
    """
    Initiate an emergency SOS event.

    NO AUTHENTICATION REQUIRED — every second counts in an emergency.
    Creates a new SOS record. The caller must then verify via OTP
    before an ambulance is dispatched.
    """
    return await sos_service.activate(data)


@router.post("/{sos_id}/send-otp")
async def send_sos_otp(sos_id: str, data: SosSendOtpRequest):
    """Send OTP to the caller's phone for SOS verification. No auth required."""
    return await sos_service.send_verification(sos_id, data.phone)


@router.post("/{sos_id}/verify")
async def verify_sos(sos_id: str, data: SosVerifyRequest):
    """
    Verify the SOS event with OTP. No auth required.

    On success, marks the SOS as verified and dispatches the ambulance.
    """
    return await sos_service.verify(sos_id, data.phone, data.otp_code)


@router.get("/{sos_id}/status", response_model=SosResponse)
async def get_sos_status(sos_id: str):
    """Get the current status of an SOS event. No auth required."""
    return await sos_service.get_status(sos_id)


@router.post("/{sos_id}/cancel", response_model=SosResponse)
async def cancel_sos(sos_id: str, data: SosCancelRequest):
    """Cancel an active SOS event. No auth required."""
    return await sos_service.cancel(sos_id, data)
