from app.firebase_client import get_db, doc_to_dict, now_iso
from app.models.sos import SosActivateRequest, SosCancelRequest, SosStatus
from app.services.twilio_service import twilio_service
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class SosService:
    """Handles SOS event lifecycle: activate -> OTP -> verify -> dispatch.

    No authentication required — emergencies cannot wait.
    If a user is logged in, their user_id can optionally be attached,
    but the entire flow works without one.
    """

    def _get_db(self):
        return get_db()

    async def activate(self, data: SosActivateRequest, user_id: str | None = None) -> dict:
        """Create a new SOS event. Works with or without a logged-in user."""
        db = self._get_db()
        now = now_iso()
        payload = {
            "status": SosStatus.INITIATED,
            "latitude": data.latitude,
            "longitude": data.longitude,
            "address": data.address,
            "user_id": user_id,
            "verified_phone": None,
            "cancel_reason": None,
            "created_at": now,
            "updated_at": now,
        }

        _, doc_ref = db.collection("sos_events").add(payload)
        payload["id"] = doc_ref.id
        return payload

    async def send_verification(self, sos_id: str, phone: str) -> dict:
        """Send OTP for SOS verification."""
        db = self._get_db()

        sos = self._get_sos_event(sos_id)
        if sos["status"] not in [SosStatus.INITIATED, SosStatus.COUNTDOWN, SosStatus.OTP_SENT]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot send OTP for SOS in '{sos['status']}' status",
            )

        # Send OTP via Twilio
        otp_result = await twilio_service.send_otp(phone, purpose=f"sos_{sos_id}")

        if otp_result["success"]:
            db.collection("sos_events").document(sos_id).update({
                "status": SosStatus.OTP_SENT,
                "updated_at": now_iso(),
            })

        return otp_result

    async def verify(self, sos_id: str, phone: str, otp_code: str) -> dict:
        """Verify OTP and mark SOS as verified + dispatched."""
        db = self._get_db()

        sos = self._get_sos_event(sos_id)
        if sos["status"] not in [SosStatus.OTP_SENT, SosStatus.INITIATED, SosStatus.COUNTDOWN]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot verify SOS in '{sos['status']}' status",
            )

        # Verify OTP
        verify_result = await twilio_service.verify_otp(phone, otp_code, purpose=f"sos_{sos_id}")

        if not verify_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=verify_result["message"],
            )

        # Mark as verified and dispatched
        db.collection("sos_events").document(sos_id).update({
            "status": SosStatus.DISPATCHED,
            "verified_phone": phone,
            "updated_at": now_iso(),
        })

        return {
            "id": sos_id,
            "status": SosStatus.DISPATCHED,
            "message": "SOS verified. Ambulance dispatched.",
        }

    async def get_status(self, sos_id: str) -> dict:
        """Get the current status of an SOS event."""
        return self._get_sos_event(sos_id)

    async def cancel(self, sos_id: str, data: SosCancelRequest) -> dict:
        """Cancel an SOS event."""
        db = self._get_db()

        sos = self._get_sos_event(sos_id)
        if sos["status"] in [SosStatus.COMPLETED, SosStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel SOS in '{sos['status']}' status",
            )

        db.collection("sos_events").document(sos_id).update({
            "status": SosStatus.CANCELLED,
            "cancel_reason": data.reason,
            "updated_at": now_iso(),
        })

        updated_doc = db.collection("sos_events").document(sos_id).get()
        result = doc_to_dict(updated_doc)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="SOS event not found"
            )
        return result

    def _get_sos_event(self, sos_id: str) -> dict:
        """Fetch an SOS event by ID only — no user ownership check."""
        db = self._get_db()
        doc = db.collection("sos_events").document(sos_id).get()
        data = doc_to_dict(doc)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="SOS event not found"
            )
        return data


sos_service = SosService()
