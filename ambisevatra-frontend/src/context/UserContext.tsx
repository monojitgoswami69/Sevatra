import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    authApi, usersApi,
    setTokens, clearTokens, getAccessToken,
    type ProfileData, type AddressData, type EmergencyContactData, type MedicalConditionData,
} from '../services/api';

export interface SavedAddress {
    id?: string;
    label: string;
    address: string;
    icon: string;
}

export interface UserProfile {
    fullName: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    bloodGroup: string;
    addresses: SavedAddress[];
    emergencyContacts: { id?: string; name: string; phone: string }[];
    medicalConditions: string[];
    medicalConditionIds: string[];
}

interface UserContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    profile: UserProfile;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    syncProfile: () => Promise<void>;
    completeRegistration: () => void;
}

const defaultProfile: UserProfile = {
    fullName: '', email: '', phone: '', age: '', gender: '', bloodGroup: '',
    addresses: [], emergencyContacts: [], medicalConditions: [], medicalConditionIds: [],
};

const UserContext = createContext<UserContextType>({
    isLoggedIn: false, isLoading: false, profile: defaultProfile,
    login: async () => ({ success: false }),
    logout: () => { },
    updateProfile: () => { },
    syncProfile: async () => { },
    completeRegistration: () => { },
});

export const useUser = () => useContext(UserContext);

// ── Helpers ──

function profileFromApi(
    p: ProfileData,
    addresses: AddressData[],
    contacts: EmergencyContactData[],
    conditions: MedicalConditionData[],
): UserProfile {
    return {
        fullName: p.full_name || '',
        email: p.email || '',
        phone: p.phone || '',
        age: p.age != null ? String(p.age) : '',
        gender: p.gender || '',
        bloodGroup: p.blood_group || '',
        addresses: addresses.map(a => ({ id: a.id, label: a.label, address: a.address, icon: a.icon })),
        emergencyContacts: contacts.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
        medicalConditions: conditions.map(c => c.condition),
        medicalConditionIds: conditions.map(c => c.id),
    };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!getAccessToken());
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('sevatra_profile');
        return saved ? JSON.parse(saved) : defaultProfile;
    });

    // Persist profile locally for instant access on reload
    useEffect(() => {
        localStorage.setItem('sevatra_profile', JSON.stringify(profile));
    }, [profile]);

    // Sync profile from backend
    const syncProfile = useCallback(async () => {
        if (!getAccessToken()) return;
        try {
            const [p, addresses, contacts, conditions] = await Promise.all([
                usersApi.getProfile(),
                usersApi.listAddresses(),
                usersApi.listEmergencyContacts(),
                usersApi.listMedicalConditions(),
            ]);
            setProfile(profileFromApi(p, addresses, contacts, conditions));
        } catch (err) {
            console.error('Failed to sync profile:', err);
        }
    }, []);

    // Sync on initial load if logged in
    useEffect(() => {
        if (isLoggedIn) { syncProfile(); }
    }, [isLoggedIn, syncProfile]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await authApi.login({ email, password });
            setTokens(res.access_token, res.refresh_token);
            if (res.user) {
                setProfile(prev => ({
                    ...prev,
                    fullName: res.user.full_name || prev.fullName,
                    email: res.user.email || prev.email,
                    phone: res.user.phone || prev.phone,
                }));
            }
            setIsLoggedIn(true);
            return { success: true };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            return { success: false, error: msg };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authApi.logout().catch(() => { });
        clearTokens();
        setIsLoggedIn(false);
        setProfile(defaultProfile);
        localStorage.removeItem('sevatra_profile');
    };

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const completeRegistration = () => {
        setIsLoggedIn(true);
    };

    return (
        <UserContext.Provider value={{ isLoggedIn, isLoading, profile, login, logout, updateProfile, syncProfile, completeRegistration }}>
            {children}
        </UserContext.Provider>
    );
};

export { UserContext };
