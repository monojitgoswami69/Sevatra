import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperator } from '../context/OperatorContext';
import { authApi, setTokens, operatorApi, type OperatorType, type AmbulanceType } from '../services/api';

type AuthAction = 'login' | 'signup';
type Step = 'form' | 'verify-email' | 'operator-register' | 'complete';

const commonEquipment = [
    { key: 'has_oxygen', label: 'Oxygen Tank' },
    { key: 'has_defibrillator', label: 'Defibrillator (AED)' },
    { key: 'has_stretcher', label: 'Stretcher' },
    { key: 'has_ventilator', label: 'Ventilator' },
    { key: 'has_first_aid', label: 'First Aid Kit' },
];

const Login = () => {
    const [authAction, setAuthAction] = useState<AuthAction>('login');
    const [step, setStep] = useState<Step>('form');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '',
    });

    const [operatorData, setOperatorData] = useState({
        operatorType: 'individual' as OperatorType,
        phone: '',
        facilityName: '',
        facilityAddress: '',
        facilityPhone: '',
        licenseNumber: '',
    });

    // Ambulance data for individual operators
    const [ambulanceData, setAmbulanceData] = useState({
        vehicle_number: '',
        ambulance_type: 'basic' as AmbulanceType,
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: new Date().getFullYear(),
        has_oxygen: false,
        has_defibrillator: false,
        has_stretcher: true,
        has_ventilator: false,
        has_first_aid: true,
        driver_name: '',
        driver_phone: '',
        driver_license_number: '',
        driver_experience_years: '' as string | number,
        base_address: '',
        service_radius_km: '',
        price_per_km: '',
    });

    const [emailCode, setEmailCode] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const navigate = useNavigate();
    const { isLoggedIn, isOperator, login: contextLogin, updateProfile, completeRegistration, setIsOperator } = useOperator();

    if (isLoggedIn && isOperator && step === 'form') {
        navigate('/dashboard');
        return null;
    }

    useEffect(() => {
        if (resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendTimer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleOperatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOperatorData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleAmbulanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setAmbulanceData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const toggleEquipment = (key: string) => {
        setAmbulanceData(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    };

    // ── Login / Signup submit ──
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (authAction === 'login') {
            const res = await contextLogin(formData.email, formData.password);
            setIsLoading(false);
            if (res.success) {
                try {
                    const opCheck = await operatorApi.checkStatus();
                    if (opCheck.is_operator) {
                        navigate('/dashboard');
                    } else {
                        setStep('operator-register');
                    }
                } catch {
                    setStep('operator-register');
                }
            } else {
                setError(res.error || 'Invalid email or password');
            }
            return;
        }

        // Signup
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            await authApi.signup({
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName,
            });
            setStep('verify-email');
            setResendTimer(60);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Verify email ──
    const handleVerifyEmail = async () => {
        if (emailCode.length !== 6) return;
        setError('');
        setIsLoading(true);
        try {
            const res = await authApi.verifyEmail({ email: formData.email, token: emailCode });
            setTokens(res.access_token, res.refresh_token);
            updateProfile({ fullName: formData.fullName, email: formData.email });
            completeRegistration();
            setStep('operator-register');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (resendTimer > 0) return;
        try {
            await authApi.resendEmail(formData.email);
            setResendTimer(60);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend code');
        }
    };

    // ── Operator registration ──
    const handleOperatorRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // 1. Register operator
            await operatorApi.register({
                operator_type: operatorData.operatorType,
                full_name: formData.fullName || 'Operator',
                phone: operatorData.phone,
                facility_name: operatorData.operatorType === 'provider' ? operatorData.facilityName : undefined,
                facility_address: operatorData.operatorType === 'provider' ? operatorData.facilityAddress : undefined,
                facility_phone: operatorData.operatorType === 'provider' ? operatorData.facilityPhone : undefined,
                license_number: operatorData.licenseNumber || undefined,
            });
            setIsOperator(true);

            // 2. If individual, also create the single ambulance
            if (operatorData.operatorType === 'individual') {
                try {
                    await operatorApi.createAmbulance({
                        vehicle_number: ambulanceData.vehicle_number,
                        ambulance_type: ambulanceData.ambulance_type,
                        vehicle_make: ambulanceData.vehicle_make || undefined,
                        vehicle_model: ambulanceData.vehicle_model || undefined,
                        vehicle_year: ambulanceData.vehicle_year,
                        has_oxygen: ambulanceData.has_oxygen,
                        has_defibrillator: ambulanceData.has_defibrillator,
                        has_stretcher: ambulanceData.has_stretcher,
                        has_ventilator: ambulanceData.has_ventilator,
                        has_first_aid: ambulanceData.has_first_aid,
                        driver_name: ambulanceData.driver_name,
                        driver_phone: ambulanceData.driver_phone,
                        driver_license_number: ambulanceData.driver_license_number,
                        driver_experience_years: ambulanceData.driver_experience_years ? Number(ambulanceData.driver_experience_years) : undefined,
                        base_address: ambulanceData.base_address || undefined,
                        service_radius_km: ambulanceData.service_radius_km ? parseFloat(String(ambulanceData.service_radius_km)) : undefined,
                        price_per_km: ambulanceData.price_per_km ? parseFloat(String(ambulanceData.price_per_km)) : undefined,
                    });
                } catch (ambErr) {
                    console.error('Failed to create ambulance during registration:', ambErr);
                    // Don't block registration if ambulance creation fails
                }
            }

            setStep('complete');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Google Sign-In ──
    const handleGoogleSignIn = async (credentialResponse: { credential?: string }) => {
        setError('');
        setIsLoading(true);
        try {
            if (!credentialResponse?.credential) throw new Error('Failed to get Google credentials');
            const idToken = credentialResponse.credential;
            const fullName = authAction === 'signup' && formData.fullName ? formData.fullName : undefined;
            const res = await authApi.signupGoogle({ id_token: idToken, full_name: fullName });
            setTokens(res.access_token, res.refresh_token);
            updateProfile({ fullName: res.user.full_name || fullName, email: res.user.email });
            completeRegistration();
            try {
                const opCheck = await operatorApi.checkStatus();
                if (opCheck.is_operator) { navigate('/dashboard'); }
                else { setStep('operator-register'); }
            } catch { setStep('operator-register'); }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google Sign-In failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (step === 'form') {
            const init = () => {
                const g = (window as unknown as Record<string, unknown>).google as Record<string, Record<string, { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void }>> | undefined;
                if (g?.accounts?.id) {
                    try {
                        g.accounts.id.initialize({
                            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
                            callback: handleGoogleSignIn,
                        });
                        const el = document.getElementById('google-signin-button');
                        if (el) {
                            g.accounts.id.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', width: 400 });
                        }
                    } catch (err) { console.error('GSI init failed:', err); }
                }
            };
            setTimeout(init, 200);
        }
    }, [step, authAction]);

    const inputBase = "w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-amber-500 dark:focus:border-amber-500 py-3 text-base text-text-dark dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors duration-300 font-medium pl-10";
    const labelBase = "text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-1 block";
    const inputClean = "w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-amber-500 dark:focus:border-amber-500 py-3 text-base text-text-dark dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors duration-300 font-medium";

    const steps = [
        { key: 'form', label: 'Account', icon: 'person_add' },
        { key: 'verify-email', label: 'Email', icon: 'mark_email_read' },
        { key: 'operator-register', label: 'Operator', icon: 'local_shipping' },
    ];
    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="flex-1 w-full min-h-screen bg-white dark:bg-background-dark flex items-center justify-center px-6">
            <div className="w-full max-w-md pt-16 pb-16">

                {/* Step Indicator (not on form/complete) */}
                {step !== 'form' && step !== 'complete' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <div className="flex items-center justify-between max-w-sm mx-auto">
                            {steps.map((s, i) => (
                                <div key={s.key} className="flex items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                                        i < currentStepIndex ? 'bg-success-green text-white'
                                            : i === currentStepIndex ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                    }`}>
                                        {i < currentStepIndex
                                            ? <span className="material-symbols-outlined text-lg">check</span>
                                            : <span className="material-symbols-outlined text-lg">{s.icon}</span>}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`w-10 sm:w-14 h-0.5 mx-1 transition-colors duration-300 ${i < currentStepIndex ? 'bg-success-green' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emergency-red/10 border border-emergency-red/20 text-emergency-red text-sm font-bold">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">

                    {/* ═══ FORM STEP ═══ */}
                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-xl">local_shipping</span>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                                        Operator Portal
                                    </span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-black text-text-dark dark:text-white tracking-tight leading-[1.1]">
                                    {authAction === 'login' ? 'Welcome ' : 'Join '}
                                    <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                        {authAction === 'login' ? 'Back' : 'OperatoSevatra'}
                                    </span>
                                </h1>
                                <p className="text-text-gray dark:text-gray-400 text-base font-medium mt-3">
                                    {authAction === 'login'
                                        ? 'Sign in to manage your ambulance fleet.'
                                        : 'Create an account to start managing ambulances.'}
                                </p>
                            </div>

                            {/* Sign In / Sign Up toggle */}
                            <div className="mb-10">
                                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                    {(['login', 'signup'] as const).map(m => (
                                        <button key={m} onClick={() => { setAuthAction(m); setError(''); }}
                                            className={`flex-1 py-3 rounded-lg text-sm font-black tracking-wider transition-all duration-200 ${
                                                authAction === m ? 'bg-white dark:bg-gray-700 text-text-dark dark:text-white shadow-sm' : 'text-text-gray dark:text-gray-400'
                                            }`}>
                                            {m === 'login' ? 'Sign In' : 'Sign Up'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleFormSubmit}>
                                <div className="space-y-6">
                                    <AnimatePresence>
                                        {authAction === 'signup' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <div className="pb-6">
                                                    <label className={labelBase}>Full Name *</label>
                                                    <div className="relative">
                                                        <input name="fullName" value={formData.fullName} onChange={handleChange} required className={inputBase} placeholder="Jane Doe" />
                                                        <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">person</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div>
                                        <label className={labelBase}>Email *</label>
                                        <div className="relative">
                                            <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputBase} placeholder="operator@example.com" />
                                            <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">mail</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelBase}>Password *</label>
                                        <div className="relative">
                                            <input name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} className={inputBase} placeholder="••••••••" />
                                            <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">lock</span>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {authAction === 'signup' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <div className="pb-2">
                                                    <label className={labelBase}>Confirm Password *</label>
                                                    <div className="relative">
                                                        <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className={inputBase} placeholder="••••••••" />
                                                        <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">lock</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.button
                                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                                        disabled={isLoading} type="submit"
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-60 mt-4"
                                    >
                                        {isLoading
                                            ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                            : <><span className="material-symbols-outlined text-xl">{authAction === 'login' ? 'login' : 'person_add'}</span>{authAction === 'login' ? 'Sign In' : 'Create Account'}</>}
                                    </motion.button>
                                </div>
                            </form>

                            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
                                <p className="text-center text-sm text-text-gray dark:text-gray-500 font-medium mb-4">
                                    {authAction === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                    <button type="button" onClick={() => { setAuthAction(authAction === 'login' ? 'signup' : 'login'); setError(''); }}
                                        className="text-amber-600 dark:text-amber-400 font-black hover:underline">
                                        {authAction === 'login' ? 'Sign Up' : 'Sign In'}
                                    </button>
                                </p>
                                <div className="flex items-center gap-3 my-6">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                    <p className="text-xs font-bold text-text-gray dark:text-gray-500 uppercase tracking-wider">Or</p>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div id="google-signin-button" className="flex justify-center" />
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ VERIFY EMAIL ═══ */}
                    {step === 'verify-email' && (
                        <motion.div key="verify-email" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }} className="text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <span className="material-symbols-outlined text-white text-4xl">mark_email_read</span>
                            </motion.div>
                            <h2 className="text-3xl font-black text-text-dark dark:text-white mb-2">Verify Your Email</h2>
                            <p className="text-text-gray dark:text-gray-400 text-sm font-medium mb-2">We sent a 6-digit code to</p>
                            <p className="text-amber-600 dark:text-amber-400 font-bold text-base mb-8">{formData.email}</p>
                            <div className="mb-8 relative">
                                <input type="text" inputMode="numeric" maxLength={6} value={emailCode} autoFocus
                                    onChange={e => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full text-center text-4xl font-black tracking-[0.6em] rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-text-dark dark:text-white focus:border-amber-500 dark:focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all h-20 px-4 placeholder-gray-300 dark:placeholder-gray-600" />
                                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-2 pointer-events-none">
                                    {[0,1,2,3,4,5].map(i => (
                                        <div key={i} className={`h-0.5 w-6 rounded-full transition-all duration-200 ${i < emailCode.length ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                    ))}
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={emailCode.length !== 6 || isLoading} onClick={handleVerifyEmail}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed">
                                {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    : <><span className="material-symbols-outlined text-xl">verified</span>Verify Email</>}
                            </motion.button>
                            <div className="mt-6">
                                <button onClick={handleResendEmail} disabled={resendTimer > 0}
                                    className="text-sm font-bold text-text-gray dark:text-gray-400 hover:text-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive it? Resend code"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ OPERATOR REGISTRATION ═══ */}
                    {step === 'operator-register' && (
                        <motion.div key="operator-register" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <span className="material-symbols-outlined text-white text-4xl">local_shipping</span>
                            </motion.div>
                            <h2 className="text-3xl font-black text-text-dark dark:text-white mb-2 text-center">Set Up Your Fleet</h2>
                            <p className="text-text-gray dark:text-gray-400 text-sm font-medium mb-8 text-center">Tell us about your ambulance operation</p>

                            <form onSubmit={handleOperatorRegister}>
                                <div className="space-y-6">
                                    {/* Type toggle */}
                                    <div>
                                        <label className={labelBase}>Operator Type *</label>
                                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mt-2">
                                            {(['individual', 'provider'] as const).map(t => (
                                                <button key={t} type="button"
                                                    onClick={() => setOperatorData(prev => ({ ...prev, operatorType: t }))}
                                                    className={`flex-1 py-3 rounded-lg text-sm font-black tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                                                        operatorData.operatorType === t ? 'bg-white dark:bg-gray-700 text-text-dark dark:text-white shadow-sm' : 'text-text-gray dark:text-gray-400'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-lg">{t === 'individual' ? 'person' : 'business'}</span>
                                                    {t === 'individual' ? 'Individual' : 'Provider'}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-text-gray dark:text-gray-500 mt-2">
                                            {operatorData.operatorType === 'individual'
                                                ? 'Solo operator with one ambulance.'
                                                : 'Facility or company managing multiple ambulances.'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className={labelBase}>Contact Phone *</label>
                                        <div className="relative">
                                            <input name="phone" type="tel" value={operatorData.phone} onChange={handleOperatorChange} required className={inputBase} placeholder="+261 34 00 000 00" />
                                            <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">phone</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelBase}>License Number</label>
                                        <div className="relative">
                                            <input name="licenseNumber" value={operatorData.licenseNumber} onChange={handleOperatorChange} className={inputBase} placeholder="Operator / driver license" />
                                            <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">badge</span>
                                        </div>
                                    </div>

                                    {/* Provider fields */}
                                    <AnimatePresence>
                                        {operatorData.operatorType === 'provider' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <div className="space-y-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 mb-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">business</span>
                                                        <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Facility Details</span>
                                                    </div>
                                                    <div>
                                                        <label className={labelBase}>Facility Name *</label>
                                                        <input name="facilityName" value={operatorData.facilityName} onChange={handleOperatorChange}
                                                            required={operatorData.operatorType === 'provider'} className={inputClean} placeholder="City General Hospital" />
                                                    </div>
                                                    <div>
                                                        <label className={labelBase}>Facility Address *</label>
                                                        <input name="facilityAddress" value={operatorData.facilityAddress} onChange={handleOperatorChange}
                                                            required={operatorData.operatorType === 'provider'} className={inputClean} placeholder="123 Main Street, City" />
                                                    </div>
                                                    <div>
                                                        <label className={labelBase}>Facility Phone</label>
                                                        <input name="facilityPhone" type="tel" value={operatorData.facilityPhone} onChange={handleOperatorChange} className={inputClean} placeholder="+261 20 00 000 00" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* ═══ INDIVIDUAL — Ambulance Details (inline) ═══ */}
                                    <AnimatePresence>
                                        {operatorData.operatorType === 'individual' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <div className="space-y-5 p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 mb-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">local_shipping</span>
                                                        <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Your Ambulance</span>
                                                    </div>
                                                    <p className="text-xs text-text-gray dark:text-gray-500 -mt-2">
                                                        As an individual operator, you can register one ambulance. This will be set up now.
                                                    </p>

                                                    {/* Vehicle */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={labelBase}>Vehicle Number *</label>
                                                            <input name="vehicle_number" value={ambulanceData.vehicle_number} onChange={handleAmbulanceChange}
                                                                required className={inputClean} placeholder="e.g. 1234 TAA" />
                                                        </div>
                                                        <div>
                                                            <label className={labelBase}>Type *</label>
                                                            <select name="ambulance_type" value={ambulanceData.ambulance_type} onChange={handleAmbulanceChange}
                                                                className={inputClean + " cursor-pointer"}>
                                                                <option value="basic">BLS — Basic</option>
                                                                <option value="advanced">ALS — Advanced</option>
                                                                <option value="patient_transport">Patient Transport</option>
                                                                <option value="neonatal">Neonatal</option>
                                                                <option value="air">Air Ambulance</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className={labelBase}>Make</label>
                                                            <input name="vehicle_make" value={ambulanceData.vehicle_make} onChange={handleAmbulanceChange}
                                                                className={inputClean} placeholder="Toyota" />
                                                        </div>
                                                        <div>
                                                            <label className={labelBase}>Model</label>
                                                            <input name="vehicle_model" value={ambulanceData.vehicle_model} onChange={handleAmbulanceChange}
                                                                className={inputClean} placeholder="HiAce" />
                                                        </div>
                                                        <div>
                                                            <label className={labelBase}>Year</label>
                                                            <input name="vehicle_year" type="number" min="1990" max="2030" value={ambulanceData.vehicle_year} onChange={handleAmbulanceChange}
                                                                className={inputClean} />
                                                        </div>
                                                    </div>

                                                    {/* Equipment */}
                                                    <div>
                                                        <label className={labelBase}>Equipment</label>
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {commonEquipment.map(item => {
                                                                const selected = ambulanceData[item.key as keyof typeof ambulanceData] as boolean;
                                                                return (
                                                                    <button key={item.key} type="button" onClick={() => toggleEquipment(item.key)}
                                                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                                                            selected
                                                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                                                : 'bg-white dark:bg-gray-800 text-text-gray dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                                                        }`}>
                                                                        {selected && <span className="mr-0.5">✓</span>}
                                                                        {item.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Driver */}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">person</span>
                                                        <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Driver Info</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={labelBase}>Driver Name *</label>
                                                            <input name="driver_name" value={ambulanceData.driver_name} onChange={handleAmbulanceChange}
                                                                required className={inputClean} placeholder="Full name" />
                                                        </div>
                                                        <div>
                                                            <label className={labelBase}>Driver Phone *</label>
                                                            <input name="driver_phone" type="tel" value={ambulanceData.driver_phone} onChange={handleAmbulanceChange}
                                                                required className={inputClean} placeholder="+261 34..." />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={labelBase}>License # *</label>
                                                            <input name="driver_license_number" value={ambulanceData.driver_license_number} onChange={handleAmbulanceChange}
                                                                required className={inputClean} placeholder="License number" />
                                                        </div>
                                                        <div>
                                                            <label className={labelBase}>Experience (yrs)</label>
                                                            <input name="driver_experience_years" type="number" min="0" max="50" value={ambulanceData.driver_experience_years}
                                                                onChange={handleAmbulanceChange} className={inputClean} placeholder="e.g. 5" />
                                                        </div>
                                                    </div>

                                                    {/* Location */}
                                                    <div>
                                                        <label className={labelBase}>Base Address</label>
                                                        <input name="base_address" value={ambulanceData.base_address} onChange={handleAmbulanceChange}
                                                            className={inputClean} placeholder="Where ambulance is stationed" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={labelBase}>Service Radius (km)</label>
                                                            <input name="service_radius_km" type="number" step="0.1" min="1" max="500" value={ambulanceData.service_radius_km}
                                                                onChange={handleAmbulanceChange} className={inputClean} placeholder="e.g. 50" />
                                                        </div>
                                                        <div>
                                                            <label className={labelBase}>Price / KM (Ar)</label>
                                                            <input name="price_per_km" type="number" step="0.01" min="0" value={ambulanceData.price_per_km}
                                                                onChange={handleAmbulanceChange} className={inputClean} placeholder="e.g. 5000" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.button whileHover={!isLoading ? { scale: 1.02 } : {}} whileTap={!isLoading ? { scale: 0.98 } : {}}
                                        disabled={isLoading} type="submit"
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-60 mt-4">
                                        {isLoading ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                            : <><span className="material-symbols-outlined text-xl">check_circle</span>Complete Registration</>}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* ═══ COMPLETE ═══ */}
                    {step === 'complete' && (
                        <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-center py-12">
                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-success-green to-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                                <span className="material-symbols-outlined text-white text-5xl">check_circle</span>
                            </motion.div>
                            <h2 className="text-3xl font-black text-text-dark dark:text-white mb-3">You're All Set!</h2>
                            <p className="text-text-gray dark:text-gray-400 text-base font-medium mb-2">Your operator account is ready.</p>
                            <p className="text-text-gray dark:text-gray-400 text-sm">Redirecting to your dashboard...</p>
                            <div className="mt-8 flex justify-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success-green/10 text-success-green text-sm font-bold">
                                    <span className="material-symbols-outlined text-base">mark_email_read</span>Email ✓
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-bold">
                                    <span className="material-symbols-outlined text-base">local_shipping</span>Operator ✓
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
