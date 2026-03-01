import { useState } from 'react';

const Faq = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            q: "How fast does the ambulance arrive?",
            a: "Our average response time is under 8 minutes in covered areas. In life-threatening emergencies, our AI triage system automatically upgrades your priority, ensuring the fastest available unit is dispatched."
        },
        {
            q: "How does the AI Triage work?",
            a: "When you enter or speak your symptoms, our advanced AI analyzes them against critical medical parameters to determine the severity of the situation. It then automatically recommends the most appropriate type of ambulance (BLS, ALS, or ICU) to ensure you get the exact care you need without overpaying."
        },
        {
            q: "Can I track the ambulance?",
            a: "Yes! Once an ambulance is dispatched, you will see its live location on an interactive map. We also provide the estimated time of arrival (ETA), the driver's name, and contact details."
        },
        {
            q: "What types of ambulances are available?",
            a: "We offer Basic Life Support (BLS) for non-critical transport, Advanced Life Support (ALS) for serious medical emergencies requiring a paramedic and specialized equipment, and ICU-on-Wheels for critical care requiring doctors, ventilators, and complete intensive care setups."
        },
        {
            q: "Are the paramedics trained?",
            a: "Absolutely. All AmbiSevatra paramedics are certified, highly trained, and equipped to handle emergencies. Our ALS and ICU ambulances are also staffed with specialized nurses and doctors respectively."
        }
    ];

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 mt-24 min-h-[70vh] animate-[slideIn_0.5s_ease-out_forwards]">
            <div className="text-center mb-16">
                <h1 className="text-4xl sm:text-5xl font-black text-text-dark dark:text-white mb-6 font-display">
                    Frequently Asked <span className="bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">Questions</span>
                </h1>
                <p className="text-lg text-text-gray dark:text-gray-400 max-w-2xl mx-auto">
                    Everything you need to know about our emergency response services.
                </p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, i) => (
                    <div
                        key={i}
                        className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${openIndex === i ? 'border-primary-blue/50 ring-2 ring-primary-blue/20' : 'border-gray-200 dark:border-gray-800'
                            }`}
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            className="w-full text-left px-6 py-5 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <h3 className={`font-bold text-lg pr-8 transition-colors ${openIndex === i ? 'text-primary-blue' : 'text-text-dark dark:text-white'}`}>
                                {faq.q}
                            </h3>
                            <span className={`material-symbols-outlined transform transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-primary-blue' : 'text-text-gray'}`}>
                                expand_more
                            </span>
                        </button>
                        <div
                            className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-96 py-5 opacity-100' : 'max-h-0 py-0 opacity-0'
                                }`}
                        >
                            <p className="text-text-gray dark:text-gray-400 leading-relaxed font-medium">
                                {faq.a}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 bg-gradient-to-br from-primary-blue to-blue-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
                {/* Support background decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

                <h2 className="text-3xl font-bold mb-4 relative z-10">Still have questions?</h2>
                <p className="text-blue-100 mb-8 max-w-xl mx-auto relative z-10">
                    We're here 24/7 to support you. Ask our AI chatbot or connect directly with our medical dispatch team.
                </p>
                <div className="flex justify-center gap-4 relative z-10">
                    <button className="px-8 py-4 bg-white text-primary-blue font-bold rounded-xl hover:shadow-glow transition-all hover:scale-105 flex items-center gap-2">
                        <span className="material-symbols-outlined">chat</span>
                        Chat Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Faq;
