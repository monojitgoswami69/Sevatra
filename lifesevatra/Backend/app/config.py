"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    FIREBASE_CREDENTIAL_PATH: str = ""
    DROPBOX_ACCESS_TOKEN: str = ""
    MOCK_DB: bool = True  # Default to true for testing if no creds

    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
