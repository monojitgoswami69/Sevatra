/**
 * Sample data for the Doctor Dashboard.
 */

import type { AdmittedPatient } from '../services/admissionService';
import type { DoctorInfo, ScheduleSlot, ClinicalNote } from '../types/dashboard.types';

// ---------------------------------------------------------------------------
// Hospital (minimal – doctor only needs basic info)
// ---------------------------------------------------------------------------
export const HOSPITAL_INFO = {
  id: 1,
  hospital_name: 'Lifesevatra Central Hospital',
  email: 'admin@lifesevatra.health',
  contact: '9876543210',
  hospital_address: '42 MG Road, Bengaluru, Karnataka 560001',
  icu_beds: 10,
  hdu_beds: 15,
  general_beds: 30,
  created_at: '2025-06-01T08:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Logged-in Doctor
// ---------------------------------------------------------------------------
const now = new Date().toISOString();
const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const CURRENT_DOCTOR: DoctorInfo = {
  id: 1,
  staff_id: 'DOC-001',
  full_name: 'Dr. Meera Nair',
  specialty: 'Cardiology',
  qualification: 'MD, DM Cardiology',
  experience_years: 15,
  contact: '9876500001',
  email: 'meera.nair@lifesevatra.health',
  on_duty: true,
  shift: 'day',
  max_patients: 10,
  current_patient_count: 3,
  joined_date: '2020-03-15',
  bio: 'Senior Cardiologist with 15+ years of experience in interventional cardiology, heart failure management, and preventive cardiac care. Fellow of the Indian College of Cardiology.',
  languages: ['English', 'Hindi', 'Malayalam'],
  consultation_fee: 1500,
};

// ---------------------------------------------------------------------------
// Patients assigned to Dr. Meera Nair
// ---------------------------------------------------------------------------
export const INITIAL_PATIENTS: AdmittedPatient[] = [
  {
    patient_id: 1,
    patient_name: 'Arjun Verma',
    age: 45,
    gender: 'male',
    bed_id: 'ICU-01',
    admission_date: today,
    heart_rate: 112,
    spo2: 88,
    resp_rate: 28,
    temperature: 39.2,
    blood_pressure: { systolic: 180, diastolic: 110 },
    measured_time: now,
    presenting_ailment: 'Acute Myocardial Infarction',
    medical_history: 'Hypertension, Diabetes Type 2',
    clinical_notes: 'Chest pain radiating to left arm. ECG shows ST elevation.',
    lab_results: 'Troponin I elevated at 4.5 ng/mL',
    severity_score: 9,
    condition: 'Critical',
    doctor: 'Dr. Meera Nair',
    created_at: now,
    updated_at: now,
  },
  {
    patient_id: 3,
    patient_name: 'Rahul Desai',
    age: 58,
    gender: 'male',
    bed_id: 'HDU-02',
    admission_date: today,
    heart_rate: 92,
    spo2: 93,
    resp_rate: 22,
    temperature: 38.1,
    blood_pressure: { systolic: 150, diastolic: 95 },
    measured_time: now,
    presenting_ailment: 'Post-operative monitoring – CABG',
    medical_history: 'Triple vessel disease, Diabetes',
    clinical_notes: 'Day 2 post-CABG. Stable hemodynamics.',
    lab_results: 'Hemoglobin 10.2 g/dL',
    severity_score: 6,
    condition: 'Serious',
    doctor: 'Dr. Meera Nair',
    created_at: now,
    updated_at: now,
  },
  {
    patient_id: 7,
    patient_name: 'Mohammed Khan',
    age: 53,
    gender: 'male',
    bed_id: 'HDU-07',
    admission_date: today,
    heart_rate: 98,
    spo2: 92,
    resp_rate: 24,
    temperature: 38.5,
    blood_pressure: { systolic: 140, diastolic: 90 },
    measured_time: now,
    presenting_ailment: 'Acute Pancreatitis',
    medical_history: 'Chronic alcohol use',
    clinical_notes: 'Severe epigastric pain. NPO, IV fluids running.',
    lab_results: 'Amylase 1200 U/L; Lipase 950 U/L',
    severity_score: 7,
    condition: 'Serious',
    doctor: 'Dr. Meera Nair',
    created_at: now,
    updated_at: now,
  },
];

// ---------------------------------------------------------------------------
// Today's Schedule
// ---------------------------------------------------------------------------
export const INITIAL_SCHEDULE: ScheduleSlot[] = [
  { id: 1, time: '08:00 AM', patient_name: null, patient_id: null, type: 'rounds', status: 'completed', notes: 'Morning ICU rounds' },
  { id: 2, time: '09:00 AM', patient_name: 'Arjun Verma', patient_id: 1, type: 'consultation', status: 'completed', notes: 'Post-MI review, check troponin trend' },
  { id: 3, time: '09:30 AM', patient_name: 'Rahul Desai', patient_id: 3, type: 'follow-up', status: 'completed', notes: 'Post-CABG day 2 check' },
  { id: 4, time: '10:00 AM', patient_name: 'Suresh Pillai', patient_id: null, type: 'consultation', status: 'in-progress', notes: 'OPD – Chest pain evaluation' },
  { id: 5, time: '10:30 AM', patient_name: 'Anita Deshmukh', patient_id: null, type: 'consultation', status: 'scheduled', notes: 'OPD – Hypertension follow-up' },
  { id: 6, time: '11:00 AM', patient_name: null, patient_id: null, type: 'break', status: 'scheduled', notes: 'Tea break' },
  { id: 7, time: '11:30 AM', patient_name: 'Mohammed Khan', patient_id: 7, type: 'follow-up', status: 'scheduled', notes: 'Review amylase/lipase, pain assessment' },
  { id: 8, time: '12:00 PM', patient_name: 'Kavita Sharma', patient_id: null, type: 'procedure', status: 'scheduled', notes: 'Echocardiography reading' },
  { id: 9, time: '01:00 PM', patient_name: null, patient_id: null, type: 'break', status: 'scheduled', notes: 'Lunch break' },
  { id: 10, time: '02:00 PM', patient_name: null, patient_id: null, type: 'rounds', status: 'scheduled', notes: 'Afternoon HDU rounds' },
  { id: 11, time: '03:00 PM', patient_name: 'Rajan Nair', patient_id: null, type: 'consultation', status: 'scheduled', notes: 'OPD – New patient referral, suspected ACS' },
  { id: 12, time: '04:00 PM', patient_name: 'Arjun Verma', patient_id: 1, type: 'follow-up', status: 'scheduled', notes: 'Evening vitals check & plan review' },
];

// ---------------------------------------------------------------------------
// Recent Clinical Notes
// ---------------------------------------------------------------------------
export const INITIAL_NOTES: ClinicalNote[] = [
  {
    id: 1,
    patient_id: 1,
    patient_name: 'Arjun Verma',
    note: 'Patient hemodynamically stable after PCI. Continue dual antiplatelet therapy. Monitor troponin trend q6h.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    type: 'progress',
  },
  {
    id: 2,
    patient_id: 3,
    patient_name: 'Rahul Desai',
    note: 'Post-CABG Day 2: Chest drains removed. Mobilization started. Diet upgraded to soft. Target discharge in 3 days.',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    type: 'progress',
  },
  {
    id: 3,
    patient_id: 7,
    patient_name: 'Mohammed Khan',
    note: 'Pain score 7/10. CT abdomen shows peripancreatic fluid collection. Upgraded to IV Meropenem. Gastro consult requested.',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    type: 'observation',
  },
  {
    id: 4,
    patient_id: 1,
    patient_name: 'Arjun Verma',
    note: 'Rx: Tab Aspirin 75mg OD, Tab Clopidogrel 75mg OD, Tab Atorvastatin 40mg HS, Tab Metoprolol 25mg BD, Inj Enoxaparin 60mg SC BD',
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    type: 'prescription',
  },
];

// ---------------------------------------------------------------------------
// Dashboard stats (derived)
// ---------------------------------------------------------------------------
export const INITIAL_DASHBOARD_STATS = {
  totalPatients: INITIAL_PATIENTS.length,
  criticalPatients: INITIAL_PATIENTS.filter(p => p.severity_score >= 8).length,
  admittedToday: INITIAL_PATIENTS.length,
  dischargedToday: 1,
  bedOccupancy: {
    icuOccupied: INITIAL_PATIENTS.filter(p => p.bed_id.startsWith('ICU')).length,
    hduOccupied: INITIAL_PATIENTS.filter(p => p.bed_id.startsWith('HDU')).length,
    generalOccupied: INITIAL_PATIENTS.filter(p => p.bed_id.startsWith('GEN')).length,
  },
};

// ---------------------------------------------------------------------------
// Bed data (needed by service layer – kept minimal)
// ---------------------------------------------------------------------------
export const INITIAL_BEDS = (() => {
  const beds: {
    bed_id: string;
    bed_type: 'ICU' | 'HDU' | 'GENERAL';
    bed_number: number;
    is_available: boolean;
    current_patient_id: number | null;
    last_occupied_at: string | null;
    patient_name: string | null;
    condition: string | null;
  }[] = [];

  const prefix = { ICU: 'ICU', HDU: 'HDU', GENERAL: 'GEN' } as const;
  const addBeds = (type: 'ICU' | 'HDU' | 'GENERAL', count: number) => {
    for (let i = 1; i <= count; i++) {
      const bedId = `${prefix[type]}-${String(i).padStart(2, '0')}`;
      const patient = INITIAL_PATIENTS.find(p => p.bed_id === bedId);
      beds.push({
        bed_id: bedId,
        bed_type: type,
        bed_number: i,
        is_available: !patient,
        current_patient_id: patient ? patient.patient_id : null,
        last_occupied_at: patient ? now : null,
        patient_name: patient ? patient.patient_name : null,
        condition: patient ? patient.condition : null,
      });
    }
  };
  addBeds('ICU', HOSPITAL_INFO.icu_beds);
  addBeds('HDU', HOSPITAL_INFO.hdu_beds);
  addBeds('GENERAL', HOSPITAL_INFO.general_beds);
  return beds;
})();

// Staff stub (needed by admissionService)
export const INITIAL_STAFF = [
  { id: 1, staff_id: 'DOC-001', full_name: 'Dr. Meera Nair', role: 'doctor' as const, specialty: 'Cardiology', qualification: 'MD, DM Cardiology', experience_years: 15, contact: '9876500001', email: 'meera.nair@lifesevatra.health', on_duty: true, shift: 'day' as const, max_patients: 10, current_patient_count: 3, joined_date: '2020-03-15', created_at: now, updated_at: now },
];
