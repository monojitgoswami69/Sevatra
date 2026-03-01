import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { operatorApi, type OperatorData } from '../services/api';
import { useOperator } from '../context/OperatorContext';

const OperatorProfile = () => {
    const { profile: ctxProfile, syncProfile } = useOperator();
    const [profile, setProfile] = useState<OperatorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        facility_name: '',
        facility_address: '',
        facility_phone: '',
        license_number: '',
    });

    useEffect(() => {
        const load = async () => {
            try {
                const p = await operatorApi.getProfile();
                setProfile(p);
                setForm({
                    full_name: p.full_name || '',
                    phone: p.phone || '',
                    facility_name: p.facility_name || '',
                    facility_address: p.facility_address || '',
                    facility_phone: p.facility_phone || '',
                    license_number: p.license_number || '',
                });
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const updated = await operatorApi.updateProfile({
                full_name: form.full_name || undefined,
                phone: form.phone || undefined,
                facility_name: form.facility_name || undefined,
                facility_address: form.facility_address || undefined,
                facility_phone: form.facility_phone || undefined,
                license_number: form.license_number || undefined,
            });
            setProfile(updated);
            syncProfile();
            setEditing(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const labelClass = "text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-1.5 block";
    const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all";
    const valueClass = "text-sm font-medium text-text-dark dark:text-white";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="material-symbols-outlined text-4xl text-amber-500 animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Profile</h1>
                        <p className="text-text-gray dark:text-gray-400 text-sm font-medium mt-1">Manage your operator account</p>
                    </div>
                    {!editing && (
                        <button onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-dark dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Edit
                        </button>
                    )}
                </div>

                {/* Alerts */}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-success-green/10 border border-success-green/20 text-success-green text-sm font-bold mb-6">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        {success}
                    </motion.div>
                )}
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emergency-red/10 border border-emergency-red/20 text-emergency-red text-sm font-bold mb-6">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                {/* Profile Card */}
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    {/* Banner */}
                    <div className="h-24 bg-gradient-to-r from-amber-500 to-orange-600 relative">
                        <div className="absolute -bottom-8 left-6">
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                                <span className="text-2xl font-black bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                    {(profile?.full_name || ctxProfile?.email || 'O').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="absolute top-3 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                profile?.operator_type === 'provider'
                                    ? 'bg-white/20 text-white backdrop-blur-sm'
                                    : 'bg-white/20 text-white backdrop-blur-sm'
                            }`}>
                                {profile?.operator_type === 'provider' ? '🏥 Provider' : '🚑 Individual'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-12 px-6 pb-6">
                        {editing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Full Name</label>
                                        <input name="full_name" value={form.full_name} onChange={handleChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <input name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>License Number</label>
                                        <input name="license_number" value={form.license_number} onChange={handleChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <p className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-text-gray text-sm font-medium">
                                            {ctxProfile?.email || '—'}
                                        </p>
                                    </div>
                                </div>

                                {profile?.operator_type === 'provider' && (
                                    <>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="material-symbols-outlined text-amber-500 text-lg">business</span>
                                                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Facility</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Facility Name</label>
                                                <input name="facility_name" value={form.facility_name} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Facility Phone</label>
                                                <input name="facility_phone" type="tel" value={form.facility_phone} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className={labelClass}>Facility Address</label>
                                                <input name="facility_address" value={form.facility_address} onChange={handleChange} className={inputClass} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setEditing(false)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-text-dark dark:text-white font-bold text-sm transition-all">
                                        Cancel
                                    </button>
                                    <motion.button whileTap={{ scale: 0.98 }} disabled={saving} type="submit"
                                        className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                        {saving
                                            ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                            : <><span className="material-symbols-outlined text-sm">save</span>Save Changes</>}
                                    </motion.button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>Full Name</label>
                                        <p className={valueClass}>{profile?.full_name || '—'}</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <p className={valueClass}>{ctxProfile?.email || '—'}</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <p className={valueClass}>{profile?.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>License Number</label>
                                        <p className={valueClass}>{profile?.license_number || '—'}</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Operator Type</label>
                                        <p className={valueClass}>{profile?.operator_type === 'provider' ? 'Provider / Facility' : 'Individual'}</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Member Since</label>
                                        <p className={valueClass}>
                                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                </div>

                                {profile?.operator_type === 'provider' && (
                                    <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">business</span>
                                            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Facility Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className={labelClass}>Facility Name</label>
                                                <p className={valueClass}>{profile?.facility_name || '—'}</p>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Facility Phone</label>
                                                <p className={valueClass}>{profile?.facility_phone || '—'}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className={labelClass}>Facility Address</label>
                                                <p className={valueClass}>{profile?.facility_address || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OperatorProfile;
