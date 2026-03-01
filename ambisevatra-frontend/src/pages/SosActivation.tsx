import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sosApi } from '../services/api';
import { useUser } from '../context/UserContext';

type SosState = 'idle' | 'countdown' | 'activating' | 'verification' | 'dispatched';

/* ── Animated scanner line for futuristic background ── */
const ScanLine = () => (
    <motion.div
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute left-0 right-0 h-[2px] z-[1]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(230,57,70,0.6) 30%, rgba(230,57,70,0.9) 50%, rgba(230,57,70,0.6) 70%, transparent 100%)' }}
    />
);

/* ── Radar sweep ring ── */
const RadarRing = ({ delay = 0, scale = 1.6 }: { delay?: number; scale?: number }) => (
    <motion.div
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale, opacity: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full border-2 border-emergency-red/50 pointer-events-none"
    />
);

/* ── Hexagonal grid pattern overlay ── */
const HexGrid = () => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="hexGrid" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
                <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid)" className="text-emergency-red" />
    </svg>
);

/* ── Glitch text effect ── */
const GlitchText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span className={`relative inline-block ${className}`}>
        <span className="relative z-10">{children}</span>
        <motion.span
            animate={{ x: [-2, 2, -1, 0], opacity: [0, 0.8, 0, 0] }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3 }}
            className="absolute inset-0 text-red-400 z-0" aria-hidden
            style={{ clipPath: 'inset(20% 0 40% 0)' }}
        >{children}</motion.span>
        <motion.span
            animate={{ x: [2, -2, 1, 0], opacity: [0, 0.6, 0, 0] }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4, delay: 0.15 }}
            className="absolute inset-0 text-cyan-400 z-0" aria-hidden
            style={{ clipPath: 'inset(60% 0 5% 0)' }}
        >{children}</motion.span>
    </span>
);

/* ── Floating data particles ── */
const DataParticle = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ y: '100%', x: `${Math.random() * 100}%`, opacity: 0 }}
        animate={{ y: '-10%', opacity: [0, 0.7, 0] }}
        transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay, ease: 'linear' }}
        className="absolute text-[10px] font-mono text-emergency-red/30 pointer-events-none select-none"
    >
        {Math.random() > 0.5 ? '01' : '10'}
    </motion.div>
);

const SosActivation = () => {
    const navigate = useNavigate();
    const { isLoggedIn, profile } = useUser();
    const [sosState, setSosState] = useState<SosState>('idle');
    const [countdown, setCountdown] = useState<number>(5);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [sosId, setSosId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const activatingRef = useRef(false);

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Countdown timer
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (sosState === 'countdown' && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (sosState === 'countdown' && countdown === 0) {
            activateSos();
        }
        return () => clearTimeout(timer);
    }, [countdown, sosState]);

    const activateSos = useCallback(async () => {
        if (activatingRef.current) return;
        activatingRef.current = true;
        setSosState('activating');

        try {
            let lat: number | undefined;
            let lng: number | undefined;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                    );
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                    setCoords({ lat, lng });
                } catch { /* location unavailable, proceed without */ }
            }

            const res = await sosApi.activate({ latitude: lat, longitude: lng });
            setSosId(res.id);

            // ── Auth-aware flow ──
            // Logged-in users are already verified → skip OTP, go straight to dispatched
            if (isLoggedIn) {
                setSosState('dispatched');
                setTimeout(() => navigate('/ambulance-confirmed', { state: { sosId: res.id, sosData: res } }), 3500);
            } else {
                setSosState('verification');
            }
        } catch (err) {
            console.error('SOS activation failed:', err);
            // Even on failure, proceed based on auth state
            if (isLoggedIn) {
                setSosState('dispatched');
                setTimeout(() => navigate('/ambulance-confirmed', { state: { sosId: sosId } }), 3500);
            } else {
                setSosState('verification');
            }
        } finally {
            activatingRef.current = false;
        }
    }, [isLoggedIn, navigate]);

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
        activatingRef.current = false;
        setSosState('idle');
        setCountdown(5);
        setPhone('');
        setOtp('');
        setIsOtpSent(false);
        setSosId(null);
        setError('');
        setCoords(null);
    };

    const handleSkip = () => {
        if (sosState === 'countdown') {
            setCountdown(0);
            activateSos();
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');

        if (!isOtpSent) {
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
            if (!sosId) {
                setError('SOS session not active.');
                setIsVerifying(false);
                return;
            }
            try {
                const res = await sosApi.verify(sosId, phone, otp);
                if (res.status === 'dispatched') {
                    setSosState('dispatched');
                    setTimeout(() => navigate('/ambulance-confirmed', { state: { sosId, sosData: res } }), 3500);
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

    const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });
    const dateStr = currentTime.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

    return (
        <div className="relative flex-1 w-full min-h-[90vh] flex flex-col items-center justify-center overflow-x-hidden pt-20 pb-10">

            {/* ── Futuristic Background Layer ── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <HexGrid />
                {/* Floating binary particles */}
                {Array.from({ length: 12 }).map((_, i) => (
                    <DataParticle key={i} delay={i * 0.5} />
                ))}
            </div>

            {/* ── Dynamic State Overlays ── */}
            <AnimatePresence>
                {(sosState === 'countdown' || sosState === 'activating') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="pointer-events-none fixed inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-red-950/60 via-black/70 to-red-950/40 backdrop-blur-sm" />
                        <motion.div
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 bg-emergency-red/10"
                        />
                        <ScanLine />
                        {/* Corner grid lines */}
                        <div className="absolute top-4 left-4 w-20 h-20 border-t-2 border-l-2 border-emergency-red/30 rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-emergency-red/30 rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-20 h-20 border-b-2 border-l-2 border-emergency-red/30 rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-20 h-20 border-b-2 border-r-2 border-emergency-red/30 rounded-br-lg" />
                    </motion.div>
                )}
                {sosState === 'verification' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.3 } }}
                        className="pointer-events-none fixed inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/50 via-black/80 to-amber-950/30 backdrop-blur-md" />
                        <ScanLine />
                    </motion.div>
                )}
                {sosState === 'dispatched' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pointer-events-none fixed inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/50 via-black/70 to-emerald-950/30 backdrop-blur-md" />
                        <motion.div
                            animate={{ opacity: [0.05, 0.15, 0.05] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-success-green/10"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center">

                {/* ── HUD Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8 w-full"
                >
                    {/* Status bar */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <motion.div
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={`w-2 h-2 rounded-full ${sosState === 'dispatched' ? 'bg-success-green' : sosState === 'idle' ? 'bg-gray-400' : 'bg-emergency-red'}`}
                        />
                        <span className="text-xs font-mono uppercase tracking-[0.3em] text-gray-400">
                            {sosState === 'idle' ? 'SYSTEM READY' : sosState === 'countdown' ? 'ALERT INITIATED' : sosState === 'activating' ? 'LOCATING...' : sosState === 'verification' ? 'VERIFY IDENTITY' : 'DISPATCH CONFIRMED'}
                        </span>
                        <span className="text-xs font-mono text-gray-500">{timeStr}</span>
                    </div>

                    <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.15em] transition-colors duration-500 ${sosState === 'dispatched' ? 'text-success-green'
                        : sosState === 'verification' ? 'text-accent-orange'
                            : 'text-emergency-red'
                        }`}>
                        {sosState === 'dispatched' ? (
                            <GlitchText>DISPATCHED</GlitchText>
                        ) : sosState === 'verification' ? (
                            <GlitchText>VERIFY</GlitchText>
                        ) : sosState === 'activating' ? (
                            <GlitchText>LOCATING</GlitchText>
                        ) : (
                            <GlitchText>EMERGENCY</GlitchText>
                        )}
                    </h1>

                    <motion.p
                        key={sosState}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto font-mono mt-3 tracking-wide"
                    >
                        {sosState === 'dispatched' ? '// ambulance en route — stay at current location'
                            : sosState === 'activating' ? '// acquiring GPS coordinates...'
                                : sosState === 'verification' ? '// identity verification required for dispatch'
                                    : sosState === 'countdown' ? `// dispatching in ${countdown}s — cancel to abort`
                                        : '// tap to initiate emergency medical response'}
                    </motion.p>

                    {/* Auth badge */}
                    {isLoggedIn && sosState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-success-green/10 border border-success-green/20"
                        >
                            <span className="material-symbols-outlined text-success-green text-sm">verified_user</span>
                            <span className="text-xs font-mono text-success-green tracking-wider">
                                VERIFIED AS {profile.fullName?.toUpperCase() || profile.phone || 'USER'} — OTP SKIP ENABLED
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                {/* ── Main Dynamic Area ── */}
                <div className="relative w-full flex items-center justify-center min-h-[380px]">
                    <AnimatePresence mode="wait">

                        {/* ── IDLE + COUNTDOWN: Big SOS Button ── */}
                        {(sosState === 'idle' || sosState === 'countdown') && (
                            <motion.div
                                key="sos-btn"
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.3, opacity: 0, filter: 'blur(20px)', transition: { duration: 0.4 } }}
                                className="relative w-full max-w-[300px] sm:max-w-[340px] aspect-square flex items-center justify-center"
                            >
                                {/* Radar rings */}
                                <RadarRing delay={0} scale={1.8} />
                                <RadarRing delay={0.6} scale={2.0} />
                                <RadarRing delay={1.2} scale={2.2} />

                                {/* Idle breathing glow */}
                                {sosState === 'idle' && (
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.05, 0.25] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute inset-[-15%] rounded-full bg-emergency-red/30 blur-2xl pointer-events-none"
                                    />
                                )}

                                {/* Countdown intense pulse */}
                                {sosState === 'countdown' && (
                                    <motion.div
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="absolute inset-[-10%] rounded-full bg-emergency-red/50 blur-xl pointer-events-none"
                                    />
                                )}

                                {/* Rotating outer ring */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-[-5%] rounded-full pointer-events-none"
                                >
                                    <svg viewBox="0 0 200 200" className="w-full h-full">
                                        <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(230,57,70,0.15)" strokeWidth="0.5" strokeDasharray="4 8" />
                                    </svg>
                                </motion.div>

                                {/* Counter-rotating inner ring */}
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-[3%] rounded-full pointer-events-none"
                                >
                                    <svg viewBox="0 0 200 200" className="w-full h-full">
                                        <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(230,57,70,0.1)" strokeWidth="0.5" strokeDasharray="2 12" />
                                    </svg>
                                </motion.div>

                                {/* The Button */}
                                <motion.button
                                    whileHover={{ scale: sosState === 'countdown' ? 1 : 1.04 }}
                                    whileTap={{ scale: sosState === 'countdown' ? 1 : 0.96 }}
                                    onClick={handleSosClick}
                                    disabled={sosState === 'countdown'}
                                    className={`relative z-10 w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-500 overflow-hidden border-2 ${sosState === 'countdown'
                                        ? 'bg-gradient-to-br from-red-900 via-red-800 to-red-950 border-emergency-red/60 shadow-[0_0_80px_rgba(230,57,70,0.6),inset_0_0_60px_rgba(230,57,70,0.2)]'
                                        : 'bg-gradient-to-br from-red-900/90 via-emergency-red to-red-800 border-emergency-red/30 shadow-[0_0_50px_rgba(230,57,70,0.4)] cursor-pointer hover:shadow-[0_0_80px_rgba(230,57,70,0.7)] hover:border-emergency-red/60'
                                        }`}
                                >
                                    {/* Inner scan line */}
                                    {sosState === 'countdown' && (
                                        <motion.div
                                            animate={{ top: ['10%', '90%', '10%'] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                            className="absolute left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-30 pointer-events-none"
                                        />
                                    )}

                                    {/* SVG Timer ring */}
                                    {sosState === 'countdown' && (
                                        <svg className="absolute inset-[4%] w-[92%] h-[92%] -rotate-90 pointer-events-none z-20">
                                            <circle
                                                cx="50%" cy="50%" r="46%"
                                                stroke="rgba(255,255,255,0.08)"
                                                strokeWidth="3" fill="transparent"
                                            />
                                            <motion.circle
                                                cx="50%" cy="50%" r="46%"
                                                stroke="rgba(255,255,255,0.9)"
                                                strokeWidth="3" fill="transparent"
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
                                                initial={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                                className="text-[110px] sm:text-[130px] leading-none font-black block drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] font-mono tabular-nums"
                                            >
                                                {countdown}
                                            </motion.span>
                                            <motion.span
                                                animate={{ opacity: [1, 0.3, 1] }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                                className="text-[10px] uppercase tracking-[0.5em] font-bold mt-1 text-red-200/80 font-mono"
                                            >
                                                DISPATCHING
                                            </motion.span>
                                        </div>
                                    ) : (
                                        <div className="text-white flex flex-col items-center text-center z-20 gap-1">
                                            <span
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                                className="material-symbols-outlined text-[80px] sm:text-[90px] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                            >
                                                emergency_share
                                            </span>
                                            <span className="text-4xl sm:text-5xl font-black tracking-[0.3em] drop-shadow-lg">SOS</span>
                                            <span className="text-[9px] uppercase tracking-[0.4em] text-red-200/60 font-mono mt-1">TAP TO ACTIVATE</span>
                                        </div>
                                    )}
                                </motion.button>
                            </motion.div>
                        )}

                        {/* ── ACTIVATING: Processing spinner ── */}
                        {sosState === 'activating' && (
                            <motion.div
                                key="activating"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="relative w-32 h-32">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-emergency-red border-r-emergency-red/50"
                                    />
                                    <motion.div
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-2 rounded-full border-2 border-transparent border-b-emergency-red/70 border-l-emergency-red/30"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.span
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="material-symbols-outlined text-4xl text-emergency-red"
                                        >
                                            my_location
                                        </motion.span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-mono text-gray-400 tracking-wider">ACQUIRING LOCATION...</p>
                                    {coords && (
                                        <p className="text-xs font-mono text-emergency-red/60 mt-2">
                                            {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ── VERIFICATION: OTP Form (only for non-logged-in users) ── */}
                        {sosState === 'verification' && (
                            <motion.div
                                key="verify"
                                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                                className="w-full max-w-md"
                            >
                                {/* Glass card */}
                                <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                                    {/* Top accent line */}
                                    <div className="h-[2px] bg-gradient-to-r from-transparent via-accent-orange to-transparent" />

                                    <div className="p-8 sm:p-10">
                                        {/* Card header */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-accent-orange text-xl">shield_lock</span>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-sm tracking-wide">IDENTITY VERIFICATION</h3>
                                                <p className="text-gray-500 text-xs font-mono">SMS_AUTH_PROTOCOL</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleVerifySubmit} className="space-y-5">
                                            <AnimatePresence>
                                                {error && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emergency-red/10 border border-emergency-red/20 text-emergency-red text-xs font-mono">
                                                            <span className="material-symbols-outlined text-base">error</span>
                                                            {error}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div>
                                                <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500 mb-2">Phone Number</label>
                                                <div className="relative group">
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        disabled={isOtpSent || isVerifying}
                                                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-accent-orange/50 focus:bg-white/10 text-white transition-all outline-none font-mono placeholder-gray-600 disabled:opacity-40"
                                                        placeholder="+91 98765 43210"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-accent-orange transition-colors text-lg">call</span>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isOtpSent && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500 mb-2">OTP Code</label>
                                                        <div className="relative group">
                                                            <input
                                                                type="text"
                                                                required
                                                                value={otp}
                                                                onChange={(e) => setOtp(e.target.value)}
                                                                disabled={isVerifying}
                                                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-accent-orange/50 focus:bg-white/10 text-white transition-all outline-none font-mono tracking-[0.5em] text-center text-lg font-bold placeholder-gray-600"
                                                                placeholder="••••••"
                                                                maxLength={6}
                                                                autoFocus
                                                            />
                                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-accent-orange transition-colors text-lg">pin</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-600 mt-2 text-center font-mono tracking-wider">
                                                            CHECK_SMS_FOR_VERIFICATION_CODE
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={isVerifying || (!isOtpSent && !phone) || (isOtpSent && !otp)}
                                                type="submit"
                                                className="w-full py-4 bg-gradient-to-r from-accent-orange to-red-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] overflow-hidden flex justify-center items-center h-14 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-mono tracking-wider text-sm"
                                            >
                                                {isVerifying ? (
                                                    <motion.span
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        className="material-symbols-outlined text-white"
                                                    >progress_activity</motion.span>
                                                ) : !isOtpSent ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">send</span>
                                                        SEND_OTP
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">verified</span>
                                                        VERIFY_&_DISPATCH
                                                    </span>
                                                )}
                                            </motion.button>

                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="w-full text-center text-xs font-mono text-gray-600 hover:text-emergency-red transition-colors tracking-wider py-2"
                                            >
                                                [ CANCEL_REQUEST ]
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── DISPATCHED: Success ── */}
                        {sosState === 'dispatched' && (
                            <motion.div
                                key="dispatched"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                                className="flex flex-col items-center gap-8"
                            >
                                {/* Success orb */}
                                <div className="relative w-[220px] sm:w-[260px] aspect-square flex items-center justify-center">
                                    <RadarRing delay={0} scale={1.6} />
                                    <RadarRing delay={0.5} scale={1.8} />
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-[-15%] rounded-full bg-success-green/20 blur-2xl pointer-events-none"
                                    />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-[-5%] rounded-full"
                                    >
                                        <svg viewBox="0 0 200 200" className="w-full h-full">
                                            <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(46,204,113,0.15)" strokeWidth="0.5" strokeDasharray="4 8" />
                                        </svg>
                                    </motion.div>
                                    <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-emerald-600 via-success-green to-emerald-700 border-2 border-success-green/40 shadow-[0_0_60px_rgba(46,204,113,0.5)] flex flex-col items-center justify-center">
                                        <motion.span
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                            className="material-symbols-outlined text-[80px] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                                        >
                                            check_circle
                                        </motion.span>
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-xs font-mono tracking-[0.4em] text-white/80 mt-1 uppercase"
                                        >
                                            Active
                                        </motion.span>
                                    </div>
                                </div>

                                {/* Info card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-success-green/10 rounded-2xl overflow-hidden"
                                >
                                    <div className="h-[2px] bg-gradient-to-r from-transparent via-success-green to-transparent" />
                                    <div className="p-6 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-gray-500 tracking-wider">STATUS</span>
                                            <span className="text-[10px] font-mono text-success-green tracking-wider flex items-center gap-1">
                                                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-success-green inline-block" />
                                                AMBULANCE_DISPATCHED
                                            </span>
                                        </div>
                                        {coords && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-gray-500 tracking-wider">COORDINATES</span>
                                                <span className="text-[10px] font-mono text-gray-300 tracking-wider">
                                                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-gray-500 tracking-wider">TIMESTAMP</span>
                                            <span className="text-[10px] font-mono text-gray-300 tracking-wider">{dateStr} {timeStr}</span>
                                        </div>
                                        {isLoggedIn && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-gray-500 tracking-wider">AUTH</span>
                                                <span className="text-[10px] font-mono text-success-green tracking-wider">VERIFIED_USER — OTP_SKIPPED</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-white/5">
                                            <motion.p
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-xs text-center text-gray-400 font-mono tracking-wider"
                                            >
                                                REDIRECTING TO LIVE TRACKING...
                                            </motion.p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Action Buttons (Countdown) ── */}
                <div className="h-28 mt-6 w-full flex justify-center items-center">
                    <AnimatePresence>
                        {sosState === 'countdown' && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15, transition: { duration: 0.2 } }}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4 z-20 w-full max-w-lg justify-center px-4"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handleCancel}
                                    className="flex-1 px-5 py-4 bg-black/40 backdrop-blur-xl text-white font-mono text-xs sm:text-sm rounded-xl border border-white/10 flex items-center justify-center gap-2 hover:border-emergency-red/50 hover:text-emergency-red transition-all tracking-wider"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                    CANCEL
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handleSkip}
                                    className="flex-1 px-5 py-4 bg-gradient-to-r from-emergency-red to-red-700 text-white font-mono text-xs sm:text-sm rounded-xl shadow-[0_0_30px_rgba(230,57,70,0.3)] flex items-center justify-center gap-2 transition-all tracking-wider border border-emergency-red/30 hover:shadow-[0_0_40px_rgba(230,57,70,0.5)]"
                                >
                                    SKIP
                                    <span className="material-symbols-outlined text-lg">double_arrow</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Safety Notice ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 max-w-2xl w-full relative z-10"
                >
                    <div className="bg-black/30 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                        <div className="h-[1px] bg-gradient-to-r from-transparent via-emergency-red/30 to-transparent" />
                        <div className="p-5 flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-emergency-red/10 border border-emergency-red/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-emergency-red text-base">gavel</span>
                            </div>
                            <div>
                                <h3 className="text-xs font-mono font-bold text-white/80 mb-1 tracking-wider">LEGAL_NOTICE</h3>
                                <p className="text-[11px] text-gray-500 font-mono leading-relaxed">
                                    Misuse of emergency SOS results in severe penalties and legal action.
                                    Only activate for genuine medical emergencies requiring immediate intervention.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SosActivation;
