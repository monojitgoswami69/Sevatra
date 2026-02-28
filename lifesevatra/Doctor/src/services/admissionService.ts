/**
 * Doctor-focused Service Layer
 * Patient management, vitals, schedule, clinical notes, profile.
 * Calls the FastAPI backend at /api/doctor/*.
 */

import type { DoctorInfo, ScheduleSlot, ClinicalNote } from '../types/dashboard.types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ── Interfaces ──────────────────────────────────────────────────────────────

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

// ── Patient services ─────────────────────────────────────────────────────────

/** Return ALL patients assigned to the logged-in doctor. */
export const getDoctorPatients = async (): Promise<AdmittedPatient[]> => {
  const res = await api<{ success: boolean; data: AdmittedPatient[] }>('/doctor/patients');
  return res.data;
};

/** Alias kept for backward-compat usage. Returns all doctor's patients. */
export const getAllAdmissions = async (_params?: {
  condition?: string;
  minSeverity?: number;
  maxSeverity?: number;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; message: string; data: AdmittedPatient[] }> => {
  const patients = await getDoctorPatients();
  let filtered = [...patients];
  if (_params?.condition) filtered = filtered.filter(p => p.condition.toLowerCase() === _params.condition!.toLowerCase());
  if (_params?.minSeverity) filtered = filtered.filter(p => p.severity_score >= _params.minSeverity!);
  if (_params?.maxSeverity) filtered = filtered.filter(p => p.severity_score <= _params.maxSeverity!);
  return { success: true, message: 'OK', data: filtered };
};

/** Get a single patient by ID. */
export const getPatientById = async (patientId: number): Promise<AdmittedPatient> => {
  const res = await api<{ success: boolean; data: AdmittedPatient }>(`/admissions/${patientId}`);
  return res.data;
};

/** Update vital signs — also recalculates severity. */
export const updatePatientVitals = async (
  patientId: number,
  vitals: {
    heartRate?: number; spo2?: number; respRate?: number;
    temperature?: number; bpSystolic?: number; bpDiastolic?: number;
  },
): Promise<AdmittedPatient> => {
  const res = await api<{ success: boolean; data: AdmittedPatient }>(
    `/admissions/${patientId}/vitals`,
    { method: 'PUT', body: JSON.stringify(vitals) }
  );
  return res.data;
};

/** Update clinical info (notes, lab results, misc fields). */
export const updatePatientClinicalInfo = async (
  patientId: number,
  data: Partial<AdmittedPatient>,
): Promise<AdmittedPatient> => {
  const res = await api<{ success: boolean; data: AdmittedPatient }>(
    `/admissions/${patientId}/clinical`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
  return res.data;
};

// ── Schedule services ────────────────────────────────────────────────────────

/** Get today's schedule. */
export const getSchedule = async (): Promise<ScheduleSlot[]> => {
  const res = await api<{ success: boolean; data: ScheduleSlot[] }>('/doctor/schedule');
  return res.data;
};

/** Update a schedule slot status. */
export const updateScheduleStatus = async (
  slotId: number,
  status: ScheduleSlot['status'],
): Promise<ScheduleSlot> => {
  const res = await api<{ success: boolean; data: ScheduleSlot }>(
    `/doctor/schedule/${slotId}`,
    { method: 'PUT', body: JSON.stringify({ status }) }
  );
  return res.data;
};

// ── Clinical notes services ──────────────────────────────────────────────────

/** Get all clinical notes written by this doctor. */
export const getClinicalNotes = async (): Promise<ClinicalNote[]> => {
  const res = await api<{ success: boolean; data: ClinicalNote[] }>('/doctor/notes');
  return res.data;
};

/** Add a new clinical note. */
export const addClinicalNote = async (
  note: Omit<ClinicalNote, 'id' | 'created_at'>,
): Promise<ClinicalNote> => {
  const res = await api<{ success: boolean; data: ClinicalNote }>(
    '/doctor/notes',
    { method: 'POST', body: JSON.stringify(note) }
  );
  return res.data;
};

// ── Doctor profile services ──────────────────────────────────────────────────

/** Get the logged-in doctor's profile. */
export const getDoctorProfile = async (): Promise<DoctorInfo> => {
  const res = await api<{ success: boolean; data: DoctorInfo }>('/doctor/profile');
  return res.data;
};

/** Update the doctor's profile. */
export const updateDoctorProfile = async (
  data: Partial<DoctorInfo>,
): Promise<DoctorInfo> => {
  const res = await api<{ success: boolean; data: DoctorInfo }>(
    '/doctor/profile',
    { method: 'PUT', body: JSON.stringify(data) }
  );
  return res.data;
};
