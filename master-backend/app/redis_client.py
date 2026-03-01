"""Upstash Redis client for OTP storage.

Uses the ``redis`` library which is compatible with Upstash Redis
(standard Redis protocol over TLS).
"""

import json
import logging
from typing import Any

import redis

from app.config import get_settings

logger = logging.getLogger(__name__)

_pool: redis.ConnectionPool | None = None


def _get_pool() -> redis.ConnectionPool:
    """Create (once) and return the Redis connection pool."""
    global _pool
    if _pool is not None:
        return _pool

    settings = get_settings()
    _pool = redis.ConnectionPool.from_url(
        settings.redis_url,
        decode_responses=True,
    )
    return _pool


def get_redis() -> redis.Redis:
    """Return a Redis client backed by the shared connection pool."""
    return redis.Redis(connection_pool=_get_pool())


# ── OTP helpers ──


def store_otp(key: str, code: str, ttl_seconds: int, **extra: Any) -> None:
    """Store an OTP code in Redis with auto-expiry.

    Args:
        key: Redis key, e.g. ``otp:email_verification:user@example.com``
        code: The OTP code string.
        ttl_seconds: Time-to-live in seconds (auto-deleted after this).
        **extra: Any additional metadata to store alongside the code.
    """
    r = get_redis()
    payload = {"code": code, **extra}
    r.setex(key, ttl_seconds, json.dumps(payload))
    logger.debug("OTP stored: %s (TTL=%ds)", key, ttl_seconds)


def get_otp(key: str) -> dict | None:
    """Retrieve an OTP record from Redis.  Returns ``None`` if expired / missing."""
    r = get_redis()
    raw = r.get(key)
    if raw is None:
        return None
    return json.loads(raw)


def delete_otp(key: str) -> None:
    """Explicitly delete an OTP key (e.g. after successful verification)."""
    r = get_redis()
    r.delete(key)
    logger.debug("OTP deleted: %s", key)


def otp_key(purpose: str, identifier: str) -> str:
    """Build a standardised Redis key for an OTP.

    Examples::

        otp_key("email_verification", "user@example.com")
        # → "otp:email_verification:user@example.com"

        otp_key("sos_abc123", "+261340000000")
        # → "otp:sos_abc123:+261340000000"
    """
    return f"otp:{purpose}:{identifier}"
