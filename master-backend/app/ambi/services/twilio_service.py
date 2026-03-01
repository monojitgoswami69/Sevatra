"""Twilio SMS OTP service.

FIX: OTPs are only logged in development mode now.
"""

import logging
import random
import string

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client as TwilioClient

from app.config import get_settings
from app.redis_client import delete_otp, get_otp, otp_key, store_otp

logger = logging.getLogger(__name__)


class TwilioService:
    """OTP generation, sending via Twilio, and verification against Redis."""

    def __init__(self):
        self.settings = get_settings()
        self._client: TwilioClient | None = None

    @property
    def client(self) -> TwilioClient:
        if self._client is None:
            self._client = TwilioClient(
                self.settings.twilio_account_sid,
                self.settings.twilio_auth_token,
            )
        return self._client

    def _generate_otp(self) -> str:
        length = self.settings.otp_length
        return "".join(random.choices(string.digits, k=length))

    async def send_otp(self, phone: str, purpose: str = "sos_verification") -> dict:
        """Generate OTP, store in Redis, and send via Twilio SMS."""
        otp_code = self._generate_otp()

        key = otp_key(purpose, phone)
        store_otp(key, otp_code, ttl_seconds=self.settings.otp_expiry_seconds)

        # Only log OTP in development — NEVER in production
        if self.settings.is_development:
            logger.info("SMS OTP for %s (purpose: %s): %s", phone, purpose, otp_code)

        if not self.settings.twilio_enabled:
            logger.warning("Twilio disabled — OTP stored in Redis only")
            return {"success": True, "message": "OTP generated (Twilio disabled)"}

        try:
            self.client.messages.create(
                body=(
                    f"[{self.settings.app_name}] Your verification code is: {otp_code}. "
                    f"Valid for {self.settings.otp_expiry_seconds // 60} minutes."
                ),
                from_=self.settings.twilio_phone_number,
                to=phone,
            )
            return {"success": True, "message": "OTP sent successfully"}
        except TwilioRestException as e:
            logger.error("Twilio error sending OTP to %s: %s", phone, e)
            return {"success": False, "message": f"Failed to send OTP: {e}"}

    async def verify_otp(self, phone: str, code: str, purpose: str = "sos_verification") -> dict:
        """Verify OTP code against Redis. Deletes key on success."""
        key = otp_key(purpose, phone)
        otp_data = get_otp(key)

        if otp_data is None:
            return {"success": False, "message": "No pending OTP found or it has expired."}

        if otp_data["code"] != code:
            return {"success": False, "message": "Invalid OTP code."}

        delete_otp(key)
        return {"success": True, "message": "OTP verified successfully"}


twilio_service = TwilioService()
