import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { authApi, setTokens } from '../services/api';

type Step = 'form' | 'verify-email' | 'complete';

const Login = () => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [step, setStep] = useState<Step>('form');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '',
    });

    // Verification data
    const [emailCode, setEmailCode] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, login: contextLogin, updateProfile, completeRegistration } = useUser();

    const customMessage = location.state?.message;

    if (isLoggedIn && step === 'form') {
        navigate(location.state?.from || '/profile');
        return null;
    }

    // Resend timer countdown
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

    // ── Step 1: Submit signup or login form ──
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (mode === 'login') {
            const res = await contextLogin(formData.email, formData.password);
            setIsLoading(false);
            if (res.success) navigate('/');
            else setError(res.error || 'Invalid email or password');
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

    // ── Step 2: Verify email OTP ──
    const handleVerifyEmail = async () => {
        if (emailCode.length !== 6) return;
        setError('');
        setIsLoading(true);
        try {
            const res = await authApi.verifyEmail({ email: formData.email, token: emailCode });
            // Store tokens from email verification
            setTokens(res.access_token, res.refresh_token);
            // Update profile and complete
            updateProfile({
                fullName: formData.fullName,
                email: formData.email,
            });
            completeRegistration();
            setStep('complete');
            setTimeout(() => navigate('/'), 2000);
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

    // ── Google Sign-In ──
    const handleGoogleSignIn = async (credentialResponse: any) => {
        setError('');
        setIsLoading(true);
        try {
            if (!credentialResponse?.credential) {
                throw new Error('Failed to get Google credentials');
            }

            const idToken = credentialResponse.credential;

            // For sign-up, send full name; for sign-in, omit it
            const fullName = mode === 'signup' && formData.fullName ? formData.fullName : undefined;

            const res = await authApi.signupGoogle({
                id_token: idToken,
                full_name: fullName,
            });

            // Store tokens
            setTokens(res.access_token, res.refresh_token);

            // Update profile and complete registration
            updateProfile({
                fullName: res.user.full_name || fullName,
                email: res.user.email,
            });
            completeRegistration();

            // Redirect to home
            setTimeout(() => navigate('/'), 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google Sign-In failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize Google One Tap
    useEffect(() => {
        if (!step || step === 'form') {
            const initGoogleOneTap = () => {
                if ((window as any).google?.accounts?.id) {
                    try {
                        (window as any).google.accounts.id.initialize({
                            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
                            callback: handleGoogleSignIn,
                        });

                        // Render the button to the container
                        const buttonElement = document.getElementById('google-signin-button');
                        if (buttonElement) {
                            (window as any).google.accounts.id.renderButton(buttonElement, {
                                type: 'standard',
                                theme: 'outline',
                                size: 'large',
                                width: 400,
                            });
                        }
                    } catch (err) {
                        console.error('Google Sign-In initialization failed:', err);
                    }
                }
            };

            // Small delay to ensure google library is loaded
            setTimeout(initGoogleOneTap, 200);
        }
    }, [step]);

    const inputBase = "w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-blue dark:focus:border-primary-blue py-3 text-base text-text-dark dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors duration-300 font-medium pl-10";
    const labelBase = "text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-1 block";

    // ── Step indicator ──
    const steps = [
        { key: 'form', label: 'Account', icon: 'person_add' },
        { key: 'verify-email', label: 'Email', icon: 'mark_email_read' },
    ];
    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="flex-1 w-full min-h-screen bg-white dark:bg-background-dark flex items-center justify-center px-6">
            <div className="w-full max-w-md pt-24 pb-16">

                {/* Back */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-text-gray dark:text-gray-400 hover:text-primary-blue transition-colors group">
                        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Home
                    </Link>
                </motion.div>

                {/* Step Indicator (only for signup flow) */}
                {mode === 'signup' && step !== 'form' && step !== 'complete' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <div className="flex items-center justify-between max-w-xs mx-auto">
                            {steps.map((s, i) => (
                                <div key={s.key} className="flex items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${i < currentStepIndex
                                        ? 'bg-success-green text-white'
                                        : i === currentStepIndex
                                            ? 'bg-gradient-to-br from-primary-blue to-accent-purple text-white shadow-lg'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                        }`}>
                                        {i < currentStepIndex ? (
                                            <span className="material-symbols-outlined text-lg">check</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-lg">{s.icon}</span>
                                        )}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`w-12 sm:w-16 h-0.5 mx-1 transition-colors duration-300 ${i < currentStepIndex ? 'bg-success-green' : 'bg-gray-200 dark:bg-gray-700'}`} />
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

                    {/* ═══════════ FORM STEP ═══════════ */}
                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

                            {/* Header */}
                            <div className="mb-10">

                                <h1 className="text-4xl sm:text-5xl font-black text-text-dark dark:text-white tracking-tight leading-[1.1]">
                                    {mode === 'login' ? 'Sign In' : 'Create '}
                                    <span className="bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">
                                        {mode === 'login' ? '' : 'Account'}
                                    </span>
                                </h1>
                                <p className="text-text-gray dark:text-gray-400 text-base font-medium mt-3">
                                    {customMessage ? (
                                        <span className="text-primary-blue font-bold">{customMessage}</span>
                                    ) : mode === 'login'
                                        ? 'Access your emergency medical profile and booking history.'
                                        : 'We\'ll verify your email for your safety.'}
                                </p>
                            </div>

                            {/* Mode Toggle */}
                            <div className="mb-10">
                                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                    {(['login', 'signup'] as const).map(m => (
                                        <button key={m} onClick={() => { setMode(m); setError(''); }}
                                            className={`flex-1 py-3 rounded-lg text-sm font-black tracking-wider transition-all duration-200 ${mode === m ? 'bg-white dark:bg-gray-700 text-text-dark dark:text-white shadow-sm' : 'text-text-gray dark:text-gray-400'
                                                }`}>
                                            {m === 'login' ? 'Sign In' : 'Sign Up'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleFormSubmit}>
                                <div className="space-y-6">
                                    <AnimatePresence>
                                        {mode === 'signup' && (
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
                                            <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputBase} placeholder="jane@example.com" />
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
                                        {mode === 'signup' && (
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
                                        disabled={isLoading}
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl h-14 bg-gradient-to-r from-primary-blue to-accent-purple text-white text-base font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-60 mt-4"
                                    >
                                        {isLoading ? (
                                            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-xl">
                                                    {mode === 'login' ? 'login' : 'person_add'}
                                                </span>
                                                {mode === 'login' ? 'Sign In' : 'Create Account'}
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>

                            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
                                <p className="text-center text-sm text-text-gray dark:text-gray-500 font-medium mb-4">
                                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                    <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                                        className="text-primary-blue font-black hover:underline">
                                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                                    </button>
                                </p>

                                <div className="flex items-center gap-3 my-6">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                    <p className="text-xs font-bold text-text-gray dark:text-gray-500 uppercase tracking-wider">Or</p>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Google Sign-In Button */}
                                <div id="google-signin-button" className="flex justify-center" />
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════ VERIFY EMAIL STEP ═══════════ */}
                    {step === 'verify-email' && (
                        <motion.div key="verify-email" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }} className="text-center">

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-blue to-accent-purple flex items-center justify-center mx-auto mb-6 shadow-xl"
                            >
                                <span className="material-symbols-outlined text-white text-4xl">mark_email_read</span>
                            </motion.div>

                            <h2 className="text-3xl font-black text-text-dark dark:text-white mb-2">Verify Your Email</h2>
                            <p className="text-text-gray dark:text-gray-400 text-sm font-medium mb-2">
                                We sent a 6-digit code to
                            </p>
                            <p className="text-primary-blue font-bold text-base mb-8">{formData.email}</p>

                            <div className="mb-8">
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={emailCode}
                                        autoFocus
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setEmailCode(val);
                                        }}
                                        placeholder="000000"
                                        className="w-full text-center text-4xl font-black tracking-[0.6em] rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-text-dark dark:text-white focus:border-primary-blue dark:focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 outline-none transition-all h-20 px-4 placeholder-gray-300 dark:placeholder-gray-600"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-2 pointer-events-none">
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={`h-0.5 w-6 rounded-full transition-all duration-200 ${i < emailCode.length ? 'bg-primary-blue' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={emailCode.length !== 6 || isLoading}
                                onClick={handleVerifyEmail}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl h-14 bg-gradient-to-r from-primary-blue to-accent-purple text-white text-base font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-xl">verified</span>
                                        Verify Email
                                    </>
                                )}
                            </motion.button>

                            <div className="mt-6">
                                <button
                                    onClick={handleResendEmail}
                                    disabled={resendTimer > 0}
                                    className="text-sm font-bold text-text-gray dark:text-gray-400 hover:text-primary-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive it? Resend code"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════ COMPLETE STEP ═══════════ */}
                    {step === 'complete' && (
                        <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-center py-12">

                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-success-green to-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                            >
                                <span className="material-symbols-outlined text-white text-5xl">check_circle</span>
                            </motion.div>

                            <h2 className="text-3xl font-black text-text-dark dark:text-white mb-3">
                                All Set!
                            </h2>
                            <p className="text-text-gray dark:text-gray-400 text-base font-medium mb-2">
                                Your email is verified.
                            </p>
                            <p className="text-text-gray dark:text-gray-400 text-sm">
                                Redirecting you now...
                            </p>

                            <div className="mt-8 flex justify-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success-green/10 text-success-green text-sm font-bold">
                                    <span className="material-symbols-outlined text-base">mark_email_read</span>
                                    Email ✓
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
