import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';

const Header = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const { isLoggedIn, profile } = useUser();

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
        return 'light';
    });

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const initials = profile.fullName
        ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center ${scrolled || !isHome
                ? 'bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl shadow-sm'
                : 'bg-transparent'
                }`}
        >
            <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center gap-4">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="relative flex items-center justify-center">
                        <span className="material-symbols-outlined text-emergency-red text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                            emergency
                        </span>
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-black text-text-dark dark:text-white font-display tracking-tight leading-none group-hover:text-primary-blue transition-colors" style={{ fontFamily: '"Space Mono", monospace' }}>
                            AmbiSevatra
                        </span>
                    </div>
                </Link>

                <nav className="flex items-center gap-3 sm:gap-5">

                    {isLoggedIn && (
                        <Link
                            to="/booking-history"
                            className="relative flex items-center justify-center w-9 h-9 rounded-full text-text-dark dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            title="Booking History"
                        >
                            <span className="material-symbols-outlined text-[18px]">history</span>
                        </Link>
                    )}

                    <button
                        onClick={toggleTheme}
                        className="relative flex items-center justify-center w-9 h-9 rounded-full text-text-dark dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                        aria-label="Toggle Theme"
                        title="Toggle Theme"
                    >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    {isLoggedIn ? (
                        <Link
                            to="/profile"
                            className="group relative inline-flex items-center gap-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all px-3 py-1.5 rounded-full"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-blue to-accent-purple flex items-center justify-center text-white text-xs font-black">
                                {initials}
                            </div>
                            <span className="text-sm font-bold text-text-dark dark:text-white hidden sm:inline max-w-[100px] truncate">
                                {profile.fullName || 'Profile'}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="group relative inline-flex items-center gap-2 bg-text-dark dark:bg-white text-white dark:text-text-dark hover:scale-105 transition-all px-4 py-2 rounded-full text-sm font-bold shadow-lg overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-blue to-accent-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="material-symbols-outlined text-base relative z-10 group-hover:text-white transition-colors">person</span>
                            <span className="relative z-10 group-hover:text-white transition-colors">Login</span>
                        </Link>
                    )}
                </nav>
            </div>
        </motion.header>
    );
};

export default Header;
