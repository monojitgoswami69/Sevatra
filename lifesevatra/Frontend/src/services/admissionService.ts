/**
 * Admission Service
 * Manages patient admissions, bed assignments, and vitals.
 * Calls the FastAPI backend at /api/*.
 */

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

// ── Service functions ────────────────────────────────────────────────────────

export const createAdmission = async (payload: AdmissionPayload): Promise<AdmissionResponse> =>
  api<AdmissionResponse>('/admissions/', { method: 'POST', body: JSON.stringify(payload) });

export const getAllAdmissions = async (params?: {
  condition?: string;
  minSeverity?: number;
  maxSeverity?: number;
  limit?: number;
  offset?: number;
}): Promise<AllAdmissionsResponse> => {
  const raw = await api<AllAdmissionsResponse & { pagination: { has_more?: boolean } }>(
    `/admissions/${qs({
      condition: params?.condition,
      minSeverity: params?.minSeverity,
      maxSeverity: params?.maxSeverity,
      limit: params?.limit,
      offset: params?.offset,
    })}`
  );
  // Normalise snake_case → camelCase for pagination
  return {
    ...raw,
    pagination: {
      ...raw.pagination,
      hasMore: raw.pagination.has_more ?? raw.pagination.hasMore ?? false,
    },
  };
};

export const getBedAvailability = async (): Promise<BedAvailabilityResponse> =>
  api<BedAvailabilityResponse>('/beds/availability');

export const getDashboardStats = async (): Promise<DashboardStatsResponse> =>
  api<DashboardStatsResponse>('/dashboard/stats');

export const getPatientById = async (patientId: number): Promise<AdmissionResponse> =>
  api<AdmissionResponse>(`/admissions/${patientId}`);

export const updatePatientVitals = async (
  patientId: number,
  vitals: { heartRate?: number; spo2?: number; respRate?: number; temperature?: number; bpSystolic?: number; bpDiastolic?: number }
): Promise<AdmissionResponse> =>
  api<AdmissionResponse>(`/admissions/${patientId}/vitals`, { method: 'PUT', body: JSON.stringify(vitals) });

export const deleteAdmission = async (patientId: number): Promise<{ success: boolean; message: string }> =>
  api(`/admissions/${patientId}`, { method: 'DELETE' });

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

export const getAllBeds = async (): Promise<{ success: boolean; count: number; data: BedData[] }> =>
  api('/beds/');

export const getBedStats = async (): Promise<{ success: boolean; data: BedStatsData }> =>
  api('/beds/stats');

export const assignBed = async (bedId: string, patientId: number): Promise<{ success: boolean; message: string }> =>
  api(`/beds/${bedId}/assign${qs({ patient_id: patientId })}`, { method: 'PUT' });

export const releaseBed = async (bedId: string): Promise<{ success: boolean; message: string }> =>
  api(`/beds/${bedId}/release`, { method: 'PUT' });

export const dischargePatient = async (
  patientId: number,
  dischargeNotes?: string
): Promise<{ success: boolean; message: string; data: { patientId: number; patientName: string; releasedBed: string; dischargedAt: string } }> =>
  api(`/admissions/${patientId}/discharge`, {
    method: 'POST',
    body: JSON.stringify({ dischargeNotes }),
  });

