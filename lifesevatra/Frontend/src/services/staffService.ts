/**
 * Staff Service
 * Manages hospital staff, duty status, and assignments.
 */

import { INITIAL_STAFF } from '../data/sampleData';

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

// ── In-memory store ──────────────────────────────────────────────────────────

let staffList: StaffMember[] = [...INITIAL_STAFF];
let nextStaffNum = staffList.length + 1;

const delay = (ms = 200) => new Promise<void>(r => setTimeout(r, ms));

function computeStats(): StaffStats {
  return {
    total_staff: String(staffList.length),
    total_doctors: String(staffList.filter(s => ['doctor', 'surgeon', 'specialist'].includes(s.role)).length),
    total_nurses: String(staffList.filter(s => s.role === 'nurse').length),
    on_duty: String(staffList.filter(s => s.on_duty).length),
    off_duty: String(staffList.filter(s => !s.on_duty).length),
    total_assigned_patients: String(staffList.reduce((sum, s) => sum + s.current_patient_count, 0)),
  };
}

// ── Service functions ────────────────────────────────────────────────────────

export const getAllStaff = async (params?: {
  role?: string;
  specialty?: string;
  onDuty?: boolean;
  shift?: string;
}): Promise<AllStaffResponse> => {
  await delay();
  let filtered = [...staffList];
  if (params?.role) filtered = filtered.filter(s => s.role === params.role);
  if (params?.specialty) filtered = filtered.filter(s => s.specialty.toLowerCase().includes(params.specialty!.toLowerCase()));
  if (params?.onDuty !== undefined) filtered = filtered.filter(s => s.on_duty === params.onDuty);
  if (params?.shift) filtered = filtered.filter(s => s.shift === params.shift);
  return { success: true, message: 'OK', data: filtered };
};

export const getStaffById = async (staffId: string): Promise<StaffResponse> => {
  await delay();
  const s = staffList.find(x => x.staff_id === staffId);
  if (!s) throw new Error('Staff not found');
  return { success: true, message: 'OK', data: s };
};

export const createStaff = async (payload: StaffPayload): Promise<StaffResponse> => {
  await delay();
  const prefix = payload.role === 'nurse' ? 'NUR' : 'DOC';
  const now = new Date().toISOString();
  const member: StaffMember = {
    id: nextStaffNum,
    staff_id: `${prefix}-${String(nextStaffNum).padStart(3, '0')}`,
    full_name: payload.fullName,
    role: payload.role as StaffMember['role'],
    specialty: payload.specialty,
    qualification: payload.qualification ?? null,
    experience_years: payload.experienceYears ?? 0,
    contact: payload.contact ?? null,
    email: payload.email ?? null,
    on_duty: true,
    shift: (payload.shift as StaffMember['shift']) ?? 'day',
    max_patients: payload.maxPatients ?? 10,
    current_patient_count: 0,
    joined_date: new Date().toISOString().slice(0, 10),
    created_at: now,
    updated_at: now,
  };
  nextStaffNum++;
  staffList.push(member);
  return { success: true, message: 'Staff member added', data: member };
};

export const updateStaff = async (
  staffId: string,
  payload: Partial<StaffPayload & { onDuty: boolean }>
): Promise<StaffResponse> => {
  await delay();
  const idx = staffList.findIndex(s => s.staff_id === staffId);
  if (idx === -1) throw new Error('Staff not found');
  const s = { ...staffList[idx] };
  if (payload.fullName) s.full_name = payload.fullName;
  if (payload.role) s.role = payload.role as StaffMember['role'];
  if (payload.specialty) s.specialty = payload.specialty;
  if (payload.qualification !== undefined) s.qualification = payload.qualification ?? null;
  if (payload.experienceYears !== undefined) s.experience_years = payload.experienceYears ?? 0;
  if (payload.contact !== undefined) s.contact = payload.contact ?? null;
  if (payload.email !== undefined) s.email = payload.email ?? null;
  if (payload.shift) s.shift = payload.shift as StaffMember['shift'];
  if (payload.maxPatients !== undefined) s.max_patients = payload.maxPatients ?? 10;
  if (payload.onDuty !== undefined) s.on_duty = payload.onDuty;
  s.updated_at = new Date().toISOString();
  staffList[idx] = s;
  return { success: true, message: 'Staff updated', data: s };
};

export const deleteStaff = async (staffId: string): Promise<{ success: boolean; message: string }> => {
  await delay();
  staffList = staffList.filter(s => s.staff_id !== staffId);
  return { success: true, message: 'Staff removed' };
};

export const updateDutyStatus = async (
  staffId: string,
  onDuty?: boolean
): Promise<StaffResponse> => {
  await delay();
  const idx = staffList.findIndex(s => s.staff_id === staffId);
  if (idx === -1) throw new Error('Staff not found');
  const s = { ...staffList[idx] };
  s.on_duty = onDuty !== undefined ? onDuty : !s.on_duty;
  s.updated_at = new Date().toISOString();
  staffList[idx] = s;
  return { success: true, message: 'Duty status updated', data: s };
};

export const getAvailableDoctors = async (_ward?: string): Promise<AllStaffResponse> => {
  await delay();
  const doctors = staffList.filter(s => ['doctor', 'surgeon', 'specialist'].includes(s.role) && s.on_duty && s.current_patient_count < s.max_patients);
  return { success: true, message: 'OK', data: doctors };
};

export const getStaffStats = async (): Promise<StaffStatsResponse> => {
  await delay();
  return { success: true, data: computeStats() };
};

