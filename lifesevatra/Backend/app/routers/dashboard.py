"""Dashboard router using Firebase."""

from fastapi import APIRouter, Depends
from google.cloud.firestore import Client

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    db: Client = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    stats = await dashboard_service.get_dashboard_stats(db, hospital_id)
    return {
        "success": True,
        "message": "Dashboard stats fetched",
        "data": stats,
    }
