"""Booking CRUD service — Firestore backed."""

import logging

from fastapi import HTTPException, status

from app.ambi.models import BookingCreate, BookingStatus, BookingUpdate
from app.ambi.services.ambulance_assignment import assignment_service
from app.firebase_client import doc_to_dict, get_db, now_iso

logger = logging.getLogger(__name__)


class BookingService:
    """Handles scheduled transport booking CRUD operations."""

    @staticmethod
    def _get_db():
        return get_db()

    async def create_booking(self, user_id: str, data: BookingCreate) -> dict:
        db = self._get_db()
        now = now_iso()

        # Try to assign the nearest available ambulance
        ambulance_info = None
        try:
            ambulance_info = await assignment_service.find_and_assign(
                data.latitude, data.longitude,
                booking_id=None,  # will update after doc creation
            )
        except Exception as exc:
            logger.warning("Ambulance assignment failed during booking: %s", exc)

        payload = {
            "user_id": user_id,
            "patient_name": data.patient_name,
            "patient_phone": data.patient_phone,
            "patient_age": data.patient_age,
            "patient_gender": data.patient_gender,
            "pickup_address": data.pickup_address,
            "destination": data.destination,
            "scheduled_date": data.scheduled_date,
            "scheduled_time": data.scheduled_time,
            "reason": data.reason,
            "special_needs": data.special_needs or {},
            "additional_notes": data.additional_notes,
            "status": BookingStatus.CONFIRMED if ambulance_info else BookingStatus.PENDING,
            "assigned_ambulance": ambulance_info,
            "created_at": now,
            "updated_at": now,
        }
        _, doc_ref = db.collection("bookings").add(payload)
        payload["id"] = doc_ref.id

        # Update the ambulance's assignment ref with the real booking ID
        if ambulance_info:
            amb_id = ambulance_info["ambulance_id"]
            db.collection("ambulances").document(amb_id).update({
                "current_assignment.booking_id": doc_ref.id,
            })

        return payload

    async def list_bookings(self, user_id: str, limit: int = 20, offset: int = 0) -> list[dict]:
        db = self._get_db()
        query = (
            db.collection("bookings")
            .where("user_id", "==", user_id)
            .order_by("created_at", direction="DESCENDING")
            .offset(offset)
            .limit(limit)
        )
        docs = query.get()
        return [doc_to_dict(d) for d in docs]

    async def get_booking(self, user_id: str, booking_id: str) -> dict:
        db = self._get_db()
        doc = db.collection("bookings").document(booking_id).get()
        data = doc_to_dict(doc)
        if not data or data.get("user_id") != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        return data

    async def update_booking(self, user_id: str, booking_id: str, data: BookingUpdate) -> dict:
        db = self._get_db()
        existing = await self.get_booking(user_id, booking_id)

        if existing["status"] not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot update booking in '{existing['status']}' status",
            )

        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

        update_data["updated_at"] = now_iso()
        doc_ref = db.collection("bookings").document(booking_id)
        doc_ref.update(update_data)
        return doc_to_dict(doc_ref.get())

    async def cancel_booking(self, user_id: str, booking_id: str) -> dict:
        db = self._get_db()
        existing = await self.get_booking(user_id, booking_id)

        if existing["status"] in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel booking in '{existing['status']}' status",
            )

        # Release assigned ambulance back to available pool
        amb = existing.get("assigned_ambulance")
        if amb and amb.get("ambulance_id"):
            try:
                await assignment_service.release(amb["ambulance_id"])
            except Exception as exc:
                logger.warning("Failed to release ambulance %s: %s", amb["ambulance_id"], exc)

        doc_ref = db.collection("bookings").document(booking_id)
        doc_ref.update({
            "status": BookingStatus.CANCELLED,
            "assigned_ambulance": None,
            "updated_at": now_iso(),
        })
        return doc_to_dict(doc_ref.get())


booking_service = BookingService()
