import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status

from app.firebase_client import get_db, get_firebase_auth, now_iso
from app.redis_client import store_otp, get_otp, delete_otp, otp_key
from app.models.auth import SignupRequest, LoginRequest
from app.services.twilio_service import twilio_service
from app.config import get_settings
from google.cloud.firestore_v1.base_query import FieldFilter
from google.oauth2 import id_token as google_id_token
from google.auth.transport.requests import Request as GoogleAuthRequest
import logging

logger = logging.getLogger(__name__)

# Firebase Auth REST API endpoints
_IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1"
_TOKEN_URL = "https://securetoken.googleapis.com/v1"


class AuthService:
    """Handles user authentication via Firebase Auth (service account + REST API for password login)."""

    # ── Platform email helpers ──

    @staticmethod
    def _firebase_email(real_email: str, platform: str) -> str:
        """Prefix the email so the same address can exist on both platforms.
        Firebase stores `ambi.user@example.com` / `operato.user@example.com`,
        but users always see and type their real email.
        """
        return f"{platform}.{real_email}"

    @staticmethod
    def _real_email(firebase_email: str) -> str:
        """Strip the platform prefix from a Firebase-stored email."""
        for prefix in ("ambi.", "operato."):
            if firebase_email.startswith(prefix):
                return firebase_email[len(prefix):]
        return firebase_email

    def _generate_otp(self) -> str:
        settings = get_settings()
        return "".join(random.choices(string.digits, k=settings.otp_length))

    def _send_email_otp(self, email: str, otp_code: str):
        """Send email OTP via SMTP if configured, otherwise log it."""
        settings = get_settings()
        logger.info(f"Email verification OTP for {email}: {otp_code}")

        if not settings.smtp_configured:
            logger.warning("SMTP not configured — OTP logged to console only")
            return

        expiry_minutes = settings.otp_expiry_seconds // 60

        html_body = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                🚑 {settings.app_name}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 16px;">
              <h2 style="margin:0 0 8px;color:#1f2937;font-size:20px;font-weight:600;">
                🔒 Your Verification Code
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.5;">
                Hello there,
              </p>
              <!-- Warning box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;text-align:center;">
                    <p style="margin:0;color:#dc2626;font-size:13px;font-weight:600;line-height:1.5;">
                      Never share this code! Anyone you give it to can access your account.<br>
                      Code is valid for {expiry_minutes} minutes or until used.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- OTP Code -->
          <tr>
            <td style="padding:8px 32px 32px;">
              <p style="margin:0 0 12px;color:#6b7280;font-size:14px;">Enter the verification code below:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;padding:20px;text-align:center;">
                    <span style="font-size:34px;font-weight:700;letter-spacing:6px;color:#111827;font-family:'Courier New',Courier,monospace;">
                      {otp_code}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 32px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                If you didn't request this code, you can safely ignore this email.<br>
                &copy; {settings.app_name} &mdash; Emergency ambulance services
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        plain_body = (
            f"[{settings.app_name}] Your email verification code is: {otp_code}\n"
            f"Valid for {expiry_minutes} minutes.\n\n"
            f"Never share this code with anyone."
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{settings.app_name} — Email Verification Code"
        msg["From"] = settings.smtp_email
        msg["To"] = email
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_email, settings.smtp_password)
                server.send_message(msg)
            logger.info(f"Email OTP sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send email OTP: {e}")

    async def _firebase_rest_call(self, endpoint: str, payload: dict) -> dict:
        """Call a Firebase Auth REST API endpoint."""
        settings = get_settings()
        url = f"{_IDENTITY_URL}/{endpoint}?key={settings.firebase_api_key}"
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload)
        data = resp.json()
        if resp.status_code != 200:
            error_msg = data.get("error", {}).get("message", "Unknown error")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )
        return data

    async def _exchange_custom_token(self, custom_token: bytes) -> dict:
        """Exchange a Firebase custom token for an ID token + refresh token."""
        return await self._firebase_rest_call(
            "accounts:signInWithCustomToken",
            {"token": custom_token.decode("utf-8"), "returnSecureToken": True},
        )

    # ── SIGNUP (Step 1) ──

    async def signup(self, data: SignupRequest) -> dict:
        """
        Create a Firebase Auth user immediately with email_verified=False.
        Create Firestore profile.  Send email verification OTP.
        User cannot log in until email is verified.
        """
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
            logger.error(f"Signup error: {e}")
            # If user exists but is unverified, allow re-signup
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

        # Create profile document in Firestore
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
            logger.error(f"Profile creation error: {e}")

        # Generate email verification OTP and store in Redis (auto-expires)
        settings = get_settings()
        otp_code = self._generate_otp()

        key = otp_key("email_verification", f"{platform}:{data.email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds)

        # Send the OTP to the REAL email address
        self._send_email_otp(data.email, otp_code)

        return {
            "user_id": uid,
            "email": data.email,
            "step": "verify_email",
            "message": "Verification code sent to your email. Check your inbox.",
        }

    # ── VERIFY EMAIL (Step 2) ──

    async def verify_email(self, email: str, token: str, platform: str = "ambi") -> dict:
        """
        Verify the email OTP code.
        On success, marks email as verified in Firebase Auth.
        Returns access token + refresh token + next step.
        """
        auth = get_firebase_auth()
        fb_email = self._firebase_email(email, platform)

        # Look up OTP in Redis (keyed by platform:real_email)
        key = otp_key("email_verification", f"{platform}:{email}")
        otp_data = get_otp(key)

        if otp_data is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending verification code found or it has expired. Please request a new one.",
            )

        # Check code
        if otp_data["code"] != token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code.",
            )

        # OTP is valid — delete it from Redis immediately
        delete_otp(key)

        # Mark email as verified in Firebase Auth (prefixed email)
        try:
            user = auth.get_user_by_email(fb_email)
            auth.update_user(user.uid, email_verified=True)
        except Exception as e:
            logger.error(f"Failed to mark email as verified: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to verify email.",
            )

        # Create custom token and exchange for ID token + refresh token
        custom_token = auth.create_custom_token(user.uid)
        token_data = await self._exchange_custom_token(custom_token)

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
        """Resend the email verification OTP.  Only works for unverified users."""
        auth = get_firebase_auth()
        settings = get_settings()
        fb_email = self._firebase_email(email, platform)

        # Check user exists and email is not yet verified
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

        otp_code = self._generate_otp()
        key = otp_key("email_verification", f"{platform}:{email}")
        store_otp(key, otp_code, ttl_seconds=settings.otp_expiry_seconds)

        self._send_email_otp(email, otp_code)

        return {"success": True, "message": "Verification code resent to your email"}

    # ── VERIFY PHONE (Step 3) ──

    async def send_phone_otp(self, phone: str) -> dict:
        """Send an SMS OTP to verify the phone during registration."""
        return await twilio_service.send_otp(phone, purpose="registration")

    async def verify_phone(self, user_id: str, phone: str, code: str) -> dict:
        """
        Verify the phone OTP and mark phone_verified = true.
        This completes the registration process.
        """
        result = await twilio_service.verify_otp(phone, code, purpose="registration")

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Invalid OTP code"),
            )

        # Mark phone as verified in Firestore profile
        db = get_db()
        try:
            db.collection("profiles").document(user_id).update({
                "phone_verified": True,
                "phone": phone,
                "updated_at": now_iso(),
            })
        except Exception as e:
            logger.error(f"Phone verify update error: {e}")

        return {
            "success": True,
            "message": "Phone verified! Registration complete.",
            "fully_registered": True,
        }

    # ── GOOGLE SIGN-UP ──

    async def google_signup(self, google_token: str, full_name: str | None = None, platform: str = "ambi") -> dict:
        """
        Register or login via Google Sign-In.

        Verifies the Google ID token to extract the user's real email,
        then creates or signs in a Firebase Auth user with the
        platform-prefixed email.  This allows the same Google account
        to be used on both the customer and operator frontends.
        """
        auth = get_firebase_auth()
        db = get_db()
        settings = get_settings()

        # 1. Verify the Google ID token and extract user info
        try:
            idinfo = google_id_token.verify_oauth2_token(
                google_token,
                GoogleAuthRequest(),
                audience=settings.google_client_id or None,
            )
            real_email = idinfo["email"]
            display_name = full_name or idinfo.get("name", "")
        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google credential.",
            )

        fb_email = self._firebase_email(real_email, platform)

        # 2. Find or create a Firebase Auth user with the prefixed email
        user_record = None
        try:
            user_record = auth.get_user_by_email(fb_email)
        except Exception:
            pass  # user doesn't exist yet

        if user_record is None:
            try:
                # Generate a random password — user will always sign in via Google
                rand_pw = "".join(random.choices(string.ascii_letters + string.digits, k=32))
                user_record = auth.create_user(
                    email=fb_email,
                    password=rand_pw,
                    display_name=display_name,
                    email_verified=True,  # Google already verified the email
                )
            except Exception as e:
                logger.error(f"Failed to create Firebase user for Google sign-in: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create account.",
                )

        uid = user_record.uid

        # 3. Create custom token and exchange for ID + refresh tokens
        custom_token = auth.create_custom_token(uid)
        token_data = await self._exchange_custom_token(custom_token)

        # 4. Ensure Firestore profile exists (stores REAL email)
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
                logger.error(f"Profile creation error: {e}")
        else:
            if display_name:
                try:
                    db.collection("profiles").document(uid).update({
                        "full_name": display_name,
                        "updated_at": now_iso(),
                    })
                except Exception as e:
                    logger.warning(f"Profile update error: {e}")

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
        """Authenticate user with email + password via Firebase REST API.
        Rejects users whose email is not yet verified."""
        auth = get_firebase_auth()
        platform = data.platform
        fb_email = self._firebase_email(data.email, platform)

        try:
            token_data = await self._firebase_rest_call(
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

        # Block login if email is not verified
        try:
            user = auth.get_user(uid)
            if not user.email_verified:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please verify your email before logging in. Check your inbox for the verification code.",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to check email verification status: {e}")

        # Fetch profile from Firestore (stores REAL email)
        db = get_db()
        profile_doc = db.collection("profiles").document(uid).get()
        profile = profile_doc.to_dict() if profile_doc.exists else {}

        return {
            "access_token": token_data["idToken"],
            "refresh_token": token_data["refreshToken"],
            "token_type": "bearer",
            "user": {
                "id": uid,
                "email": data.email,  # Return the real email, not the prefixed one
                "full_name": profile.get("full_name", ""),
                "phone": profile.get("phone", ""),
            },
        }

    # ── REFRESH ──

    async def refresh_token(self, refresh_token: str) -> dict:
        """Refresh the access token using the Firebase secure token API."""
        settings = get_settings()
        url = f"{_TOKEN_URL}/token?key={settings.firebase_api_key}"

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )

        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        data = resp.json()
        return {
            "access_token": data["id_token"],
            "refresh_token": data["refresh_token"],
            "token_type": "bearer",
        }

    # ── LOGOUT ──

    async def logout(self, token: str) -> dict:
        """Revoke refresh tokens for the user."""
        try:
            auth = get_firebase_auth()
            decoded = auth.verify_id_token(token)
            auth.revoke_refresh_tokens(decoded["uid"])
        except Exception:
            pass
        return {"message": "Logged out successfully"}

    # ── CLEANUP UNVERIFIED USERS ──

    async def cleanup_unverified_users(self) -> dict:
        """
        Delete Firebase Auth users and Firestore profiles for accounts
        where email was never verified within the configured TTL.
        """
        auth = get_firebase_auth()
        db = get_db()
        settings = get_settings()

        cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.unverified_user_ttl_hours)
        cutoff_iso = cutoff.isoformat()

        # Query old profiles
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
                    # Delete Firebase Auth user
                    auth.delete_user(uid)
                    # Delete Firestore profile
                    doc.reference.delete()
                    deleted += 1
            except Exception as e:
                logger.warning(f"Cleanup: skipping uid={uid}: {e}")

        logger.info(f"Cleanup: deleted {deleted} unverified users")
        return {"deleted": deleted}


auth_service = AuthService()
