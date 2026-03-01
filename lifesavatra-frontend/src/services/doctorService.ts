/**
 * Doctor Service
 * Doctor-portal specific API calls: my patients, schedule, clinical notes, profile.
 * Calls the FastAPI backend at /api/doctor/*.
 */

import { getAuthHeaders } from '../context/AuthContext';
import type { AdmittedPatient } from './admissionService';
export type { AdmittedPatient } from './admissionService';

const API = import.meta.env.VITE_API_URL ?? 'https://api-sevatra.vercel.app/api/v1';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface ScheduleSlot {
  id: string;
  time: string;
  patient_name: string;
  patient_id?: string;
  type: string;
  status: 'scheduled' | 'completed' | 'in-progress' | 'cancelled' | 'no-show';
  notes: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name?: string;
  note: string;
  created_at: string;
  type: 'observation' | 'prescription' | 'discharge-summary' | 'progress';
}

export interface DoctorProfile {
  id: string;
  staff_id: string;
  full_name: string;
  email?: string;
  role: string;
  specialty: string;
  qualification?: string | null;
  experience_years: number;
  contact?: string;
  on_duty: boolean;
  shift: string;
  max_patients: number;
  current_patient_count: number;
  hospital_id: string;
  joined_date: string;
  bio?: string;
  languages?: string[];
  consultation_fee?: number;
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

// ── Patients ─────────────────────────────────────────────────────────────────

export const getDoctorPatients = async (): Promise<AdmittedPatient[]> => {
  const res = await api<{ patients: AdmittedPatient[]; total: number }>('/life/doctor/patients');
  return res.patients;
};

export const getPatientById = async (patientId: string): Promise<AdmittedPatient> =>
  api<AdmittedPatient>(`/life/doctor/patients/${patientId}`);

export const updatePatientVitals = async (
  patientId: string,
  vitals: { heartRate?: number; spo2?: number; respRate?: number; temperature?: number; bpSystolic?: number; bpDiastolic?: number },
): Promise<AdmittedPatient> => api<AdmittedPatient>(`/life/admissions/${patientId}/vitals`, { method: 'PUT', body: JSON.stringify(vitals) });

export const updatePatientClinicalInfo = async (
  patientId: string,
  info: { clinicalNotes?: string; labResults?: string },
): Promise<AdmittedPatient> => api<AdmittedPatient>(`/life/admissions/${patientId}/clinical`, { method: 'PUT', body: JSON.stringify(info) });

// ── Schedule ─────────────────────────────────────────────────────────────────

export const getSchedule = async (): Promise<ScheduleSlot[]> => {
  const res = await api<{ schedule: ScheduleSlot[] }>('/life/doctor/schedule');
  return res.schedule;
};

export const createScheduleSlot = async (data: {
  time: string;
  patient_name?: string;
  patient_id?: string;
  type: string;
  notes?: string;
  status?: string;
}): Promise<ScheduleSlot> =>
  api<ScheduleSlot>('/life/doctor/schedule', { method: 'POST', body: JSON.stringify(data) });

export const updateScheduleStatus = async (slotId: string, status: string): Promise<ScheduleSlot> =>
  api<ScheduleSlot>(`/life/doctor/schedule/${slotId}`, { method: 'PUT', body: JSON.stringify({ status }) });

// ── Clinical Notes ───────────────────────────────────────────────────────────

export const getClinicalNotes = async (patientId?: string, type?: string): Promise<ClinicalNote[]> => {
  const params = new URLSearchParams();
  if (patientId) params.set('patient_id', patientId);
  if (type) params.set('type', type);
  const qs = params.toString() ? `?${params}` : '';
  const res = await api<{ notes: ClinicalNote[]; total: number }>(`/life/doctor/notes${qs}`);
  return res.notes;
};

export const addClinicalNote = async (note: {
  patient_id: string;
  patient_name: string;
  note: string;
  type: string;
}): Promise<ClinicalNote> =>
  api<ClinicalNote>('/life/doctor/notes', { method: 'POST', body: JSON.stringify(note) });

// ── Profile ──────────────────────────────────────────────────────────────────

export const getDoctorProfile = async (): Promise<DoctorProfile> =>
  api<DoctorProfile>('/life/doctor/profile');

export const updateDoctorProfile = async (updates: Partial<DoctorProfile>): Promise<DoctorProfile> =>
  api<DoctorProfile>('/life/doctor/profile', { method: 'PUT', body: JSON.stringify(updates) });
