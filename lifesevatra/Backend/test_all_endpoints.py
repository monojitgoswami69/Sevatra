"""
Comprehensive backend endpoint tester.
Run: python test_all_endpoints.py
"""
import httpx
import json
import sys

BASE = "http://127.0.0.1:8000"
passed = 0
failed = 0
errors = []


def test(label: str, method: str, path: str, *, json_body=None, expect_status=200, expect_key=None):
    global passed, failed
    url = f"{BASE}{path}"
    try:
        kwargs: dict = {"timeout": 10}
        if method.upper() in ("POST", "PUT", "PATCH") and json_body is not None:
            kwargs["json"] = json_body
        r = getattr(httpx, method.lower())(url, **kwargs)
        ok = r.status_code == expect_status
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        if expect_key and expect_key not in body:
            ok = False
        if ok:
            passed += 1
            print(f"  ✅ {label} [{r.status_code}]")
        else:
            failed += 1
            detail = body.get("detail", str(body)[:120])
            errors.append(f"{label}: expected {expect_status}, got {r.status_code} — {detail}")
            print(f"  ❌ {label} [{r.status_code}] {detail}")
        return body
    except Exception as e:
        failed += 1
        errors.append(f"{label}: {e}")
        print(f"  ❌ {label} EXCEPTION: {e}")
        return {}


print("\n" + "=" * 60)
print("  LIFESEVATRA BACKEND — FULL ENDPOINT TEST")
print("=" * 60)

# ── Health ──
print("\n── Health ──")
test("GET /health", "GET", "/health", expect_key="status")

# ── Dashboard ──
print("\n── Dashboard ──")
body = test("GET /api/dashboard/stats", "GET", "/api/dashboard/stats", expect_key="data")
if body.get("data"):
    d = body["data"]
    print(f"     → totalPatients={d.get('totalPatients')}, criticalPatients={d.get('criticalPatients')}, "
          f"admittedToday={d.get('admittedToday')}, dischargedToday={d.get('dischargedToday')}")

# ── Admissions ──
print("\n── Admissions ──")
body = test("GET /api/admissions/", "GET", "/api/admissions/", expect_key="data")
if body.get("data"):
    print(f"     → {len(body['data'])} patients, pagination total={body.get('pagination', {}).get('total')}")

# Get first patient
patient_id = None
if body.get("data") and len(body["data"]) > 0:
    patient_id = body["data"][0].get("patient_id")
    print(f"     → First patient_id = {patient_id}")

if patient_id:
    test(f"GET /api/admissions/{patient_id}", "GET", f"/api/admissions/{patient_id}", expect_key="data")

# Test filters
test("GET admissions?condition=Critical", "GET", "/api/admissions/?condition=Critical", expect_key="data")
test("GET admissions?minSeverity=5", "GET", "/api/admissions/?minSeverity=5", expect_key="data")
test("GET admissions?limit=2&offset=0", "GET", "/api/admissions/?limit=2&offset=0", expect_key="data")

# Create new admission
new_patient = {
    "name": "Test Patient",
    "age": 30,
    "gender": "male",
    "heartRate": 95,
    "spo2": 96,
    "respRate": 18,
    "temperature": 37.2,
    "bpSystolic": 130,
    "bpDiastolic": 85,
    "presentingAilment": "Test ailment",
    "medicalHistory": "None",
}
body = test("POST /api/admissions/ (create)", "POST", "/api/admissions/", json_body=new_patient, expect_key="data")
new_id = None
if body.get("data"):
    new_id = body["data"].get("patient_id")
    d = body["data"]
    print(f"     → Created patient_id={new_id}, bed={d.get('bed_id')}, severity={d.get('severity_score')}, "
          f"condition={d.get('condition')}, doctor={d.get('doctor')}")

# Update vitals
if new_id:
    vitals = {"heartRate": 140, "spo2": 88, "respRate": 30, "temperature": 39.5, "bpSystolic": 185, "bpDiastolic": 115}
    body = test(f"PUT /api/admissions/{new_id}/vitals", "PUT", f"/api/admissions/{new_id}/vitals", json_body=vitals, expect_key="data")
    if body.get("data"):
        d = body["data"]
        print(f"     → Updated severity={d.get('severity_score')}, condition={d.get('condition')}")

# Update clinical
if new_id:
    clinical = {"presentingAilment": "Updated ailment", "clinicalNotes": "Test notes from endpoint check"}
    test(f"PUT /api/admissions/{new_id}/clinical", "PUT", f"/api/admissions/{new_id}/clinical", json_body=clinical, expect_key="data")

# Discharge
if new_id:
    body = test(f"POST /api/admissions/{new_id}/discharge", "POST", f"/api/admissions/{new_id}/discharge",
                json_body={"dischargeNotes": "Test discharge"}, expect_key="success")
    if body.get("data"):
        print(f"     → Discharged: releasedBed={body['data'].get('releasedBed')}")

# Delete (create another, then delete)
body2 = test("POST /api/admissions/ (for delete)", "POST", "/api/admissions/",
             json_body={"name": "Delete Me", "age": 25, "gender": "female"}, expect_key="data")
del_id = body2.get("data", {}).get("patient_id")
if del_id:
    test(f"DELETE /api/admissions/{del_id}", "DELETE", f"/api/admissions/{del_id}", expect_key="success")

# 404 test
test("GET /api/admissions/99999 (not found)", "GET", "/api/admissions/99999", expect_status=404)

# ── Beds ──
print("\n── Beds ──")
body = test("GET /api/beds/", "GET", "/api/beds/", expect_key="data")
if body.get("data"):
    avail = sum(1 for b in body["data"] if b.get("is_available"))
    occ = sum(1 for b in body["data"] if not b.get("is_available"))
    print(f"     → {len(body['data'])} beds total, {avail} available, {occ} occupied")

body = test("GET /api/beds/stats", "GET", "/api/beds/stats", expect_key="data")
if body.get("data"):
    print(f"     → totals: {body['data'].get('totals')}")
    for bt in body["data"].get("by_type", []):
        print(f"       {bt['bed_type']}: total={bt['total_beds']}, available={bt['available_beds']}, occupied={bt['occupied_beds']}")

test("GET /api/beds/availability", "GET", "/api/beds/availability", expect_key="data")

# ── Staff ──
print("\n── Staff ──")
body = test("GET /api/staff/", "GET", "/api/staff/", expect_key="data")
if body.get("data"):
    print(f"     → {len(body['data'])} staff members")

body = test("GET /api/staff/stats", "GET", "/api/staff/stats", expect_key="data")
if body.get("data"):
    d = body["data"]
    print(f"     → total={d.get('total_staff')}, doctors={d.get('total_doctors')}, nurses={d.get('total_nurses')}, "
          f"onDuty={d.get('on_duty')}, offDuty={d.get('off_duty')}")

test("GET /api/staff/available-doctors", "GET", "/api/staff/available-doctors", expect_key="data")

# Filters
test("GET staff?role=doctor", "GET", "/api/staff/?role=doctor", expect_key="data")
test("GET staff?onDuty=true", "GET", "/api/staff/?onDuty=true", expect_key="data")
test("GET staff?shift=day", "GET", "/api/staff/?shift=day", expect_key="data")

# Get first staff
staff_id_str = None
if body.get("data"):
    pass   # we need from getAllStaff
body = httpx.get(f"{BASE}/api/staff/").json()
if body.get("data") and len(body["data"]) > 0:
    staff_id_str = body["data"][0].get("staff_id")
    staff_pk = body["data"][0].get("id")

if staff_id_str:
    test(f"GET /api/staff/{staff_id_str}", "GET", f"/api/staff/{staff_id_str}", expect_key="data")

# Create staff
new_staff = {
    "fullName": "Dr. Test Endpoint",
    "role": "doctor",
    "specialty": "Testing",
    "qualification": "MD Test",
    "experienceYears": 5,
    "contact": "+91-0000000000",
    "email": "test@test.com",
    "shift": "day",
    "maxPatients": 8,
}
body = test("POST /api/staff/ (create)", "POST", "/api/staff/", json_body=new_staff, expect_key="data")
new_staff_pk = body.get("data", {}).get("id")
new_staff_sid = body.get("data", {}).get("staff_id")
if new_staff_pk:
    print(f"     → Created id={new_staff_pk}, staff_id={new_staff_sid}")

# Update staff
if new_staff_sid:
    test(f"PUT /api/staff/{new_staff_sid}", "PUT", f"/api/staff/{new_staff_sid}",
         json_body={"fullName": "Dr. Updated Name", "specialty": "Updated Testing"}, expect_key="data")

# Toggle duty
if new_staff_sid:
    test(f"PATCH /api/staff/{new_staff_sid}/duty?onDuty=false", "PATCH",
         f"/api/staff/{new_staff_sid}/duty?onDuty=false", expect_key="data")

# Delete staff
if new_staff_sid:
    test(f"DELETE /api/staff/{new_staff_sid}", "DELETE", f"/api/staff/{new_staff_sid}", expect_key="success")

# ── Doctor Portal ──
print("\n── Doctor Portal ──")
body = test("GET /api/doctor/patients", "GET", "/api/doctor/patients", expect_key="data")
if body.get("data"):
    print(f"     → {len(body['data'])} patients for doctor_id=1")

body = test("GET /api/doctor/schedule", "GET", "/api/doctor/schedule", expect_key="data")
if body.get("data"):
    print(f"     → {len(body['data'])} schedule slots")
    # Update first slot
    if len(body["data"]) > 0:
        slot_id = body["data"][0].get("id")
        test(f"PUT /api/doctor/schedule/{slot_id}", "PUT", f"/api/doctor/schedule/{slot_id}",
             json_body={"status": "completed", "notes": "Test note"}, expect_key="data")

body = test("GET /api/doctor/notes", "GET", "/api/doctor/notes", expect_key="data")
if body.get("data"):
    print(f"     → {len(body['data'])} clinical notes")

# Create clinical note — we need a valid admission_id
admissions = httpx.get(f"{BASE}/api/admissions/").json()
if admissions.get("data") and len(admissions["data"]) > 0:
    adm_id = admissions["data"][0]["patient_id"]
    adm_name = admissions["data"][0]["patient_name"]
    note_body = {
        "admission_id": adm_id,
        "patient_name": adm_name,
        "note": "Test clinical note from endpoint checker",
        "type": "observation",
    }
    test("POST /api/doctor/notes", "POST", "/api/doctor/notes", json_body=note_body, expect_key="data")

body = test("GET /api/doctor/profile", "GET", "/api/doctor/profile", expect_key="data")
if body.get("data"):
    d = body["data"]
    print(f"     → Doctor: {d.get('full_name')}, specialty={d.get('specialty')}")

test("PUT /api/doctor/profile", "PUT", "/api/doctor/profile",
     json_body={"qualification": "MD, FACC (Updated)"}, expect_key="data")

# ── Vitals / Severity Calculator ──
print("\n── Vitals / Severity ──")
vital_cases = [
    ("Normal vitals", {"heartRate": 72, "spo2": 98, "respRate": 16, "temperature": 36.8, "bpSystolic": 120, "bpDiastolic": 80}),
    ("Critical vitals", {"heartRate": 145, "spo2": 85, "respRate": 32, "temperature": 40, "bpSystolic": 200, "bpDiastolic": 120}),
    ("Moderate vitals", {"heartRate": 100, "spo2": 93, "respRate": 22, "temperature": 38.5, "bpSystolic": 140, "bpDiastolic": 90}),
    ("Empty vitals", {}),
]
for label, vitals in vital_cases:
    body = test(f"POST severity ({label})", "POST", "/api/vitals/calculate-severity", json_body=vitals, expect_key="data")
    if body.get("data"):
        d = body["data"]
        print(f"     → score={d.get('score')}, condition={d.get('condition')}, ward={d.get('wardRecommendation')}")

# ── Edge Cases ──
print("\n── Edge Cases ──")
test("GET /api/admissions/ with bad param", "GET", "/api/admissions/?limit=-1", expect_status=422)
test("POST /api/admissions/ missing name", "POST", "/api/admissions/", json_body={"age": 25, "gender": "male"}, expect_status=422)
test("POST /api/admissions/ missing age", "POST", "/api/admissions/", json_body={"name": "X", "gender": "male"}, expect_status=422)
test("PUT /api/admissions/99999/vitals", "PUT", "/api/admissions/99999/vitals", json_body={"heartRate": 80}, expect_status=404)
test("DELETE /api/admissions/99999", "DELETE", "/api/admissions/99999", expect_status=404)
test("GET /api/staff/99999", "GET", "/api/staff/99999", expect_status=404)
test("GET /nonexistent", "GET", "/nonexistent", expect_status=404)

# ── Summary ──
print("\n" + "=" * 60)
print(f"  RESULTS: {passed} passed, {failed} failed")
print("=" * 60)
if errors:
    print("\n  FAILURES:")
    for e in errors:
        print(f"    ✗ {e}")
print()
sys.exit(1 if failed else 0)
