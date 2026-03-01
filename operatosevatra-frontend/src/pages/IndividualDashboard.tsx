import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { operatorApi, type AmbulanceData } from '../services/api';
import { useOperator } from '../context/OperatorContext';

type Gender = 'Male' | 'Female' | 'Other' | '';

interface PatientForm {
    name: string;
    age: string;
    gender: Gender;
    bloodGroup: string;
    emergencyContact: string;
}

interface Vitals {
    heartRate: string;
    spo2: string;
    respRate: string;
    temperature: string;
    bpSystolic: string;
    bpDiastolic: string;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const IndividualDashboard = () => {
    const { profile } = useOperator();
    const [ambulance, setAmbulance] = useState<AmbulanceData | null>(null);
    const [loading, setLoading] = useState(true);

    const [patient, setPatient] = useState<PatientForm>({
        name: '', age: '', gender: '', bloodGroup: '', emergencyContact: '',
    });

    const [vitals, setVitals] = useState<Vitals>({
        heartRate: '', spo2: '', respRate: '', temperature: '',
        bpSystolic: '120', bpDiastolic: '80',
    });

    useEffect(() => {
        const load = async () => {
            try {
                const ambs = await operatorApi.listAmbulances();
                if (ambs.length > 0) setAmbulance(ambs[0]);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setPatient(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleVitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVitals(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCheckAvailability = () => {
        // Frontend only — placeholder
        alert('Severity score calculation and bed recommendation coming soon!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="material-symbols-outlined text-4xl text-amber-500 animate-spin">progress_activity</span>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-gray-400 dark:placeholder-gray-500";
    const labelClass = "text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-1.5 block";
    const cardClass = "rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-5";
    const innerCardClass = "rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 p-4";
    const sectionIconClass = "w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0";

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* ── Greeting ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-black text-text-dark dark:text-white tracking-tight">
                    Welcome back,{' '}
                    <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        {profile?.fullName?.split(' ')[0] || 'Operator'}
                    </span>
                </h1>

                {ambulance && (
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <span className="material-symbols-outlined text-amber-500 text-base">local_shipping</span>
                            <span className="text-sm font-bold text-text-dark dark:text-white">
                                {[ambulance.vehicle_make, ambulance.vehicle_model].filter(Boolean).join(' ') || 'Ambulance'}
                            </span>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                {ambulance.vehicle_number}
                            </span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                            ambulance.status === 'available'
                                ? 'bg-success-green/10 text-success-green border-success-green/20'
                                : ambulance.status === 'on_trip'
                                ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                : 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500/20'
                        }`}>
                            <span className="material-symbols-outlined text-sm">
                                {ambulance.status === 'available' ? 'check_circle' : ambulance.status === 'on_trip' ? 'directions_car' : 'power_settings_new'}
                            </span>
                            {ambulance.status.replace('_', ' ')}
                        </span>
                    </div>
                )}
            </motion.div>

            {/* ── PATIENT DEMOGRAPHICS ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className={sectionIconClass}>
                        <span className="material-symbols-outlined text-white text-lg">badge</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-text-dark dark:text-white">Patient Demographics</h2>
                        <p className="text-xs text-text-gray dark:text-gray-500 font-medium">Required information</p>
                    </div>
                </div>

                <div className={`${cardClass} space-y-4`}>
                    <div>
                        <label className={labelClass}>Patient Name <span className="text-emergency-red">*</span></label>
                        <input name="name" value={patient.name} onChange={handlePatientChange}
                            className={inputClass} placeholder="Enter full name" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Age <span className="text-emergency-red">*</span></label>
                            <input name="age" type="number" min="0" max="150" value={patient.age}
                                onChange={handlePatientChange} className={inputClass} placeholder="Years" />
                        </div>
                        <div>
                            <label className={labelClass}>Gender <span className="text-emergency-red">*</span></label>
                            <div className="flex gap-2">
                                {(['Male', 'Female', 'Other'] as const).map(g => (
                                    <button key={g} type="button"
                                        onClick={() => setPatient(prev => ({ ...prev, gender: g }))}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                                            patient.gender === g
                                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent shadow-lg shadow-amber-500/20'
                                                : 'bg-gray-50 dark:bg-gray-800/50 text-text-gray dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500/50'
                                        }`}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Blood Group <span className="text-emergency-red">*</span></label>
                            <select name="bloodGroup" value={patient.bloodGroup} onChange={handlePatientChange}
                                className={`${inputClass} cursor-pointer`}>
                                <option value="" disabled>Select blood group</option>
                                {bloodGroups.map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Emergency Contact <span className="text-emergency-red">*</span></label>
                            <input name="emergencyContact" type="tel" value={patient.emergencyContact}
                                onChange={handlePatientChange} className={inputClass} placeholder="Phone number" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── CURRENT VITALS ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emergency-red/10 dark:bg-emergency-red/15 border border-emergency-red/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-emergency-red text-lg">monitor_heart</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-text-dark dark:text-white">Current Vitals</h2>
                            <p className="text-xs text-text-gray dark:text-gray-500 font-medium">Live patient monitoring</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-green/10 border border-success-green/20">
                        <span className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
                        <span className="text-xs font-black text-success-green tracking-wider">LIVE</span>
                    </span>
                </div>

                <div className={`${cardClass} space-y-3`}>
                    {/* Heart Rate + SpO2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={innerCardClass}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-gray dark:text-gray-400 uppercase tracking-wider">Heart Rate</span>
                                <span className="material-symbols-outlined text-emergency-red text-xl">favorite</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input name="heartRate" type="number" min="0" max="300" value={vitals.heartRate}
                                    onChange={handleVitalChange}
                                    className="w-full bg-transparent text-3xl font-black text-text-dark dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600"
                                    placeholder="—" />
                                <span className="text-sm font-bold text-text-gray dark:text-gray-500 flex-shrink-0">bpm</span>
                            </div>
                        </div>

                        <div className={innerCardClass}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-gray dark:text-gray-400 uppercase tracking-wider">SpO2</span>
                                <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-xl">water_drop</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input name="spo2" type="number" min="0" max="100" value={vitals.spo2}
                                    onChange={handleVitalChange}
                                    className="w-full bg-transparent text-3xl font-black text-text-dark dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600"
                                    placeholder="—" />
                                <span className="text-sm font-bold text-text-gray dark:text-gray-500 flex-shrink-0">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Resp Rate + Temperature */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={innerCardClass}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-gray dark:text-gray-400 uppercase tracking-wider">Resp. Rate</span>
                                <span className="material-symbols-outlined text-accent-purple text-xl">pulmonology</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input name="respRate" type="number" min="0" max="100" value={vitals.respRate}
                                    onChange={handleVitalChange}
                                    className="w-full bg-transparent text-3xl font-black text-text-dark dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600"
                                    placeholder="—" />
                                <span className="text-sm font-bold text-text-gray dark:text-gray-500 flex-shrink-0">bpm</span>
                            </div>
                        </div>

                        <div className={innerCardClass}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-gray dark:text-gray-400 uppercase tracking-wider">Temperature</span>
                                <span className="material-symbols-outlined text-amber-500 text-xl">thermostat</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input name="temperature" type="number" step="0.1" min="30" max="45" value={vitals.temperature}
                                    onChange={handleVitalChange}
                                    className="w-full bg-transparent text-3xl font-black text-text-dark dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600"
                                    placeholder="—" />
                                <span className="text-sm font-bold text-text-gray dark:text-gray-500 flex-shrink-0">°C</span>
                            </div>
                        </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className={innerCardClass}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-text-gray dark:text-gray-400 uppercase tracking-wider">Blood Pressure</span>
                            <span className="material-symbols-outlined text-success-green text-xl">bloodtype</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input name="bpSystolic" type="number" min="0" max="300" value={vitals.bpSystolic}
                                onChange={handleVitalChange}
                                className="w-20 bg-transparent text-3xl font-black text-text-dark dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600 text-center"
                                placeholder="120" />
                            <span className="text-3xl font-black text-text-gray dark:text-gray-500">/</span>
                            <input name="bpDiastolic" type="number" min="0" max="200" value={vitals.bpDiastolic}
                                onChange={handleVitalChange}
                                className="w-20 bg-transparent text-3xl font-black text-text-dark dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600 text-center"
                                placeholder="80" />
                            <span className="text-sm font-bold text-text-gray dark:text-gray-500 ml-auto">mmHg</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── BED ALLOCATION ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-accent-purple/10 dark:bg-accent-purple/15 border border-accent-purple/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-accent-purple text-lg">bed</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-text-dark dark:text-white">Bed Allocation</h2>
                        <p className="text-xs text-text-gray dark:text-gray-500 font-medium">Check availability & severity</p>
                    </div>
                </div>

                <div className={cardClass}>
                    <p className="text-sm text-text-gray dark:text-gray-400 font-medium mb-5">
                        Based on the vitals entered, the system will calculate a severity score and recommend an appropriate ward.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCheckAvailability}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base font-black shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all">
                        <span className="material-symbols-outlined text-xl">bed</span>
                        Check Availability
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default IndividualDashboard;
