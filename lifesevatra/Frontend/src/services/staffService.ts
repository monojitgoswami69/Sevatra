/**
 * Staff Service
 * Manages hospital staff, duty status, and assignments.
 * Calls the FastAPI backend at /api/staff/*.
 */

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface StaffMember {
  id: number;
  staff_id: string;
  full_name: string;
  role: 'doctor' | 'surgeon' | 'specialist' | 'nurse';
  specialty: string;
  qualification: string | null;
  experience_years: number;
  contact: string | null;
  email: string | null;
  on_duty: boolean;
  shift: 'day' | 'night' | 'rotating';
  max_patients: number;
  current_patient_count: number;
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export interface StaffPayload {
  fullName: string;
  role: string;
  specialty: string;
  qualification?: string;
  experienceYears?: number;
  contact?: string;
  email?: string;
  shift?: string;
  maxPatients?: number;
}

export interface StaffResponse {
  success: boolean;
  message: string;
  data: StaffMember;
}

export interface AllStaffResponse {
  success: boolean;
  message: string;
  data: StaffMember[];
}

export interface StaffStats {
  total_staff: string;
  total_doctors: string;
  total_nurses: string;
  on_duty: string;
  off_duty: string;
  total_assigned_patients: string;
}

export interface StaffStatsResponse {
  success: boolean;
  message?: string;
  data: StaffStats;
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

export const getAllStaff = async (params?: {
  role?: string;
  specialty?: string;
  onDuty?: boolean;
  shift?: string;
}): Promise<AllStaffResponse> =>
  api<AllStaffResponse>(`/staff/${qs({
    role: params?.role,
    specialty: params?.specialty,
    onDuty: params?.onDuty,
    shift: params?.shift,
  })}`);

export const getStaffById = async (staffId: string): Promise<StaffResponse> =>
  api<StaffResponse>(`/staff/${staffId}`);

export const createStaff = async (payload: StaffPayload): Promise<StaffResponse> =>
  api<StaffResponse>('/staff/', { method: 'POST', body: JSON.stringify(payload) });

export const updateStaff = async (
  staffId: string,
  payload: Partial<StaffPayload & { onDuty: boolean }>
): Promise<StaffResponse> =>
  api<StaffResponse>(`/staff/${staffId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteStaff = async (staffId: string): Promise<{ success: boolean; message: string }> =>
  api(`/staff/${staffId}`, { method: 'DELETE' });

export const updateDutyStatus = async (
  staffId: string,
  onDuty?: boolean
): Promise<StaffResponse> =>
  api<StaffResponse>(`/staff/${staffId}/duty${qs({ onDuty })}`, { method: 'PATCH' });

export const getAvailableDoctors = async (_ward?: string): Promise<AllStaffResponse> =>
  api<AllStaffResponse>('/staff/available-doctors');

export const getStaffStats = async (): Promise<StaffStatsResponse> =>
  api<StaffStatsResponse>('/staff/stats');

