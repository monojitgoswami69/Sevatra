"""File upload route using Supabase Storage."""

import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.file_service import upload_file

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    """Upload a file to Supabase Storage and return its public URL."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    content = await file.read()

    try:
        url = await upload_file(
            file_bytes=content,
            file_name=unique_name,
            content_type=file.content_type or "application/octet-stream",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    return {"success": True, "message": "File uploaded", "data": {"url": url}}
