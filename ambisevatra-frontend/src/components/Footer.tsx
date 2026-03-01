import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="relative z-10 bg-gray-900 text-white py-12 mt-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-emergency-red text-2xl">
                                emergency
                            </span>
                            <span className="text-xl font-black">AmbiSevatra</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            Saving Lives, One Second at a Time
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">share</span>
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">mail</span>
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">call</span>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link to="/about" className="hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/how-it-works" className="hover:text-white transition-colors">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link to="/features" className="hover:text-white transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-white transition-colors">
                                    Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-bold mb-4">Services</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link to="/smart-booking" className="hover:text-white transition-colors">
                                    AI Smart Booking
                                </Link>
                            </li>
                            <li>
                                <Link to="/sos-activation" className="hover:text-white transition-colors">
                                    Emergency SOS
                                </Link>
                            </li>
                            <li>
                                <Link to="/features" className="hover:text-white transition-colors">
                                    Hospital Bed Tracking
                                </Link>
                            </li>
                            <li>
                                <Link to="/features" className="hover:text-white transition-colors">
                                    Medical QR Code
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-bold mb-4">Support</h3>
                        <div className="space-y-3">
                            <button
                                // onclick triggers chatbot eventually, will handle via context or global state
                                className="block w-full bg-primary-blue hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold text-center transition-all"
                            >
                                <span className="material-symbols-outlined align-middle mr-1">
                                    chat
                                </span>
                                Chat with Us
                            </button>
                            <Link
                                to="/sos-activation"
                                className="block w-full bg-emergency-red hover:bg-red-700 text-white py-3 px-4 rounded-lg font-bold text-center transition-all"
                            >
                                <span className="material-symbols-outlined align-middle mr-1">
                                    sos
                                </span>
                                Emergency SOS
                            </Link>
                            <p className="text-gray-400 text-xs text-center md:text-left">24/7 Emergency Support</p>
                            <p className="text-white font-bold text-sm text-center md:text-left">
                                📞 1800-AMBI-SEVATRA
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
                    <p>
                        © 2025 AmbiSevatra. All rights reserved. |{' '}
                        <a href="#" className="hover:text-white">
                            Privacy Policy
                        </a>{' '}
                        |{' '}
                        <a href="#" className="hover:text-white">
                            Terms of Service
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
