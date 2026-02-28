"""Files upload router to Dropbox."""

from fastapi import APIRouter, File, UploadFile, Depends
from dropbox import Dropbox

from app.database import get_dbx
from app.services import file_service

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    dbx: Dropbox = Depends(get_dbx),
):
    url = await file_service.upload_file(dbx, file, "uploads")
    return {
        "success": True,
        "message": "File uploaded",
        "data": {"url": url},
    }
