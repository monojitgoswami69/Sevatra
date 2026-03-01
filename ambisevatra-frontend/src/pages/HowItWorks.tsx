import { Link } from 'react-router-dom';

const HowItWorks = () => {
    const steps = [
        {
            step: '01',
            icon: 'touch_app',
            title: 'Tap to Activate',
            desc: 'Open the app and either trigger the SOS button for instant dispatch or smart-book based on symptoms.',
            color: 'emergency-red',
        },
        {
            step: '02',
            icon: 'psychology',
            title: 'AI Triage',
            desc: 'Our intelligent system asks precise questions or uses voice recognition to determine the severity and right ambulance type.',
            color: 'accent-purple',
        },
        {
            step: '03',
            icon: 'ambulance',
            title: 'Instant Dispatch',
            desc: 'The nearest matching ambulance (BLS, ALS, or ICU) receives your live location and begins navigating immediately.',
            color: 'primary-blue',
        },
        {
            step: '04',
            icon: 'medical_services',
            title: 'Care Arrives',
            desc: 'Paramedics arrive equipped with your medical history and take you to a pre-notified hospital bed.',
            color: 'success-green',
        }
    ];

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-24 animate-[slideIn_0.5s_ease-out_forwards]">
            <div className="text-center mb-16">
                <h1 className="text-4xl sm:text-5xl font-black text-text-dark dark:text-white mb-6 font-display break-words">
                    How It Works
                </h1>
                <p className="text-lg text-text-gray dark:text-gray-400 max-w-2xl mx-auto">
                    Four simple steps to get the help you need, instantly.
                </p>
            </div>

            <div className="relative">
                {/* Connection Line */}
                <div className="hidden lg:block absolute top-[6.5rem] left-[10%] right-[10%] h-1 bg-gradient-to-r from-emergency-red via-accent-purple to-success-green opacity-30 z-0"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 relative z-10">
                    {steps.map((s, idx) => (
                        <div key={idx} className="relative flex flex-col items-center">
                            <span className={`text-6xl font-black text-${s.color}/10 absolute -top-8 -left-4 font-display -z-10`}>
                                {s.step}
                            </span>
                            <div
                                className={`w-28 h-28 bg-white dark:bg-gray-900 border-4 border-${s.color} rounded-full flex items-center justify-center shadow-2xl mb-6 shadow-${s.color}/20`}
                            >
                                <span className={`material-symbols-outlined text-5xl text-${s.color}`}>
                                    {s.icon}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-text-dark dark:text-white mb-3 text-center">
                                {s.title}
                            </h3>
                            <p className="text-text-gray dark:text-gray-400 text-center font-medium leading-relaxed max-w-[250px]">
                                {s.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <Link
                    to="/smart-booking"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white font-bold rounded-xl hover:shadow-glow transition-all hover:scale-105 shadow-xl"
                >
                    <span className="material-symbols-outlined">rocket_launch</span>
                    Try Smart Booking Now
                </Link>
            </div>
        </div>
    );
};

export default HowItWorks;
