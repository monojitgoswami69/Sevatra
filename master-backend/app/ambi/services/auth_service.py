"""Authentication service for AmbiSevatra + OperatoSevatra.

Uses shared ``core.email`` helpers for OTP generation, email sending,
and Firebase REST calls — eliminating duplication with the life auth service.
"""

import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.cloud.firestore_v1.base_query import FieldFilter
from google.oauth2 import id_token as google_id_token

from app.ambi.models import LoginRequest, SignupRequest
from app.ambi.services.twilio_service import twilio_service
from app.config import get_settings
from app.core.email import (
    exchange_custom_token,
    firebase_rest_call,
    generate_otp,
    refresh_firebase_token,
    send_email_otp,
)
from app.firebase_client import get_db, get_firebase_auth, now_iso
from app.redis_client import delete_otp, get_otp, otp_key, store_otp

import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Handles user authentication via Firebase Auth."""

    # ── Platform email helpers ──

    @staticmethod
    def _firebase_email(real_email: str, platform: str) -> str:
        """Prefix the email so the same address can exist on multiple platforms."""
        return f"{platform}.{real_email}"

    @staticmethod
    def _real_email(firebase_email: str) -> str:
        for prefix in ("ambi.", "operato."):
            if firebase_email.startswith(prefix):
                return firebase_email[len(prefix):]
        return firebase_email

    # ── SIGNUP (Step 1) ──

    async def signup(self, data: SignupRequest) -> dict:
        """Create Firebase Auth user, Firestore profile, send email OTP."""
        auth = get_firebase_auth()
        db = get_db()
        platform = data.platform
        fb_email = self._firebase_email(data.email, platform)

        try:
            user_record = auth.create_user(
                email=fb_email,
                password=data.password,
                display_name=data.full_name,
                email_verified=False,
            )
        except Exception as e:
            error_msg = str(e)
            logger.error("Signup error: %s", e)
            try:
                existing = auth.get_user_by_email(fb_email)
                if not existing.email_verified:
                    auth.delete_user(existing.uid)
                    db.collection("profiles").document(existing.uid).delete()
                    user_record = auth.create_user(
                        email=fb_email,
                        password=data.password,
                        display_name=data.full_name,
                        email_verified=False,
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="An account with this email already exists.",
                    )
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg,
                )

        uid = user_record.uid
        now = now_iso()

        try:
            db.collection("profiles").document(uid).set({
                "email": data.email,
                "full_name": data.full_name,
                "phone": None,
                "phone_verified": False,
                "age": None,
                "gender": None,
                "blood_group": None,
                "created_at": now,
                "updated_at": now,
            })
        except Exception as e:
            logger.error("Profile creation error: %s", e)

        settings = get_settings()
        otp_code = generate_otp()
        key = otp_key("email_verification", f"{platform}:{data.email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds)

        send_email_otp(
            data.email, otp_code,
            app_name="AmbiSevatra",
            brand_gradient="linear-gradient(135deg,#dc2626,#b91c1c)",
            brand_color="#dc2626",
            accent_bg="#fef2f2",
            accent_border="#fecaca",
            footer_text="Emergency ambulance services",
        )

        return {
            "user_id": uid,
            "email": data.email,
            "step": "verify_email",
            "message": "Verification code sent to your email. Check your inbox.",
        }

    # ── VERIFY EMAIL (Step 2) ──

    async def verify_email(self, email: str, token: str, platform: str = "ambi") -> dict:
        auth = get_firebase_auth()
        fb_email = self._firebase_email(email, platform)

        key = otp_key("email_verification", f"{platform}:{email}")
        otp_data = get_otp(key)

        if otp_data is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending verification code found or it has expired.",
            )
        if otp_data["code"] != token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code.",
            )

        delete_otp(key)

        try:
            user = auth.get_user_by_email(fb_email)
            auth.update_user(user.uid, email_verified=True)
        except Exception as e:
            logger.error("Failed to mark email as verified: %s", e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to verify email.",
            )

        custom_token = auth.create_custom_token(user.uid)
        token_data = await exchange_custom_token(custom_token)

        return {
            "access_token": token_data["idToken"],
            "refresh_token": token_data["refreshToken"],
            "token_type": "bearer",
            "user_id": user.uid,
            "email": email,
            "step": "done",
            "message": "Email verified! Registration complete.",
        }

    # ── RESEND EMAIL CODE ──

    async def resend_email_code(self, email: str, platform: str = "ambi") -> dict:
        auth = get_firebase_auth()
        settings = get_settings()
        fb_email = self._firebase_email(email, platform)

        try:
            user = auth.get_user_by_email(fb_email)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No account found with this email.",
            )

        if user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified.",
            )

        otp_code = generate_otp()
        key = otp_key("email_verification", f"{platform}:{email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds)

        send_email_otp(
            email, otp_code,
            app_name="AmbiSevatra",
            brand_gradient="linear-gradient(135deg,#dc2626,#b91c1c)",
            brand_color="#dc2626",
            accent_bg="#fef2f2",
            accent_border="#fecaca",
            footer_text="Emergency ambulance services",
        )

        return {"success": True, "message": "Verification code resent to your email"}

    # ── VERIFY PHONE (Step 3) ──

    async def send_phone_otp(self, phone: str) -> dict:
        return await twilio_service.send_otp(phone, purpose="registration")

    async def verify_phone(self, user_id: str, phone: str, code: str) -> dict:
        result = await twilio_service.verify_otp(phone, code, purpose="registration")
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Invalid OTP code"),
            )

        db = get_db()
        try:
            db.collection("profiles").document(user_id).update({
                "phone_verified": True,
                "phone": phone,
                "updated_at": now_iso(),
            })
        except Exception as e:
            logger.error("Phone verify update error: %s", e)

        return {
            "success": True,
            "message": "Phone verified! Registration complete.",
            "fully_registered": True,
        }

    # ── GOOGLE SIGN-UP ──

    async def google_signup(
        self, google_token: str, full_name: str | None = None, platform: str = "ambi",
    ) -> dict:
        auth = get_firebase_auth()
        db = get_db()
        settings = get_settings()

        try:
            idinfo = google_id_token.verify_oauth2_token(
                google_token,
                GoogleAuthRequest(),
                audience=settings.google_client_id or None,
            )
            real_email = idinfo["email"]
            display_name = full_name or idinfo.get("name", "")
        except Exception as e:
            logger.error("Google token verification failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google credential.",
            )

        fb_email = self._firebase_email(real_email, platform)

        user_record = None
        try:
            user_record = auth.get_user_by_email(fb_email)
        except Exception:
            pass

        if user_record is None:
            try:
                rand_pw = "".join(random.choices(string.ascii_letters + string.digits, k=32))
                user_record = auth.create_user(
                    email=fb_email,
                    password=rand_pw,
                    display_name=display_name,
                    email_verified=True,
                )
            except Exception as e:
                logger.error("Failed to create Firebase user for Google sign-in: %s", e)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create account.",
                )

        uid = user_record.uid
        custom_token = auth.create_custom_token(uid)
        token_data = await exchange_custom_token(custom_token)

        profile_doc = db.collection("profiles").document(uid).get()
        if not profile_doc.exists:
            now = now_iso()
            try:
                db.collection("profiles").document(uid).set({
                    "email": real_email,
                    "full_name": display_name,
                    "phone": None,
                    "phone_verified": False,
                    "age": None,
                    "gender": None,
                    "blood_group": None,
                    "created_at": now,
                    "updated_at": now,
                })
            except Exception as e:
                logger.error("Profile creation error: %s", e)
        else:
            if display_name:
                try:
                    db.collection("profiles").document(uid).update({
                        "full_name": display_name,
                        "updated_at": now_iso(),
                    })
                except Exception as e:
                    logger.warning("Profile update error: %s", e)

        profile_doc = db.collection("profiles").document(uid).get()
        profile = profile_doc.to_dict() if profile_doc.exists else {}

        return {
            "access_token": token_data["idToken"],
            "refresh_token": token_data["refreshToken"],
            "token_type": "bearer",
            "user": {
                "id": uid,
                "email": real_email,
                "full_name": profile.get("full_name", display_name),
                "phone": profile.get("phone"),
            },
        }

    # ── LOGIN ──

    async def login(self, data: LoginRequest) -> dict:
        auth = get_firebase_auth()
        platform = data.platform
        fb_email = self._firebase_email(data.email, platform)

        try:
            token_data = await firebase_rest_call(
                "accounts:signInWithPassword",
                {
                    "email": fb_email,
                    "password": data.password,
                    "returnSecureToken": True,
                },
            )
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        uid = token_data["localId"]

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
            logger.error("Failed to check email verification status: %s", e)

        db = get_db()
        profile_doc = db.collection("profiles").document(uid).get()
        profile = profile_doc.to_dict() if profile_doc.exists else {}

        return {
            "access_token": token_data["idToken"],
            "refresh_token": token_data["refreshToken"],
            "token_type": "bearer",
            "user": {
                "id": uid,
                "email": data.email,
                "full_name": profile.get("full_name", ""),
                "phone": profile.get("phone", ""),
            },
        }

    # ── REFRESH ──

    async def refresh_token(self, refresh_token: str) -> dict:
        return await refresh_firebase_token(refresh_token)

    # ── LOGOUT ──

    async def logout(self, token: str) -> dict:
        try:
            auth = get_firebase_auth()
            decoded = auth.verify_id_token(token)
            auth.revoke_refresh_tokens(decoded["uid"])
        except Exception:
            pass
        return {"message": "Logged out successfully"}

    # ── CLEANUP UNVERIFIED USERS ──

    async def cleanup_unverified_users(self) -> dict:
        auth = get_firebase_auth()
        db = get_db()
        settings = get_settings()

        cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.unverified_user_ttl_hours)
        cutoff_iso = cutoff.isoformat()

        old_profiles = (
            db.collection("profiles")
            .where(filter=FieldFilter("created_at", "<", cutoff_iso))
            .limit(100)
            .get()
        )

        deleted = 0
        for doc in old_profiles:
            uid = doc.id
            try:
                user = auth.get_user(uid)
                if not user.email_verified:
                    auth.delete_user(uid)
                    doc.reference.delete()
                    deleted += 1
            except Exception as e:
                logger.warning("Cleanup: skipping uid=%s: %s", uid, e)

        logger.info("Cleanup: deleted %d unverified users", deleted)
        return {"deleted": deleted}


auth_service = AuthService()
