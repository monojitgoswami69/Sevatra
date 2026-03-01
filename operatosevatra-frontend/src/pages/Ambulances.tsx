import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { operatorApi, type AmbulanceData, type AmbulanceStatus } from '../services/api';

const statusColors: Record<string, string> = {
    available: 'bg-success-green/10 text-success-green border-success-green/20',
    on_trip: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    maintenance: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
    off_duty: 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
};

const statusIcons: Record<string, string> = {
    available: 'check_circle', on_trip: 'directions_car', maintenance: 'build', off_duty: 'power_settings_new',
};

const allStatuses: AmbulanceStatus[] = ['available', 'on_trip', 'maintenance', 'off_duty'];

const Ambulances = () => {
    const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<AmbulanceStatus | 'all'>('all');
    const [editingAmbulance, setEditingAmbulance] = useState<AmbulanceData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadAmbulances = useCallback(async () => {
        try {
            const data = await operatorApi.listAmbulances();
            setAmbulances(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAmbulances(); }, [loadAmbulances]);

    const handleStatusChange = async (id: string, status: AmbulanceStatus) => {
        setActionLoading(id);
        try {
            await operatorApi.updateAmbulanceStatus(id, status);
            await loadAmbulances();
        } catch (err) { console.error(err); }
        finally { setActionLoading(null); }
    };

    const handleDelete = async (id: string) => {
        setActionLoading(id);
        try {
            await operatorApi.deleteAmbulance(id);
            setAmbulances(prev => prev.filter(a => a.id !== id));
            setDeleteConfirm(null);
        } catch (err) { console.error(err); }
        finally { setActionLoading(null); }
    };

    const handleUpdateAmbulance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAmbulance) return;
        setActionLoading(editingAmbulance.id);
        try {
            const { id, operator_id, created_at, updated_at, ...update } = editingAmbulance;
            await operatorApi.updateAmbulance(id, update);
            await loadAmbulances();
            setEditingAmbulance(null);
        } catch (err) { console.error(err); }
        finally { setActionLoading(null); }
    };

    const filtered = filter === 'all' ? ambulances : ambulances.filter(a => a.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="material-symbols-outlined text-4xl text-amber-500 animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Ambulances</h1>
                    <p className="text-text-gray dark:text-gray-400 text-sm font-medium mt-1">
                        {ambulances.length} ambulance{ambulances.length !== 1 ? 's' : ''} in your fleet
                    </p>
                </div>
                <Link to="/ambulances/add"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all self-start">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Add Ambulance
                </Link>
            </motion.div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-100 dark:bg-gray-800 text-text-gray dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    All ({ambulances.length})
                </button>
                {allStatuses.map(s => {
                    const count = ambulances.filter(a => a.status === s).length;
                    return (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${filter === s ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-100 dark:bg-gray-800 text-text-gray dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                            <span className="material-symbols-outlined text-sm">{statusIcons[s]}</span>
                            {s.replace('_', ' ')} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Ambulance List */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4 block">local_shipping</span>
                    <h3 className="text-lg font-black text-text-dark dark:text-white mb-2">
                        {filter === 'all' ? 'No Ambulances Yet' : `No ${filter.replace('_', ' ')} ambulances`}
                    </h3>
                    <p className="text-sm text-text-gray dark:text-gray-400 mb-6">
                        {filter === 'all' ? 'Add your first ambulance to get started.' : 'Change the filter to view others.'}
                    </p>
                    {filter === 'all' && (
                        <Link to="/ambulances/add"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg">
                            <span className="material-symbols-outlined text-lg">add</span>Add Ambulance
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((amb, i) => (
                        <motion.div key={amb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            className="group p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-amber-300 dark:hover:border-amber-500/30 transition-all">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">
                                            {amb.ambulance_type === 'advanced' ? 'emergency' : amb.ambulance_type === 'basic' ? 'local_shipping' : 'airport_shuttle'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-black text-text-dark dark:text-white">
                                            {amb.vehicle_make || ''} {amb.vehicle_model || ''} {amb.vehicle_year ? `(${amb.vehicle_year})` : ''}
                                        </h3>
                                        <p className="text-sm text-text-gray dark:text-gray-400 font-medium mt-0.5">
                                            <span className="font-bold">{amb.vehicle_number}</span> · {amb.ambulance_type.toUpperCase()}
                                        </p>
                                        {amb.driver_name && (
                                            <p className="text-xs text-text-gray dark:text-gray-500 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                                {amb.driver_name} {amb.driver_phone && `· ${amb.driver_phone}`}
                                            </p>
                                        )}
                                        {amb.base_address && (
                                            <p className="text-xs text-text-gray dark:text-gray-500 mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                {amb.base_address}
                                            </p>
                                        )}
                                        {/* Equipment badges */}
                                        {(amb.has_oxygen || amb.has_defibrillator || amb.has_stretcher || amb.has_ventilator || amb.has_first_aid) && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {amb.has_oxygen && <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">Oxygen</span>}
                                                {amb.has_defibrillator && <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">Defibrillator</span>}
                                                {amb.has_stretcher && <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">Stretcher</span>}
                                                {amb.has_ventilator && <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">Ventilator</span>}
                                                {amb.has_first_aid && <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">First Aid</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {/* Status badge + dropdown */}
                                    <div className="relative group/dropdown">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${statusColors[amb.status] || statusColors['off_duty']}`}>
                                            {actionLoading === amb.id
                                                ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                : <span className="material-symbols-outlined text-sm">{statusIcons[amb.status]}</span>}
                                            {amb.status.replace('_', ' ')}
                                            <span className="material-symbols-outlined text-sm ml-1">expand_more</span>
                                        </span>
                                        <div className="absolute right-0 top-full mt-1 hidden group-hover/dropdown:block z-10">
                                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1 min-w-[140px]">
                                                {allStatuses.filter(s => s !== amb.status).map(s => (
                                                    <button key={s} onClick={() => handleStatusChange(amb.id, s)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">{statusIcons[s]}</span>
                                                        {s.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit */}
                                    <button onClick={() => setEditingAmbulance(amb)}
                                        className="p-2 rounded-lg text-text-gray hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>

                                    {/* Delete */}
                                    <button onClick={() => setDeleteConfirm(amb.id)}
                                        className="p-2 rounded-lg text-text-gray hover:text-emergency-red hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Delete confirmation modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                        onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-emergency-red text-3xl">warning</span>
                            </div>
                            <h3 className="text-lg font-black text-text-dark dark:text-white text-center mb-2">Delete Ambulance?</h3>
                            <p className="text-sm text-text-gray dark:text-gray-400 text-center mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-text-dark dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-3 rounded-xl bg-emergency-red text-white font-bold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                                    {actionLoading === deleteConfirm
                                        ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        : <><span className="material-symbols-outlined text-sm">delete</span>Delete</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit modal */}
            <AnimatePresence>
                {editingAmbulance && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 overflow-y-auto py-8"
                        onClick={() => setEditingAmbulance(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-text-dark dark:text-white">Edit Ambulance</h3>
                                <button onClick={() => setEditingAmbulance(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <span className="material-symbols-outlined text-xl text-text-gray">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleUpdateAmbulance} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-text-gray block mb-1">Make</label>
                                        <input value={editingAmbulance.vehicle_make ?? ''}
                                            onChange={e => setEditingAmbulance(prev => prev ? { ...prev, vehicle_make: e.target.value } : null)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-text-gray block mb-1">Model</label>
                                        <input value={editingAmbulance.vehicle_model ?? ''}
                                            onChange={e => setEditingAmbulance(prev => prev ? { ...prev, vehicle_model: e.target.value } : null)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-text-gray block mb-1">Year</label>
                                        <input type="number" value={editingAmbulance.vehicle_year ?? ''}
                                            onChange={e => setEditingAmbulance(prev => prev ? { ...prev, vehicle_year: parseInt(e.target.value) } : null)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-text-gray block mb-1">Registration</label>
                                        <input value={editingAmbulance.vehicle_number}
                                            onChange={e => setEditingAmbulance(prev => prev ? { ...prev, vehicle_number: e.target.value } : null)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-text-gray block mb-1">Driver Name</label>
                                        <input value={editingAmbulance.driver_name || ''}
                                            onChange={e => setEditingAmbulance(prev => prev ? { ...prev, driver_name: e.target.value } : null)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-text-gray block mb-1">Driver Phone</label>
                                        <input value={editingAmbulance.driver_phone || ''}
                                            onChange={e => setEditingAmbulance(prev => prev ? { ...prev, driver_phone: e.target.value } : null)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-text-gray block mb-1">Base Address</label>
                                    <input value={editingAmbulance.base_address || ''}
                                        onChange={e => setEditingAmbulance(prev => prev ? { ...prev, base_address: e.target.value } : null)}
                                        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium outline-none focus:border-amber-500" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setEditingAmbulance(null)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-text-dark dark:text-white font-bold text-sm transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit"
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2">
                                        {actionLoading === editingAmbulance.id
                                            ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                            : <><span className="material-symbols-outlined text-sm">save</span>Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Ambulances;
