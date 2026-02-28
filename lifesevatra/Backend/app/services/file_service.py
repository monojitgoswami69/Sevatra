"""File upload service using Supabase Storage."""

from typing import Optional
import httpx

from app.config import settings

BUCKET_NAME = "lifesevatra-files"


async def upload_file(
    file_bytes: bytes,
    file_name: str,
    content_type: str = "application/octet-stream",
    folder: str = "uploads",
) -> str:
    """Upload a file to Supabase Storage and return the public URL."""
    path = f"{folder}/{file_name}"
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{path}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            content=file_bytes,
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": content_type,
                "x-upsert": "true",
            },
        )
        resp.raise_for_status()

    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{path}"
    return public_url
