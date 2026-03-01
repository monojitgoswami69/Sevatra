"""Shared email OTP and Firebase REST utilities.

Extracted from ``ambi.services.auth_service`` and ``life.services.auth_service``
to eliminate ~300 lines of duplication.  Both auth services now call into these
helpers instead of maintaining their own copies.
"""

import random
import smtplib
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx
from fastapi import HTTPException, status

from app.config import get_settings

import logging

logger = logging.getLogger(__name__)

_IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1"
_TOKEN_URL = "https://securetoken.googleapis.com/v1"


# ── OTP Generation ──


def generate_otp() -> str:
    """Generate a random numeric OTP of configured length."""
    settings = get_settings()
    return "".join(random.choices(string.digits, k=settings.otp_length))


# ── Email Sending ──


def send_email_otp(
    email: str,
    otp_code: str,
    *,
    app_name: str = "Sevatra",
    brand_gradient: str = "linear-gradient(135deg,#dc2626,#b91c1c)",
    brand_color: str = "#dc2626",
    accent_bg: str = "#fef2f2",
    accent_border: str = "#fecaca",
    footer_text: str = "Emergency ambulance services",
) -> None:
    """Send an OTP verification email via SMTP.

    In development mode the OTP is also logged to console.
    In production, OTPs are **never** logged (security requirement).
    """
    settings = get_settings()

    # Only log OTP in development — NEVER in production
    if settings.is_development:
        logger.info("Email verification OTP for %s: %s", email, otp_code)

    if not settings.smtp_configured:
        if not settings.is_development:
            logger.warning(
                "SMTP not configured in production — OTP for %s cannot be delivered",
                email,
            )
        else:
            logger.warning("SMTP not configured — OTP logged to console only")
        return

    expiry_minutes = settings.otp_expiry_seconds // 60

    html_body = _render_otp_email(
        otp_code=otp_code,
        app_name=app_name,
        brand_gradient=brand_gradient,
        brand_color=brand_color,
        accent_bg=accent_bg,
        accent_border=accent_border,
        expiry_minutes=expiry_minutes,
        footer_text=footer_text,
    )

    plain_body = (
        f"[{app_name}] Your email verification code is: {otp_code}\n"
        f"Valid for {expiry_minutes} minutes.\n\n"
        f"Never share this code with anyone."
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{app_name} — Email Verification Code"
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
        logger.error("Failed to send email OTP to %s: %s", email, e)


# ── Firebase REST API ──


async def firebase_rest_call(endpoint: str, payload: dict) -> dict:
    """Call a Firebase Auth REST API endpoint and return the JSON response."""
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


async def exchange_custom_token(custom_token: bytes | str) -> dict:
    """Exchange a Firebase custom token for ID + refresh tokens."""
    token_str = (
        custom_token.decode("utf-8")
        if isinstance(custom_token, bytes)
        else custom_token
    )
    return await firebase_rest_call(
        "accounts:signInWithCustomToken",
        {"token": token_str, "returnSecureToken": True},
    )


async def refresh_firebase_token(refresh_token: str) -> dict:
    """Refresh the Firebase access token using a refresh token."""
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


# ── Private: HTML Template ──


def _render_otp_email(
    otp_code: str,
    app_name: str,
    brand_gradient: str,
    brand_color: str,
    accent_bg: str,
    accent_border: str,
    expiry_minutes: int,
    footer_text: str,
) -> str:
    """Render a branded HTML email for OTP verification."""
    return f"""\
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
        <table role="presentation" width="480" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:{brand_gradient};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                {app_name}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 16px;">
              <h2 style="margin:0 0 8px;color:#1f2937;font-size:20px;font-weight:600;">
                Your Verification Code
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.5;">
                Hello there,
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:{accent_bg};border:1px solid {accent_border};border-radius:8px;padding:14px 18px;text-align:center;">
                    <p style="margin:0;color:{brand_color};font-size:13px;font-weight:600;line-height:1.5;">
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
                &copy; {app_name} &mdash; {footer_text}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
