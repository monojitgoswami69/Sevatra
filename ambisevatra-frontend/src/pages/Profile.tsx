import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, type SavedAddress } from '../context/UserContext';
import { usersApi, authApi } from '../services/api';

const Profile = () => {
    const navigate = useNavigate();
    const { isLoggedIn, profile, updateProfile, logout, syncProfile } = useUser();

    const [activeTab, setActiveTab] = useState<'personal' | 'addresses' | 'medical'>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Local form mirrors for editing
    const [personal, setPersonal] = useState({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
    });

    const [addresses, setAddresses] = useState<SavedAddress[]>(
        profile.addresses.length > 0 ? profile.addresses : [
            { label: 'Home', address: '', icon: 'home' },
            { label: 'Work', address: '', icon: 'work' },
        ]
    );
    const [newAddrLabel, setNewAddrLabel] = useState('');
    const [newAddrValue, setNewAddrValue] = useState('');

    const [emergencyContacts, setEmergencyContacts] = useState(
        profile.emergencyContacts.length > 0 ? profile.emergencyContacts : [{ name: '', phone: '' }]
    );
    const [conditions, setConditions] = useState<string[]>(profile.medicalConditions);
    const [newCondition, setNewCondition] = useState('');

    // Phone OTP verification
    const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verifying'>('idle');
    const [otpCode, setOtpCode] = useState('');
    const [otpMsg, setOtpMsg] = useState('');
    const [phoneVerified, setPhoneVerified] = useState(false);

    if (!isLoggedIn) {
        navigate('/login');
        return null;
    }

    const flash = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 2500); };

    const sendPhoneOtp = async () => {
        if (!personal.phone || personal.phone.length < 10) {
            setOtpMsg('Enter a valid phone number first');
            return;
        }
        try {
            setOtpStep('verifying');
            const res = await authApi.sendOtp(personal.phone);
            if (res.success) {
                setOtpStep('sent');
                setOtpMsg('OTP sent to ' + personal.phone);
            } else {
                setOtpStep('idle');
                setOtpMsg(res.message || 'Failed to send OTP');
            }
        } catch (err) {
            setOtpStep('idle');
            setOtpMsg(err instanceof Error ? err.message : 'Failed to send OTP');
        }
    };

    const verifyPhoneOtp = async () => {
        if (!otpCode || otpCode.length < 4) {
            setOtpMsg('Enter the OTP code');
            return;
        }
        try {
            setOtpStep('verifying');
            const res = await authApi.verifyOtp(personal.phone, otpCode);
            if (res.success) {
                setPhoneVerified(true);
                setOtpStep('idle');
                setOtpCode('');
                setOtpMsg('');
                flash('Phone verified!');
            } else {
                setOtpStep('sent');
                setOtpMsg(res.message || 'Invalid OTP');
            }
        } catch (err) {
            setOtpStep('sent');
            setOtpMsg(err instanceof Error ? err.message : 'Verification failed');
        }
    };

    const savePersonal = async () => {
        setIsSaving(true);
        try {
            await usersApi.updateProfile({
                full_name: personal.fullName,
                phone: personal.phone,
                age: personal.age ? parseInt(personal.age) : null,
                gender: personal.gender || null,
                blood_group: personal.bloodGroup || null,
            });
            updateProfile(personal);
            setIsEditing(false);
            flash('Profile saved!');
        } catch (err) {
            flash('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally { setIsSaving(false); }
    };

    const saveAddresses = async () => {
        setIsSaving(true);
        try {
            // Delete all existing, then re-create (simple sync strategy)
            const existing = await usersApi.listAddresses();
            await Promise.all(existing.map(a => usersApi.deleteAddress(a.id)));
            const toSave = addresses.filter(a => a.address.trim());
            await Promise.all(toSave.map(a => usersApi.createAddress({ label: a.label, address: a.address, icon: a.icon })));
            await syncProfile();
            flash('Addresses saved!');
        } catch (err) {
            flash('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally { setIsSaving(false); }
    };

    const saveMedical = async () => {
        setIsSaving(true);
        try {
            // Sync conditions: delete old, add new
            const existingConditions = await usersApi.listMedicalConditions();
            await Promise.all(existingConditions.map(c => usersApi.deleteMedicalCondition(c.id)));
            await Promise.all(conditions.map(c => usersApi.createMedicalCondition({ condition: c })));

            // Sync emergency contacts
            const existingContacts = await usersApi.listEmergencyContacts();
            await Promise.all(existingContacts.map(c => usersApi.deleteEmergencyContact(c.id)));
            const validContacts = emergencyContacts.filter(c => c.name.trim() || c.phone.trim());
            await Promise.all(validContacts.map(c => usersApi.createEmergencyContact({ name: c.name, phone: c.phone })));

            await syncProfile();
            flash('Medical info saved!');
        } catch (err) {
            flash('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally { setIsSaving(false); }
    };

    const addAddress = () => {
        if (!newAddrLabel.trim() || !newAddrValue.trim()) return;
        setAddresses(prev => [...prev, { label: newAddrLabel, address: newAddrValue, icon: 'location_on' }]);
        setNewAddrLabel('');
        setNewAddrValue('');
    };

    const removeAddress = (idx: number) => setAddresses(prev => prev.filter((_, i) => i !== idx));
    const addEmergencyContact = () => setEmergencyContacts(prev => [...prev, { name: '', phone: '' }]);
    const removeEmergencyContact = (idx: number) => setEmergencyContacts(prev => prev.filter((_, i) => i !== idx));
    const addCondition = () => { if (newCondition.trim()) { setConditions(prev => [...prev, newCondition.trim()]); setNewCondition(''); } };
    const removeCondition = (idx: number) => setConditions(prev => prev.filter((_, i) => i !== idx));

    const inputBase = "w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-blue dark:focus:border-primary-blue py-3 text-base text-text-dark dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors duration-300 font-medium";
    const labelBase = "text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-1.5 block";

    const tabs = [
        { key: 'personal' as const, label: 'Personal', icon: 'person' },
        { key: 'addresses' as const, label: 'Addresses', icon: 'location_on' },
        { key: 'medical' as const, label: 'Medical', icon: 'medical_information' },
    ];

    const initials = personal.fullName ? personal.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

    return (
        <div className="flex-1 w-full min-h-screen bg-white dark:bg-background-dark">
            <div className="h-1 w-full bg-gradient-to-r from-primary-blue via-accent-purple to-primary-blue"></div>

            <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-28 pb-16">

                {/* Save toast */}
                <AnimatePresence>
                    {saveMsg && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-success-green text-white text-sm font-bold shadow-xl">
                            {saveMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-blue to-accent-purple flex items-center justify-center text-white text-2xl font-black shadow-lg">
                            {initials}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-black text-text-dark dark:text-white tracking-tight">
                                {personal.fullName || 'Your Profile'}
                            </h1>
                            <p className="text-text-gray dark:text-gray-400 text-sm font-medium mt-1">{personal.email || 'Complete your profile below'}</p>
                        </div>
                        <button onClick={() => { logout(); navigate('/'); }}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-text-gray dark:text-gray-400 hover:text-emergency-red hover:bg-emergency-red/10 transition-all">
                            <span className="material-symbols-outlined text-lg">logout</span>
                            Sign Out
                        </button>
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 ${activeTab === tab.key ? 'bg-white dark:bg-gray-700 text-text-dark dark:text-white shadow-sm' : 'text-text-gray dark:text-gray-400'
                                    }`}>
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Content */}
                <AnimatePresence mode="wait">

                    {/* ═══ PERSONAL ═══ */}
                    {activeTab === 'personal' && (
                        <motion.div key="personal" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-black text-text-dark dark:text-white font-mono">01</span>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800 w-12"></div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Personal Info</span>
                                </div>
                                <button onClick={() => isEditing ? savePersonal() : setIsEditing(true)} disabled={isSaving}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${isEditing ? 'bg-success-green/10 text-success-green hover:bg-success-green/20' : 'bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20'
                                        }`}>
                                    <span className="material-symbols-outlined text-base">{isSaving ? 'progress_activity' : isEditing ? 'check' : 'edit'}</span>
                                    {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                                <div>
                                    <label className={labelBase}>Full Name</label>
                                    {isEditing
                                        ? <input value={personal.fullName} onChange={e => setPersonal(p => ({ ...p, fullName: e.target.value }))} className={inputBase} placeholder="Jane Doe" />
                                        : <p className="text-base font-semibold text-text-dark dark:text-white py-3">{personal.fullName || '—'}</p>}
                                </div>
                                <div>
                                    <label className={labelBase}>Email</label>
                                    <p className="text-base font-semibold text-text-dark dark:text-white py-3">{personal.email || '—'}</p>
                                </div>
                                <div>
                                    <label className={labelBase}>Phone</label>
                                    {isEditing
                                        ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2 items-end">
                                                    <input type="tel" value={personal.phone} onChange={e => { setPersonal(p => ({ ...p, phone: e.target.value })); setPhoneVerified(false); setOtpStep('idle'); }} className={`${inputBase} flex-1`} placeholder="+91 98765 43210" />
                                                    {!phoneVerified && (
                                                        <button type="button" onClick={sendPhoneOtp} disabled={otpStep === 'verifying' || !personal.phone}
                                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20 transition-all disabled:opacity-40 whitespace-nowrap">
                                                            <span className="material-symbols-outlined text-sm">{otpStep === 'verifying' ? 'progress_activity' : 'send'}</span>
                                                            {otpStep === 'sent' ? 'Resend OTP' : 'Verify'}
                                                        </button>
                                                    )}
                                                    {phoneVerified && (
                                                        <span className="flex items-center gap-1 text-success-green text-xs font-bold py-2">
                                                            <span className="material-symbols-outlined text-sm">verified</span>
                                                            Verified
                                                        </span>
                                                    )}
                                                </div>
                                                {otpStep === 'sent' && (
                                                    <div className="flex gap-2 items-end">
                                                        <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                            className={`${inputBase} flex-1`} placeholder="Enter OTP code" maxLength={6} />
                                                        <button type="button" onClick={verifyPhoneOtp} disabled={!otpCode}
                                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-success-green/10 text-success-green hover:bg-success-green/20 transition-all disabled:opacity-40 whitespace-nowrap">
                                                            <span className="material-symbols-outlined text-sm">check</span>
                                                            Confirm
                                                        </button>
                                                    </div>
                                                )}
                                                {otpMsg && <p className="text-xs text-text-gray dark:text-gray-400">{otpMsg}</p>}
                                            </div>
                                        )
                                        : <p className="text-base font-semibold text-text-dark dark:text-white py-3">{personal.phone || '—'}</p>}
                                </div>
                                <div>
                                    <label className={labelBase}>Age</label>
                                    {isEditing
                                        ? <input type="number" value={personal.age} onChange={e => setPersonal(p => ({ ...p, age: e.target.value }))} className={inputBase} placeholder="35" />
                                        : <p className="text-base font-semibold text-text-dark dark:text-white py-3">{personal.age || '—'}</p>}
                                </div>
                                <div>
                                    <label className={labelBase}>Gender</label>
                                    {isEditing
                                        ? <select value={personal.gender} onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))} className={`${inputBase} cursor-pointer`}>
                                            <option value="">Select</option>
                                            <option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option>
                                        </select>
                                        : <p className="text-base font-semibold text-text-dark dark:text-white py-3">{personal.gender || '—'}</p>}
                                </div>
                                <div>
                                    <label className={labelBase}>Blood Group</label>
                                    {isEditing
                                        ? <select value={personal.bloodGroup} onChange={e => setPersonal(p => ({ ...p, bloodGroup: e.target.value }))} className={`${inputBase} cursor-pointer`}>
                                            <option value="">Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg}>{bg}</option>)}
                                        </select>
                                        : <p className="text-base font-semibold text-text-dark dark:text-white py-3">
                                            {personal.bloodGroup ? <span className="inline-flex items-center gap-1 px-3 py-1 bg-emergency-red/10 text-emergency-red text-sm font-bold rounded-full">{personal.bloodGroup}</span> : '—'}
                                        </p>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ ADDRESSES ═══ */}
                    {activeTab === 'addresses' && (
                        <motion.div key="addresses" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-2xl font-black text-text-dark dark:text-white font-mono">02</span>
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Saved Addresses</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                {addresses.map((addr, i) => (
                                    <div key={i} className="flex items-start gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="material-symbols-outlined text-primary-blue text-lg">{addr.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <label className={labelBase}>{addr.label}</label>
                                            <input
                                                value={addr.address}
                                                onChange={e => setAddresses(prev => prev.map((a, j) => j === i ? { ...a, address: e.target.value } : a))}
                                                className={inputBase}
                                                placeholder={`Enter ${addr.label.toLowerCase()} address`}
                                            />
                                        </div>
                                        {addr.label !== 'Home' && addr.label !== 'Work' && (
                                            <button onClick={() => removeAddress(i)} className="mt-4 p-2 rounded-lg text-gray-400 hover:text-emergency-red hover:bg-emergency-red/10 transition-all opacity-0 group-hover:opacity-100">
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add custom address */}
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                                <p className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500 mb-4">Add Custom Address</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input value={newAddrLabel} onChange={e => setNewAddrLabel(e.target.value)} className={`${inputBase} sm:w-40`} placeholder="Label (e.g. Gym)" />
                                    <input value={newAddrValue} onChange={e => setNewAddrValue(e.target.value)} className={`${inputBase} flex-1`} placeholder="Full address" />
                                    <button onClick={addAddress} disabled={!newAddrLabel.trim() || !newAddrValue.trim()}
                                        className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap">
                                        <span className="material-symbols-outlined text-base">add</span>
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveAddresses} disabled={isSaving}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl h-12 px-8 bg-gradient-to-r from-primary-blue to-accent-purple text-white text-sm font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50">
                                    <span className="material-symbols-outlined text-lg">{isSaving ? 'progress_activity' : 'save'}</span>
                                    {isSaving ? 'Saving...' : 'Save Addresses'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ MEDICAL ═══ */}
                    {activeTab === 'medical' && (
                        <motion.div key="medical" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-2xl font-black text-text-dark dark:text-white font-mono">03</span>
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-text-gray dark:text-gray-500">Medical Info</span>
                            </div>

                            {/* Conditions */}
                            <div className="mb-10">
                                <p className={labelBase}>Medical Conditions / Allergies</p>
                                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                                    {conditions.map((c, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-emergency-red/10 text-emergency-red border border-emergency-red/20">
                                            {c}
                                            <button onClick={() => removeCondition(i)} className="hover:bg-emergency-red/20 rounded-full p-0.5 transition-colors">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </span>
                                    ))}
                                    {conditions.length === 0 && <span className="text-sm text-gray-400 py-2">No conditions added</span>}
                                </div>
                                <div className="flex gap-3">
                                    <input value={newCondition} onChange={e => setNewCondition(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                                        className={`${inputBase} flex-1`} placeholder="e.g. Asthma, Penicillin Allergy" />
                                    <button onClick={addCondition} disabled={!newCondition.trim()}
                                        className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold bg-emergency-red/10 text-emergency-red hover:bg-emergency-red/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap">
                                        <span className="material-symbols-outlined text-base">add</span>
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Emergency Contacts */}
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                                <div className="flex items-center justify-between mb-6">
                                    <p className={labelBase}>Emergency Contacts</p>
                                    <button onClick={addEmergencyContact}
                                        className="flex items-center gap-1 text-xs font-bold text-primary-blue hover:bg-primary-blue/10 px-3 py-1.5 rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        Add Contact
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {emergencyContacts.map((contact, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-accent-purple text-lg">contact_phone</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                                <input value={contact.name}
                                                    onChange={e => setEmergencyContacts(prev => prev.map((c, j) => j === i ? { ...c, name: e.target.value } : c))}
                                                    className={inputBase} placeholder="Contact name" />
                                                <input value={contact.phone} type="tel"
                                                    onChange={e => setEmergencyContacts(prev => prev.map((c, j) => j === i ? { ...c, phone: e.target.value } : c))}
                                                    className={inputBase} placeholder="Phone number" />
                                            </div>
                                            <button onClick={() => removeEmergencyContact(i)} className="p-2 rounded-lg text-gray-400 hover:text-emergency-red hover:bg-emergency-red/10 transition-all opacity-0 group-hover:opacity-100">
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveMedical} disabled={isSaving}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl h-12 px-8 bg-gradient-to-r from-primary-blue to-accent-purple text-white text-sm font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50">
                                    <span className="material-symbols-outlined text-lg">{isSaving ? 'progress_activity' : 'save'}</span>
                                    {isSaving ? 'Saving...' : 'Save Medical Info'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Profile;
