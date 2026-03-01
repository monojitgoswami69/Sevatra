from app.firebase_client import get_db, doc_to_dict, now_iso
from app.models.user import (
    ProfileUpdate,
    AddressCreate,
    EmergencyContactCreate,
    MedicalConditionCreate,
)
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Handles user profile, addresses, emergency contacts, and medical data via Firestore."""

    def _get_db(self):
        return get_db()

    # ── Profile ──

    async def get_profile(self, user_id: str) -> dict:
        db = self._get_db()
        doc = db.collection("profiles").document(user_id).get()
        data = doc_to_dict(doc)
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return data

    async def update_profile(self, user_id: str, data: ProfileUpdate) -> dict:
        db = self._get_db()
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

        update_data["updated_at"] = now_iso()

        doc_ref = db.collection("profiles").document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        return doc_to_dict(updated_doc)

    # ── Addresses ──

    async def list_addresses(self, user_id: str) -> list[dict]:
        db = self._get_db()
        try:
            docs = (
                db.collection("addresses")
                .where("user_id", "==", user_id)
                .order_by("created_at")
                .get()
            )
        except Exception:
            # Composite index may not exist — fall back to unordered query
            docs = (
                db.collection("addresses")
                .where("user_id", "==", user_id)
                .get()
            )
        return [doc_to_dict(d) for d in docs]

    async def create_address(self, user_id: str, data: AddressCreate) -> dict:
        db = self._get_db()
        now = now_iso()
        payload = {
            "user_id": user_id,
            "label": data.label,
            "address": data.address,
            "icon": data.icon,
            "created_at": now,
        }
        _, doc_ref = db.collection("addresses").add(payload)
        payload["id"] = doc_ref.id
        return payload

    async def delete_address(self, user_id: str, address_id: str) -> dict:
        db = self._get_db()
        doc_ref = db.collection("addresses").document(address_id)
        doc = doc_ref.get()
        if not doc.exists or doc.to_dict().get("user_id") != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
        doc_ref.delete()
        return {"message": "Address deleted"}

    # ── Emergency Contacts ──

    async def list_emergency_contacts(self, user_id: str) -> list[dict]:
        db = self._get_db()
        try:
            docs = (
                db.collection("emergency_contacts")
                .where("user_id", "==", user_id)
                .order_by("created_at")
                .get()
            )
        except Exception:
            docs = (
                db.collection("emergency_contacts")
                .where("user_id", "==", user_id)
                .get()
            )
        return [doc_to_dict(d) for d in docs]

    async def create_emergency_contact(self, user_id: str, data: EmergencyContactCreate) -> dict:
        db = self._get_db()
        now = now_iso()
        payload = {
            "user_id": user_id,
            "name": data.name,
            "phone": data.phone,
            "created_at": now,
        }
        _, doc_ref = db.collection("emergency_contacts").add(payload)
        payload["id"] = doc_ref.id
        return payload

    async def delete_emergency_contact(self, user_id: str, contact_id: str) -> dict:
        db = self._get_db()
        doc_ref = db.collection("emergency_contacts").document(contact_id)
        doc = doc_ref.get()
        if not doc.exists or doc.to_dict().get("user_id") != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
        doc_ref.delete()
        return {"message": "Contact deleted"}

    # ── Medical Conditions ──

    async def list_medical_conditions(self, user_id: str) -> list[dict]:
        db = self._get_db()
        try:
            docs = (
                db.collection("medical_conditions")
                .where("user_id", "==", user_id)
                .order_by("created_at")
                .get()
            )
        except Exception:
            docs = (
                db.collection("medical_conditions")
                .where("user_id", "==", user_id)
                .get()
            )
        return [doc_to_dict(d) for d in docs]

    async def create_medical_condition(self, user_id: str, data: MedicalConditionCreate) -> dict:
        db = self._get_db()
        now = now_iso()
        payload = {
            "user_id": user_id,
            "condition": data.condition,
            "created_at": now,
        }
        _, doc_ref = db.collection("medical_conditions").add(payload)
        payload["id"] = doc_ref.id
        return payload

    async def delete_medical_condition(self, user_id: str, condition_id: str) -> dict:
        db = self._get_db()
        doc_ref = db.collection("medical_conditions").document(condition_id)
        doc = doc_ref.get()
        if not doc.exists or doc.to_dict().get("user_id") != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Condition not found")
        doc_ref.delete()
        return {"message": "Condition deleted"}


user_service = UserService()
