import { Link } from 'react-router-dom';

const BookingHistory = () => {
    const history = [
        {
            id: "BK-123456",
            date: "Feb 28, 2026",
            status: "Completed",
            type: "BLS Ambulance",
            pickup: "123 Maple Street, Springfield",
            dropoff: "City Hospital",
            cost: "₹500",
            driver: "Rajesh Kumar",
            ambulanceNo: "MH 12 AB 1234",
        },
        {
            id: "BK-123455",
            date: "Dec 15, 2025",
            status: "Completed",
            type: "ALS Ambulance",
            pickup: "45 Pine Avenue, Springfield",
            dropoff: "General Hospital",
            cost: "₹1200",
            driver: "Sanjay Singh",
            ambulanceNo: "MH 12 XY 9876",
        }
    ];

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

            <div className="space-y-6">
                {history.map((booking, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-shadow relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 dark:border-gray-800 pb-5 mb-5 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-success-green/10 text-success-green rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
                                    {booking.type.split(' ')[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-dark dark:text-white flex items-center gap-2">
                                        {booking.type}
                                        <span className="text-xs bg-success-green/20 text-success-green px-2 py-0.5 rounded border border-success-green/30">
                                            {booking.status}
                                        </span>
                                    </h3>
                                    <p className="text-sm font-semibold text-text-gray">{booking.date} • {booking.id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-2xl text-text-dark dark:text-white">{booking.cost}</p>
                                <button className="text-sm text-primary-blue font-bold hover:underline">Download Receipt</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="relative pl-6">
                                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                <div className="mb-6 relative">
                                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary-blue ring-4 ring-primary-blue/20"></div>
                                    <p className="text-xs font-bold text-text-gray mb-1 uppercase tracking-wider">Pick-up</p>
                                    <p className="font-bold text-text-dark dark:text-gray-200">{booking.pickup}</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-success-green ring-4 ring-success-green/20"></div>
                                    <p className="text-xs font-bold text-text-gray mb-1 uppercase tracking-wider">Drop-off</p>
                                    <p className="font-bold text-text-dark dark:text-gray-200">{booking.dropoff}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800/50">
                                <h4 className="text-sm font-bold text-text-gray mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">badge</span> Driver Details
                                </h4>
                                <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <span className="font-semibold text-text-dark dark:text-gray-300">Name</span>
                                    <span className="font-bold">{booking.driver}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-text-dark dark:text-gray-300">Vehicle</span>
                                    <span className="font-bold font-mono tracking-wider">{booking.ambulanceNo}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingHistory;
