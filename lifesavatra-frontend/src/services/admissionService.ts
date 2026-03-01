/**
 * Admission Service
 * Manages patient admissions, bed assignments, and vitals.
 * Calls the FastAPI backend at /api/v1/life/*.
 */

import { getAuthHeaders } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

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
  blood_group: string | null;
  emergency_contact: string | null;
  address: string | null;
  gov_id_type: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  whatsapp_number: string | null;
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
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

async function apiRaw(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    headers: { ...getAuthHeaders(), ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

// ── Service functions ────────────────────────────────────────────────────────

export const createAdmission = async (payload: AdmissionPayload): Promise<AdmissionResponse> => {
  const raw = await api<AdmittedPatient>('/life/admissions/', { method: 'POST', body: JSON.stringify(payload) });
  return { success: true, message: 'Patient admitted', data: raw };
};

export const getAllAdmissions = async (params?: {
  condition?: string;
  minSeverity?: number;
  maxSeverity?: number;
  limit?: number;
  offset?: number;
}): Promise<AllAdmissionsResponse> => {
  const raw = await api<{ admissions: AdmittedPatient[]; total: number }>(
    `/life/admissions/${qs({
      condition: params?.condition,
      min_severity: params?.minSeverity,
      max_severity: params?.maxSeverity,
      limit: params?.limit,
      offset: params?.offset,
    })}`
  );
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  return {
    success: true,
    message: 'OK',
    data: raw.admissions ?? [],
    pagination: {
      total: raw.total ?? 0,
      limit,
      offset,
      hasMore: (offset + limit) < (raw.total ?? 0),
    },
  };
};

export const getBedAvailability = async (): Promise<BedAvailabilityResponse> =>
  api<BedAvailabilityResponse>('/life/beds/availability');

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const raw = await api<DashboardStatsResponse['data']>('/life/dashboard/stats');
  return { success: true, message: 'OK', data: raw };
};

export const getPatientById = async (patientId: number | string): Promise<AdmissionResponse> => {
  const raw = await api<AdmittedPatient>(`/life/admissions/${patientId}`);
  return { success: true, message: 'OK', data: raw };
};

export const updatePatientVitals = async (
  patientId: number | string,
  vitals: { heartRate?: number; spo2?: number; respRate?: number; temperature?: number; bpSystolic?: number; bpDiastolic?: number }
): Promise<AdmissionResponse> => {
  const raw = await api<AdmittedPatient>(`/life/admissions/${patientId}/vitals`, { method: 'PUT', body: JSON.stringify(vitals) });
  return { success: true, message: 'Vitals updated', data: raw };
};

export const deleteAdmission = async (patientId: number | string): Promise<{ success: boolean; message: string }> => {
  await api(`/life/admissions/${patientId}`, { method: 'DELETE' });
  return { success: true, message: 'Deleted' };
};

export const updateVitals = async (
  patientId: number | string,
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
  const raw = await api<BedData[]>('/life/beds/');
  return { success: true, count: raw.length, data: raw };
};

export const getBedStats = async (): Promise<{ success: boolean; data: BedStatsData }> => {
  const raw = await api<BedStatsData>('/life/beds/stats');
  return { success: true, data: raw };
};

export const assignBed = async (bedId: string, patientId: number | string, patientName: string, condition: string = 'Stable'): Promise<{ success: boolean; message: string }> => {
  await api(`/life/beds/${bedId}/assign`, { method: 'PUT', body: JSON.stringify({ patient_id: String(patientId), patient_name: patientName, condition }) });
  return { success: true, message: 'Bed assigned' };
};

export const releaseBed = async (bedId: string): Promise<{ success: boolean; message: string }> => {
  await api(`/life/beds/${bedId}/release`, { method: 'PUT' });
  return { success: true, message: 'Bed released' };
};

export const dischargePatient = async (
  patientId: number | string,
  dischargeNotes?: string
): Promise<{ success: boolean; message: string; data: { patientId: number; patientName: string; releasedBed: string; dischargedAt: string } }> => {
  const raw = await api<{ patientId: number; patientName: string; releasedBed: string; dischargedAt: string }>(`/life/admissions/${patientId}/discharge`, {
    method: 'POST',
    body: JSON.stringify({ dischargeNotes }),
  });
  return { success: true, message: 'Patient discharged', data: raw };
};

// ── File Management ──────────────────────────────────────────────────────────

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    name: string;
    path: string;
    size: number;
    dropbox_id: string;
  };
}

export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiRaw('/life/files/upload', {
    method: 'POST',
    body: formData,
  });
  return res.json();
};

export const listFiles = async (): Promise<{ files: Array<{ name: string; path: string; size: number; id: string }> }> =>
  api('/life/files/list');

export const deleteFile = async (path: string): Promise<{ success: boolean; deleted: unknown }> =>
  api(`/life/files/delete?path=${encodeURIComponent(path)}`, { method: 'DELETE' });

// ── Severity Calculation (server-side) ───────────────────────────────────────

export const calculateSeverityServer = async (
  vitals: { heartRate?: number; spo2?: number; respRate?: number; temperature?: number; bpSystolic?: number; bpDiastolic?: number }
): Promise<{ score: number; condition: string; wardRecommendation: string; riskFactors: string[]; summary: string; percentage: number; urgency: string }> => {
  // This endpoint requires no auth
  const res = await fetch(`${API}/life/vitals/calculate-severity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vitals),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res.json();
};

