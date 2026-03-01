import random
import string
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException
from app.config import get_settings
from app.redis_client import store_otp, get_otp, delete_otp, otp_key
import logging

logger = logging.getLogger(__name__)


class TwilioService:
    """Handles OTP generation, sending via Twilio, and verification.
    OTP records are stored in Redis with auto-expiry."""

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
        """Generate a random numeric OTP."""
        length = self.settings.otp_length
        return "".join(random.choices(string.digits, k=length))

    async def send_otp(self, phone: str, purpose: str = "sos_verification") -> dict:
        """
        Generate OTP, store in Redis with TTL, and send via Twilio SMS.
        """
        otp_code = self._generate_otp()

        # Store OTP in Redis (auto-expires after otp_expiry_seconds)
        key = otp_key(purpose, phone)
        store_otp(key, otp_code, ttl_seconds=self.settings.otp_expiry_seconds)

        # Send SMS via Twilio (or log to console if disabled)
        logger.info(f"SMS OTP for {phone} (purpose: {purpose}): {otp_code}")

        if not self.settings.twilio_enabled:
            logger.warning("Twilio disabled — OTP logged to console only")
            return {"success": True, "message": "OTP generated (Twilio disabled — check console)"}

        try:
            self.client.messages.create(
                body=f"[{self.settings.app_name}] Your verification code is: {otp_code}. Valid for {self.settings.otp_expiry_seconds // 60} minutes.",
                from_=self.settings.twilio_phone_number,
                to=phone,
            )
            return {"success": True, "message": "OTP sent successfully"}
        except TwilioRestException as e:
            logger.error(f"Twilio error sending OTP to {phone}: {e}")
            return {"success": False, "message": f"Failed to send OTP: {str(e)}"}

    async def verify_otp(self, phone: str, code: str, purpose: str = "sos_verification") -> dict:
        """
        Verify the OTP code against Redis.
        Deletes the key on success (one-time use).
        """
        key = otp_key(purpose, phone)
        otp_data = get_otp(key)

        if otp_data is None:
            return {"success": False, "message": "No pending OTP found or it has expired. Please request a new one."}

        if otp_data["code"] != code:
            return {"success": False, "message": "Invalid OTP code."}

        # OTP valid — delete it immediately
        delete_otp(key)

        return {"success": True, "message": "OTP verified successfully"}


# Singleton
twilio_service = TwilioService()
