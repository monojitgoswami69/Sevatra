"""File service using Dropbox."""

import dropbox
import uuid
from fastapi import UploadFile

async def upload_file(dbx: dropbox.Dropbox, file: UploadFile, folder: str) -> str:
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'unknown'
    filename = f"{uuid.uuid4()}.{ext}"
    path = f"/{folder}/{filename}"
    
    content = await file.read()
    dbx.files_upload(content, path, mode=dropbox.files.WriteMode.overwrite)
    
    link_info = dbx.sharing_create_shared_link_with_settings(path)
    # Convert 'dl=0' to 'raw=1' for direct accessing
    url = link_info.url.replace("dl=0", "raw=1")
    return url
