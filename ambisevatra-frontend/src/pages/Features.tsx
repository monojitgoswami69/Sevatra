import { Link } from 'react-router-dom';

const Features = () => {
    const featuresList = [
        {
            icon: 'instant_mix',
            title: 'AI Symptom Analyzer',
            description: 'Intelligent triage identifies the exact ambulance type needed within seconds based on symptoms.',
            color: 'primary-blue',
            gradient: 'from-primary-blue to-accent-purple'
        },
        {
            icon: 'location_on',
            title: 'Real-Time Tracking',
            description: 'Live GPS updates keep you informed of the ambulance location and exact ETA to your doorstep.',
            color: 'success-green',
            gradient: 'from-success-green to-emerald-400'
        },
        {
            icon: 'speed',
            title: '5-Second Emergency SOS',
            description: 'Single-tap activation dispatches help instantly to your exact GPS coordinates.',
            color: 'emergency-red',
            gradient: 'from-emergency-red to-rose-500'
        },
        {
            icon: 'local_hospital',
            title: 'Hospital Bed Tracking',
            description: 'We connect directly to local hospitals to ensure a bed is ready before you even arrive.',
            color: 'warning-yellow',
            gradient: 'from-warning-yellow to-yellow-500'
        },
        {
            icon: 'qr_code_scanner',
            title: 'Medical QR Tag',
            description: 'Instant access to your critical medical history via a scannable QR code by paramedics.',
            color: 'accent-purple',
            gradient: 'from-accent-purple to-purple-600'
        },
        {
            icon: 'support_agent',
            title: '24/7 Priority Support',
            description: 'Round-the-clock trained medical dispatchers ready to guide you while help is on the way.',
            color: 'primary-blue',
            gradient: 'from-blue-600 to-primary-blue'
        }
    ];

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-24 animate-[slideIn_0.5s_ease-out_forwards]">
            <div className="text-center mb-16">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-text-dark dark:text-white mb-6 font-display">
                    Powerful <span className="bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">Features</span>
                </h1>
                <p className="text-lg text-text-gray dark:text-gray-400 max-w-2xl mx-auto">
                    Built with cutting-edge technology to ensure you get the fastest, most reliable emergency response possible.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-16">
                {featuresList.map((feature, idx) => (
                    <div
                        key={idx}
                        className={`group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl hover:-translate-y-2 transition-transform duration-300 hover:border-${feature.color}/50`}
                    >
                        {/* Background glow on hover */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                        <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined text-white text-3xl font-bold">
                                {feature.icon}
                            </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-text-dark dark:text-white mb-3">
                            {feature.title}
                        </h3>
                        <p className="text-text-gray dark:text-gray-400 leading-relaxed font-medium">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-r from-primary-blue/10 to-accent-purple/10 border-2 border-primary-blue/20 rounded-3xl p-8 sm:p-12 text-center shadow-xl animate-[pulse-subtle_3s_infinite]">
                <h2 className="text-3xl font-bold text-text-dark dark:text-white mb-4">
                    Ready to experience the future of emergency response?
                </h2>
                <Link
                    to="/login"
                    className="inline-block mt-4 px-8 py-4 bg-primary-blue text-white font-bold rounded-xl shadow-glow hover:bg-blue-600 transition-colors"
                >
                    Create Free Account
                </Link>
            </div>
        </div>
    );
};

export default Features;
