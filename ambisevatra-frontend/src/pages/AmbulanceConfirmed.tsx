import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const AmbulanceConfirmed = () => {
    useEffect(() => {
        // Adding confetti effect logic or similar if needed
    }, []);

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 mt-24 text-center min-h-[70vh] flex flex-col items-center justify-center animate-[slideIn_0.5s_ease-out_forwards]">
            <div className="text-success-green animate-bounce mb-6">
                <span className="material-symbols-outlined text-8xl drop-shadow-[0_0_20px_rgba(46,204,113,0.5)]">
                    check_circle
                </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-text-dark dark:text-white mb-4">
                Ambulance Confirmed!
            </h1>
            <p className="text-lg text-text-gray dark:text-gray-400 mb-8 max-w-xl">
                Your ambulance has been dispatched. Hold on tight, help is on the way.
            </p>

            <div className="bg-white dark:bg-gray-900 border-2 border-primary-blue/30 rounded-2xl shadow-xl w-full max-w-md p-8 text-left mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-blue">ambulance</span>
                    Vehicle Details
                </h3>
                <ul className="space-y-4">
                    <li className="flex justify-between items-center border-b pb-2 dark:border-gray-800">
                        <span className="text-text-gray">License Plate</span>
                        <span className="font-mono font-bold text-text-dark dark:text-white">MH 12 AB 1234</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2 dark:border-gray-800">
                        <span className="text-text-gray">Driver Name</span>
                        <span className="font-bold text-text-dark dark:text-white">Rajesh Kumar</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2 dark:border-gray-800">
                        <span className="text-text-gray">Contact</span>
                        <span className="font-bold text-primary-blue">+91 98765 43210</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span className="text-text-gray">ETA</span>
                        <span className="font-bold text-emergency-red animate-pulse">8 min</span>
                    </li>
                </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link
                    to="/booking-history"
                    className="flex-1 bg-gray-200 dark:bg-gray-800 text-text-dark dark:text-white font-bold h-14 rounded-xl flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                    View Bookings
                </Link>
                <Link
                    to="/"
                    className="flex-1 bg-gradient-to-r from-primary-blue to-accent-purple text-white font-bold h-14 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
};

export default AmbulanceConfirmed;
