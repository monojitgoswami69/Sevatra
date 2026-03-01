import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    authApi, operatorApi,
    setTokens, clearTokens, getAccessToken,
    type OperatorData,
} from '../services/api';

export interface OperatorProfile {
    fullName: string;
    email: string;
    operatorId: string | null;
    operatorType: 'individual' | 'provider' | null;
    phone: string;
    facilityName: string | null;
    facilityAddress: string | null;
    facilityPhone: string | null;
    licenseNumber: string | null;
    isVerified: boolean;
    ambulanceCount: number;
}

interface OperatorContextType {
    isLoggedIn: boolean;
    isOperator: boolean;
    isLoading: boolean;
    profile: OperatorProfile;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (updates: Partial<OperatorProfile>) => void;
    syncProfile: () => Promise<void>;
    completeRegistration: () => void;
    setIsOperator: (val: boolean) => void;
}

const defaultProfile: OperatorProfile = {
    fullName: '', email: '', operatorId: null, operatorType: null,
    phone: '', facilityName: null, facilityAddress: null,
    facilityPhone: null, licenseNumber: null,
    isVerified: false, ambulanceCount: 0,
};

const OperatorContext = createContext<OperatorContextType>({
    isLoggedIn: false, isOperator: false, isLoading: false,
    profile: defaultProfile,
    login: async () => ({ success: false }),
    logout: () => { },
    updateProfile: () => { },
    syncProfile: async () => { },
    completeRegistration: () => { },
    setIsOperator: () => { },
});

export const useOperator = () => useContext(OperatorContext);

function profileFromOperatorData(op: OperatorData, email: string): OperatorProfile {
    return {
        fullName: op.full_name || '',
        email,
        operatorId: op.id,
        operatorType: op.operator_type,
        phone: op.phone || '',
        facilityName: op.facility_name,
        facilityAddress: op.facility_address,
        facilityPhone: op.facility_phone,
        licenseNumber: op.license_number,
        isVerified: op.is_verified,
        ambulanceCount: op.ambulance_count,
    };
}

export const OperatorProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!getAccessToken());
    const [isOperator, setIsOperator] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<OperatorProfile>(() => {
        const saved = localStorage.getItem('operato_profile');
        return saved ? JSON.parse(saved) : defaultProfile;
    });

    useEffect(() => {
        localStorage.setItem('operato_profile', JSON.stringify(profile));
    }, [profile]);

    const syncProfile = useCallback(async () => {
        if (!getAccessToken()) return;
        try {
            const opCheck = await operatorApi.checkStatus();
            if (opCheck.is_operator && opCheck.operator) {
                setIsOperator(true);
                setProfile(prev => profileFromOperatorData(opCheck.operator!, prev.email));
            }
        } catch (err) {
            console.error('Failed to sync operator profile:', err);
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) { syncProfile(); }
    }, [isLoggedIn, syncProfile]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await authApi.login({ email, password });
            setTokens(res.access_token, res.refresh_token);
            setProfile(prev => ({
                ...prev,
                fullName: res.user.full_name || prev.fullName,
                email: res.user.email || prev.email,
            }));
            setIsLoggedIn(true);

            // Check operator status
            try {
                const opCheck = await operatorApi.checkStatus();
                if (opCheck.is_operator && opCheck.operator) {
                    setIsOperator(true);
                    setProfile(prev => profileFromOperatorData(opCheck.operator!, prev.email));
                }
            } catch { /* not an operator yet */ }

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
        setIsOperator(false);
        setProfile(defaultProfile);
        localStorage.removeItem('operato_profile');
    };

    const updateProfile = (updates: Partial<OperatorProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const completeRegistration = () => {
        setIsLoggedIn(true);
    };

    return (
        <OperatorContext.Provider value={{
            isLoggedIn, isOperator, isLoading, profile,
            login, logout, updateProfile, syncProfile,
            completeRegistration, setIsOperator,
        }}>
            {children}
        </OperatorContext.Provider>
    );
};

export { OperatorContext };
