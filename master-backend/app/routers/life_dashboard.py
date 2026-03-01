"""Dashboard aggregation route for LifeSevatra."""

from fastapi import APIRouter, Depends

from app.firebase_client import get_db
from app.dependencies_life import get_current_hospital
from app.services import life_dashboard_service as svc

router = APIRouter(prefix="/life/dashboard", tags=["Life — Dashboard"])


@router.get("/stats")
async def dashboard_stats(hospital: dict = Depends(get_current_hospital)):
    """Return high-level hospital KPIs for the dashboard page."""
    db = get_db()
    return await svc.get_dashboard_stats(db, hospital["id"])
