"""Shared FastAPI dependencies."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db  # noqa: F401


async def get_current_hospital_id() -> int:
    """Stub: returns a placeholder hospital id.

    Will be replaced with real auth (Supabase Auth / OAuth) later.
    """
    return 1
