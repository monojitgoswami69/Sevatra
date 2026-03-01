import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LoginResponse } from '../services/authService';
import { login as apiLogin, refreshToken as apiRefresh } from '../services/authService';

// ── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'doctor' | 'surgeon' | 'specialist' | 'nurse';

export interface HospitalProfile {
  id: string;
  hospital_name: string;
  email: string;
  contact: string;
  hospital_address: string;
  icu_beds: number;
  hdu_beds: number;
  general_beds: number;
  status: string;
}

export interface StaffProfile {
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
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  hospital: HospitalProfile | null;
  staff: StaffProfile | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

// ── Persistence helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'life_auth';

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { accessToken: null, refreshToken: null, role: null, hospital: null, staff: null };
}

function saveState(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(loadState);

  // Persist on change
  useEffect(() => {
    if (state.accessToken) saveState(state);
  }, [state]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    const newState: AuthState = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      role: data.role,
      hospital: data.hospital ?? null,
      staff: data.staff ?? null,
    };
    setState(newState);
    saveState(newState);
    return data;
  }, []);

  const logout = useCallback(() => {
    setState({ accessToken: null, refreshToken: null, role: null, hospital: null, staff: null });
    clearState();
  }, []);

  // Silent token refresh on mount
  useEffect(() => {
    if (state.refreshToken && !state.accessToken) {
      apiRefresh(state.refreshToken)
        .then(data => setState(prev => ({ ...prev, accessToken: data.access_token, refreshToken: data.refresh_token })))
        .catch(() => logout());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isAdmin = state.role === 'admin';
  const isDoctor = state.role === 'doctor' || state.role === 'surgeon' || state.role === 'specialist';

  return (
    <AuthContext.Provider value={{
      ...state,
      isAuthenticated: !!state.accessToken,
      isAdmin,
      isDoctor,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/**
 * Returns the Bearer authorization header for API calls.
 */
export function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw) as AuthState;
      if (state.accessToken) {
        return { Authorization: `Bearer ${state.accessToken}` };
      }
    }
  } catch { /* ignore */ }
  return {};
}
