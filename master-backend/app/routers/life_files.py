"""File upload routes for LifeSevatra — stores files in Dropbox."""

import uuid
import logging
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status

from app.dependencies_life import get_current_hospital
from app.services.dropbox_service import dropbox_storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/life/files", tags=["Life — Files"])

# Allowed MIME prefixes / extensions
_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    hospital: dict = Depends(get_current_hospital),
):
    """Upload a file to Dropbox under ``/life/<hospital_id>/``.

    Returns a raw (direct‑download) URL that can be stored in admission
    records as ``idPicture`` or ``patientPicture``.
    """
    if file.content_type and file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Unsupported file type: {file.content_type}. "
            f"Allowed: {', '.join(sorted(_ALLOWED_TYPES))}",
        )

    content = await file.read()
    if len(content) > _MAX_SIZE_BYTES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File too large. Maximum size is {_MAX_SIZE_BYTES // (1024*1024)} MB.",
        )

    # Derive extension from original filename
    ext = "bin"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()

    unique_name = f"{uuid.uuid4()}.{ext}"
    remote_path = f"/life/{hospital['id']}/{unique_name}"

    try:
        meta = dropbox_storage.upload_file(content, remote_path, overwrite=True)
    except RuntimeError as e:
        logger.error("Dropbox upload failed: %s", e)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "File upload failed")

    # Get a shareable link and convert to raw/direct URL
    try:
        shared_url = dropbox_storage.get_shared_link(remote_path)
        raw_url = shared_url.replace("dl=0", "raw=1").replace("?dl=1", "?raw=1")
    except RuntimeError:
        # Fallback — return path-only (caller can fetch via download endpoint)
        raw_url = None

    return {
        "success": True,
        "message": "File uploaded",
        "data": {
            "url": raw_url or meta["path"],
            "name": meta["name"],
            "path": meta["path"],
            "size": meta["size"],
            "dropbox_id": meta["id"],
        },
    }


@router.get("/download")
async def download_file(
    path: str,
    hospital: dict = Depends(get_current_hospital),
):
    """Download a file from Dropbox by its path.

    The path must belong to this hospital (``/life/<hospital_id>/…``).
    """
    expected_prefix = f"/life/{hospital['id']}/"
    if not path.startswith(expected_prefix):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    try:
        content = dropbox_storage.download_file(path)
    except RuntimeError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    from fastapi.responses import Response
    # Guess content type from extension
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    ct_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
              "webp": "image/webp", "gif": "image/gif", "pdf": "application/pdf"}
    content_type = ct_map.get(ext, "application/octet-stream")

    return Response(content=content, media_type=content_type)


@router.delete("/delete")
async def delete_file(
    path: str,
    hospital: dict = Depends(get_current_hospital),
):
    """Delete a file from Dropbox. Path must belong to this hospital."""
    expected_prefix = f"/life/{hospital['id']}/"
    if not path.startswith(expected_prefix):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    try:
        result = dropbox_storage.delete_file(path)
    except RuntimeError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    return {"success": True, "deleted": result}


@router.get("/list")
async def list_files(
    hospital: dict = Depends(get_current_hospital),
):
    """List all files stored for this hospital."""
    folder = f"/life/{hospital['id']}"
    try:
        files = dropbox_storage.list_files(folder)
    except RuntimeError:
        files = []
    return {"files": files}
