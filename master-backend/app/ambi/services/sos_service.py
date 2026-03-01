"""SOS event lifecycle service — Firestore backed."""

import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.ambi.models import BookingStatus, SosActivateRequest, SosCancelRequest, SosStatus
from app.ambi.services.ambulance_assignment import assignment_service
from app.ambi.services.twilio_service import twilio_service
from app.firebase_client import doc_to_dict, get_db, now_iso

logger = logging.getLogger(__name__)


class SosService:
    """Handles SOS: activate -> OTP -> verify -> dispatch.

    No authentication required — emergencies cannot wait.
    Logged-in users get auto-dispatch and a booking history entry.
    """

    @staticmethod
    def _get_db():
        return get_db()

    # ── helpers ──────────────────────────────────────────────

    async def _create_sos_booking(
        self, sos_data: dict, ambulance_info: dict | None = None,
    ) -> dict | None:
        """Create a record in the ``bookings`` collection so the SOS appears
        in booking history for logged-in users."""
        user_id = sos_data.get("user_id")
        if not user_id:
            return None

        db = self._get_db()
        now = now_iso()
        utc_now = datetime.now(timezone.utc)

        # Fetch user profile for patient details
        user_doc = db.collection("users").document(user_id).get()
        user_data = doc_to_dict(user_doc) or {}

        pickup = sos_data.get("address") or ""
        if not pickup and (sos_data.get("latitude") or sos_data.get("longitude")):
            pickup = f"GPS: {sos_data.get('latitude', 'N/A')}, {sos_data.get('longitude', 'N/A')}"

        payload = {
            "user_id": user_id,
            "patient_name": user_data.get("full_name", "SOS Emergency"),
            "patient_phone": sos_data.get("verified_phone") or user_data.get("phone", ""),
            "patient_age": user_data.get("age"),
            "patient_gender": user_data.get("gender"),
            "pickup_address": pickup or "Location not available",
            "destination": "Nearest Hospital (Emergency)",
            "scheduled_date": utc_now.strftime("%Y-%m-%d"),
            "scheduled_time": utc_now.strftime("%H:%M"),
            "reason": "SOS Emergency",
            "special_needs": {},
            "additional_notes": f"SOS Emergency Dispatch (SOS ID: {sos_data.get('id', 'N/A')})",
            "status": BookingStatus.CONFIRMED,
            "booking_type": "sos",
            "sos_id": sos_data.get("id"),
            "assigned_ambulance": ambulance_info,
            "created_at": now,
            "updated_at": now,
        }
        _, doc_ref = db.collection("bookings").add(payload)
        payload["id"] = doc_ref.id
        logger.info("Created SOS booking %s for user %s", doc_ref.id, user_id)
        return payload

    # ── public API ──────────────────────────────────────────

    async def _assign_ambulance(
        self,
        latitude: float | None,
        longitude: float | None,
        *,
        booking_id: str | None = None,
        sos_id: str | None = None,
    ) -> dict | None:
        """Attempt to find & assign the nearest available ambulance."""
        try:
            return await assignment_service.find_and_assign(
                latitude, longitude,
                booking_id=booking_id,
                sos_id=sos_id,
            )
        except Exception as exc:
            logger.error("Ambulance assignment failed: %s", exc)
            return None

    async def activate(self, data: SosActivateRequest, user_id: str | None = None) -> dict:
        db = self._get_db()
        now = now_iso()

        # Logged-in users skip OTP → auto-dispatch
        initial_status = SosStatus.DISPATCHED if user_id else SosStatus.INITIATED

        payload = {
            "status": initial_status,
            "latitude": data.latitude,
            "longitude": data.longitude,
            "address": data.address,
            "user_id": user_id,
            "verified_phone": None,
            "cancel_reason": None,
            "assigned_ambulance": None,
            "created_at": now,
            "updated_at": now,
        }
        _, doc_ref = db.collection("sos_events").add(payload)
        payload["id"] = doc_ref.id

        # Auto-dispatch for logged-in users → assign ambulance immediately
        ambulance_info: dict | None = None
        if user_id:
            ambulance_info = await self._assign_ambulance(
                data.latitude, data.longitude, sos_id=doc_ref.id,
            )
            if ambulance_info:
                payload["assigned_ambulance"] = ambulance_info
                db.collection("sos_events").document(doc_ref.id).update({
                    "assigned_ambulance": ambulance_info,
                })
            await self._create_sos_booking(payload, ambulance_info)

        return payload

    async def send_verification(self, sos_id: str, phone: str) -> dict:
        db = self._get_db()
        sos = self._get_sos_event(sos_id)

        if sos["status"] not in [SosStatus.INITIATED, SosStatus.COUNTDOWN, SosStatus.OTP_SENT]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot send OTP for SOS in '{sos['status']}' status",
            )

        otp_result = await twilio_service.send_otp(phone, purpose=f"sos_{sos_id}")
        if otp_result["success"]:
            db.collection("sos_events").document(sos_id).update({
                "status": SosStatus.OTP_SENT,
                "updated_at": now_iso(),
            })
        return otp_result

    async def verify(self, sos_id: str, phone: str, otp_code: str) -> dict:
        db = self._get_db()
        sos = self._get_sos_event(sos_id)

        if sos["status"] not in [SosStatus.OTP_SENT, SosStatus.INITIATED, SosStatus.COUNTDOWN]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot verify SOS in '{sos['status']}' status",
            )

        verify_result = await twilio_service.verify_otp(phone, otp_code, purpose=f"sos_{sos_id}")
        if not verify_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=verify_result["message"],
            )

        # Assign nearest ambulance
        ambulance_info = await self._assign_ambulance(
            sos.get("latitude"), sos.get("longitude"), sos_id=sos_id,
        )

        update_fields: dict = {
            "status": SosStatus.DISPATCHED,
            "verified_phone": phone,
            "updated_at": now_iso(),
        }
        if ambulance_info:
            update_fields["assigned_ambulance"] = ambulance_info

        db.collection("sos_events").document(sos_id).update(update_fields)

        # Create booking record for history (if SOS has a user_id)
        updated_sos = doc_to_dict(db.collection("sos_events").document(sos_id).get())
        if updated_sos:
            await self._create_sos_booking(updated_sos, ambulance_info)

        result: dict = {
            "id": sos_id,
            "status": SosStatus.DISPATCHED,
            "message": "SOS verified. Ambulance dispatched.",
        }
        if ambulance_info:
            result["assigned_ambulance"] = ambulance_info
        return result

    async def get_status(self, sos_id: str) -> dict:
        return self._get_sos_event(sos_id)

    async def cancel(self, sos_id: str, data: SosCancelRequest) -> dict:
        db = self._get_db()
        sos = self._get_sos_event(sos_id)

        if sos["status"] in [SosStatus.COMPLETED, SosStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel SOS in '{sos['status']}' status",
            )

        # Release assigned ambulance back to available
        amb = sos.get("assigned_ambulance")
        if amb and amb.get("ambulance_id"):
            await assignment_service.release(amb["ambulance_id"])

        db.collection("sos_events").document(sos_id).update({
            "status": SosStatus.CANCELLED,
            "cancel_reason": data.reason,
            "updated_at": now_iso(),
        })

        updated_doc = db.collection("sos_events").document(sos_id).get()
        result = doc_to_dict(updated_doc)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOS event not found")
        return result

    def _get_sos_event(self, sos_id: str) -> dict:
        db = self._get_db()
        doc = db.collection("sos_events").document(sos_id).get()
        data = doc_to_dict(doc)
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOS event not found")
        return data


sos_service = SosService()
