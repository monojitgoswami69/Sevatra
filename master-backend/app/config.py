from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Firebase ──
    firebase_credentials_path: str = "firebase-credentials.json"
    firebase_api_key: str = ""

    # ── Google OAuth ──
    google_client_id: str = ""

    # ── Dropbox ──
    dropbox_app_key: str = ""
    dropbox_app_secret: str = ""
    dropbox_refresh_token: str = ""

    # ── Twilio ──
    twilio_enabled: bool = True
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # ── App ──
    app_name: str = "Sevatra API"
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000"
    secret_key: str = "change-this-to-a-random-secret-key"

    # ── OTP ──
    otp_expiry_seconds: int = 300
    otp_length: int = 6

    # ── Redis (Upstash) ──
    redis_url: str = ""

    # ── Cleanup / Cron ──
    cron_secret: str = ""
    unverified_user_ttl_hours: int = 1

    # ── SMTP (optional — for sending email verification OTP) ──
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_email: str = ""
    smtp_password: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_email and self.smtp_password)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
