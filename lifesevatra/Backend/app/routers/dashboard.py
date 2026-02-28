"""Dashboard routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_hospital_id
from app.schemas.common import ApiResponse
from app.schemas.admission import DashboardStatsData
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=ApiResponse[DashboardStatsData])
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    hospital_id: int = Depends(get_current_hospital_id),
):
    data = await dashboard_service.get_dashboard_stats(db, hospital_id)
    return {"success": True, "message": "OK", "data": data}
