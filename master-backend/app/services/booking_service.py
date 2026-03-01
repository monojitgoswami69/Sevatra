from app.firebase_client import get_db, doc_to_dict, now_iso
from app.models.booking import BookingCreate, BookingUpdate, BookingStatus
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class BookingService:
    """Handles scheduled transport booking CRUD operations via Firestore."""

    def _get_db(self):
        return get_db()

    async def create_booking(self, user_id: str, data: BookingCreate) -> dict:
        db = self._get_db()
        now = now_iso()
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
            "status": BookingStatus.PENDING,
            "created_at": now,
            "updated_at": now,
        }
        _, doc_ref = db.collection("bookings").add(payload)
        payload["id"] = doc_ref.id
        return payload

    async def list_bookings(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict]:
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
            )
        return data

    async def update_booking(
        self, user_id: str, booking_id: str, data: BookingUpdate
    ) -> dict:
        db = self._get_db()

        # Verify ownership
        existing = await self.get_booking(user_id, booking_id)

        # Can only update pending/confirmed bookings
        if existing["status"] not in [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot update booking in '{existing['status']}' status",
            )

        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
            )

        update_data["updated_at"] = now_iso()

        doc_ref = db.collection("bookings").document(booking_id)
        doc_ref.update(update_data)

        updated_doc = doc_ref.get()
        return doc_to_dict(updated_doc)

    async def cancel_booking(self, user_id: str, booking_id: str) -> dict:
        db = self._get_db()

        existing = await self.get_booking(user_id, booking_id)
        if existing["status"] in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel booking in '{existing['status']}' status",
            )

        doc_ref = db.collection("bookings").document(booking_id)
        doc_ref.update({
            "status": BookingStatus.CANCELLED,
            "updated_at": now_iso(),
        })

        updated_doc = doc_ref.get()
        return doc_to_dict(updated_doc)


booking_service = BookingService()
