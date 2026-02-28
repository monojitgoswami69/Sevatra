"""Seed script — populates the database with sample data from sampleData.ts.

Usage:
    python -m app.seed
"""

import asyncio
from datetime import datetime, date

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import _get_engine, _get_session_factory, Base
from app.models import Hospital, Staff, Admission, Bed, ClinicalNote, ScheduleSlot
from app.services.bed_service import generate_beds_for_hospital, assign_bed


async def seed():
    engine = _get_engine()
    session_factory = _get_session_factory()

    # Create tables if they don't exist (dev convenience)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as db:
        # ── Hospital ──────────────────────────────────────────────────────
        hospital = Hospital(
            hospital_name="Lifesevatra Central Hospital",
            email="admin@lifesevatra.health",
            contact="9876543210",
            hospital_address="42 MG Road, Bengaluru, Karnataka 560001",
            icu_beds=10,
            hdu_beds=15,
            general_beds=30,
        )
        db.add(hospital)
        await db.flush()
        await db.refresh(hospital)
        h_id = hospital.id
        print(f"✓ Hospital created (id={h_id})")

        # ── Beds ──────────────────────────────────────────────────────────
        await generate_beds_for_hospital(db, h_id, 10, 15, 30)
        print("✓ 55 beds created (10 ICU, 15 HDU, 30 General)")

        # ── Staff ─────────────────────────────────────────────────────────
        staff_data = [
            {
                "staff_id": "DOC-001", "full_name": "Dr. Meera Nair", "role": "doctor",
                "specialty": "Cardiology", "qualification": "MD, DM Cardiology",
                "experience_years": 15, "contact": "9876500001",
                "email": "meera.nair@lifesevatra.health", "on_duty": True,
                "shift": "day", "max_patients": 10, "current_patient_count": 3,
                "joined_date": date(2020, 3, 15),
                "bio": "Experienced cardiologist with 15+ years in interventional cardiology.",
                "languages": ["English", "Hindi", "Malayalam"],
                "consultation_fee": 800,
            },
            {
                "staff_id": "DOC-002", "full_name": "Dr. Ravi Patel", "role": "doctor",
                "specialty": "Pulmonology", "qualification": "MD, DNB Pulmonary Medicine",
                "experience_years": 12, "contact": "9876500002",
                "email": "ravi.patel@lifesevatra.health", "on_duty": True,
                "shift": "day", "max_patients": 10, "current_patient_count": 3,
                "joined_date": date(2021, 1, 10),
            },
            {
                "staff_id": "DOC-003", "full_name": "Dr. Anil Kumar", "role": "surgeon",
                "specialty": "General Surgery", "qualification": "MS, FRCS",
                "experience_years": 18, "contact": "9876500003",
                "email": "anil.kumar@lifesevatra.health", "on_duty": False,
                "shift": "night", "max_patients": 8, "current_patient_count": 2,
                "joined_date": date(2019, 7, 22),
            },
            {
                "staff_id": "DOC-004", "full_name": "Dr. Sunita Rao", "role": "specialist",
                "specialty": "Neurology", "qualification": "MD, DM Neurology",
                "experience_years": 10, "contact": "9876500004",
                "email": "sunita.rao@lifesevatra.health", "on_duty": True,
                "shift": "rotating", "max_patients": 8, "current_patient_count": 1,
                "joined_date": date(2022, 5, 1),
            },
            {
                "staff_id": "NUR-001", "full_name": "Kavitha Menon", "role": "nurse",
                "specialty": "ICU Nursing", "qualification": "BSc Nursing, CCRN",
                "experience_years": 8, "contact": "9876500005",
                "email": "kavitha.m@lifesevatra.health", "on_duty": True,
                "shift": "day", "max_patients": 4, "current_patient_count": 2,
                "joined_date": date(2020, 9, 10),
            },
            {
                "staff_id": "NUR-002", "full_name": "Deepa Joshi", "role": "nurse",
                "specialty": "Emergency Nursing", "qualification": "BSc Nursing",
                "experience_years": 5, "contact": "9876500006",
                "email": "deepa.j@lifesevatra.health", "on_duty": True,
                "shift": "night", "max_patients": 4, "current_patient_count": 3,
                "joined_date": date(2023, 1, 15),
            },
            {
                "staff_id": "NUR-003", "full_name": "Ramesh Babu", "role": "nurse",
                "specialty": "General Ward", "qualification": "GNM",
                "experience_years": 6, "contact": "9876500007",
                "email": "ramesh.b@lifesevatra.health", "on_duty": False,
                "shift": "rotating", "max_patients": 5, "current_patient_count": 0,
                "joined_date": date(2021, 11, 20),
            },
            {
                "staff_id": "DOC-005", "full_name": "Dr. Fatima Siddiqui", "role": "doctor",
                "specialty": "Pediatrics", "qualification": "MD Pediatrics",
                "experience_years": 9, "contact": "9876500008",
                "email": "fatima.s@lifesevatra.health", "on_duty": True,
                "shift": "day", "max_patients": 12, "current_patient_count": 4,
                "joined_date": date(2022, 8, 5),
            },
        ]

        staff_map: dict[str, int] = {}  # full_name -> id
        for sd in staff_data:
            s = Staff(hospital_id=h_id, **sd)
            db.add(s)
            await db.flush()
            await db.refresh(s)
            staff_map[s.full_name] = s.id

        print(f"✓ {len(staff_data)} staff members created")

        # ── Patients / Admissions ─────────────────────────────────────────
        now = datetime.utcnow()
        patients_data = [
            {
                "patient_name": "Arjun Verma", "age": 45, "gender": "male",
                "bed_id": "ICU-01", "doctor_name": "Dr. Meera Nair",
                "heart_rate": 112, "spo2": 88, "resp_rate": 28,
                "temperature": 39.2, "bp_systolic": 180, "bp_diastolic": 110,
                "presenting_ailment": "Acute Myocardial Infarction",
                "medical_history": "Hypertension, Diabetes Type 2",
                "clinical_notes": "Chest pain radiating to left arm. ECG shows ST elevation.",
                "lab_results": "Troponin I elevated at 4.5 ng/mL",
                "severity_score": 9, "condition": "Critical",
            },
            {
                "patient_name": "Priya Sharma", "age": 32, "gender": "female",
                "bed_id": "ICU-03", "doctor_name": "Dr. Ravi Patel",
                "heart_rate": 105, "spo2": 90, "resp_rate": 26,
                "temperature": 38.8, "bp_systolic": 95, "bp_diastolic": 60,
                "presenting_ailment": "Severe Pneumonia",
                "medical_history": "Asthma since childhood",
                "clinical_notes": "Bilateral infiltrates on chest X-ray. On O2 support.",
                "lab_results": "WBC 18,000; CRP 120 mg/L",
                "severity_score": 8, "condition": "Critical",
            },
            {
                "patient_name": "Rahul Desai", "age": 58, "gender": "male",
                "bed_id": "HDU-02", "doctor_name": "Dr. Meera Nair",
                "heart_rate": 92, "spo2": 93, "resp_rate": 22,
                "temperature": 38.1, "bp_systolic": 150, "bp_diastolic": 95,
                "presenting_ailment": "Post-operative monitoring – CABG",
                "medical_history": "Triple vessel disease, Diabetes",
                "clinical_notes": "Day 2 post-CABG. Stable hemodynamics.",
                "lab_results": "Hemoglobin 10.2 g/dL",
                "severity_score": 6, "condition": "Serious",
            },
            {
                "patient_name": "Sanya Gupta", "age": 24, "gender": "female",
                "bed_id": "HDU-05", "doctor_name": "Dr. Anil Kumar",
                "heart_rate": 88, "spo2": 95, "resp_rate": 20,
                "temperature": 37.5, "bp_systolic": 120, "bp_diastolic": 78,
                "presenting_ailment": "Dengue Hemorrhagic Fever",
                "medical_history": "None significant",
                "clinical_notes": "Platelet count dropping. Close monitoring needed.",
                "lab_results": "Platelets 45,000; Hematocrit 42%",
                "severity_score": 5, "condition": "Serious",
            },
            {
                "patient_name": "Vikram Singh", "age": 67, "gender": "male",
                "bed_id": "GEN-04", "doctor_name": "Dr. Ravi Patel",
                "heart_rate": 76, "spo2": 97, "resp_rate": 16,
                "temperature": 36.8, "bp_systolic": 130, "bp_diastolic": 82,
                "presenting_ailment": "Elective Knee Replacement",
                "medical_history": "Osteoarthritis, mild hypertension",
                "clinical_notes": "Pre-operative workup complete. Surgery scheduled tomorrow.",
                "lab_results": "All labs within normal limits",
                "severity_score": 2, "condition": "Stable",
            },
            {
                "patient_name": "Lakshmi Iyer", "age": 41, "gender": "female",
                "bed_id": "GEN-08", "doctor_name": "Dr. Anil Kumar",
                "heart_rate": 72, "spo2": 98, "resp_rate": 14,
                "temperature": 36.6, "bp_systolic": 118, "bp_diastolic": 74,
                "presenting_ailment": "Recovery – Appendectomy",
                "medical_history": "None significant",
                "clinical_notes": "Post-op day 1. Tolerating oral feeds. Discharge planned tomorrow.",
                "lab_results": "WBC normalizing",
                "severity_score": 1, "condition": "Recovering",
            },
            {
                "patient_name": "Mohammed Khan", "age": 53, "gender": "male",
                "bed_id": "HDU-07", "doctor_name": "Dr. Meera Nair",
                "heart_rate": 98, "spo2": 92, "resp_rate": 24,
                "temperature": 38.5, "bp_systolic": 140, "bp_diastolic": 90,
                "presenting_ailment": "Acute Pancreatitis",
                "medical_history": "Chronic alcohol use",
                "clinical_notes": "Severe epigastric pain. NPO, IV fluids running.",
                "lab_results": "Amylase 1200 U/L; Lipase 950 U/L",
                "severity_score": 7, "condition": "Serious",
            },
            {
                "patient_name": "Anjali Reddy", "age": 29, "gender": "female",
                "bed_id": "GEN-12", "doctor_name": "Dr. Ravi Patel",
                "heart_rate": 70, "spo2": 99, "resp_rate": 15,
                "temperature": 36.7, "bp_systolic": 110, "bp_diastolic": 70,
                "presenting_ailment": "Observation – Mild head injury",
                "medical_history": "None",
                "clinical_notes": "GCS 15/15. CT brain normal. 24h observation.",
                "lab_results": "All labs normal",
                "severity_score": 2, "condition": "Stable",
            },
        ]

        for pd in patients_data:
            doctor_name = pd.pop("doctor_name")
            doctor_id = staff_map.get(doctor_name)
            admission = Admission(
                hospital_id=h_id,
                doctor_id=doctor_id,
                doctor_name=doctor_name,
                admission_date=now,
                measured_time=now,
                created_at=now,
                updated_at=now,
                **pd,
            )
            db.add(admission)
            await db.flush()
            await db.refresh(admission)

            # Assign bed
            await assign_bed(db, h_id, admission.bed_id, admission.id)

        print(f"✓ {len(patients_data)} patients admitted")

        # ── Schedule slots (for Dr. Meera Nair) ──────────────────────────
        meera_id = staff_map["Dr. Meera Nair"]
        schedule_data = [
            {"time": "08:00 AM", "patient_name": "Arjun Verma", "type": "rounds", "status": "completed"},
            {"time": "08:30 AM", "patient_name": "Rahul Desai", "type": "follow-up", "status": "completed"},
            {"time": "09:00 AM", "patient_name": "Mohammed Khan", "type": "consultation", "status": "completed"},
            {"time": "09:30 AM", "patient_name": None, "type": "break", "status": "completed"},
            {"time": "10:00 AM", "patient_name": "New Patient", "type": "consultation", "status": "in-progress"},
            {"time": "10:30 AM", "patient_name": "Arjun Verma", "type": "procedure", "status": "scheduled"},
            {"time": "11:00 AM", "patient_name": None, "type": "rounds", "status": "scheduled"},
            {"time": "11:30 AM", "patient_name": "Rahul Desai", "type": "follow-up", "status": "scheduled"},
            {"time": "12:00 PM", "patient_name": None, "type": "break", "status": "scheduled"},
            {"time": "01:00 PM", "patient_name": "New Patient", "type": "consultation", "status": "scheduled"},
            {"time": "02:00 PM", "patient_name": None, "type": "rounds", "status": "scheduled"},
            {"time": "03:00 PM", "patient_name": "Mohammed Khan", "type": "follow-up", "status": "scheduled"},
        ]
        for sd in schedule_data:
            slot = ScheduleSlot(
                doctor_id=meera_id,
                date=date.today(),
                **sd,
            )
            db.add(slot)
        await db.flush()
        print(f"✓ {len(schedule_data)} schedule slots created")

        # ── Clinical notes ────────────────────────────────────────────────
        notes_data = [
            {
                "admission_id": 1, "patient_name": "Arjun Verma",
                "note": "Patient presenting with acute chest pain. ECG shows ST elevation in leads II, III, aVF. Started on dual antiplatelet therapy.",
                "type": "observation",
            },
            {
                "admission_id": 1, "patient_name": "Arjun Verma",
                "note": "Aspirin 325mg stat, Clopidogrel 300mg loading dose, Heparin 5000 IU IV bolus.",
                "type": "prescription",
            },
            {
                "admission_id": 3, "patient_name": "Rahul Desai",
                "note": "Post-CABG Day 2: Hemodynamically stable. Chest drains minimal output. Plan to remove drains tomorrow.",
                "type": "progress",
            },
            {
                "admission_id": 7, "patient_name": "Mohammed Khan",
                "note": "Severe acute pancreatitis. Ranson score 4. Keep NPO, aggressive IV fluids, pain management with morphine PCA.",
                "type": "observation",
            },
        ]
        for nd in notes_data:
            note = ClinicalNote(doctor_id=meera_id, created_at=now, **nd)
            db.add(note)
        await db.flush()
        print(f"✓ {len(notes_data)} clinical notes created")

        await db.commit()
        print("\n✅ Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
