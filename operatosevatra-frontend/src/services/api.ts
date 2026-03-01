const API_BASE = 'http://localhost:8000/api/v1';

// ── Token Management ──

let accessToken: string | null = localStorage.getItem('operato_access_token');
let refreshToken: string | null = localStorage.getItem('operato_refresh_token');

export function getAccessToken() { return accessToken; }

export function setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    localStorage.setItem('operato_access_token', access);
    localStorage.setItem('operato_refresh_token', refresh);
}

export function clearTokens() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('operato_access_token');
    localStorage.removeItem('operato_refresh_token');
}

// ── HTTP Helper ──

async function request<T>(
    path: string,
    options: RequestInit = {},
    auth = true,
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (auth && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Auto-refresh on 401
    if (res.status === 401 && auth && refreshToken) {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
            const data = await refreshRes.json();
            setTokens(data.access_token, data.refresh_token);
            headers['Authorization'] = `Bearer ${data.access_token}`;
            const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
            if (!retry.ok) {
                const err = await retry.json().catch(() => ({ detail: 'Request failed' }));
                throw new Error(err.detail || `HTTP ${retry.status}`);
            }
            return retry.json();
        } else {
            clearTokens();
            throw new Error('Session expired, please log in again');
        }
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }

    return res.json();
}

// ── Auth API ──

export const authApi = {
    signup: (data: { email: string; password: string; full_name: string }) =>
        request<{ user_id: string; email: string; step: string; message: string }>(
            '/auth/signup', { method: 'POST', body: JSON.stringify({ ...data, platform: 'operato' }) }, false,
        ),

    signupGoogle: (data: { id_token: string; full_name?: string }) =>
        request<{ access_token: string; refresh_token: string; token_type: string; user: Record<string, string>; message: string }>(
            '/auth/signup/google', { method: 'POST', body: JSON.stringify({ ...data, platform: 'operato' }) }, false,
        ),

    verifyEmail: (data: { email: string; token: string }) =>
        request<{ access_token: string; refresh_token: string; user_id: string; email: string; step: string; message: string }>(
            '/auth/verify-email', { method: 'POST', body: JSON.stringify({ ...data, platform: 'operato' }) }, false,
        ),

    resendEmail: (email: string) =>
        request<{ success: boolean; message: string }>(
            '/auth/resend-email', { method: 'POST', body: JSON.stringify({ email, platform: 'operato' }) }, false,
        ),

    login: (data: { email: string; password: string }) =>
        request<{ access_token: string; refresh_token: string; user: Record<string, string> }>(
            '/auth/login', { method: 'POST', body: JSON.stringify({ ...data, platform: 'operato' }) }, false,
        ),

    logout: () => request('/auth/logout', { method: 'POST' }).catch(() => ({ message: 'logged out' })),
};

// ── Operator API ──

export type OperatorType = 'individual' | 'provider';
export type AmbulanceType = 'basic' | 'advanced' | 'patient_transport' | 'neonatal' | 'air';
export type AmbulanceStatus = 'available' | 'on_trip' | 'maintenance' | 'off_duty';

export interface OperatorData {
    id: string;
    user_id: string;
    operator_type: OperatorType;
    full_name: string;
    phone: string;
    facility_name: string | null;
    facility_address: string | null;
    facility_phone: string | null;
    license_number: string | null;
    is_verified: boolean;
    ambulance_count: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface AmbulanceData {
    id: string;
    operator_id: string;
    vehicle_number: string;
    ambulance_type: AmbulanceType;
    status: AmbulanceStatus;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_year: number | null;
    has_oxygen: boolean;
    has_defibrillator: boolean;
    has_stretcher: boolean;
    has_ventilator: boolean;
    has_first_aid: boolean;
    driver_name: string;
    driver_phone: string;
    driver_license_number: string;
    driver_experience_years: number | null;
    driver_photo_url: string | null;
    base_latitude: number | null;
    base_longitude: number | null;
    base_address: string | null;
    service_radius_km: number | null;
    price_per_km: number | null;
    notes: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface DashboardStats {
    total_ambulances: number;
    available_ambulances: number;
    on_trip_ambulances: number;
    maintenance_ambulances: number;
    off_duty_ambulances: number;
    total_trips_completed: number;
    operator_type: OperatorType;
    facility_name: string | null;
}

export const operatorApi = {
    register: (data: {
        operator_type: OperatorType;
        full_name: string;
        phone: string;
        facility_name?: string;
        facility_address?: string;
        facility_phone?: string;
        license_number?: string;
    }) => request<OperatorData>('/operator/register', { method: 'POST', body: JSON.stringify(data) }),

    getProfile: () => request<OperatorData>('/operator/profile'),

    updateProfile: (data: Partial<Omit<OperatorData, 'id' | 'user_id' | 'is_verified' | 'ambulance_count' | 'created_at' | 'updated_at'>>) =>
        request<OperatorData>('/operator/profile', { method: 'PUT', body: JSON.stringify(data) }),

    checkStatus: () => request<{ is_operator: boolean; operator: OperatorData | null }>('/operator/check'),

    getDashboard: () => request<DashboardStats>('/operator/dashboard'),

    createAmbulance: (data: {
        vehicle_number: string;
        ambulance_type?: AmbulanceType;
        vehicle_make?: string;
        vehicle_model?: string;
        vehicle_year?: number;
        has_oxygen?: boolean;
        has_defibrillator?: boolean;
        has_stretcher?: boolean;
        has_ventilator?: boolean;
        has_first_aid?: boolean;
        driver_name: string;
        driver_phone: string;
        driver_license_number: string;
        driver_experience_years?: number;
        driver_photo_url?: string;
        base_latitude?: number;
        base_longitude?: number;
        base_address?: string;
        service_radius_km?: number;
        price_per_km?: number;
        notes?: string;
    }) => request<AmbulanceData>('/operator/ambulances', { method: 'POST', body: JSON.stringify(data) }),

    listAmbulances: () => request<AmbulanceData[]>('/operator/ambulances'),

    getAmbulance: (id: string) => request<AmbulanceData>(`/operator/ambulances/${id}`),

    updateAmbulance: (id: string, data: Record<string, unknown>) =>
        request<AmbulanceData>(`/operator/ambulances/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    deleteAmbulance: (id: string) =>
        request<{ success: boolean; message: string }>(`/operator/ambulances/${id}`, { method: 'DELETE' }),

    updateAmbulanceStatus: (id: string, status: AmbulanceStatus) =>
        request<AmbulanceData>(`/operator/ambulances/${id}/status?new_status=${status}`, { method: 'PATCH' }),
};
