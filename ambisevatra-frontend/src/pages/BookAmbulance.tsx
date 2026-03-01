import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { bookingsApi } from '../services/api';

/* ─────────────────────────────────────────────
   Custom Date Picker
   ───────────────────────────────────────────── */
const CustomDatePicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) { const [y, m] = value.split('-'); return new Date(+y, +m - 1); }
        return new Date();
    });
    const ref = useRef<HTMLDivElement>(null);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const isPast = (d: number) => { const dt = new Date(year, month, d); dt.setHours(0, 0, 0, 0); return dt < today; };
    const isSelected = (d: number) => value === `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isTodayDay = (d: number) => year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

    const select = (d: number) => {
        if (isPast(d)) return;
        onChange(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        setIsOpen(false);
    };

    const display = value ? (() => {
        const [y, m, d] = value.split('-');
        return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    })() : '';

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-blue py-3 text-base text-left outline-none transition-colors duration-300 group">
                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-blue transition-colors text-xl">calendar_month</span>
                <span className={`font-medium flex-1 ${display ? 'text-text-dark dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {display || 'Select date'}
                </span>
                <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 w-[320px]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <button type="button" onClick={() => setViewDate(new Date(year, month - 1))}
                                className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-lg text-text-gray">chevron_left</span>
                            </button>
                            <span className="text-sm font-black text-text-dark dark:text-white">{months[month]} {year}</span>
                            <button type="button" onClick={() => setViewDate(new Date(year, month + 1))}
                                className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-lg text-text-gray">chevron_right</span>
                            </button>
                        </div>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-1">
                            {dayLabels.map(l => <div key={l} className="text-center text-[10px] font-bold uppercase tracking-wider text-text-gray/60 dark:text-gray-600 py-1">{l}</div>)}
                        </div>
                        {/* Days */}
                        <div className="grid grid-cols-7 gap-0.5">
                            {cells.map((d, i) => d === null ? <div key={`e${i}`} /> : (
                                <button key={d} type="button" onClick={() => select(d)} disabled={isPast(d)}
                                    className={`h-10 w-full rounded-xl text-[13px] font-semibold transition-all duration-150 flex items-center justify-center
                                        ${isSelected(d) ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/30'
                                            : isPast(d) ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                                : isTodayDay(d) ? 'bg-primary-blue/10 text-primary-blue font-bold ring-1 ring-primary-blue/30'
                                                    : 'text-text-dark dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                    {d}
                                </button>
                            ))}
                        </div>
                        {/* Today shortcut */}
                        <button type="button" onClick={() => { setViewDate(new Date()); select(today.getDate()); }}
                            className="w-full mt-4 py-2 text-xs font-bold text-primary-blue hover:bg-primary-blue/10 rounded-xl transition-colors">
                            Today
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Custom Time Picker
   ───────────────────────────────────────────── */
const CustomTimePicker = ({ value, onChange, selectedDate }: { value: string; onChange: (v: string) => void; selectedDate?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const parseVal = () => {
        if (!value) return { h12: null as number | null, min: null as number | null, period: 'AM' as 'AM' | 'PM' };
        const [hh, mm] = value.split(':').map(Number);
        return { h12: hh % 12 || 12, min: mm, period: (hh >= 12 ? 'PM' : 'AM') as 'AM' | 'PM' };
    };

    const parsed = parseVal();
    const [selHour, setSelHour] = useState<number | null>(parsed.h12);
    const [selMin, setSelMin] = useState<number | null>(parsed.min);
    const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const to24 = (h: number, p: 'AM' | 'PM') => {
        if (p === 'AM' && h === 12) return 0;
        if (p === 'PM' && h !== 12) return h + 12;
        return h;
    };

    const emit = (h: number, m: number, p: 'AM' | 'PM') => {
        const h24 = to24(h, p);
        onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };

    const pickHour = (h: number) => { setSelHour(h); if (selMin !== null) emit(h, selMin, period); };
    const pickMin = (m: number) => { setSelMin(m); if (selHour !== null) emit(selHour, m, period); };
    const pickPeriod = (p: 'AM' | 'PM') => { setPeriod(p); if (selHour !== null && selMin !== null) emit(selHour, selMin, p); };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const mins = Array.from({ length: 60 }, (_, i) => i);

    const display = value ? (() => {
        const [h, m] = value.split(':').map(Number);
        return `${(h % 12 || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    })() : '';

    const today = new Date();
    const isToday = selectedDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const nowHour24 = today.getHours();
    const nowMinute = today.getMinutes();

    const isPastHour = (h: number, p: 'AM' | 'PM') => {
        if (!isToday) return false;
        const h24 = to24(h, p);
        return h24 < nowHour24;
    };

    const isPastMinute = (h: number | null, m: number, p: 'AM' | 'PM') => {
        if (!isToday || h === null) return false;
        const h24 = to24(h, p);
        if (h24 < nowHour24) return true;
        if (h24 === nowHour24) return m < nowMinute;
        return false;
    };

    const isPastPeriod = (p: 'AM' | 'PM') => {
        if (!isToday) return false;
        if (nowHour24 >= 12 && p === 'AM') return true;
        return false;
    };

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-blue py-3 text-base text-left outline-none transition-colors duration-300 group">
                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-blue transition-colors text-xl">schedule</span>
                <span className={`font-medium flex-1 ${display ? 'text-text-dark dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {display || 'Select time'}
                </span>
                <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 w-[280px]">

                        <div className="flex gap-2 h-48">
                            {/* Hours */}
                            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pr-1 relative">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-gray/60 dark:text-gray-600 mb-2 sticky top-0 bg-white dark:bg-gray-900 pb-1 z-10 text-center">Hr</p>
                                <div className="flex flex-col gap-1">
                                    {hours.map(h => {
                                        const disabled = isPastHour(h, period);
                                        return (
                                            <button key={`h-${h}`} type="button" onClick={() => pickHour(h)} disabled={disabled}
                                                className={`h-9 shrink-0 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center
                                                    ${disabled ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50' :
                                                        selHour === h ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/30'
                                                            : 'text-text-dark dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                {h}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px bg-gray-100 dark:bg-gray-800 my-2"></div>

                            {/* Minutes */}
                            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] px-1 relative">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-gray/60 dark:text-gray-600 mb-2 sticky top-0 bg-white dark:bg-gray-900 pb-1 z-10 text-center">Min</p>
                                <div className="flex flex-col gap-1">
                                    {mins.map(m => {
                                        const disabled = isPastMinute(selHour, m, period);
                                        return (
                                            <button key={`m-${m}`} type="button" onClick={() => pickMin(m)} disabled={disabled}
                                                className={`h-9 shrink-0 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center
                                                    ${disabled ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50' :
                                                        selMin === m ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/30'
                                                            : 'text-text-dark dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                {String(m).padStart(2, '0')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px bg-gray-100 dark:bg-gray-800 my-2"></div>

                            {/* Period */}
                            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pl-1 relative">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-gray/60 dark:text-gray-600 mb-2 sticky top-0 bg-white dark:bg-gray-900 pb-1 z-10 text-center">AM/PM</p>
                                <div className="flex flex-col gap-1">
                                    {(['AM', 'PM'] as const).map(p => {
                                        const disabled = isPastPeriod(p);
                                        return (
                                            <button key={`p-${p}`} type="button" onClick={() => pickPeriod(p)} disabled={disabled}
                                                className={`h-9 shrink-0 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center
                                                    ${disabled ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50' :
                                                        period === p ? 'bg-primary-blue text-white shadow-md shadow-primary-blue/30'
                                                            : 'text-text-dark dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Done */}
                        {selHour !== null && selMin !== null && (
                            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button" onClick={() => setIsOpen(false)}
                                className="w-full mt-4 py-2 bg-primary-blue/10 text-primary-blue rounded-xl text-sm font-bold hover:bg-primary-blue/20 transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">check</span>
                                {display}
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};



/* ─────────────────────────────────────────────
   Main Page Component
   ───────────────────────────────────────────── */
const BookAmbulance = () => {
    const navigate = useNavigate();
    const { isLoggedIn, profile } = useUser();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { state: { message: 'Login to proceed with booking' }, replace: true });
        }
    }, [isLoggedIn, navigate]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customNote, setCustomNote] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        age: '',
        gender: '',
        pickup: '',
        destination: '',
        date: '',
        time: '',
        reason: '',
    });
    const [needs, setNeeds] = useState<Record<string, boolean>>({});
    const [didAutofill, setDidAutofill] = useState(false);

    // Autofill from profile on mount
    useEffect(() => {
        if (isLoggedIn && profile.fullName && !didAutofill) {
            setFormData(prev => ({
                ...prev,
                fullName: profile.fullName || prev.fullName,
                contactNumber: profile.phone || prev.contactNumber,
                age: profile.age || prev.age,
                gender: profile.gender || prev.gender,
            }));
            setDidAutofill(true);
        }
    }, [isLoggedIn, profile, didAutofill]);

    if (!isLoggedIn) return null;

    const savedAddresses = isLoggedIn ? profile.addresses.filter(a => a.address.trim()) : [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleNeed = (key: string) => setNeeds(prev => ({ ...prev, [key]: !prev[key] }));

    const isFormValid = formData.fullName && formData.contactNumber && formData.date && formData.time && formData.pickup && formData.destination;

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);
        try {
            // Try to get GPS for ambulance proximity assignment
            let lat: number | undefined;
            let lng: number | undefined;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
                    );
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch { /* proceed without GPS */ }
            }

            const booking = await bookingsApi.create({
                patient_name: formData.fullName,
                patient_phone: formData.contactNumber,
                patient_age: formData.age ? parseInt(formData.age) : undefined,
                patient_gender: formData.gender || undefined,
                pickup_address: formData.pickup,
                destination: formData.destination,
                scheduled_date: formData.date,
                scheduled_time: formData.time,
                reason: formData.reason || undefined,
                special_needs: needs,
                additional_notes: customNote || undefined,
                latitude: lat,
                longitude: lng,
            });
            navigate('/ambulance-confirmed', { state: { booking } });
        } catch (err) {
            console.error('Booking failed:', err);
            // Still navigate for now — non-logged-in users get a local-only flow
            navigate('/ambulance-confirmed', { state: { pickup: formData.pickup, destination: formData.destination } });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBase = "w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-blue dark:focus:border-primary-blue py-3 text-base text-text-dark dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors duration-300 font-medium";
    const inputWithIcon = `${inputBase} pl-10`;
    const labelBase = "text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-1.5 block";

    const specialNeeds = [
        { key: 'wheelchair', label: 'Wheelchair', icon: 'accessible' },
        { key: 'stretcher', label: 'Stretcher', icon: 'airline_seat_flat' },
        { key: 'oxygen', label: 'Oxygen', icon: 'air' },
        { key: 'attendant', label: 'Attendant', icon: 'support_agent' },
        { key: 'iv_drip', label: 'IV Drip', icon: 'water_drop' },
        { key: 'cardiac', label: 'Cardiac Monitor', icon: 'monitor_heart' },
        { key: 'child_seat', label: 'Child Seat', icon: 'child_care' },
        { key: 'interpreter', label: 'Interpreter', icon: 'translate' },
    ];

    const summaryRows = [
        { label: 'Patient', value: formData.fullName },
        { label: 'Phone', value: formData.contactNumber },
        { label: 'Date', value: formData.date ? new Date(formData.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '' },
        { label: 'Time', value: formData.time ? (() => { const [h, m] = formData.time.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; })() : '' },
        { label: 'Pick-up', value: formData.pickup },
        { label: 'Hospital', value: formData.destination },
    ];

    const activeNeeds = specialNeeds.filter(n => needs[n.key]);

    return (
        <div className="flex-1 w-full min-h-screen bg-white dark:bg-background-dark">
            <div className="h-1 w-full bg-gradient-to-r from-primary-blue via-accent-purple to-primary-blue"></div>

            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-12">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-14">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-dark dark:text-white tracking-tight leading-[1.1]">
                        Schedule{' '}
                        <span className="bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">Transport</span>
                    </h1>
                    <p className="text-text-gray dark:text-gray-400 text-base lg:text-lg font-medium mt-4 max-w-none leading-relaxed">
                        Pre-book a comfortable medical ride for checkups, discharges, dialysis, or routine appointments.
                    </p>
                </motion.div>

                {/* Two-column layout */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

                    {/* ═══ LEFT: Form ═══ */}
                    <div className="flex-1 min-w-0 space-y-14">

                        {/* Section 1: Patient */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-2xl font-black text-text-dark dark:text-white font-mono">01</span>
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Patient</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                                <div>
                                    <label className={labelBase}>Full Name *</label>
                                    <input name="fullName" value={formData.fullName} onChange={handleChange} className={inputBase} placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className={labelBase}>Phone *</label>
                                    <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} type="tel" className={inputBase} placeholder="+91 98765 43210" />
                                </div>
                                <div>
                                    <label className={labelBase}>Age</label>
                                    <input name="age" value={formData.age} onChange={handleChange} type="number" className={inputBase} placeholder="35" />
                                </div>
                                <div>
                                    <label className={labelBase}>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className={`${inputBase} cursor-pointer`}>
                                        <option value="">Select</option>
                                        <option>Female</option>
                                        <option>Male</option>
                                        <option>Other</option>
                                        <option>Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 2: Schedule & Route */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-2xl font-black text-text-dark dark:text-white font-mono">02</span>
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Schedule & Route</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 mb-8">
                                <div>
                                    <label className={labelBase}>Date *</label>
                                    <CustomDatePicker value={formData.date} onChange={(v) => setFormData(p => ({ ...p, date: v }))} />
                                </div>
                                <div>
                                    <label className={labelBase}>Time *</label>
                                    <CustomTimePicker value={formData.time} onChange={(v) => setFormData(p => ({ ...p, time: v }))} selectedDate={formData.date} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 mb-6">
                                <div>
                                    <label className={labelBase}>Pick-up Address *</label>
                                    <div className="relative">
                                        <input name="pickup" value={formData.pickup} onChange={handleChange} className={inputWithIcon} placeholder="123 Home Street, Apt 4B" />
                                        <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">location_on</span>
                                    </div>
                                    {savedAddresses.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {savedAddresses.map((a, i) => (
                                                <button key={i} type="button" onClick={() => setFormData(p => ({ ...p, pickup: a.address }))}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-blue bg-primary-blue/8 hover:bg-primary-blue/15 px-2.5 py-1 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined text-xs">{a.icon}</span>
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className={labelBase}>Destination Hospital *</label>
                                    <div className="relative">
                                        <input name="destination" value={formData.destination} onChange={handleChange} className={inputWithIcon} placeholder="City General Hospital" />
                                        <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">local_hospital</span>
                                    </div>
                                    {savedAddresses.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {savedAddresses.map((a, i) => (
                                                <button key={i} type="button" onClick={() => setFormData(p => ({ ...p, destination: a.address }))}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-blue bg-primary-blue/8 hover:bg-primary-blue/15 px-2.5 py-1 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined text-xs">{a.icon}</span>
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className={labelBase}>Reason for Trip</label>
                                <textarea name="reason" value={formData.reason} onChange={handleChange} className={`${inputBase} resize-none`} rows={1} placeholder="Dialysis, routine checkup, discharge, etc." />
                            </div>
                        </motion.section>

                        {/* Section 3: Special Needs */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-2xl font-black text-text-dark dark:text-white font-mono">03</span>
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Special Needs</span>
                            </div>

                            <div className="flex flex-wrap gap-2.5 mb-6">
                                {specialNeeds.map(item => {
                                    const active = !!needs[item.key];
                                    return (
                                        <button key={item.key} type="button" onClick={() => toggleNeed(item.key)}
                                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-200 select-none ${active
                                                ? 'bg-primary-blue/10 dark:bg-primary-blue/20 border-primary-blue text-primary-blue'
                                                : 'border-gray-200 dark:border-gray-700 text-text-gray dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                                                }`}>
                                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                            {item.label}
                                            {active && <span className="material-symbols-outlined text-sm">check</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom notes field */}
                            <div>
                                <label className={labelBase}>Additional Notes</label>
                                <div className="relative">
                                    <textarea
                                        value={customNote}
                                        onChange={e => setCustomNote(e.target.value)}
                                        className={`${inputBase} resize-none pl-10`}
                                        rows={2}
                                        placeholder="Any other requirements, allergies, mobility constraints, or instructions for the crew..."
                                    />
                                    <span className="material-symbols-outlined absolute left-0 top-3 text-gray-400 text-xl">edit_note</span>
                                </div>
                            </div>
                        </motion.section>

                        {/* Mobile submit */}
                        <div className="lg:hidden pt-4 pb-8">
                            <motion.button whileHover={isFormValid && !isSubmitting ? { scale: 1.02 } : {}} whileTap={isFormValid && !isSubmitting ? { scale: 0.98 } : {}}
                                onClick={handleSubmit} disabled={!isFormValid || isSubmitting}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl h-16 bg-gradient-to-r from-primary-blue to-accent-purple text-white text-lg font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed">
                                {isSubmitting
                                    ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                    : <><span className="material-symbols-outlined text-xl">check</span>Confirm Booking</>}
                            </motion.button>
                        </div>
                    </div>

                    {/* ═══ RIGHT: Summary ═══ */}
                    <motion.aside initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
                        className="hidden lg:block w-[340px] xl:w-[380px] flex-shrink-0">
                        <div className="sticky top-28 space-y-6">
                            <div className="bg-gray-50/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 xl:p-8 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-sm font-black uppercase tracking-wider text-text-gray dark:text-gray-500 mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary-blue text-lg">receipt_long</span>
                                    Booking Summary
                                </h3>
                                <div className="space-y-4">
                                    {summaryRows.map((row, i) => (
                                        <div key={i} className="flex justify-between items-start gap-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 whitespace-nowrap pt-0.5">{row.label}</span>
                                            <AnimatePresence mode="wait">
                                                <motion.span key={row.value || 'empty'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                                                    className={`text-sm font-semibold text-right truncate max-w-[200px] ${row.value ? 'text-text-dark dark:text-white' : 'text-gray-300 dark:text-gray-700'}`}>
                                                    {row.value || '—'}
                                                </motion.span>
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>

                                {(activeNeeds.length > 0 || customNote) && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                                        {activeNeeds.length > 0 && (
                                            <>
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Requirements</span>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {activeNeeds.map(n => (
                                                        <span key={n.key} className="inline-flex items-center gap-1 text-xs font-bold text-primary-blue bg-primary-blue/10 px-2.5 py-1 rounded-full">
                                                            <span className="material-symbols-outlined text-xs">{n.icon}</span>
                                                            {n.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        {customNote && (
                                            <div className="mt-3">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Notes</span>
                                                <p className="text-xs text-text-dark dark:text-gray-300 mt-1 leading-relaxed line-clamp-3">{customNote}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            <motion.button whileHover={isFormValid && !isSubmitting ? { scale: 1.02, y: -2 } : {}} whileTap={isFormValid && !isSubmitting ? { scale: 0.98 } : {}}
                                onClick={handleSubmit} disabled={!isFormValid || isSubmitting}
                                className="w-full flex items-center justify-center gap-2.5 rounded-2xl h-16 bg-gradient-to-r from-primary-blue to-accent-purple text-white text-base font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                                {isSubmitting
                                    ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                    : <><span className="material-symbols-outlined text-xl">event_available</span>Confirm Booking</>}
                            </motion.button>
                            <p className="text-[11px] text-center text-text-gray dark:text-gray-500 font-medium px-4 leading-relaxed">
                                By scheduling, you agree to our terms of service and transportation policies.
                            </p>
                        </div>
                    </motion.aside>
                </div>
            </div>
        </div>
    );
};

export default BookAmbulance;
