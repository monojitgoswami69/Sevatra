/**
 * Admission Service
 * Manages patient admissions, bed assignments, and vitals.
 */

import {
  INITIAL_PATIENTS,
  INITIAL_DASHBOARD_STATS,
  INITIAL_BEDS,
  INITIAL_STAFF,
} from '../data/sampleData';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface AdmissionPayload {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  emergencyContact?: string;
  presentingAilment?: string;
  medicalHistory?: string;
  clinicalNotes?: string;
  labResults?: string;
  heartRate?: number;
  spo2?: number;
  respRate?: number;
  temperature?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  govIdType?: string;
  idPicture?: string;
  patientPicture?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  whatsappNumber?: string;
  address?: string;
}

export interface AdmittedPatient {
  patient_id: number;
  patient_name: string;
  age: number;
  gender: string;
  bed_id: string;
  admission_date: string;
  heart_rate: number | null;
  spo2: number | null;
  resp_rate: number | null;
  temperature: number | null;
  blood_pressure: { systolic: number | null; diastolic: number | null };
  measured_time: string;
  presenting_ailment: string | null;
  medical_history: string | null;
  clinical_notes: string | null;
  lab_results: string | null;
  severity_score: number;
  condition: string;
  doctor: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionResponse {
  success: boolean;
  message: string;
  data: AdmittedPatient;
}

export interface AllAdmissionsResponse {
  success: boolean;
  message: string;
  data: AdmittedPatient[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export interface BedAvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    occupiedBeds: number;
    lowestBedId: number;
    highestBedId: number;
    availableBedRange: string;
  };
}

export interface DashboardStatsResponse {
  success: boolean;
  message: string;
  data: {
    totalPatients: number;
    criticalPatients: number;
    admittedToday: number;
    dischargedToday: number;
    bedOccupancy: { icuOccupied: number; hduOccupied: number; generalOccupied: number };
  };
}

export interface BedData {
  bed_id: string;
  bed_type: 'ICU' | 'HDU' | 'GENERAL';
  bed_number: number;
  is_available: boolean;
  current_patient_id: number | null;
  last_occupied_at: string | null;
  patient_name: string | null;
  condition: string | null;
}

export interface BedStatsData {
  by_type: { bed_type: string; total_beds: string; available_beds: string; occupied_beds: string }[];
  totals: { total_beds: number; available_beds: number; occupied_beds: number };
}

// ── In-memory store ──────────────────────────────────────────────────────────

let patients = [...INITIAL_PATIENTS];
let nextId = patients.length + 1;

const delay = (ms = 200) => new Promise<void>(r => setTimeout(r, ms));

// ── Helpers ──────────────────────────────────────────────────────────────────

function deriveSeverity(hr?: number, spo2?: number, rr?: number, temp?: number, sys?: number, dia?: number) {
  let score = 3;
  if (hr && (hr > 120 || hr < 50)) score += 2;
  if (spo2 && spo2 < 90) score += 3;
  else if (spo2 && spo2 < 94) score += 1;
  if (rr && (rr > 25 || rr < 10)) score += 2;
  if (temp && (temp > 39 || temp < 35)) score += 1;
  if (sys && (sys > 180 || sys < 90)) score += 2;
  if (dia && dia > 110) score += 1;
  return Math.min(score, 10);
}

function deriveCondition(score: number): string {
  if (score >= 8) return 'Critical';
  if (score >= 5) return 'Serious';
  if (score >= 3) return 'Stable';
  return 'Recovering';
}

function findAvailableBed(severity: number): string {
  const wardPriority = severity >= 8 ? ['ICU', 'HDU', 'GEN'] : severity >= 5 ? ['HDU', 'GEN', 'ICU'] : ['GEN', 'HDU', 'ICU'];
  const prefix: Record<string, string> = { ICU: 'ICU', HDU: 'HDU', GEN: 'GEN' };
  for (const ward of wardPriority) {
    const occupied = new Set(patients.map(p => p.bed_id));
    const beds = INITIAL_BEDS.filter(b => b.bed_id.startsWith(prefix[ward]));
    const available = beds.find(b => !occupied.has(b.bed_id));
    if (available) return available.bed_id;
  }
  return `GEN-${String(nextId).padStart(2, '0')}`;
}

// ── Service functions ────────────────────────────────────────────────────────

export const createAdmission = async (payload: AdmissionPayload): Promise<AdmissionResponse> => {
  await delay();
  const severity = deriveSeverity(payload.heartRate, payload.spo2, payload.respRate, payload.temperature, payload.bpSystolic, payload.bpDiastolic);
  const now = new Date();
  const bedId = findAvailableBed(severity);
  const doctors = INITIAL_STAFF.filter(s => ['doctor', 'surgeon', 'specialist'].includes(s.role) && s.on_duty);
  const doctor = doctors.length > 0 ? doctors[Math.floor(Math.random() * doctors.length)].full_name : 'Dr. Unassigned';

  const patient: AdmittedPatient = {
    patient_id: nextId++,
    patient_name: payload.name,
    age: payload.age,
    gender: payload.gender,
    bed_id: bedId,
    admission_date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    heart_rate: payload.heartRate ?? null,
    spo2: payload.spo2 ?? null,
    resp_rate: payload.respRate ?? null,
    temperature: payload.temperature ?? null,
    blood_pressure: { systolic: payload.bpSystolic ?? null, diastolic: payload.bpDiastolic ?? null },
    measured_time: now.toISOString(),
    presenting_ailment: payload.presentingAilment ?? null,
    medical_history: payload.medicalHistory ?? null,
    clinical_notes: payload.clinicalNotes ?? null,
    lab_results: payload.labResults ?? null,
    severity_score: severity,
    condition: deriveCondition(severity),
    doctor,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
  patients.push(patient);
  return { success: true, message: 'Patient admitted successfully', data: patient };
};

export const getAllAdmissions = async (_params?: {
  condition?: string;
  minSeverity?: number;
  maxSeverity?: number;
  limit?: number;
  offset?: number;
}): Promise<AllAdmissionsResponse> => {
  await delay();
  let filtered = [...patients];
  if (_params?.condition) filtered = filtered.filter(p => p.condition.toLowerCase() === _params.condition!.toLowerCase());
  if (_params?.minSeverity) filtered = filtered.filter(p => p.severity_score >= _params.minSeverity!);
  if (_params?.maxSeverity) filtered = filtered.filter(p => p.severity_score <= _params.maxSeverity!);
  const offset = _params?.offset ?? 0;
  const limit = _params?.limit ?? 100;
  const page = filtered.slice(offset, offset + limit);
  return {
    success: true,
    message: 'OK',
    data: page,
    pagination: { total: filtered.length, limit, offset, hasMore: offset + limit < filtered.length },
  };
};

export const getBedAvailability = async (): Promise<BedAvailabilityResponse> => {
  await delay();
  const occupied = patients.length;
  return {
    success: true,
    message: 'OK',
    data: { occupiedBeds: occupied, lowestBedId: 1, highestBedId: 55, availableBedRange: '1-55' },
  };
};

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  await delay();
  const stats = {
    totalPatients: patients.length,
    criticalPatients: patients.filter(p => p.severity_score >= 8).length,
    admittedToday: patients.length,
    dischargedToday: INITIAL_DASHBOARD_STATS.dischargedToday,
    bedOccupancy: {
      icuOccupied: patients.filter(p => p.bed_id.startsWith('ICU')).length,
      hduOccupied: patients.filter(p => p.bed_id.startsWith('HDU')).length,
      generalOccupied: patients.filter(p => p.bed_id.startsWith('GEN')).length,
    },
  };
  return { success: true, message: 'OK', data: stats };
};

export const getPatientById = async (patientId: number): Promise<AdmissionResponse> => {
  await delay();
  const p = patients.find(pt => pt.patient_id === patientId);
  if (!p) throw new Error('Patient not found');
  return { success: true, message: 'OK', data: p };
};

export const updatePatientVitals = async (
  patientId: number,
  vitals: { heartRate?: number; spo2?: number; respRate?: number; temperature?: number; bpSystolic?: number; bpDiastolic?: number }
): Promise<AdmissionResponse> => {
  await delay();
  const idx = patients.findIndex(p => p.patient_id === patientId);
  if (idx === -1) throw new Error('Patient not found');
  const p = { ...patients[idx] };
  if (vitals.heartRate !== undefined) p.heart_rate = vitals.heartRate;
  if (vitals.spo2 !== undefined) p.spo2 = vitals.spo2;
  if (vitals.respRate !== undefined) p.resp_rate = vitals.respRate;
  if (vitals.temperature !== undefined) p.temperature = vitals.temperature;
  if (vitals.bpSystolic !== undefined) p.blood_pressure = { ...p.blood_pressure, systolic: vitals.bpSystolic };
  if (vitals.bpDiastolic !== undefined) p.blood_pressure = { ...p.blood_pressure, diastolic: vitals.bpDiastolic };
  p.severity_score = deriveSeverity(p.heart_rate ?? undefined, p.spo2 ?? undefined, p.resp_rate ?? undefined, p.temperature ?? undefined, p.blood_pressure.systolic ?? undefined, p.blood_pressure.diastolic ?? undefined);
  p.condition = deriveCondition(p.severity_score);
  p.updated_at = new Date().toISOString();
  patients[idx] = p;
  return { success: true, message: 'Vitals updated', data: p };
};

export const deleteAdmission = async (patientId: number): Promise<{ success: boolean; message: string }> => {
  await delay();
  patients = patients.filter(p => p.patient_id !== patientId);
  return { success: true, message: 'Admission deleted' };
};

export const updateVitals = async (
  patientId: number,
  vitals: { heartRate?: number; spo2?: number; respRate?: number; temperature?: number; bpSystolic?: number; bpDiastolic?: number }
): Promise<{ success: boolean; message: string; data: { severity_score: number; condition: string; ward_recommendation: string } }> => {
  const res = await updatePatientVitals(patientId, vitals);
  const p = res.data;
  let ward = 'General';
  if (p.severity_score >= 8) ward = 'ICU';
  else if (p.severity_score >= 5) ward = 'HDU';
  return { success: true, message: 'Vitals updated', data: { severity_score: p.severity_score, condition: p.condition, ward_recommendation: ward } };
};

// ── Bed Management ───────────────────────────────────────────────────────────

export const getAllBeds = async (): Promise<{ success: boolean; count: number; data: BedData[] }> => {
  await delay();
  const occupied = new Set(patients.map(p => p.bed_id));
  const beds: BedData[] = INITIAL_BEDS.map(b => {
    const patient = patients.find(p => p.bed_id === b.bed_id);
    return {
      ...b,
      is_available: !occupied.has(b.bed_id),
      current_patient_id: patient?.patient_id ?? null,
      patient_name: patient?.patient_name ?? null,
      condition: patient?.condition ?? null,
      last_occupied_at: patient ? patient.created_at : null,
    };
  });
  return { success: true, count: beds.length, data: beds };
};

export const getBedStats = async (): Promise<{ success: boolean; data: BedStatsData }> => {
  await delay();
  const occupied = new Set(patients.map(p => p.bed_id));
  const by_type = (['ICU', 'HDU', 'GENERAL'] as const).map(type => {
    const prefix = type === 'GENERAL' ? 'GEN' : type;
    const beds = INITIAL_BEDS.filter(b => b.bed_id.startsWith(prefix));
    const occ = beds.filter(b => occupied.has(b.bed_id)).length;
    return { bed_type: type, total_beds: String(beds.length), available_beds: String(beds.length - occ), occupied_beds: String(occ) };
  });
  const totalBeds = INITIAL_BEDS.length;
  const totalOcc = occupied.size;
  return { success: true, data: { by_type, totals: { total_beds: totalBeds, available_beds: totalBeds - totalOcc, occupied_beds: totalOcc } } };
};

export const assignBed = async (_bedId: string, _patientId: number): Promise<{ success: boolean; message: string }> => {
  await delay();
  const p = patients.find(pt => pt.patient_id === _patientId);
  if (p) p.bed_id = _bedId;
  return { success: true, message: 'Bed assigned' };
};

export const releaseBed = async (bedId: string): Promise<{ success: boolean; message: string }> => {
  await delay();
  const p = patients.find(pt => pt.bed_id === bedId);
  if (p) p.bed_id = '';
  return { success: true, message: 'Bed released' };
};

export const dischargePatient = async (
  patientId: number,
  _dischargeNotes?: string
): Promise<{ success: boolean; message: string; data: { patientId: number; patientName: string; releasedBed: string; dischargedAt: string } }> => {
  await delay();
  const p = patients.find(pt => pt.patient_id === patientId);
  const name = p?.patient_name ?? 'Unknown';
  const bed = p?.bed_id ?? '';
  patients = patients.filter(pt => pt.patient_id !== patientId);
  return { success: true, message: 'Patient discharged', data: { patientId, patientName: name, releasedBed: bed, dischargedAt: new Date().toISOString() } };
};

