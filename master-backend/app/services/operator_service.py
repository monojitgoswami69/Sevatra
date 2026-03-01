from app.firebase_client import get_db, doc_to_dict, now_iso
from app.models.operator import (
    OperatorRegisterRequest,
    OperatorProfileUpdate,
    AmbulanceCreate,
    AmbulanceUpdate,
    AmbulanceStatus,
)
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class OperatorService:
    """Handles operator registration, ambulance CRUD, and dashboard stats."""

    def _get_db(self):
        return get_db()

    # ── Operator Profile ──

    async def register_operator(self, user_id: str, data: OperatorRegisterRequest) -> dict:
        """Register an authenticated user as an ambulance operator."""
        db = self._get_db()

        # Check if already registered
        existing = db.collection("operators").where("user_id", "==", user_id).limit(1).get()
        if len(list(existing)) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already registered as an operator.",
            )

        now = now_iso()
        doc_data = {
            "user_id": user_id,
            "operator_type": data.operator_type.value,
            "full_name": data.full_name,
            "phone": data.phone,
            "facility_name": data.facility_name,
            "facility_address": data.facility_address,
            "facility_phone": data.facility_phone,
            "license_number": data.license_number,
            "is_verified": False,
            "ambulance_count": 0,
            "created_at": now,
            "updated_at": now,
        }

        doc_ref = db.collection("operators").document()
        doc_ref.set(doc_data)

        return {**doc_data, "id": doc_ref.id}

    async def get_operator_profile(self, user_id: str) -> dict:
        """Get operator profile for the current user."""
        db = self._get_db()
        docs = db.collection("operators").where("user_id", "==", user_id).limit(1).get()
        docs_list = list(docs)
        if not docs_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Operator profile not found. Please register first.",
            )
        return doc_to_dict(docs_list[0])

    async def update_operator_profile(self, user_id: str, data: OperatorProfileUpdate) -> dict:
        """Update operator profile."""
        db = self._get_db()
        docs = db.collection("operators").where("user_id", "==", user_id).limit(1).get()
        docs_list = list(docs)
        if not docs_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Operator profile not found.",
            )

        doc_ref = docs_list[0].reference
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return doc_to_dict(docs_list[0])

        updates["updated_at"] = now_iso()
        doc_ref.update(updates)
        return doc_to_dict(doc_ref.get())

    async def check_is_operator(self, user_id: str) -> dict:
        """Check if a user is registered as an operator. Returns operator info or null."""
        db = self._get_db()
        docs = db.collection("operators").where("user_id", "==", user_id).limit(1).get()
        docs_list = list(docs)
        if not docs_list:
            return {"is_operator": False, "operator": None}
        op = doc_to_dict(docs_list[0])
        return {"is_operator": True, "operator": op}

    # ── Ambulance CRUD ──

    async def _get_operator_doc(self, user_id: str):
        """Internal: get operator doc, raise 404 if not found."""
        db = self._get_db()
        docs = db.collection("operators").where("user_id", "==", user_id).limit(1).get()
        docs_list = list(docs)
        if not docs_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Operator profile not found. Please register first.",
            )
        return docs_list[0]

    async def create_ambulance(self, user_id: str, data: AmbulanceCreate) -> dict:
        """Add a new ambulance under this operator."""
        db = self._get_db()
        op_doc = await self._get_operator_doc(user_id)
        op_data = op_doc.to_dict()
        operator_id = op_doc.id

        # Individual operators can only have 1 ambulance
        if op_data.get("operator_type") == "individual":
            existing = db.collection("ambulances").where("operator_id", "==", operator_id).limit(1).get()
            if len(list(existing)) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Individual operators can only register one ambulance. Upgrade to provider to add more.",
                )

        # Check duplicate vehicle number
        dup = db.collection("ambulances").where("vehicle_number", "==", data.vehicle_number).limit(1).get()
        if len(list(dup)) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ambulance with vehicle number {data.vehicle_number} is already registered.",
            )

        now = now_iso()
        amb_data = {
            "operator_id": operator_id,
            "vehicle_number": data.vehicle_number,
            "ambulance_type": data.ambulance_type.value,
            "status": AmbulanceStatus.AVAILABLE.value,
            "vehicle_make": data.vehicle_make,
            "vehicle_model": data.vehicle_model,
            "vehicle_year": data.vehicle_year,
            "has_oxygen": data.has_oxygen,
            "has_defibrillator": data.has_defibrillator,
            "has_stretcher": data.has_stretcher,
            "has_ventilator": data.has_ventilator,
            "has_first_aid": data.has_first_aid,
            "driver_name": data.driver_name,
            "driver_phone": data.driver_phone,
            "driver_license_number": data.driver_license_number,
            "driver_experience_years": data.driver_experience_years,
            "driver_photo_url": data.driver_photo_url,
            "base_latitude": data.base_latitude,
            "base_longitude": data.base_longitude,
            "base_address": data.base_address,
            "service_radius_km": data.service_radius_km,
            "price_per_km": data.price_per_km,
            "notes": data.notes,
            "created_at": now,
            "updated_at": now,
        }

        doc_ref = db.collection("ambulances").document()
        doc_ref.set(amb_data)

        # Update ambulance count
        new_count = op_data.get("ambulance_count", 0) + 1
        op_doc.reference.update({"ambulance_count": new_count, "updated_at": now})

        return {**amb_data, "id": doc_ref.id}

    async def list_ambulances(self, user_id: str) -> list[dict]:
        """List all ambulances for this operator."""
        db = self._get_db()
        op_doc = await self._get_operator_doc(user_id)
        operator_id = op_doc.id

        docs = db.collection("ambulances").where("operator_id", "==", operator_id).get()
        return [doc_to_dict(d) for d in docs]

    async def get_ambulance(self, user_id: str, ambulance_id: str) -> dict:
        """Get a single ambulance by ID (must belong to this operator)."""
        db = self._get_db()
        op_doc = await self._get_operator_doc(user_id)
        operator_id = op_doc.id

        doc = db.collection("ambulances").document(ambulance_id).get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ambulance not found.")

        amb = doc_to_dict(doc)
        if amb.get("operator_id") != operator_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ambulance.")

        return amb

    async def update_ambulance(self, user_id: str, ambulance_id: str, data: AmbulanceUpdate) -> dict:
        """Update ambulance details."""
        db = self._get_db()
        op_doc = await self._get_operator_doc(user_id)
        operator_id = op_doc.id

        doc = db.collection("ambulances").document(ambulance_id).get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ambulance not found.")

        amb = doc_to_dict(doc)
        if amb.get("operator_id") != operator_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ambulance.")

        updates = {}
        for k, v in data.model_dump().items():
            if v is not None:
                # Convert enum values to string
                if hasattr(v, "value"):
                    updates[k] = v.value
                else:
                    updates[k] = v

        if not updates:
            return amb

        updates["updated_at"] = now_iso()
        db.collection("ambulances").document(ambulance_id).update(updates)
        return doc_to_dict(db.collection("ambulances").document(ambulance_id).get())

    async def delete_ambulance(self, user_id: str, ambulance_id: str) -> dict:
        """Delete an ambulance."""
        db = self._get_db()
        op_doc = await self._get_operator_doc(user_id)
        operator_id = op_doc.id
        op_data = op_doc.to_dict()

        doc = db.collection("ambulances").document(ambulance_id).get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ambulance not found.")

        amb = doc_to_dict(doc)
        if amb.get("operator_id") != operator_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ambulance.")

        db.collection("ambulances").document(ambulance_id).delete()

        # Update count
        new_count = max(0, op_data.get("ambulance_count", 1) - 1)
        op_doc.reference.update({"ambulance_count": new_count, "updated_at": now_iso()})

        return {"success": True, "message": f"Ambulance {amb.get('vehicle_number')} deleted."}

    async def update_ambulance_status(self, user_id: str, ambulance_id: str, new_status: AmbulanceStatus) -> dict:
        """Quick status toggle for an ambulance."""
        db = self._get_db()
        op_doc = await self._get_operator_doc(user_id)
        operator_id = op_doc.id

        doc = db.collection("ambulances").document(ambulance_id).get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ambulance not found.")

        amb = doc_to_dict(doc)
        if amb.get("operator_id") != operator_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ambulance.")

        db.collection("ambulances").document(ambulance_id).update({
            "status": new_status.value,
            "updated_at": now_iso(),
        })

        return doc_to_dict(db.collection("ambulances").document(ambulance_id).get())

    # ── Dashboard ──

    async def get_dashboard_stats(self, user_id: str) -> dict:
        """Get dashboard overview stats."""
        db = self._get_db()
        op_doc = await self._get_operator_doc(user_id)
        operator_id = op_doc.id
        op_data = op_doc.to_dict()

        ambulances = db.collection("ambulances").where("operator_id", "==", operator_id).get()
        ambulances_list = [doc_to_dict(d) for d in ambulances]

        available = sum(1 for a in ambulances_list if a.get("status") == "available")
        on_trip = sum(1 for a in ambulances_list if a.get("status") == "on_trip")
        maintenance = sum(1 for a in ambulances_list if a.get("status") == "maintenance")
        off_duty = sum(1 for a in ambulances_list if a.get("status") == "off_duty")

        return {
            "total_ambulances": len(ambulances_list),
            "available_ambulances": available,
            "on_trip_ambulances": on_trip,
            "maintenance_ambulances": maintenance,
            "off_duty_ambulances": off_duty,
            "total_trips_completed": 0,  # TODO: count completed bookings assigned to this operator
            "operator_type": op_data.get("operator_type", "individual"),
            "facility_name": op_data.get("facility_name"),
        }


operator_service = OperatorService()
