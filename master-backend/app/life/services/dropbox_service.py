"""Dropbox file-storage service for LifeSevatra.

Fix: removed unused ``io`` import.
"""

import logging
from typing import BinaryIO

import dropbox
from dropbox.exceptions import ApiError
from dropbox.files import FileMetadata, WriteMode

from app.config import get_settings

logger = logging.getLogger(__name__)

_dbx: dropbox.Dropbox | None = None


def get_dropbox() -> dropbox.Dropbox:
    """Get the Dropbox client (singleton)."""
    global _dbx
    if _dbx is not None:
        return _dbx

    settings = get_settings()
    if not settings.dropbox_app_key:
        raise RuntimeError("Dropbox is not configured — set DROPBOX_APP_KEY in .env")

    _dbx = dropbox.Dropbox(
        app_key=settings.dropbox_app_key,
        app_secret=settings.dropbox_app_secret,
        oauth2_refresh_token=settings.dropbox_refresh_token,
    )
    return _dbx


class DropboxStorageService:
    """Handles file storage operations via Dropbox API."""

    def upload_file(
        self,
        file_data: bytes | BinaryIO,
        remote_path: str,
        overwrite: bool = True,
    ) -> dict:
        dbx = get_dropbox()
        mode = WriteMode.overwrite if overwrite else WriteMode.add

        data = file_data if isinstance(file_data, (bytes, bytearray)) else file_data.read()

        try:
            meta: FileMetadata = dbx.files_upload(data, remote_path, mode=mode)
            return {
                "name": meta.name,
                "path": meta.path_display,
                "size": meta.size,
                "id": meta.id,
            }
        except ApiError as e:
            logger.error("Dropbox upload error: %s", e)
            raise RuntimeError(f"Dropbox upload failed: {e}")

    def download_file(self, remote_path: str) -> bytes:
        dbx = get_dropbox()
        try:
            _, response = dbx.files_download(remote_path)
            return response.content
        except ApiError as e:
            logger.error("Dropbox download error: %s", e)
            raise RuntimeError(f"Dropbox download failed: {e}")

    def delete_file(self, remote_path: str) -> dict:
        dbx = get_dropbox()
        try:
            meta = dbx.files_delete_v2(remote_path).metadata
            return {"name": meta.name, "path": meta.path_display}
        except ApiError as e:
            logger.error("Dropbox delete error: %s", e)
            raise RuntimeError(f"Dropbox delete failed: {e}")

    def get_shared_link(self, remote_path: str) -> str:
        dbx = get_dropbox()
        try:
            links = dbx.sharing_list_shared_links(path=remote_path).links
            if links:
                return links[0].url
            link_meta = dbx.sharing_create_shared_link_with_settings(remote_path)
            return link_meta.url
        except ApiError as e:
            logger.error("Dropbox shared link error: %s", e)
            raise RuntimeError(f"Dropbox shared link failed: {e}")

    def list_files(self, folder_path: str = "") -> list[dict]:
        dbx = get_dropbox()
        try:
            result = dbx.files_list_folder(folder_path)
            files = []
            for entry in result.entries:
                if isinstance(entry, FileMetadata):
                    files.append(
                        {
                            "name": entry.name,
                            "path": entry.path_display,
                            "size": entry.size,
                            "id": entry.id,
                        }
                    )
            return files
        except ApiError as e:
            logger.error("Dropbox list error: %s", e)
            raise RuntimeError(f"Dropbox list failed: {e}")


dropbox_storage = DropboxStorageService()
