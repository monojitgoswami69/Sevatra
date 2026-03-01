/**
 * Auth Service
 * Handles login / logout / token refresh / register / verify against the LifeSevatra backend.
 */

const API = import.meta.env.VITE_API_URL ?? 'https://api-sevatra.vercel.app/api/v1';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface RegisterPayload {
  hospital_name: string;
  email: string;
  password: string;
  contact: string;
  hospital_address?: string;
  icu_beds?: number;
  hdu_beds?: number;
  general_beds?: number;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  step: string;
  message: string;
}

export interface VerifyEmailResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  step: string;
  message: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: 'admin' | 'doctor' | 'surgeon' | 'specialist' | 'nurse';
  hospital?: {
    id: string;
    hospital_name: string;
    email: string;
    contact: string;
    hospital_address: string;
    icu_beds: number;
    hdu_beds: number;
    general_beds: number;
    status: string;
  };
  staff?: {
    id: string;
    staff_id: string;
    full_name: string;
    email: string;
    role: string;
    specialty: string;
    qualification: string | null;
    experience_years: number;
    contact: string;
    on_duty: boolean;
    shift: string;
    max_patients: number;
    current_patient_count: number;
    hospital_id: string;
    joined_date: string;
  };
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${API}/life/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Login failed (${res.status})`);
  }
  return res.json();
};

export const refreshToken = async (refresh_token: string): Promise<RefreshResponse> => {
  const res = await fetch(`${API}/life/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
};

// ── Registration & Verification ──────────────────────────────────────────

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const res = await fetch(`${API}/life/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Registration failed (${res.status})`);
  }
  return res.json();
};

export const verifyEmail = async (email: string, token: string): Promise<VerifyEmailResponse> => {
  const res = await fetch(`${API}/life/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Verification failed (${res.status})`);
  }
  return res.json();
};

export const resendOtp = async (email: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API}/life/auth/resend-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Resend failed (${res.status})`);
  }
  return res.json();
};
