const API_BASE = `${import.meta.env.VITE_API_URL ?? 'https://api-sevatra.vercel.app'}/api/v1`;

// ── Token Management ──

let accessToken: string | null = localStorage.getItem('sevatra_access_token');
let refreshToken: string | null = localStorage.getItem('sevatra_refresh_token');

export function getAccessToken() { return accessToken; }

export function setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    localStorage.setItem('sevatra_access_token', access);
    localStorage.setItem('sevatra_refresh_token', refresh);
}

export function clearTokens() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('sevatra_access_token');
    localStorage.removeItem('sevatra_refresh_token');
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

    // Try token refresh on 401
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
    // Step 1: Create account (no tokens returned — email verification required)
    signup: (data: { email: string; password: string; full_name: string }) =>
        request<{ user_id: string; email: string; step: string; message: string }>(
            '/auth/signup', { method: 'POST', body: JSON.stringify({ ...data, platform: 'ambi' }) }, false,
        ),

    // Google Sign-In (immediate login, no email verification required)
    signupGoogle: (data: { id_token: string; full_name?: string }) =>
        request<{ access_token: string; refresh_token: string; token_type: string; user: Record<string, string>; message: string }>(
            '/auth/signup/google', { method: 'POST', body: JSON.stringify({ ...data, platform: 'ambi' }) }, false,
        ),

    // Step 2: Verify email OTP (returns tokens for the first time)
    verifyEmail: (data: { email: string; token: string }) =>
        request<{ access_token: string; refresh_token: string; user_id: string; email: string; step: string; message: string }>(
            '/auth/verify-email', { method: 'POST', body: JSON.stringify({ ...data, platform: 'ambi' }) }, false,
        ),

    // Resend email verification code
    resendEmail: (email: string) =>
        request<{ success: boolean; message: string }>(
            '/auth/resend-email', { method: 'POST', body: JSON.stringify({ email, platform: 'ambi' }) }, false,
        ),

    // Login (existing users)
    login: (data: { email: string; password: string }) =>
        request<{ access_token: string; refresh_token: string; user: Record<string, string> }>(
            '/auth/login', { method: 'POST', body: JSON.stringify({ ...data, platform: 'ambi' }) }, false,
        ),

    logout: () => request('/auth/logout', { method: 'POST' }).catch(() => ({ message: 'logged out' })),

    // General-purpose OTP (phone verification, etc.)
    sendOtp: (phone: string, purpose = 'phone_verification') =>
        request<{ success: boolean; message: string }>(
            '/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone, purpose }) }, false,
        ),

    verifyOtp: (phone: string, code: string, purpose = 'phone_verification') =>
        request<{ success: boolean; message: string }>(
            '/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code, purpose }) }, false,
        ),
};


// ── Users API ──

export interface ProfileData {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    age: number | null;
    gender: string | null;
    blood_group: string | null;
}

export interface AddressData {
    id: string;
    user_id: string;
    label: string;
    address: string;
    icon: string;
}

export interface EmergencyContactData {
    id: string;
    user_id: string;
    name: string;
    phone: string;
}

export interface MedicalConditionData {
    id: string;
    user_id: string;
    condition: string;
}

export const usersApi = {
    getProfile: () => request<ProfileData>('/users/me'),
    updateProfile: (data: Partial<ProfileData>) =>
        request<ProfileData>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),

    listAddresses: () => request<AddressData[]>('/users/me/addresses'),
    createAddress: (data: { label: string; address: string; icon: string }) =>
        request<AddressData>('/users/me/addresses', { method: 'POST', body: JSON.stringify(data) }),
    deleteAddress: (id: string) => request('/users/me/addresses/' + id, { method: 'DELETE' }),

    listEmergencyContacts: () => request<EmergencyContactData[]>('/users/me/emergency-contacts'),
    createEmergencyContact: (data: { name: string; phone: string }) =>
        request<EmergencyContactData>('/users/me/emergency-contacts', { method: 'POST', body: JSON.stringify(data) }),
    deleteEmergencyContact: (id: string) => request('/users/me/emergency-contacts/' + id, { method: 'DELETE' }),

    listMedicalConditions: () => request<MedicalConditionData[]>('/users/me/medical-conditions'),
    createMedicalCondition: (data: { condition: string }) =>
        request<MedicalConditionData>('/users/me/medical-conditions', { method: 'POST', body: JSON.stringify(data) }),
    deleteMedicalCondition: (id: string) => request('/users/me/medical-conditions/' + id, { method: 'DELETE' }),
};

// ── Assigned Ambulance ──

export interface AssignedAmbulance {
    ambulance_id: string;
    vehicle_number: string;
    ambulance_type: string;
    driver_name: string;
    driver_phone: string;
    driver_photo_url: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_year: number | null;
    has_oxygen: boolean;
    has_defibrillator: boolean;
    has_stretcher: boolean;
    has_ventilator: boolean;
    base_latitude: number | null;
    base_longitude: number | null;
    base_address: string | null;
    distance_km: number | null;
    operator_id: string | null;
}

// ── Bookings API ──

export interface BookingData {
    id: string;
    user_id: string;
    patient_name: string;
    patient_phone: string;
    patient_age: number | null;
    patient_gender: string | null;
    pickup_address: string;
    destination: string;
    scheduled_date: string;
    scheduled_time: string;
    reason: string | null;
    special_needs: Record<string, boolean> | null;
    additional_notes: string | null;
    status: string;
    assigned_ambulance: AssignedAmbulance | null;
    booking_type: string | null;
    sos_id: string | null;
    created_at: string | null;
}

export const bookingsApi = {
    create: (data: {
        patient_name: string;
        patient_phone: string;
        patient_age?: number;
        patient_gender?: string;
        pickup_address: string;
        destination: string;
        scheduled_date: string;
        scheduled_time: string;
        reason?: string;
        special_needs?: Record<string, boolean>;
        additional_notes?: string;
        latitude?: number;
        longitude?: number;
    }) => request<BookingData>('/bookings/', { method: 'POST', body: JSON.stringify(data) }),

    list: (limit = 20, offset = 0) =>
        request<BookingData[]>(`/bookings/?limit=${limit}&offset=${offset}`),

    get: (id: string) => request<BookingData>('/bookings/' + id),

    cancel: (id: string) => request<BookingData>('/bookings/' + id, { method: 'DELETE' }),
};

// ── SOS API ──

export interface SosData {
    id: string;
    user_id: string | null;
    status: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    verified_phone: string | null;
    assigned_ambulance: AssignedAmbulance | null;
    created_at: string | null;
}

export const sosApi = {
    activate: (data: { latitude?: number; longitude?: number; address?: string }) =>
        request<SosData>('/sos/activate', { method: 'POST', body: JSON.stringify(data) }),

    sendOtp: (sosId: string, phone: string) =>
        request<{ success: boolean; message: string }>(
            `/sos/${sosId}/send-otp`, { method: 'POST', body: JSON.stringify({ phone }) }, false,
        ),

    verify: (sosId: string, phone: string, otpCode: string) =>
        request<{ id: string; status: string; message: string }>(
            `/sos/${sosId}/verify`, { method: 'POST', body: JSON.stringify({ phone, otp_code: otpCode }) }, false,
        ),

    getStatus: (sosId: string) => request<SosData>(`/sos/${sosId}/status`, {}, false),

    cancel: (sosId: string, reason?: string) =>
        request<SosData>(`/sos/${sosId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }, false),
};

// ── Tracking API ──

const WS_BASE = API_BASE.replace(/^http/, 'ws');

export interface TrackingData {
    booking_id: string;
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    eta_minutes: number;
    status: 'dispatched' | 'en_route' | 'nearby' | 'arrived';
    driver_name: string;
    driver_phone: string;
    vehicle_number: string;
    vehicle_type: string;
    updated_at: number;
}

export const trackingApi = {
    /** Get latest location via REST (fallback) */
    getLocation: (bookingId: string) =>
        request<TrackingData>(`/tracking/${bookingId}/location`, {}, false),

    /** Start simulation for demo/dev */
    simulate: (bookingId: string) =>
        request<{ ok: boolean; message: string }>(`/tracking/${bookingId}/simulate`, { method: 'POST' }, false),

    /** Connect WebSocket for real-time updates */
    connectWs: (bookingId: string, onMessage: (data: TrackingData) => void, onError?: (err: Event) => void): WebSocket => {
        const ws = new WebSocket(`${WS_BASE}/tracking/${bookingId}/ws`);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as TrackingData;
                onMessage(data);
            } catch { /* ignore non-JSON */ }
        };
        ws.onerror = (err) => onError?.(err);
        return ws;
    },
};
