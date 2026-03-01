import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="flex-1 w-full px-4 py-8 mt-24 animate-[slideIn_0.5s_ease-out_forwards]">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-text-dark dark:text-white mb-6 font-display">
                        About AmbiSevatra
                    </h1>
                    <p className="text-lg md:text-xl text-text-gray dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Reimagining emergency medical response with bleeding-edge technology, AI triage, and a
                        human-centric approach to save lives when seconds matter most.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl">
                        <div className="w-14 h-14 bg-primary-blue/10 rounded-2xl flex items-center justify-center mb-6 text-primary-blue">
                            <span className="material-symbols-outlined text-3xl">lightbulb</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                        <p className="text-text-gray dark:text-gray-400">
                            To drastically reduce emergency response times across the globe through a smart, interconnected network
                            of ambulances, hospitals, and patients. We believe every life is precious and technology is the key to
                            faster, more effective care.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl">
                        <div className="w-14 h-14 bg-success-green/10 rounded-2xl flex items-center justify-center mb-6 text-success-green">
                            <span className="material-symbols-outlined text-3xl">public</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                        <p className="text-text-gray dark:text-gray-400">
                            A world where emergency medical assistance is accessible to everyone within 8 minutes. We aim to
                            eradicate fatalities caused by delays in medical transport by optimizing routes, democratizing access,
                            and empowering paramedics.
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-background-dark p-8 md:p-12 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emergency-red/20 rounded-full blur-3xl -ml-24 -mb-24"></div>

                    <h2 className="text-3xl font-bold mb-8 text-center relative z-10">Why We Are Different</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 text-center">
                        <div>
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-success-green to-emerald-400 block mb-2">AI</span>
                            <p className="font-semibold text-gray-300">Driven Triage</p>
                        </div>
                        <div>
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-blue-400 block mb-2">8m</span>
                            <p className="font-semibold text-gray-300">Average ETA</p>
                        </div>
                        <div>
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emergency-red to-rose-400 block mb-2">24/7</span>
                            <p className="font-semibold text-gray-300">Live Support</p>
                        </div>
                    </div>
                </div>

                <div className="text-center pb-10">
                    <Link
                        to="/smart-booking"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white font-bold rounded-xl hover:shadow-glow transition-all hover:scale-105"
                    >
                        <span className="material-symbols-outlined">rocket_launch</span>
                        Experience Smart Booking
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default About;
