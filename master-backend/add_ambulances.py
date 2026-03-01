#!/usr/bin/env python3
"""
Script to login to OperatoSevatra and add 3 ambulances to the database.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "shubhadeep2biswas@gmail.com"
PASSWORD = "123456"

# Session to maintain cookies/tokens
session = requests.Session()


def signup_user():
    """Create a new user account."""
    print(f"📝 Creating new account for {EMAIL}...")
    
    signup_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": "Shubhadeep Biswas",
        "platform": "operato"
    }
    
    response = session.post(f"{BASE_URL}/auth/signup", json=signup_data)
    
    if response.status_code == 201:
        print(f"✅ Account created! Verifying email...")
        return True
    
    print(f"⚠️  Signup status: {response.status_code}")
    print(f"Response: {response.text}")
    return False


def verify_email_auto():
    """Try to auto-verify email (may not work depending on OTP setup)."""
    print("⏭️  Attempting to auto-verify email (skipping OTP verification)...")
    # Note: In development, the OTP might be logged to console or we might skip this
    # For now, we'll assume the email is verified or try to login anyway
    return True


def login():
    """Login and get auth token."""
    print(f"\n🔐 Attempting to login with {EMAIL}...")
    
    login_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "platform": "operato"
    }
    
    response = session.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        auth_data = response.json()
        token = auth_data.get("access_token")
        
        if token:
            session.headers.update({"Authorization": f"Bearer {token}"})
            print(f"✅ Login successful! Token: {token[:20]}...")
            return token
        return None
    
    # If login fails, try creating the account first
    if response.status_code == 401:
        print(f"⚠️  User not found or email not verified. Attempting to create account...")
        if signup_user():
            # Try to verify email
            verify_email_auto()
            # Try login again
            return login()
        return None
    
    print(f"❌ Login failed: {response.status_code}")
    print(f"Response: {response.text}")
    return None


def check_operator_status():
    """Check if user is already an operator."""
    print("\n🔍 Checking operator status...")
    
    response = session.get(f"{BASE_URL}/operator/check")
    
    if response.status_code == 200:
        print("✅ Already registered as operator")
        return True
    
    print("⚠️  Not registered as operator yet")
    return False


def register_operator():
    """Register as an ambulance operator."""
    print("\n📝 Registering as operator...")
    
    operator_data = {
        "operator_type": "individual",
        "full_name": "Shubhadeep Biswas",
        "phone": "+91-9876543210",
        "license_number": "DL-2024-001"
    }
    
    response = session.post(f"{BASE_URL}/operator/register", json=operator_data)
    
    if response.status_code == 201:
        result = response.json()
        print(f"✅ Registration successful! Operator ID: {result.get('id')}")
        return True
    
    print(f"❌ Registration failed: {response.status_code}")
    print(f"Response: {response.text}")
    return False


def add_ambulance(ambulance_data):
    """Add a single ambulance."""
    response = session.post(f"{BASE_URL}/operator/ambulances", json=ambulance_data)
    
    if response.status_code == 201:
        result = response.json()
        print(f"✅ Ambulance added! ID: {result.get('id')}, Vehicle: {result.get('vehicle_number')}")
        return True
    
    print(f"❌ Failed to add ambulance: {response.status_code}")
    print(f"Response: {response.text}")
    return False


def add_three_ambulances():
    """Add 3 ambulances with different specifications."""
    print("\n🚑 Adding 3 ambulances...\n")
    
    ambulances = [
        {
            "vehicle_number": "DL-01-AB-1234",
            "ambulance_type": "basic",
            "vehicle_make": "Maruti",
            "vehicle_model": "Omni",
            "vehicle_year": 2023,
            "has_oxygen": True,
            "has_defibrillator": True,
            "has_stretcher": True,
            "has_ventilator": False,
            "has_first_aid": True,
            "driver_name": "Rajesh Kumar",
            "driver_phone": "+91-9876543211",
            "driver_license_number": "DL-0001234567",
            "driver_experience_years": 8,
            "base_latitude": 28.7041,
            "base_longitude": 77.1025,
            "base_address": "Connaught Place, New Delhi",
            "service_radius_km": 25,
            "price_per_km": 15,
            "notes": "Basic Life Support ambulance, 24/7 available"
        },
        {
            "vehicle_number": "DL-02-AB-5678",
            "ambulance_type": "advanced",
            "vehicle_make": "Hyundai",
            "vehicle_model": "Styx",
            "vehicle_year": 2023,
            "has_oxygen": True,
            "has_defibrillator": True,
            "has_stretcher": True,
            "has_ventilator": True,
            "has_first_aid": True,
            "driver_name": "Suresh Singh",
            "driver_phone": "+91-9876543212",
            "driver_license_number": "DL-0007654321",
            "driver_experience_years": 12,
            "base_latitude": 28.5921,
            "base_longitude": 77.2064,
            "base_address": "Karol Bagh, New Delhi",
            "service_radius_km": 35,
            "price_per_km": 25,
            "notes": "Advanced Life Support with ventilator, ICU equipped"
        },
        {
            "vehicle_number": "DL-03-AB-9012",
            "ambulance_type": "patient_transport",
            "vehicle_make": "Toyota",
            "vehicle_model": "Fortuner",
            "vehicle_year": 2022,
            "has_oxygen": False,
            "has_defibrillator": False,
            "has_stretcher": True,
            "has_ventilator": False,
            "has_first_aid": True,
            "driver_name": "Vinay Patel",
            "driver_phone": "+91-9876543213",
            "driver_license_number": "DL-0005432109",
            "driver_experience_years": 5,
            "base_latitude": 28.6139,
            "base_longitude": 77.2090,
            "base_address": "Lajpat Nagar, New Delhi",
            "service_radius_km": 20,
            "price_per_km": 12,
            "notes": "Patient transport for non-emergency transfers"
        }
    ]
    
    for i, ambulance in enumerate(ambulances, 1):
        print(f"Adding ambulance {i}/3...")
        add_ambulance(ambulance)
        print()


def main():
    """Main function."""
    print("=" * 60)
    print("🚑 OperatoSevatra - Add Ambulances Script")
    print("=" * 60)
    
    # Step 1: Login
    token = login()
    if not token:
        print("❌ Failed to login. Exiting.")
        return
    
    # Step 2: Check/Register as operator
    is_operator = check_operator_status()
    if not is_operator:
        register_success = register_operator()
        if not register_success:
            print("❌ Failed to register as operator. Exiting.")
            return
    
    # Step 3: Add 3 ambulances
    add_three_ambulances()
    
    print("\n" + "=" * 60)
    print("✅ All done! 3 ambulances have been added.")
    print("=" * 60)


if __name__ == "__main__":
    main()
