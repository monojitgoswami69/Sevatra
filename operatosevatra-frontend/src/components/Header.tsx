import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperator } from '../context/OperatorContext';

const providerNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { to: '/ambulances', label: 'Ambulances', icon: 'local_shipping' },
    { to: '/profile', label: 'Profile', icon: 'person' },
];

const individualNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { to: '/profile', label: 'Profile', icon: 'person' },
];

const Header = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn, profile, logout } = useOperator();

    const navLinks = profile?.operatorType === 'individual' ? individualNavLinks : providerNavLinks;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-background-dark/80 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                {/* Logo */}
                <Link to={isLoggedIn ? '/dashboard' : '/login'} className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
                        <span className="material-symbols-outlined text-white text-lg">local_shipping</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight text-text-dark dark:text-white leading-none">
                            Operato<span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Sevatra</span>
                        </span>
                        <span className="text-[10px] font-bold text-text-gray dark:text-gray-500 leading-none mt-0.5">Fleet Management</span>
                    </div>
                </Link>

                {/* Desktop nav */}
                {isLoggedIn && (
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => {
                            const active = location.pathname.startsWith(link.to);
                            return (
                                <Link key={link.to} to={link.to}
                                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                        active
                                            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                                            : 'text-text-gray dark:text-gray-400 hover:text-text-dark dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">{link.icon}</span>
                                    {link.label}
                                    {active && (
                                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-amber-500" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                )}

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {isLoggedIn && (
                        <>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-white">
                                        {(profile?.fullName || profile?.email || 'O').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-text-dark dark:text-white max-w-[120px] truncate">
                                    {profile?.fullName || profile?.email || 'Operator'}
                                </span>
                            </div>
                            <button onClick={handleLogout}
                                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-text-gray dark:text-gray-400 hover:text-emergency-red hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                <span className="material-symbols-outlined text-lg">logout</span>
                            </button>
                        </>
                    )}

                    {/* Mobile menu button */}
                    {isLoggedIn && (
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <span className="material-symbols-outlined text-xl text-text-dark dark:text-white">
                                {mobileOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile nav */}
            <AnimatePresence>
                {mobileOpen && isLoggedIn && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="md:hidden overflow-hidden border-t border-gray-200/50 dark:border-gray-800/50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl">
                        <div className="px-4 py-3 space-y-1">
                            {navLinks.map(link => {
                                const active = location.pathname.startsWith(link.to);
                                return (
                                    <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                            active
                                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                                                : 'text-text-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}>
                                        <span className="material-symbols-outlined text-lg">{link.icon}</span>
                                        {link.label}
                                    </Link>
                                );
                            })}
                            <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-emergency-red hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                <span className="material-symbols-outlined text-lg">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
