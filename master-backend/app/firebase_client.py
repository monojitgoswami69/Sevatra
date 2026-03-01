import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from app.config import get_settings
from datetime import datetime, timezone

_app: firebase_admin.App | None = None
_db = None


def _init_firebase():
    """Initialize Firebase Admin SDK (once)."""
    global _app, _db
    if _app is not None:
        return

    settings = get_settings()

    if settings.firebase_credentials_base64:
        # Decode base64-encoded service account JSON (ideal for Vercel / serverless)
        cred_json = json.loads(base64.b64decode(settings.firebase_credentials_base64))
        cred = credentials.Certificate(cred_json)
    elif os.path.exists(settings.firebase_credentials_path):
        cred = credentials.Certificate(settings.firebase_credentials_path)
    else:
        # Fall back to Application Default Credentials (e.g. GCP environment)
        cred = credentials.ApplicationDefault()

    _app = firebase_admin.initialize_app(cred)
    _db = firestore.client()


def get_db():
    """Get the Firestore client."""
    global _db
    if _db is None:
        _init_firebase()
    return _db


def get_firebase_auth():
    """Get the Firebase Auth module (ensures SDK is initialized)."""
    if _app is None:
        _init_firebase()
    return firebase_auth


def doc_to_dict(doc) -> dict | None:
    """Convert a Firestore DocumentSnapshot to a dict with 'id' included."""
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    # Convert datetime objects to ISO strings for Pydantic serialization
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
    return data


def now_iso() -> str:
    """Return current UTC time as ISO string."""
    return datetime.now(timezone.utc).isoformat()
