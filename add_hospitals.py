#!/usr/bin/env python3
"""
Seed script: add 3 hospitals to LifeSevatra via Firebase Admin + Firestore directly.
Bypasses email OTP by setting email_verified=True through the Admin SDK.
Run from: C:\\Users\\SBR\\Desktop\\Sevatra-sbr  (repo root)
"""

import sys
import asyncio
from datetime import datetime, timezone

sys.path.insert(0, "master-backend")

from app.firebase_client import get_db, get_firebase_auth, now_iso
from app.life.services.bed_service import generate_beds

HOSPITALS = [
    {
        "hospital_name": "Apollo General Hospital",
        "email": "apollo.general@hospital.com",
        "password": "apollo@2026",
        "contact": "+911234567890",
        "hospital_address": "12 MG Road, Bengaluru, Karnataka 560001",
        "icu_beds": 10,
        "hdu_beds": 15,
        "general_beds": 30,
    },
    {
        "hospital_name": "City Medical Centre",
        "email": "city.medical@hospital.com",
        "password": "citymed@2026",
        "contact": "+919876543210",
        "hospital_address": "45 Park Street, Kolkata, West Bengal 700016",
        "icu_beds": 8,
        "hdu_beds": 12,
        "general_beds": 25,
    },
    {
        "hospital_name": "Sunrise Multispecialty Hospital",
        "email": "sunrise.multi@hospital.com",
        "password": "sunrise@2026",
        "contact": "+917654321098",
        "hospital_address": "78 Anna Salai, Chennai, Tamil Nadu 600002",
        "icu_beds": 12,
        "hdu_beds": 18,
        "general_beds": 40,
    },
]

PLATFORM = "life"


def fb_email(real_email: str) -> str:
    return f"{PLATFORM}.{real_email}"


async def create_hospital(auth, db, h: dict) -> None:
    name = h["hospital_name"]
    print(f"  Creating: {name} ...")

    fe = fb_email(h["email"])

    # Try to create Firebase Auth user; if exists, fetch it
    try:
        user = auth.create_user(
            email=fe,
            password=h["password"],
            email_verified=True,
            display_name=name,
        )
        uid = user.uid
        print(f"    [+] Firebase user created: {uid}")
    except Exception as e:
        err = str(e)
        if "EMAIL_EXISTS" in err or "already exists" in err.lower():
            user = auth.get_user_by_email(fe)
            uid = user.uid
            auth.update_user(uid, email_verified=True)
            print(f"    [~] User already exists, reusing uid: {uid}")
        else:
            print(f"    [-] Auth error: {e}")
            return

    now = now_iso()

    # Write / overwrite the hospital profile
    hospital_doc = {
        "hospital_name": h["hospital_name"],
        "email": h["email"],
        "contact": h["contact"],
        "hospital_address": h["hospital_address"],
        "icu_beds": h["icu_beds"],
        "hdu_beds": h["hdu_beds"],
        "general_beds": h["general_beds"],
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    db.collection("life_hospitals").document(uid).set(hospital_doc)
    print(f"    [+] Hospital profile saved")

    # Remove any existing beds for this hospital (idempotent re-run)
    existing_beds = db.collection("life_beds").where("hospital_id", "==", uid).get()
    deleted = 0
    for bd in existing_beds:
        bd.reference.delete()
        deleted += 1
    if deleted:
        print(f"    [~] Cleared {deleted} existing beds")

    # Generate fresh beds
    await generate_beds(db, uid, h["icu_beds"], h["hdu_beds"], h["general_beds"])
    total_beds = h["icu_beds"] + h["hdu_beds"] + h["general_beds"]
    print(f"    [+] Generated {total_beds} beds  (ICU={h['icu_beds']}, HDU={h['hdu_beds']}, GEN={h['general_beds']})")
    print(f"    [+] Login: {h['email']}  /  {h['password']}")
    print()


async def main():
    print("\n" + "=" * 60)
    print("LifeSevatra - Hospital Seed Script")
    print("=" * 60 + "\n")

    auth = get_firebase_auth()
    db   = get_db()

    for h in HOSPITALS:
        await create_hospital(auth, db, h)

    print("=" * 60)
    print("All hospitals created successfully!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
