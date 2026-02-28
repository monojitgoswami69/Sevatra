import httpx
try:
    r = httpx.post("http://127.0.0.1:8000/api/admissions/", json={
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
    })
    print("STATUS:", r.status_code)
    print("RESPONSE:", r.text)
except Exception as e:
    print("EXCEPTION:", e)

try:
    r = httpx.get("http://127.0.0.1:8000/api/staff/available-doctors")
    print("STATUS:", r.status_code)
    print("RESPONSE:", r.text)
except Exception as e:
    print("EXCEPTION:", e)
