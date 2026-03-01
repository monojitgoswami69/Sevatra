import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sosApi } from '../services/api';

type SosState = 'idle' | 'countdown' | 'verification' | 'dispatched';

const SosActivation = () => {
    const navigate = useNavigate();
    const [sosState, setSosState] = useState<SosState>('idle');
    const [countdown, setCountdown] = useState<number>(5);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [sosId, setSosId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (sosState === 'countdown' && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (sosState === 'countdown' && countdown === 0) {
            activateSos();
        }
        return () => clearTimeout(timer);
    }, [countdown, sosState]);

    const activateSos = async () => {
        try {
            // Try to get location
            let lat: number | undefined;
            let lng: number | undefined;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                    );
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch { /* location unavailable, proceed without */ }
            }

            const res = await sosApi.activate({ latitude: lat, longitude: lng });
            setSosId(res.id);
            setSosState('verification');
        } catch (err) {
            console.error('SOS activation failed:', err);
            // Fallback: still move to verification but without a real SOS ID
            setSosState('verification');
        }
    };

    const handleSosClick = () => {
        if (sosState === 'idle') {
            setSosState('countdown');
            setCountdown(5);
            setError('');
        }
    };

    const handleCancel = async () => {
        if (sosId) {
            try { await sosApi.cancel(sosId, 'User cancelled'); } catch { /* ignore */ }
        }
        setSosState('idle');
        setCountdown(5);
        setPhone('');
        setOtp('');
        setIsOtpSent(false);
        setSosId(null);
        setError('');
    };

    const handleSkip = () => {
        activateSos();
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');

        if (!isOtpSent) {
            // Send OTP via Twilio
            if (!sosId) {
                setError('SOS session not active. Please try again.');
                setIsVerifying(false);
                return;
            }
            try {
                const res = await sosApi.sendOtp(sosId, phone);
                if (res.success) {
                    setIsOtpSent(true);
                } else {
                    setError(res.message || 'Failed to send OTP');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to send OTP');
            } finally {
                setIsVerifying(false);
            }
        } else {
            // Verify OTP
            if (!sosId) {
                setError('SOS session not active.');
                setIsVerifying(false);
                return;
            }
            try {
                const res = await sosApi.verify(sosId, phone, otp);
                if (res.status === 'dispatched') {
                    setSosState('dispatched');
                    setTimeout(() => {
                        navigate('/ambulance-confirmed');
                    }, 3000);
                } else {
                    setError(res.message || 'Verification failed');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Verification failed');
            } finally {
                setIsVerifying(false);
            }
        }
    };

    return (
        <div className="relative flex-1 w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-10">
            {/* Dynamic Background Overlays relying on State */}
            <AnimatePresence>
                {sosState === 'countdown' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="pointer-events-none fixed inset-0 z-0 bg-red-900/40 backdrop-blur-[10px]"
                    >
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 bg-emergency-red/20 mix-blend-overlay"
                        />
                    </motion.div>
                )}
                {sosState === 'verification' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.3 } }}
                        className="pointer-events-none fixed inset-0 z-0 bg-accent-orange/10 backdrop-blur-[20px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 dark:from-black/40 dark:to-black/80"></div>
                    </motion.div>
                )}
                {sosState === 'dispatched' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pointer-events-none fixed inset-0 z-0 bg-success-green/20 backdrop-blur-md"
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
                {/* Header text */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 w-full"
                >
                    <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-widest flex items-center justify-center gap-4 drop-shadow-lg transition-colors duration-500 ${sosState === 'dispatched' ? 'text-success-green'
                        : sosState === 'verification' ? 'text-accent-orange'
                            : 'text-emergency-red'
                        }`}>
                        {sosState === 'dispatched' ? (
                            <span className="material-symbols-outlined text-6xl">check_circle</span>
                        ) : sosState === 'verification' ? (
                            <span className="material-symbols-outlined text-6xl">security</span>
                        ) : (
                            <span className="material-symbols-outlined text-6xl animate-pulse">emergency</span>
                        )}
                        {sosState === 'dispatched' ? 'SOS Dispatched'
                            : sosState === 'verification' ? 'Verify Emergency'
                                : 'Emergency SOS'}
                    </h1>
                    <p className="text-text-gray dark:text-gray-300 text-lg sm:text-xl max-w-xl mx-auto font-medium mt-4">
                        {sosState === 'dispatched' ? 'Help is on the way. Please stay calm and keep your phone nearby.'
                            : sosState === 'verification' ? 'To prevent false alarms, please verify this SOS request immediately.'
                                : 'Press the button below for immediate dispatch to your GPS location.'}
                    </p>
                </motion.div>

                {/* Main Dynamic View Area */}
                <div className="relative w-full flex items-center justify-center min-h-[350px]">
                    <AnimatePresence mode="wait">

                        {(sosState === 'idle' || sosState === 'countdown') && (
                            <motion.div
                                key="sos-button"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
                                className="relative w-full max-w-[320px] aspect-square flex items-center justify-center"
                            >
                                {/* Ripple Effects behind Button */}
                                {sosState === 'idle' && (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-full bg-emergency-red/40 blur-md pointer-events-none"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                                            transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-full bg-emergency-red/30 blur-xl pointer-events-none"
                                        />
                                    </>
                                )}

                                {sosState === 'countdown' && (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-full bg-emergency-red/60 blur-md pointer-events-none"
                                        />
                                    </>
                                )}

                                {/* Main Circular Button */}
                                <motion.button
                                    whileHover={{ scale: sosState === 'countdown' ? 1 : 1.05 }}
                                    whileTap={{ scale: sosState === 'countdown' ? 1 : 0.95 }}
                                    onClick={handleSosClick}
                                    disabled={sosState === 'countdown'}
                                    className={`relative z-10 w-full h-full rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden ${sosState === 'countdown'
                                        ? 'bg-red-800 shadow-[0_0_60px_rgba(220,38,38,0.8)]'
                                        : 'bg-gradient-to-br from-emergency-red via-red-600 to-rose-700 shadow-[0_0_40px_rgba(230,57,70,0.6)] cursor-pointer hover:shadow-[0_0_60px_rgba(230,57,70,0.8)]'
                                        }`}
                                >
                                    {sosState === 'countdown' && (
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                            <motion.circle
                                                cx="50%"
                                                cy="50%"
                                                r="46%"
                                                stroke="rgba(255,255,255,0.9)"
                                                strokeWidth="10"
                                                fill="transparent"
                                                strokeDasharray="289%"
                                                initial={{ strokeDashoffset: '0%' }}
                                                animate={{ strokeDashoffset: '289%' }}
                                                transition={{ duration: 5, ease: 'linear' }}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    )}

                                    {sosState === 'countdown' ? (
                                        <div className="text-white text-center flex flex-col items-center justify-center z-20">
                                            <motion.span
                                                key={countdown}
                                                initial={{ scale: 1.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-[120px] leading-tight font-black block drop-shadow-lg font-mono"
                                            >
                                                {countdown}
                                            </motion.span>
                                            <span className="text-base uppercase tracking-widest font-black mt-0 opacity-90 block animate-pulse">Wait...</span>
                                        </div>
                                    ) : (
                                        <div className="text-white flex flex-col items-center text-center z-20 w-full h-full justify-center">
                                            <span style={{ fontVariationSettings: "'FILL' 1" }} className="material-symbols-outlined text-[100px] mb-2 drop-shadow-xl relative">
                                                touch_app
                                            </span>
                                            <span className="text-5xl font-black tracking-widest uppercase drop-shadow-xl">SOS</span>
                                        </div>
                                    )}
                                </motion.button>
                            </motion.div>
                        )}

                        {sosState === 'verification' && (
                            <motion.div
                                key="verification-form"
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -30 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="w-full max-w-md bg-white/10 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative"
                            >
                                <form onSubmit={handleVerifySubmit} className="space-y-6 relative z-10 w-full">
                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden">
                                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emergency-red/10 border border-emergency-red/20 text-emergency-red text-sm font-bold">
                                                    <span className="material-symbols-outlined text-lg">error</span>
                                                    {error}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.div layout>
                                        <label className="block text-sm font-semibold text-text-dark dark:text-gray-200 mb-2">Registered Phone Number</label>
                                        <div className="relative group">
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                disabled={isOtpSent || isVerifying}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent bg-gray-50/80 dark:bg-black/40 focus:bg-white dark:focus:bg-gray-900 focus:border-accent-orange/50 text-text-dark dark:text-white transition-all outline-none font-medium placeholder-gray-400 shadow-inner disabled:opacity-50"
                                                placeholder="+91 98765 43210"
                                            />
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-orange transition-colors">call</span>
                                        </div>
                                    </motion.div>

                                    <AnimatePresence>
                                        {isOtpSent && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <label className="block text-sm font-semibold text-text-dark dark:text-gray-200 mb-2">Emergency OTP Code</label>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        required
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        disabled={isVerifying}
                                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent bg-gray-50/80 dark:bg-black/40 focus:bg-white dark:focus:bg-gray-900 focus:border-accent-orange/50 text-text-dark dark:text-white transition-all outline-none font-bold placeholder-gray-400 shadow-inner tracking-[0.5em] font-mono text-center text-lg"
                                                        placeholder="••••••"
                                                        maxLength={6}
                                                    />
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-orange transition-colors">pin</span>
                                                </div>
                                                {isOtpSent && (
                                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                                        Check your phone for the SMS code
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.button
                                        layout
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isVerifying || (!isOtpSent && !phone) || (isOtpSent && !otp)}
                                        type="submit"
                                        className="w-full py-4 bg-gradient-to-r from-accent-orange to-red-500 text-white font-black rounded-2xl shadow-xl overflow-hidden group mt-2 flex justify-center items-center h-14 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isVerifying ? (
                                            <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
                                        ) : !isOtpSent ? (
                                            <span className="uppercase tracking-widest flex items-center gap-2">
                                                <span className="material-symbols-outlined">send_to_mobile</span>
                                                Send OTP
                                            </span>
                                        ) : (
                                            <span className="uppercase tracking-widest flex items-center gap-2">
                                                <span className="material-symbols-outlined">verified</span>
                                                Verify & Dispatch
                                            </span>
                                        )}
                                    </motion.button>

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="w-full text-center text-sm font-bold text-gray-500 hover:text-text-dark dark:hover:text-white transition-colors mt-2"
                                    >
                                        Cancel Request
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {sosState === 'dispatched' && (
                            <motion.div
                                key="dispatched-success"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-[320px] aspect-square rounded-full bg-gradient-to-br from-success-green to-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.8)] border-4 border-success-green text-white flex flex-col items-center text-center z-20 justify-center relative overflow-hidden"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 rounded-full bg-white/40 blur-md pointer-events-none"
                                />
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, rotate: 360 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    className="material-symbols-outlined text-[100px] drop-shadow-lg relative z-10"
                                >
                                    check_circle
                                </motion.span>
                                <span className="text-xl uppercase tracking-widest font-black mt-2 drop-shadow-md relative z-10">Verified</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Double Option Buttons for Countdown State */}
                <div className="h-32 mt-8 w-full flex justify-center items-center">
                    <AnimatePresence>
                        {sosState === 'countdown' && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="flex flex-col sm:flex-row gap-4 sm:gap-6 z-20 w-full max-w-lg justify-center px-4"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-4 bg-white dark:bg-gray-800 text-text-dark dark:text-white font-black text-sm sm:text-base rounded-2xl transition-all shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 hover:border-emergency-red hover:text-emergency-red dark:hover:border-emergency-red dark:hover:text-emergency-red"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                    CANCEL SOS
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSkip}
                                    className="flex-1 px-4 py-4 bg-gradient-to-r from-accent-orange to-red-500 text-white font-black text-sm sm:text-base rounded-2xl transition-all shadow-[0_10px_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
                                >
                                    SKIP COUNTDOWN
                                    <span className="material-symbols-outlined text-xl">double_arrow</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Safety Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-l-4 border-emergency-red max-w-2xl w-full text-left relative z-10"
                >
                    <h3 className="text-lg font-black text-text-dark dark:text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emergency-red font-bold">warning</span>
                        Important Notice
                    </h3>
                    <p className="text-sm text-text-gray dark:text-gray-400 font-medium leading-relaxed">
                        Misuse of the SOS feature may result in severe penalties and strict legal action. Only use this button in genuine medical emergencies where immediate life-saving intervention is required.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default SosActivation;
