import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { operatorApi, type AmbulanceData, type DashboardStats } from '../services/api';
import { useOperator } from '../context/OperatorContext';

const statusColors: Record<string, string> = {
    available: 'bg-success-green/10 text-success-green border-success-green/20',
    on_trip: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    maintenance: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
    off_duty: 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
};

const statusIcons: Record<string, string> = {
    available: 'check_circle', on_trip: 'directions_car', maintenance: 'build', off_duty: 'power_settings_new',
};

const Dashboard = () => {
    const { profile } = useOperator();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, a] = await Promise.all([
                    operatorApi.getDashboard(),
                    operatorApi.listAmbulances(),
                ]);
                setStats(s);
                setAmbulances(a);
            } catch (err) { console.error('Dashboard load error:', err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const statCards = stats ? [
        { label: 'Total', value: stats.total_ambulances, icon: 'local_shipping', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
        { label: 'Available', value: stats.available_ambulances, icon: 'check_circle', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
        { label: 'On Trip', value: stats.on_trip_ambulances, icon: 'directions_car', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
        { label: 'Maintenance', value: stats.maintenance_ambulances, icon: 'build', color: 'from-yellow-500 to-amber-600', shadow: 'shadow-yellow-500/20' },
        { label: 'Off Duty', value: stats.off_duty_ambulances, icon: 'power_settings_new', color: 'from-gray-400 to-gray-600', shadow: 'shadow-gray-400/20' },
    ] : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="material-symbols-outlined text-4xl text-amber-500 animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-black text-text-dark dark:text-white tracking-tight">
                    Welcome back,{' '}
                    <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        {profile?.fullName?.split(' ')[0] || 'Operator'}
                    </span>
                </h1>
                <p className="text-text-gray dark:text-gray-400 text-base font-medium mt-1">
                    Here's an overview of your ambulance fleet.
                </p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                {statCards.map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} text-white p-5 shadow-lg ${card.shadow}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="material-symbols-outlined text-2xl opacity-80">{card.icon}</span>
                        </div>
                        <p className="text-3xl font-black">{card.value}</p>
                        <p className="text-sm font-bold opacity-80 mt-1">{card.label}</p>
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                    </motion.div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/ambulances/add"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Add Ambulance
                </Link>
                <Link to="/ambulances"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-dark dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                    <span className="material-symbols-outlined text-lg">list</span>
                    View All
                </Link>
            </div>

            {/* Recent ambulances */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-text-dark dark:text-white">Your Ambulances</h2>
                    {ambulances.length > 5 && (
                        <Link to="/ambulances" className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline">View all →</Link>
                    )}
                </div>

                {ambulances.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4 block">local_shipping</span>
                        <h3 className="text-lg font-black text-text-dark dark:text-white mb-2">No Ambulances Yet</h3>
                        <p className="text-sm text-text-gray dark:text-gray-400 mb-6">Add your first ambulance to get started.</p>
                        <Link to="/ambulances/add"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg">
                            <span className="material-symbols-outlined text-lg">add</span>Add Ambulance
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {ambulances.slice(0, 5).map((amb, i) => (
                            <motion.div key={amb.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-amber-300 dark:hover:border-amber-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">
                                            {amb.ambulance_type === 'als' ? 'emergency' : amb.ambulance_type === 'bls' ? 'local_shipping' : 'airport_shuttle'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-text-dark dark:text-white">
                                            {amb.vehicle_make || ''} {amb.vehicle_model || ''}
                                        </h3>
                                        <p className="text-xs text-text-gray dark:text-gray-400 font-medium">
                                            {amb.vehicle_number} · {amb.ambulance_type.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[amb.status] || statusColors['off_duty']}`}>
                                        <span className="material-symbols-outlined text-sm">{statusIcons[amb.status] || 'circle'}</span>
                                        {amb.status.replace('_', ' ')}
                                    </span>
                                    <Link to={`/ambulances`}
                                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <span className="material-symbols-outlined text-lg text-text-gray">chevron_right</span>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Dashboard;
