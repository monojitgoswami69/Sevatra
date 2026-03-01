import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { operatorApi, type AmbulanceType } from '../services/api';

const commonEquipment = [
    { key: 'has_oxygen', label: 'Oxygen Tank' },
    { key: 'has_defibrillator', label: 'Defibrillator (AED)' },
    { key: 'has_stretcher', label: 'Stretcher' },
    { key: 'has_ventilator', label: 'Ventilator' },
    { key: 'has_first_aid', label: 'First Aid Kit' },
];

const AddAmbulance = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        vehicle_number: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: new Date().getFullYear(),
        ambulance_type: 'basic' as AmbulanceType,
        has_oxygen: false,
        has_defibrillator: false,
        has_stretcher: true,
        has_ventilator: false,
        has_first_aid: true,
        driver_name: '',
        driver_phone: '',
        driver_license_number: '',
        driver_experience_years: '' as string | number,
        base_latitude: '',
        base_longitude: '',
        base_address: '',
        service_radius_km: '',
        price_per_km: '',
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const toggleEquipment = (key: string) => {
        setForm(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await operatorApi.createAmbulance({
                vehicle_number: form.vehicle_number,
                vehicle_make: form.vehicle_make || undefined,
                vehicle_model: form.vehicle_model || undefined,
                vehicle_year: form.vehicle_year,
                ambulance_type: form.ambulance_type,
                has_oxygen: form.has_oxygen,
                has_defibrillator: form.has_defibrillator,
                has_stretcher: form.has_stretcher,
                has_ventilator: form.has_ventilator,
                has_first_aid: form.has_first_aid,
                driver_name: form.driver_name,
                driver_phone: form.driver_phone,
                driver_license_number: form.driver_license_number,
                driver_experience_years: form.driver_experience_years ? Number(form.driver_experience_years) : undefined,
                base_latitude: form.base_latitude ? parseFloat(String(form.base_latitude)) : undefined,
                base_longitude: form.base_longitude ? parseFloat(String(form.base_longitude)) : undefined,
                base_address: form.base_address || undefined,
                service_radius_km: form.service_radius_km ? parseFloat(String(form.service_radius_km)) : undefined,
                price_per_km: form.price_per_km ? parseFloat(String(form.price_per_km)) : undefined,
                notes: form.notes || undefined,
            });
            navigate('/ambulances');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add ambulance');
        } finally {
            setIsSubmitting(false);
        }
    };

    const sectionClass = "mb-8";
    const sectionTitle = "flex items-center gap-2 text-base font-black text-text-dark dark:text-white mb-4";
    const labelClass = "text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-1.5 block";
    const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-gray-400 dark:placeholder-gray-500";

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-xl text-text-gray">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Add Ambulance</h1>
                        <p className="text-text-gray dark:text-gray-400 text-sm font-medium mt-1">Register a new vehicle in your fleet</p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emergency-red/10 border border-emergency-red/20 text-emergency-red text-sm font-bold mb-6">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Vehicle Details */}
                    <div className={sectionClass}>
                        <h2 className={sectionTitle}>
                            <span className="material-symbols-outlined text-amber-500">directions_car</span>
                            Vehicle Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Vehicle Number / Plate *</label>
                                <input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} required className={inputClass} placeholder="e.g. 1234 TAA" />
                            </div>
                            <div>
                                <label className={labelClass}>Ambulance Type *</label>
                                <select name="ambulance_type" value={form.ambulance_type} onChange={handleChange}
                                    className={inputClass}>
                                    <option value="basic">BLS — Basic Life Support</option>
                                    <option value="advanced">ALS — Advanced Life Support</option>
                                    <option value="patient_transport">Patient Transport</option>
                                    <option value="neonatal">Neonatal</option>
                                    <option value="air">Air Ambulance</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Vehicle Make *</label>
                                <input name="vehicle_make" value={form.vehicle_make} onChange={handleChange} required className={inputClass} placeholder="e.g. Toyota" />
                            </div>
                            <div>
                                <label className={labelClass}>Vehicle Model *</label>
                                <input name="vehicle_model" value={form.vehicle_model} onChange={handleChange} required className={inputClass} placeholder="e.g. HiAce" />
                            </div>
                            <div>
                                <label className={labelClass}>Vehicle Year *</label>
                                <input name="vehicle_year" type="number" min={1990} max={2030} value={form.vehicle_year} onChange={handleChange} required className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className={sectionClass}>
                        <h2 className={sectionTitle}>
                            <span className="material-symbols-outlined text-amber-500">medical_services</span>
                            Equipment
                        </h2>
                        <p className="text-xs text-text-gray dark:text-gray-500 mb-3">Toggle equipment available in this ambulance</p>
                        <div className="flex flex-wrap gap-2">
                            {commonEquipment.map(item => {
                                const selected = form[item.key as keyof typeof form] as boolean;
                                return (
                                    <button key={item.key} type="button" onClick={() => toggleEquipment(item.key)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            selected
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                                                : 'bg-gray-50 dark:bg-gray-800 text-text-gray dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-500/30'
                                        }`}>
                                        {selected && <span className="material-symbols-outlined text-xs mr-1 align-middle">check</span>}
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Driver Info */}
                    <div className={sectionClass}>
                        <h2 className={sectionTitle}>
                            <span className="material-symbols-outlined text-amber-500">person</span>
                            Driver Information
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Driver Name *</label>
                                <input name="driver_name" value={form.driver_name} onChange={handleChange} required className={inputClass} placeholder="Full name" />
                            </div>
                            <div>
                                <label className={labelClass}>Driver Phone *</label>
                                <input name="driver_phone" type="tel" value={form.driver_phone} onChange={handleChange} required className={inputClass} placeholder="+261 34 00 000 00" />
                            </div>
                            <div>
                                <label className={labelClass}>Driver License # *</label>
                                <input name="driver_license_number" value={form.driver_license_number} onChange={handleChange} required className={inputClass} placeholder="License number" />
                            </div>
                            <div>
                                <label className={labelClass}>Experience (years)</label>
                                <input name="driver_experience_years" type="number" min="0" max="50" value={form.driver_experience_years} onChange={handleChange} className={inputClass} placeholder="e.g. 5" />
                            </div>
                        </div>
                    </div>

                    {/* Location & Pricing */}
                    <div className={sectionClass}>
                        <h2 className={sectionTitle}>
                            <span className="material-symbols-outlined text-amber-500">location_on</span>
                            Location & Pricing
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Base Address</label>
                                <input name="base_address" value={form.base_address} onChange={handleChange} className={inputClass} placeholder="Where this ambulance is stationed" />
                            </div>
                            <div>
                                <label className={labelClass}>Base Latitude</label>
                                <input name="base_latitude" type="number" step="any" value={form.base_latitude} onChange={handleChange} className={inputClass} placeholder="-18.9137" />
                            </div>
                            <div>
                                <label className={labelClass}>Base Longitude</label>
                                <input name="base_longitude" type="number" step="any" value={form.base_longitude} onChange={handleChange} className={inputClass} placeholder="47.5361" />
                            </div>
                            <div>
                                <label className={labelClass}>Service Radius (km)</label>
                                <input name="service_radius_km" type="number" step="0.1" min="1" max="500" value={form.service_radius_km} onChange={handleChange} className={inputClass} placeholder="e.g. 50" />
                            </div>
                            <div>
                                <label className={labelClass}>Price per KM (Ar)</label>
                                <input name="price_per_km" type="number" step="0.01" min="0" value={form.price_per_km} onChange={handleChange} className={inputClass} placeholder="e.g. 5000" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Notes</label>
                                <input name="notes" value={form.notes} onChange={handleChange} className={inputClass} placeholder="Any additional notes about this ambulance" />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <button type="button" onClick={() => navigate(-1)}
                            className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-dark dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                            Cancel
                        </button>
                        <motion.button whileHover={!isSubmitting ? { scale: 1.01 } : {}} whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                            disabled={isSubmitting} type="submit"
                            className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-xl disabled:opacity-60 transition-all">
                            {isSubmitting
                                ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                : <><span className="material-symbols-outlined text-lg">add</span>Add Ambulance</>}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AddAmbulance;
