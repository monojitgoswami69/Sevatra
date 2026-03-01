/**
 * Sample data for the Lifesevatra dashboard.
 */

import type { AdmittedPatient } from '../services/admissionService';
import type { StaffMember, StaffStats } from '../services/staffService';

// ---------------------------------------------------------------------------
// Hospital
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
// Patients
// ---------------------------------------------------------------------------
const now = new Date().toISOString();
const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
    patient_id: 2,
    patient_name: 'Priya Sharma',
    age: 32,
    gender: 'female',
    bed_id: 'ICU-03',
    admission_date: today,
    heart_rate: 105,
    spo2: 90,
    resp_rate: 26,
    temperature: 38.8,
    blood_pressure: { systolic: 95, diastolic: 60 },
    measured_time: now,
    presenting_ailment: 'Severe Pneumonia',
    medical_history: 'Asthma since childhood',
    clinical_notes: 'Bilateral infiltrates on chest X-ray. On O2 support.',
    lab_results: 'WBC 18,000; CRP 120 mg/L',
    severity_score: 8,
    condition: 'Critical',
    doctor: 'Dr. Ravi Patel',
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
    patient_id: 4,
    patient_name: 'Sanya Gupta',
    age: 24,
    gender: 'female',
    bed_id: 'HDU-05',
    admission_date: today,
    heart_rate: 88,
    spo2: 95,
    resp_rate: 20,
    temperature: 37.5,
    blood_pressure: { systolic: 120, diastolic: 78 },
    measured_time: now,
    presenting_ailment: 'Dengue Hemorrhagic Fever',
    medical_history: 'None significant',
    clinical_notes: 'Platelet count dropping. Close monitoring needed.',
    lab_results: 'Platelets 45,000; Hematocrit 42%',
    severity_score: 5,
    condition: 'Serious',
    doctor: 'Dr. Anil Kumar',
    created_at: now,
    updated_at: now,
  },
  {
    patient_id: 5,
    patient_name: 'Vikram Singh',
    age: 67,
    gender: 'male',
    bed_id: 'GEN-04',
    admission_date: today,
    heart_rate: 76,
    spo2: 97,
    resp_rate: 16,
    temperature: 36.8,
    blood_pressure: { systolic: 130, diastolic: 82 },
    measured_time: now,
    presenting_ailment: 'Elective Knee Replacement',
    medical_history: 'Osteoarthritis, mild hypertension',
    clinical_notes: 'Pre-operative workup complete. Surgery scheduled tomorrow.',
    lab_results: 'All labs within normal limits',
    severity_score: 2,
    condition: 'Stable',
    doctor: 'Dr. Ravi Patel',
    created_at: now,
    updated_at: now,
  },
  {
    patient_id: 6,
    patient_name: 'Lakshmi Iyer',
    age: 41,
    gender: 'female',
    bed_id: 'GEN-08',
    admission_date: today,
    heart_rate: 72,
    spo2: 98,
    resp_rate: 14,
    temperature: 36.6,
    blood_pressure: { systolic: 118, diastolic: 74 },
    measured_time: now,
    presenting_ailment: 'Recovery – Appendectomy',
    medical_history: 'None significant',
    clinical_notes: 'Post-op day 1. Tolerating oral feeds. Discharge planned tomorrow.',
    lab_results: 'WBC normalizing',
    severity_score: 1,
    condition: 'Recovering',
    doctor: 'Dr. Anil Kumar',
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
  {
    patient_id: 8,
    patient_name: 'Anjali Reddy',
    age: 29,
    gender: 'female',
    bed_id: 'GEN-12',
    admission_date: today,
    heart_rate: 70,
    spo2: 99,
    resp_rate: 15,
    temperature: 36.7,
    blood_pressure: { systolic: 110, diastolic: 70 },
    measured_time: now,
    presenting_ailment: 'Observation – Mild head injury',
    medical_history: 'None',
    clinical_notes: 'GCS 15/15. CT brain normal. 24h observation.',
    lab_results: 'All labs normal',
    severity_score: 2,
    condition: 'Stable',
    doctor: 'Dr. Ravi Patel',
    created_at: now,
    updated_at: now,
  },
];

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 1,
    staff_id: 'DOC-001',
    full_name: 'Dr. Meera Nair',
    role: 'doctor',
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
    created_at: now,
    updated_at: now,
  },
  {
    id: 2,
    staff_id: 'DOC-002',
    full_name: 'Dr. Ravi Patel',
    role: 'doctor',
    specialty: 'Pulmonology',
    qualification: 'MD, DNB Pulmonary Medicine',
    experience_years: 12,
    contact: '9876500002',
    email: 'ravi.patel@lifesevatra.health',
    on_duty: true,
    shift: 'day',
    max_patients: 10,
    current_patient_count: 3,
    joined_date: '2021-01-10',
    created_at: now,
    updated_at: now,
  },
  {
    id: 3,
    staff_id: 'DOC-003',
    full_name: 'Dr. Anil Kumar',
    role: 'surgeon',
    specialty: 'General Surgery',
    qualification: 'MS, FRCS',
    experience_years: 18,
    contact: '9876500003',
    email: 'anil.kumar@lifesevatra.health',
    on_duty: false,
    shift: 'night',
    max_patients: 8,
    current_patient_count: 2,
    joined_date: '2019-07-22',
    created_at: now,
    updated_at: now,
  },
  {
    id: 4,
    staff_id: 'DOC-004',
    full_name: 'Dr. Sunita Rao',
    role: 'specialist',
    specialty: 'Neurology',
    qualification: 'MD, DM Neurology',
    experience_years: 10,
    contact: '9876500004',
    email: 'sunita.rao@lifesevatra.health',
    on_duty: true,
    shift: 'rotating',
    max_patients: 8,
    current_patient_count: 1,
    joined_date: '2022-05-01',
    created_at: now,
    updated_at: now,
  },
  {
    id: 5,
    staff_id: 'NUR-001',
    full_name: 'Kavitha Menon',
    role: 'nurse',
    specialty: 'ICU Nursing',
    qualification: 'BSc Nursing, CCRN',
    experience_years: 8,
    contact: '9876500005',
    email: 'kavitha.m@lifesevatra.health',
    on_duty: true,
    shift: 'day',
    max_patients: 4,
    current_patient_count: 2,
    joined_date: '2020-09-10',
    created_at: now,
    updated_at: now,
  },
  {
    id: 6,
    staff_id: 'NUR-002',
    full_name: 'Deepa Joshi',
    role: 'nurse',
    specialty: 'Emergency Nursing',
    qualification: 'BSc Nursing',
    experience_years: 5,
    contact: '9876500006',
    email: 'deepa.j@lifesevatra.health',
    on_duty: true,
    shift: 'night',
    max_patients: 4,
    current_patient_count: 3,
    joined_date: '2023-01-15',
    created_at: now,
    updated_at: now,
  },
  {
    id: 7,
    staff_id: 'NUR-003',
    full_name: 'Ramesh Babu',
    role: 'nurse',
    specialty: 'General Ward',
    qualification: 'GNM',
    experience_years: 6,
    contact: '9876500007',
    email: 'ramesh.b@lifesevatra.health',
    on_duty: false,
    shift: 'rotating',
    max_patients: 5,
    current_patient_count: 0,
    joined_date: '2021-11-20',
    created_at: now,
    updated_at: now,
  },
  {
    id: 8,
    staff_id: 'DOC-005',
    full_name: 'Dr. Fatima Siddiqui',
    role: 'doctor',
    specialty: 'Pediatrics',
    qualification: 'MD Pediatrics',
    experience_years: 9,
    contact: '9876500008',
    email: 'fatima.s@lifesevatra.health',
    on_duty: true,
    shift: 'day',
    max_patients: 12,
    current_patient_count: 4,
    joined_date: '2022-08-05',
    created_at: now,
    updated_at: now,
  },
];

// ---------------------------------------------------------------------------
// Staff stats (derived)
// ---------------------------------------------------------------------------
export const INITIAL_STAFF_STATS: StaffStats = {
  total_staff: String(INITIAL_STAFF.length),
  total_doctors: String(INITIAL_STAFF.filter(s => ['doctor', 'surgeon', 'specialist'].includes(s.role)).length),
  total_nurses: String(INITIAL_STAFF.filter(s => s.role === 'nurse').length),
  on_duty: String(INITIAL_STAFF.filter(s => s.on_duty).length),
  off_duty: String(INITIAL_STAFF.filter(s => !s.on_duty).length),
  total_assigned_patients: String(INITIAL_STAFF.reduce((sum, s) => sum + s.current_patient_count, 0)),
};

// ---------------------------------------------------------------------------
// Dashboard stats (derived from patients)
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
// Bed data
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

export const INITIAL_BED_STATS = {
  by_type: (['ICU', 'HDU', 'GENERAL'] as const).map(type => {
    const beds = INITIAL_BEDS.filter(b => b.bed_type === type);
    const available = beds.filter(b => b.is_available).length;
    return {
      bed_type: type,
      total_beds: String(beds.length),
      available_beds: String(available),
      occupied_beds: String(beds.length - available),
    };
  }),
  totals: {
    total_beds: INITIAL_BEDS.length,
    available_beds: INITIAL_BEDS.filter(b => b.is_available).length,
    occupied_beds: INITIAL_BEDS.filter(b => !b.is_available).length,
  },
};

