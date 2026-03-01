"""Hospital authentication service for LifeSevatra.

Uses the shared ``core.email`` utilities for OTP generation, email
sending, and Firebase REST calls to eliminate duplication with AmbiSevatra.
"""

import logging

from fastapi import HTTPException, status

from app.config import get_settings
from app.core.email import (
    exchange_custom_token,
    generate_otp,
    refresh_firebase_token,
    send_email_otp,
)
from app.firebase_client import get_db, get_firebase_auth, now_iso
from app.life.services.bed_service import generate_beds
from app.redis_client import delete_otp, get_otp, otp_key, store_otp

logger = logging.getLogger(__name__)

_PLATFORM = "life"


class LifeAuthService:
    """Hospital registration, email OTP verification, and login."""

    # ── Helpers ──

    @staticmethod
    def _fb_email(real_email: str) -> str:
        return f"{_PLATFORM}.{real_email}"

    @staticmethod
    def _real_email(firebase_email: str) -> str:
        prefix = f"{_PLATFORM}."
        return firebase_email[len(prefix):] if firebase_email.startswith(prefix) else firebase_email

    # ── Register ──

    async def register(self, data) -> dict:
        """Create a Firebase Auth user with life. prefix, send email OTP,
        and store the hospital profile (pending verification)."""
        auth = get_firebase_auth()
        db = get_db()
        settings = get_settings()
        fb_email = self._fb_email(data.email)

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

        otp_code = generate_otp()
        key = otp_key("email_verification", f"{_PLATFORM}:{data.email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds, uid=uid)

        send_email_otp(
            data.email,
            otp_code,
            app_name="LifeSevatra",
            brand_color="#059669",
            brand_gradient="linear-gradient(135deg,#059669,#047857)",
            accent_bg="#ecfdf5",
            accent_border="#a7f3d0",
            footer_text="Hospital Management Platform",
        )

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

        try:
            user = auth.get_user_by_email(fb_email)
            uid = user.uid
            auth.update_user(uid, email_verified=True)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        delete_otp(key)

        hospital_ref = db.collection("life_hospitals").document(uid)
        hospital_doc = hospital_ref.get()
        if hospital_doc.exists:
            hospital = hospital_doc.to_dict()
            hospital_ref.update({"status": "active", "updated_at": now_iso()})

            await generate_beds(
                db,
                uid,
                hospital.get("icu_beds", 0),
                hospital.get("hdu_beds", 0),
                hospital.get("general_beds", 0),
            )

        custom_token = auth.create_custom_token(uid)
        token_data = await exchange_custom_token(custom_token)

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

        otp_code = generate_otp()
        key = otp_key("email_verification", f"{_PLATFORM}:{email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds)

        send_email_otp(
            email,
            otp_code,
            app_name="LifeSevatra",
            brand_color="#059669",
            brand_gradient="linear-gradient(135deg,#059669,#047857)",
            accent_bg="#ecfdf5",
            accent_border="#a7f3d0",
            footer_text="Hospital Management Platform",
        )

        return {"success": True, "message": "Verification code resent."}

    # ── Login ──

    async def login(self, email: str, password: str) -> dict:
        """Authenticate via Firebase REST API, then determine role
        by checking life_hospitals (admin) and life_staff (doctor/nurse)."""
        from app.core.email import firebase_rest_call

        auth = get_firebase_auth()
        db = get_db()
        fb_email = self._fb_email(email)

        try:
            token_data = await firebase_rest_call(
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

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account exists but no associated profile found.",
        )

    # ── Refresh Token ──

    async def refresh_token(self, refresh_token: str) -> dict:
        return await refresh_firebase_token(refresh_token)


life_auth_service = LifeAuthService()
