#!/usr/bin/env python3
"""
Script to add 20 random patients and 15 random staff to LifeSevatra
Uses the admin account: shubhadeep2biswas@gmail.com
"""

import requests
import random
import json
import time
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000/api/v1"
EMAIL = "shubhadeep2biswas@gmail.com"
PASSWORD = "shubhadeep2biswas"
MAX_RETRIES = 3
RETRY_DELAY = 2

# Common patient data
FIRST_NAMES = [
    "Rajesh", "Priya", "Amit", "Neha", "Vikram", "Anjali", "Arjun", "Divya",
    "Anil", "Swati", "Rohan", "Pooja", "Sandeep", "Meera", "Nikhil", "Isha",
    "Ashok", "Kavya", "Ravi", "Deepika"
]

LAST_NAMES = [
    "Kumar", "Singh", "Patel", "Sharma", "Verma", "Reddy", "Gupta", "Rao",
    "Desai", "Joshi", "Nair", "Menon", "Chatterjee", "Banerjee"
]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

AILMENTS = [
    "Chest pain", "Shortness of breath", "High fever", "Severe headache",
    "Abdominal pain", "Fracture", "Pneumonia", "Heart attack", "Stroke",
    "Sepsis", "Severe burns", "Trauma", "Diabetic emergency", "Asthma attack",
    "Kidney stone", "Appendicitis", "Gastric ulcer", "Hypertensive crisis"
]

MEDICAL_HISTORIES = [
    "Hypertension", "Diabetes", "Asthma", "Heart disease", "Kidney disease",
    "Liver disease", "Thyroid disorder", "Cancer history", "Previous surgery",
    "Allergies", "None reported", "COPD", "Osteoporosis"
]

STAFF_FIRST_NAMES = [
    "Dr. Rajesh", "Dr. Priya", "Dr. Amit", "Dr. Neha", "Dr. Vikram",
    "Nurse Anjali", "Nurse Arjun", "Nurse Divya", "Staff Anil", "Staff Swati",
    "Dr. Rohan", "Nurse Pooja", "Dr. Sandeep", "Nurse Meera", "Dr. Nikhil"
]

STAFF_LAST_NAMES = [
    "Kumar", "Singh", "Patel", "Sharma", "Verma", "Reddy", "Gupta", "Rao"
]

STAFF_ROLES = ["doctor", "surgeon", "specialist", "nurse"]
SPECIALTIES = {
    "doctor": ["General Medicine", "Internal Medicine", "Pediatrics", "ENT"],
    "surgeon": ["General Surgery", "Orthopedic Surgery", "Cardiothoracic Surgery"],
    "specialist": ["Cardiology", "Neurology", "Gastroenterology", "Nephrology", "Oncology"],
    "nurse": ["ICU Nursing", "General Nursing", "Emergency Nursing"]
}

SHIFTS = ["day", "night", "rotating"]

# ─────────────────────────────────────────────────────────────────────────

def login():
    """Authenticate and get access token"""
    print("[*] Authenticating...")
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                f"{API_BASE}/life/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            token = data.get("access_token")
            print(f"[+] Logged in successfully")
            return token
        except requests.exceptions.ConnectionError as e:
            if attempt < MAX_RETRIES - 1:
                print(f"[!] Connection error, retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"[-] Login failed after {MAX_RETRIES} attempts: {e}")
                return None
        except Exception as e:
            print(f"[-] Login failed: {e}")
            return None
    return None

def get_headers(token):
    """Get headers with auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

def add_patient(token, vitals_severity):
    """Add a random patient"""
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    age = random.randint(18, 85)
    gender = random.choice(["male", "female", "other"])
    
    # Generate vitals based on severity tier
    if vitals_severity == "critical":
        # Critical vitals
        heart_rate = random.randint(120, 160)
        spo2 = random.randint(80, 92)
        resp_rate = random.randint(25, 35)
        temperature = random.uniform(38.5, 40.5)
        bp_systolic = random.choice([random.randint(160, 200), random.randint(60, 90)])
        bp_diastolic = random.choice([random.randint(100, 120), random.randint(35, 50)])
    elif vitals_severity == "serious":
        # Serious vitals
        heart_rate = random.randint(100, 120)
        spo2 = random.randint(92, 95)
        resp_rate = random.randint(22, 25)
        temperature = random.uniform(38, 39)
        bp_systolic = random.randint(140, 160)
        bp_diastolic = random.randint(90, 100)
    elif vitals_severity == "moderate":
        # Moderate vitals
        heart_rate = random.randint(85, 100)
        spo2 = random.randint(95, 97)
        resp_rate = random.randint(18, 22)
        temperature = random.uniform(37, 38)
        bp_systolic = random.randint(120, 140)
        bp_diastolic = random.randint(80, 90)
    else:
        # Normal vitals
        heart_rate = random.randint(60, 85)
        spo2 = random.randint(97, 100)
        resp_rate = random.randint(12, 18)
        temperature = random.uniform(36.5, 37.5)
        bp_systolic = random.randint(110, 130)
        bp_diastolic = random.randint(70, 85)
    
    payload = {
        "name": name,
        "age": age,
        "gender": gender,
        "bloodGroup": random.choice(BLOOD_GROUPS),
        "emergencyContact": f"+91{random.randint(6000000000, 9999999999)}",
        "presentingAilment": random.choice(AILMENTS),
        "medicalHistory": random.choice(MEDICAL_HISTORIES),
        "clinicalNotes": f"Patient admitted with {random.choice(AILMENTS)}. Initial assessment shows {vitals_severity} condition.",
        "labResults": f"Blood: Normal | Urine: Normal" if vitals_severity == "normal" else "Preliminary tests running",
        "heartRate": heart_rate,
        "spo2": spo2,
        "respRate": resp_rate,
        "temperature": round(temperature, 1),
        "bpSystolic": bp_systolic,
        "bpDiastolic": bp_diastolic,
        "address": f"{random.randint(100, 999)} Main Street, City, State 560001",
        "guardianName": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
        "guardianRelation": random.choice(["Father", "Mother", "Spouse", "Sibling", "Adult Child"]),
        "guardianPhone": f"+91{random.randint(6000000000, 9999999999)}",
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                f"{API_BASE}/life/admissions/",
                headers=get_headers(token),
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            print(f"  [+] {name} (Age {age}, {vitals_severity.upper()})")
            return True
        except requests.exceptions.ConnectionError:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            else:
                print(f"  [-] Failed to add {name}: Connection error")
                return False
        except Exception as e:
            print(f"  [-] Failed to add {name}: {e}")
            return False

def add_staff(token):
    """Add a random staff member"""
    first_name = random.choice(STAFF_FIRST_NAMES)
    last_name = random.choice(STAFF_LAST_NAMES)
    full_name = f"{first_name} {last_name}"
    role = random.choice(STAFF_ROLES)
    specialty = random.choice(SPECIALTIES[role])
    
    payload = {
        "fullName": full_name,
        "role": role,
        "specialty": specialty,
        "qualification": random.choice(["MBBS", "BNS", "MS", "MD", "DM"]),
        "experienceYears": random.randint(1, 25),
        "contact": f"+91{random.randint(6000000000, 9999999999)}",
        "email": f"{full_name.lower().replace(' ', '.')}@hospital.com",
        "shift": random.choice(SHIFTS),
        "maxPatients": random.choice([2, 3, 4, 5, 6])
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                f"{API_BASE}/life/staff/",
                headers=get_headers(token),
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            print(f"  [+] {full_name} ({role.title()} - {specialty})")
            return True
        except requests.exceptions.ConnectionError:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            else:
                print(f"  [-] Failed to add {full_name}: Connection error")
                return False
        except Exception as e:
            print(f"  [-] Failed to add {full_name}: {e}")
            return False

def main():
    """Main function"""
    print("\n" + "="*60)
    print("LifeSevatra - Data Addition Script")
    print("="*60 + "\n")
    
    # Authenticate
    token = login()
    if not token:
        print("Cannot proceed without authentication.")
        return
    
    # Add patients
    print("\n[*] Adding 20 Random Patients...")
    print("-" * 60)
    
    # Distribution: 5 critical, 5 serious, 5 moderate, 5 normal
    severity_distribution = ["critical"] * 5 + ["serious"] * 5 + ["moderate"] * 5 + ["normal"] * 5
    random.shuffle(severity_distribution)
    
    patient_count = 0
    for severity in severity_distribution:
        if add_patient(token, severity):
            patient_count += 1
    
    print(f"\n[+] Successfully added {patient_count}/20 patients")
    
    # Add staff
    print("\n[*] Adding 15 Random Staff Members...")
    print("-" * 60)
    
    staff_count = 0
    for i in range(15):
        if add_staff(token):
            staff_count += 1
    
    print(f"\n[+] Successfully added {staff_count}/15 staff members")
    
    print("\n" + "="*60)
    print("Data Addition Complete!")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
