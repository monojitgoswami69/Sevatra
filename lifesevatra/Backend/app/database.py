"""Firebase and Dropbox initialization."""

import firebase_admin
from firebase_admin import credentials, firestore, auth
import dropbox
import os

from app.config import settings
from app.mock_db import MockFirestore, MockDropbox

_db = None
_dbx = None
_auth = None

def _seed_mock_db(db):
    for i in range(1, 11):
        db.collection("beds").document().set({"hospital_id": 1, "bed_id": f"ICU-{i:02d}", "bed_type": "ICU", "bed_number": i, "is_available": True})
        db.collection("beds").document().set({"hospital_id": 1, "bed_id": f"HDU-{i:02d}", "bed_type": "HDU", "bed_number": i, "is_available": True})
        db.collection("beds").document().set({"hospital_id": 1, "bed_id": f"GEN-{i:02d}", "bed_type": "GEN", "bed_number": i, "is_available": True})
    db.collection("staff").document("test_doctor_id").set({"hospital_id": 1, "staff_id": "test_doctor_id", "full_name": "Dr. Test", "role": "doctor", "specialty": "ICU", "on_duty": True, "max_patients": 10, "current_patients": 0})
    db.collection("hospitals").document("1").set({"id": 1, "hospital_name": "Test Hospital"})

def init_firebase():
    global _db, _dbx, _auth
    
    if settings.MOCK_DB or not settings.FIREBASE_CREDENTIAL_PATH:
        if _db is None:
            _db = MockFirestore()
            _seed_mock_db(_db)
        if _dbx is None:
            _dbx = MockDropbox()
        if _auth is None:
            _auth = "MockAuth"
        return

    if not firebase_admin._apps:
        if os.path.exists(settings.FIREBASE_CREDENTIAL_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIAL_PATH)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
            
    if _db is None:
        _db = firestore.client()
    if _auth is None:
        _auth = auth

    if _dbx is None and settings.DROPBOX_ACCESS_TOKEN:
        _dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)

def get_db():
    init_firebase()
    return _db

def get_auth():
    init_firebase()
    return _auth

def get_dbx():
    init_firebase()
    return _dbx
