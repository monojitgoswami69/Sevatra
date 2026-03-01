"""Real-time ambulance tracking via WebSocket + REST.

Prefix: ``/api/v1/tracking``

FIX: Simulation endpoint is now gated behind development mode.
"""

import asyncio
import json
import logging
import math
import time
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from app.config import get_settings
from app.firebase_client import doc_to_dict, get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tracking", tags=["Ambulance Tracking"])


# ── In-memory store (per-process) ──
# TODO: Replace with Redis pub/sub for multi-worker support.


class TrackingSession:
    """Holds live tracking state for one booking."""

    __slots__ = (
        "booking_id", "latitude", "longitude", "heading", "speed",
        "eta_minutes", "status", "driver_name", "driver_phone",
        "vehicle_number", "vehicle_type", "updated_at", "listeners",
    )

    def __init__(self, booking_id: str):
        self.booking_id = booking_id
        self.latitude: float = 0.0
        self.longitude: float = 0.0
        self.heading: float = 0.0
        self.speed: float = 0.0
        self.eta_minutes: float = 8.0
        self.status: str = "dispatched"
        self.driver_name: str = ""
        self.driver_phone: str = ""
        self.vehicle_number: str = ""
        self.vehicle_type: str = "ALS"
        self.updated_at: float = time.time()
        self.listeners: list[WebSocket] = []

    def snapshot(self) -> dict:
        return {
            "booking_id": self.booking_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "heading": self.heading,
            "speed": self.speed,
            "eta_minutes": self.eta_minutes,
            "status": self.status,
            "driver_name": self.driver_name,
            "driver_phone": self.driver_phone,
            "vehicle_number": self.vehicle_number,
            "vehicle_type": self.vehicle_type,
            "updated_at": self.updated_at,
        }


_sessions: dict[str, TrackingSession] = {}


def _get_or_create(booking_id: str) -> TrackingSession:
    if booking_id not in _sessions:
        _sessions[booking_id] = TrackingSession(booking_id)
    return _sessions[booking_id]


# ── REST: push location update (called by driver/operator app) ──


class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    heading: Optional[float] = Field(0, ge=0, le=360)
    speed: Optional[float] = Field(0, ge=0)
    eta_minutes: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern=r"^(dispatched|en_route|nearby|arrived)$")
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None


@router.post("/{booking_id}/location")
async def push_location(booking_id: str, update: LocationUpdate):
    """Push a GPS location update for a booking.

    Called by the driver/operator app every few seconds.
    All connected WebSocket listeners are notified immediately.
    """
    session = _get_or_create(booking_id)
    session.latitude = update.latitude
    session.longitude = update.longitude
    session.heading = update.heading or session.heading
    session.speed = update.speed or session.speed
    if update.eta_minutes is not None:
        session.eta_minutes = update.eta_minutes
    if update.status:
        session.status = update.status
    if update.driver_name:
        session.driver_name = update.driver_name
    if update.driver_phone:
        session.driver_phone = update.driver_phone
    if update.vehicle_number:
        session.vehicle_number = update.vehicle_number
    if update.vehicle_type:
        session.vehicle_type = update.vehicle_type
    session.updated_at = time.time()

    # Broadcast to all listeners
    snapshot = session.snapshot()
    dead: list[WebSocket] = []
    for ws in session.listeners:
        try:
            await ws.send_json(snapshot)
        except Exception:
            dead.append(ws)
    for ws in dead:
        session.listeners.remove(ws)

    return {"ok": True, "listeners": len(session.listeners)}


@router.get("/{booking_id}/location")
async def get_location(booking_id: str):
    """Get the latest known location for a booking (REST fallback)."""
    if booking_id not in _sessions:
        raise HTTPException(404, "No tracking data for this booking")
    return _sessions[booking_id].snapshot()


# ── WebSocket: real-time stream to patient ──


@router.websocket("/{booking_id}/ws")
async def tracking_ws(websocket: WebSocket, booking_id: str):
    """WebSocket endpoint for live ambulance tracking."""
    await websocket.accept()
    session = _get_or_create(booking_id)
    session.listeners.append(websocket)
    logger.info("WS tracking connected: booking=%s (listeners=%d)", booking_id, len(session.listeners))

    try:
        await websocket.send_json(session.snapshot())
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info("WS tracking disconnected: booking=%s", booking_id)
    except Exception as e:
        logger.warning("WS tracking error: booking=%s err=%s", booking_id, e)
    finally:
        if websocket in session.listeners:
            session.listeners.remove(websocket)


# ── Simulation endpoint (development ONLY) ──


def _calculate_heading(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate bearing/heading between two GPS coordinates (degrees)."""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlon_rad = math.radians(lon2 - lon1)

    x = math.sin(dlon_rad) * math.cos(lat2_rad)
    y = (
        math.cos(lat1_rad) * math.sin(lat2_rad)
        - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dlon_rad)
    )

    bearing = math.atan2(x, y)
    return (math.degrees(bearing) + 360) % 360


async def _fetch_route(
    start_lat: float, start_lng: float, end_lat: float, end_lng: float,
) -> list[tuple[float, float]]:
    """Fetch road route from OSRM. Returns list of (lat, lng) tuples."""
    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{start_lng},{start_lat};{end_lng},{end_lat}"
    )
    params = {"overview": "full", "geometries": "geojson"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

            if data.get("code") != "Ok" or not data.get("routes"):
                logger.warning("OSRM routing failed: %s", data)
                return [(start_lat, start_lng), (end_lat, end_lng)]

            coords = data["routes"][0]["geometry"]["coordinates"]
            return [(lat, lng) for lng, lat in coords]
    except Exception as e:
        logger.warning("OSRM request failed: %s. Using straight-line fallback.", e)
        return [(start_lat, start_lng), (end_lat, end_lng)]


@router.post("/{booking_id}/simulate")
async def simulate_tracking(booking_id: str):
    """Start a simulated ambulance journey for development/demo purposes.

    **Only available in development mode.**
    """
    settings = get_settings()
    if not settings.is_development:
        raise HTTPException(403, "Simulation is only available in development mode")

    session = _get_or_create(booking_id)

    # ── Try to load real ambulance data from the booking/SOS ──
    db = get_db()
    assigned = None

    # Check bookings collection first
    booking_doc = db.collection("bookings").document(booking_id).get()
    if booking_doc.exists:
        bdata = booking_doc.to_dict()
        assigned = bdata.get("assigned_ambulance")
        # If this is SOS-linked, also try sos_events
        if not assigned and bdata.get("sos_id"):
            sos_doc = db.collection("sos_events").document(bdata["sos_id"]).get()
            if sos_doc.exists:
                assigned = sos_doc.to_dict().get("assigned_ambulance")
    else:
        # Maybe it's an SOS ID
        sos_doc = db.collection("sos_events").document(booking_id).get()
        if sos_doc.exists:
            assigned = sos_doc.to_dict().get("assigned_ambulance")

    if assigned:
        session.driver_name = assigned.get("driver_name", "")
        session.driver_phone = assigned.get("driver_phone", "")
        session.vehicle_number = assigned.get("vehicle_number", "")
        amb_type = assigned.get("ambulance_type", "basic")
        type_labels = {
            "basic": "BLS", "advanced": "ALS",
            "patient_transport": "PTS", "neonatal": "NICU", "air": "Air",
        }
        session.vehicle_type = type_labels.get(amb_type, amb_type.upper())

        # Use real ambulance base location as dispatch origin
        if assigned.get("base_latitude") and assigned.get("base_longitude"):
            dispatch_lat = assigned["base_latitude"]
            dispatch_lng = assigned["base_longitude"]
        else:
            dispatch_lat, dispatch_lng = 22.5847, 88.3426
    else:
        session.driver_name = "Rajesh Kumar"
        session.driver_phone = "+91 98765 43210"
        session.vehicle_number = "MH 12 AB 1234"
        session.vehicle_type = "ALS"
        dispatch_lat, dispatch_lng = 22.5847, 88.3426

    session.status = "dispatched"

    # Three-point journey: dispatch → pickup → drop (Kolkata defaults)
    pickup_lat, pickup_lng = 22.5726, 88.3639
    drop_lat, drop_lng = 22.5448, 88.3426

    logger.info("Fetching 3-point route from OSRM for booking %s", booking_id)
    segment1 = await _fetch_route(dispatch_lat, dispatch_lng, pickup_lat, pickup_lng)
    segment2 = await _fetch_route(pickup_lat, pickup_lng, drop_lat, drop_lng)
    route_coords = segment1 + segment2[1:]
    logger.info(
        "Route fetched: %d waypoints (segment1=%d, segment2=%d)",
        len(route_coords), len(segment1), len(segment2),
    )

    async def _run_simulation():
        updates = 60
        total_waypoints = len(route_coords)

        for i in range(updates + 1):
            progress = i / updates

            float_index = progress * (total_waypoints - 1)
            idx = int(float_index)
            fraction = float_index - idx

            if idx >= total_waypoints - 1:
                session.latitude, session.longitude = route_coords[-1]
                next_lat, next_lng = route_coords[-1]
            else:
                lat1, lng1 = route_coords[idx]
                lat2, lng2 = route_coords[idx + 1]
                session.latitude = lat1 + (lat2 - lat1) * fraction
                session.longitude = lng1 + (lng2 - lng1) * fraction
                next_lat, next_lng = lat2, lng2

            session.heading = _calculate_heading(
                session.latitude, session.longitude, next_lat, next_lng,
            )
            session.speed = 40 + (20 * (1 - abs(progress - 0.5) * 2))
            session.eta_minutes = max(0, 8 * (1 - progress))

            if progress < 0.1:
                session.status = "dispatched"
            elif progress < 0.85:
                session.status = "en_route"
            elif progress < 0.95:
                session.status = "nearby"
            else:
                session.status = "arrived"

            session.updated_at = time.time()

            snapshot = session.snapshot()
            dead: list[WebSocket] = []
            for ws in session.listeners:
                try:
                    await ws.send_json(snapshot)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                session.listeners.remove(ws)

            await asyncio.sleep(2)

    asyncio.create_task(_run_simulation())
    return {
        "ok": True,
        "message": f"Simulation started for booking {booking_id}",
        "duration_seconds": 120,
    }
