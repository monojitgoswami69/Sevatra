"""Hospital authentication service for LifeSevatra.

Uses the same Firebase Auth infrastructure as the main platform but with
the ``life.`` email prefix for namespace isolation.  OTP verification goes
through Upstash Redis in the same way as ambi/operato.
"""

import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, status

from app.firebase_client import get_db, get_firebase_auth, now_iso
from app.redis_client import store_otp, get_otp, delete_otp, otp_key
from app.config import get_settings
from app.services.life_bed_service import generate_beds
import logging

logger = logging.getLogger(__name__)

_PLATFORM = "life"
_IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1"
_TOKEN_URL = "https://securetoken.googleapis.com/v1"


class LifeAuthService:
    """Hospital registration, email OTP verification, and login."""

    # ── Helpers ──

    @staticmethod
    def _fb_email(real_email: str) -> str:
        return f"{_PLATFORM}.{real_email}"

    @staticmethod
    def _real_email(firebase_email: str) -> str:
        prefix = f"{_PLATFORM}."
        if firebase_email.startswith(prefix):
            return firebase_email[len(prefix):]
        return firebase_email

    def _generate_otp(self) -> str:
        settings = get_settings()
        return "".join(random.choices(string.digits, k=settings.otp_length))

    def _send_email_otp(self, email: str, otp_code: str):
        settings = get_settings()
        logger.info("Email verification OTP for %s: %s", email, otp_code)

        if not settings.smtp_configured:
            logger.warning("SMTP not configured — OTP logged to console only")
            return

        expiry_minutes = settings.otp_expiry_seconds // 60

        html_body = f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#059669,#047857);padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🏥 LifeSevatra</h1>
        </td></tr>
        <tr><td style="padding:36px 32px 16px;">
          <h2 style="margin:0 0 8px;color:#1f2937;font-size:20px;font-weight:600;">🔒 Your Verification Code</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Hello there,</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 18px;text-align:center;">
              <p style="margin:0;color:#059669;font-size:13px;font-weight:600;line-height:1.5;">
                Never share this code! Code is valid for {expiry_minutes} minutes or until used.
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <p style="margin:0 0 12px;color:#6b7280;font-size:14px;">Enter the verification code below:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;padding:20px;text-align:center;">
              <span style="font-size:34px;font-weight:700;letter-spacing:6px;color:#111827;font-family:'Courier New',monospace;">{otp_code}</span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            If you didn't request this code, you can safely ignore this email.<br>
            &copy; LifeSevatra &mdash; Hospital Management Platform
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""

        plain_body = (
            f"[LifeSevatra] Your email verification code is: {otp_code}\n"
            f"Valid for {expiry_minutes} minutes."
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "LifeSevatra — Email Verification Code"
        msg["From"] = settings.smtp_email
        msg["To"] = email
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_email, settings.smtp_password)
                server.send_message(msg)
            logger.info("Email OTP sent to %s", email)
        except Exception as e:
            logger.error("Failed to send email OTP: %s", e)

    async def _firebase_rest_call(self, endpoint: str, payload: dict) -> dict:
        settings = get_settings()
        url = f"{_IDENTITY_URL}/{endpoint}?key={settings.firebase_api_key}"
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload)
        data = resp.json()
        if resp.status_code != 200:
            error_msg = data.get("error", {}).get("message", "Unknown error")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
        return data

    # ── Register ──

    async def register(self, data) -> dict:
        """Create a Firebase Auth user with life. prefix, send email OTP,
        and store the hospital profile (pending verification)."""
        auth = get_firebase_auth()
        db = get_db()
        settings = get_settings()
        fb_email = self._fb_email(data.email)

        # Create Firebase Auth user
        try:
            user = auth.create_user(email=fb_email, password=data.password)
        except Exception as e:
            error_str = str(e)
            if "EMAIL_EXISTS" in error_str or "already exists" in error_str.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists.",
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_str)

        uid = user.uid
        now = now_iso()

        # Generate and store OTP
        otp_code = self._generate_otp()
        key = otp_key("email_verification", f"{_PLATFORM}:{data.email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds, uid=uid)

        # Send OTP via email
        self._send_email_otp(data.email, otp_code)

        # Store hospital profile (pending verification)
        hospital_data = {
            "hospital_name": data.hospital_name,
            "email": data.email,
            "contact": data.contact,
            "hospital_address": data.hospital_address,
            "icu_beds": data.icu_beds,
            "hdu_beds": data.hdu_beds,
            "general_beds": data.general_beds,
            "status": "pending_verification",
            "created_at": now,
            "updated_at": now,
        }
        db.collection("life_hospitals").document(uid).set(hospital_data)

        return {
            "user_id": uid,
            "email": data.email,
            "step": "verify_email",
            "message": "Verification code sent to your email",
        }

    # ── Verify Email ──

    async def verify_email(self, email: str, token: str) -> dict:
        """Verify email OTP, mark Firebase user as verified,
        generate beds, and return auth tokens."""
        auth = get_firebase_auth()
        db = get_db()
        fb_email = self._fb_email(email)

        key = otp_key("email_verification", f"{_PLATFORM}:{email}")
        otp_data = get_otp(key)
        if not otp_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code expired or not found. Please request a new one.",
            )
        if otp_data["code"] != token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code.",
            )

        # Mark email as verified in Firebase
        try:
            user = auth.get_user_by_email(fb_email)
            uid = user.uid
            auth.update_user(uid, email_verified=True)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        delete_otp(key)

        # Update hospital status to active
        hospital_ref = db.collection("life_hospitals").document(uid)
        hospital_doc = hospital_ref.get()
        if hospital_doc.exists:
            hospital = hospital_doc.to_dict()
            hospital_ref.update({"status": "active", "updated_at": now_iso()})

            # Generate beds
            await generate_beds(
                db, uid,
                hospital.get("icu_beds", 0),
                hospital.get("hdu_beds", 0),
                hospital.get("general_beds", 0),
            )

        # Create custom token and exchange for ID/refresh tokens
        custom_token = auth.create_custom_token(uid)
        token_data = await self._firebase_rest_call(
            "accounts:signInWithCustomToken",
            {"token": custom_token.decode() if isinstance(custom_token, bytes) else custom_token, "returnSecureToken": True},
        )

        return {
            "access_token": token_data["idToken"],
            "refresh_token": token_data["refreshToken"],
            "token_type": "bearer",
            "user_id": uid,
            "email": email,
            "step": "done",
            "message": "Email verified! Registration complete.",
        }

    # ── Resend OTP ──

    async def resend_email_code(self, email: str) -> dict:
        auth = get_firebase_auth()
        settings = get_settings()
        fb_email = self._fb_email(email)

        try:
            auth.get_user_by_email(fb_email)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email.",
            )

        otp_code = self._generate_otp()
        key = otp_key("email_verification", f"{_PLATFORM}:{email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds)
        self._send_email_otp(email, otp_code)

        return {"success": True, "message": "Verification code resent."}

    # ── Login ──

    async def login(self, email: str, password: str) -> dict:
        """Authenticate via Firebase REST API, then determine role
        by checking life_hospitals (admin) and life_staff (doctor/nurse)."""
        auth = get_firebase_auth()
        db = get_db()
        fb_email = self._fb_email(email)

        try:
            token_data = await self._firebase_rest_call(
                "accounts:signInWithPassword",
                {"email": fb_email, "password": password, "returnSecureToken": True},
            )
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        uid = token_data["localId"]

        # Block login if email is not verified
        try:
            user = auth.get_user(uid)
            if not user.email_verified:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please verify your email before logging in.",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Failed to check email verification: %s", e)

        # 1) Check if this UID belongs to a hospital admin
        hospital_doc = db.collection("life_hospitals").document(uid).get()
        if hospital_doc.exists:
            hospital = hospital_doc.to_dict()
            return {
                "access_token": token_data["idToken"],
                "refresh_token": token_data["refreshToken"],
                "token_type": "bearer",
                "role": "admin",
                "hospital": {
                    "id": uid,
                    "hospital_name": hospital.get("hospital_name", ""),
                    "email": email,
                    "contact": hospital.get("contact", ""),
                    "hospital_address": hospital.get("hospital_address", ""),
                    "icu_beds": hospital.get("icu_beds", 0),
                    "hdu_beds": hospital.get("hdu_beds", 0),
                    "general_beds": hospital.get("general_beds", 0),
                    "status": hospital.get("status", "active"),
                },
            }

        # 2) Check if this UID belongs to a staff member (doctor/nurse)
        staff_docs = (
            db.collection("life_staff")
            .where("firebase_uid", "==", uid)
            .limit(1)
            .get()
        )
        for sd in staff_docs:
            staff = sd.to_dict()
            return {
                "access_token": token_data["idToken"],
                "refresh_token": token_data["refreshToken"],
                "token_type": "bearer",
                "role": staff.get("role", "doctor"),
                "staff": {
                    "id": sd.id,
                    "staff_id": staff.get("staff_id", ""),
                    "full_name": staff.get("full_name", ""),
                    "email": email,
                    "role": staff.get("role", "doctor"),
                    "specialty": staff.get("specialty", ""),
                    "qualification": staff.get("qualification"),
                    "experience_years": staff.get("experience_years", 0),
                    "contact": staff.get("contact", ""),
                    "on_duty": staff.get("on_duty", False),
                    "shift": staff.get("shift", "day"),
                    "max_patients": staff.get("max_patients", 10),
                    "current_patient_count": staff.get("current_patient_count", 0),
                    "hospital_id": staff.get("hospital_id", ""),
                    "joined_date": staff.get("joined_date", ""),
                },
            }

        # UID not found in either collection
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account exists but no associated profile found.",
        )

    # ── Refresh Token ──

    async def refresh_token(self, refresh_token: str) -> dict:
        settings = get_settings()
        url = f"{_TOKEN_URL}/token?key={settings.firebase_api_key}"
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data={"grant_type": "refresh_token", "refresh_token": refresh_token})
        if resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        data = resp.json()
        return {
            "access_token": data["id_token"],
            "refresh_token": data["refresh_token"],
            "token_type": "bearer",
        }


life_auth_service = LifeAuthService()
