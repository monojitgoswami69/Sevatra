"""Life-platform dependencies: resolve authenticated hospital or staff.

Uses the shared ``get_current_user`` from core and does a Firestore
look-up to determine whether the caller is a hospital admin or staff.
"""

import logging

from fastapi import Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.firebase_client import get_db

logger = logging.getLogger(__name__)


async def get_current_hospital(user: dict = Depends(get_current_user)) -> dict:
    """Validate Firebase token and look up the hospital profile.

    Returns a dict with hospital fields + ``uid`` and ``email``.
    """
    db = get_db()
    doc = db.collection("life_hospitals").document(user["id"]).get()
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital profile not found. Please register first.",
        )
    hospital = doc.to_dict()
    hospital["id"] = doc.id
    hospital["uid"] = user["id"]
    hospital["email"] = user["email"]
    return hospital


async def get_current_staff(user: dict = Depends(get_current_user)) -> dict:
    """Validate Firebase token and look up the staff profile.

    Returns a dict with staff fields + ``uid`` and ``email``.
    """
    db = get_db()
    uid = user["id"]

    docs = (
        db.collection("life_staff")
        .where("firebase_uid", "==", uid)
        .limit(1)
        .get()
    )
    for d in docs:
        staff = d.to_dict()
        staff["id"] = d.id
        staff["uid"] = uid
        staff["email"] = user["email"]
        return staff

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Staff profile not found.",
    )
