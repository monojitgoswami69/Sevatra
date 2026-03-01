import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi, type BookingData } from '../services/api';

const BookingHistory = () => {
    const [history, setHistory] = useState<BookingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const data = await bookingsApi.list(50, 0);
                setHistory(data);
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
                setError(err instanceof Error ? err.message : 'Failed to load bookings');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await bookingsApi.cancel(id);
            setHistory(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            console.error('Failed to cancel booking:', err);
            alert('Failed to cancel booking.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-success-green/20 text-success-green border-success-green/30';
            case 'confirmed': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            case 'in_transit': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'pending': return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
            case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/30';
            default: return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
        }
    };

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 mt-24 animate-[slideIn_0.5s_ease-out_forwards]">
            <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-text-dark dark:text-white flex items-center gap-3 justify-center sm:justify-start">
                        <span className="material-symbols-outlined text-primary-blue text-4xl">history</span>
                        Booking History
                    </h1>
                    <p className="text-text-gray dark:text-gray-400 mt-2 font-medium">Your past ambulance requests</p>
                </div>
                <Link
                    to="/smart-booking"
                    className="px-6 py-3 bg-primary-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    New Booking
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-text-gray animate-spin">progress_activity</span>
                    <p className="mt-4 text-text-gray font-medium">Loading bookings...</p>
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-red-400">error</span>
                    <p className="mt-4 text-red-400 font-medium">{error}</p>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-text-gray">event_busy</span>
                    <p className="mt-4 text-text-gray font-medium">No bookings yet</p>
                    <Link to="/smart-booking" className="inline-block mt-4 px-6 py-3 bg-primary-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">
                        Book Your First Ambulance
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {history.map((booking) => (
                        <div key={booking.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-shadow relative">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 dark:border-gray-800 pb-5 mb-5 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-primary-blue/10 text-primary-blue rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
                                        <span className="material-symbols-outlined">
                                            {booking.booking_type === 'sos' ? 'emergency' : 'local_hospital'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-text-dark dark:text-white flex items-center gap-2">
                                            {booking.patient_name}
                                            {booking.booking_type === 'sos' && (
                                                <span className="text-xs px-2 py-0.5 rounded border bg-emergency-red/20 text-emergency-red border-emergency-red/30">
                                                    SOS
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(booking.status)}`}>
                                                {booking.status.replace('_', ' ')}
                                            </span>
                                        </h3>
                                        <p className="text-sm font-semibold text-text-gray">
                                            {booking.scheduled_date} at {booking.scheduled_time} • {booking.id}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <Link
                                        to="/ambulance-confirmed"
                                        state={{ booking }}
                                        className="px-4 py-2 bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20 rounded-lg font-bold text-sm transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">visibility</span>
                                        View
                                    </Link>
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                        <button
                                            onClick={() => handleCancel(booking.id)}
                                            className="text-sm text-red-500 font-bold hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="relative pl-6">
                                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="mb-6 relative">
                                        <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary-blue ring-4 ring-primary-blue/20"></div>
                                        <p className="text-xs font-bold text-text-gray mb-1 uppercase tracking-wider">Pick-up</p>
                                        <p className="font-bold text-text-dark dark:text-gray-200">{booking.pickup_address}</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-success-green ring-4 ring-success-green/20"></div>
                                        <p className="text-xs font-bold text-text-gray mb-1 uppercase tracking-wider">Destination</p>
                                        <p className="font-bold text-text-dark dark:text-gray-200">{booking.destination}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800/50">
                                    <h4 className="text-sm font-bold text-text-gray mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined">info</span> Booking Details
                                    </h4>
                                    {booking.assigned_ambulance && (
                                        <>
                                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                                <span className="font-semibold text-text-dark dark:text-gray-300">Ambulance</span>
                                                <span className="font-bold font-mono">{booking.assigned_ambulance.vehicle_number}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                                <span className="font-semibold text-text-dark dark:text-gray-300">Driver</span>
                                                <span className="font-bold">{booking.assigned_ambulance.driver_name}</span>
                                            </div>
                                            {booking.assigned_ambulance.distance_km != null && (
                                                <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                                    <span className="font-semibold text-text-dark dark:text-gray-300">Distance</span>
                                                    <span className="font-bold">{booking.assigned_ambulance.distance_km} km away</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                        <span className="font-semibold text-text-dark dark:text-gray-300">Patient Phone</span>
                                        <span className="font-bold">{booking.patient_phone}</span>
                                    </div>
                                    {booking.reason && (
                                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                            <span className="font-semibold text-text-dark dark:text-gray-300">Reason</span>
                                            <span className="font-bold">{booking.reason}</span>
                                        </div>
                                    )}
                                    {booking.additional_notes && (
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-text-dark dark:text-gray-300">Notes</span>
                                            <span className="font-bold text-sm">{booking.additional_notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookingHistory;
