"""Ambulance assignment service — finds and assigns the nearest available ambulance.

Queries the global ``ambulances`` Firestore collection (managed by OperatoSevatra
operators) and assigns the closest one to an SOS event or scheduled booking.
"""

import logging
import math
from typing import Optional

from app.firebase_client import doc_to_dict, get_db, now_iso

logger = logging.getLogger(__name__)

# Earth radius in km (for haversine)
_EARTH_R_KM = 6_371.0


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance in km between two GPS points."""
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    )
    return _EARTH_R_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class AmbulanceAssignmentService:
    """Find, assign, and release ambulances from the global pool."""

    @staticmethod
    def _get_db():
        return get_db()

    # ── Public API ──────────────────────────────────────────

    async def find_and_assign(
        self,
        latitude: Optional[float],
        longitude: Optional[float],
        *,
        booking_id: Optional[str] = None,
        sos_id: Optional[str] = None,
    ) -> Optional[dict]:
        """Find the nearest available ambulance and assign it.

        Returns a dict with ambulance + driver details ready to embed in a
        booking/SOS document, or ``None`` if no ambulance is available.
        """
        db = self._get_db()

        # Pull all available ambulances
        docs = (
            db.collection("ambulances")
            .where("status", "==", "available")
            .get()
        )
        candidates = [doc_to_dict(d) for d in docs if doc_to_dict(d)]

        if not candidates:
            logger.warning("No available ambulances in the pool")
            return None

        # ── Pick the best one ──
        if latitude is not None and longitude is not None:
            # Sort by distance from the request location
            for amb in candidates:
                base_lat = amb.get("base_latitude")
                base_lng = amb.get("base_longitude")
                if base_lat is not None and base_lng is not None:
                    amb["_distance_km"] = _haversine_km(latitude, longitude, base_lat, base_lng)
                else:
                    # No base location → treat as very far so ambulances with
                    # known positions are preferred
                    amb["_distance_km"] = 999_999

            candidates.sort(key=lambda a: a["_distance_km"])
        # else: no GPS → just pick the first available (FIFO)

        chosen = candidates[0]
        ambulance_id = chosen["id"]
        distance_km = chosen.get("_distance_km")

        # ── Mark as on_trip ──
        now = now_iso()
        assignment_ref = {
            "booking_id": booking_id,
            "sos_id": sos_id,
            "assigned_at": now,
        }
        db.collection("ambulances").document(ambulance_id).update({
            "status": "on_trip",
            "current_assignment": assignment_ref,
            "updated_at": now,
        })

        logger.info(
            "Assigned ambulance %s (%s) — distance %.1f km — booking=%s sos=%s",
            ambulance_id,
            chosen.get("vehicle_number"),
            distance_km if distance_km is not None else -1,
            booking_id,
            sos_id,
        )

        # ── Build the embedded summary returned to callers ──
        return {
            "ambulance_id": ambulance_id,
            "vehicle_number": chosen.get("vehicle_number", ""),
            "ambulance_type": chosen.get("ambulance_type", "basic"),
            "driver_name": chosen.get("driver_name", ""),
            "driver_phone": chosen.get("driver_phone", ""),
            "driver_photo_url": chosen.get("driver_photo_url"),
            "vehicle_make": chosen.get("vehicle_make"),
            "vehicle_model": chosen.get("vehicle_model"),
            "vehicle_year": chosen.get("vehicle_year"),
            "has_oxygen": chosen.get("has_oxygen", False),
            "has_defibrillator": chosen.get("has_defibrillator", False),
            "has_stretcher": chosen.get("has_stretcher", True),
            "has_ventilator": chosen.get("has_ventilator", False),
            "base_latitude": chosen.get("base_latitude"),
            "base_longitude": chosen.get("base_longitude"),
            "base_address": chosen.get("base_address"),
            "distance_km": round(distance_km, 2) if distance_km is not None else None,
            "operator_id": chosen.get("operator_id"),
        }

    async def release(self, ambulance_id: str) -> None:
        """Set an ambulance back to *available* (trip completed / cancelled)."""
        db = self._get_db()
        doc = db.collection("ambulances").document(ambulance_id).get()
        if not doc.exists:
            logger.warning("Cannot release unknown ambulance %s", ambulance_id)
            return

        db.collection("ambulances").document(ambulance_id).update({
            "status": "available",
            "current_assignment": None,
            "updated_at": now_iso(),
        })
        logger.info("Released ambulance %s back to available", ambulance_id)

    async def get_assignment_for_booking(self, booking_id: str) -> Optional[dict]:
        """Look up which ambulance is currently assigned to a booking."""
        db = self._get_db()
        docs = list(
            db.collection("ambulances")
            .where("current_assignment.booking_id", "==", booking_id)
            .limit(1)
            .get()
        )
        if not docs:
            return None
        return doc_to_dict(docs[0])


assignment_service = AmbulanceAssignmentService()
