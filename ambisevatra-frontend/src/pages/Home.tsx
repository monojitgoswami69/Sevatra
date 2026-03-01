import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const Home = () => {
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY;
            const shapes = document.querySelectorAll('.animate-parallax') as NodeListOf<HTMLElement>;
            shapes.forEach((shape, index) => {
                const speed = (index + 1) * 0.1;
                shape.style.transform = `translateY(${scrolled * speed}px)`;
            });
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Premium Animated Mesh Gradient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-white dark:bg-[#0B0F19] transition-colors duration-500">
                {/* Dot pattern overlay for texture */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                ></div>

                {/* Animated Mesh Blobs */}
                <motion.div
                    animate={{
                        x: [0, 100, 0, -100, 0],
                        y: [0, 50, 100, 50, 0],
                        scale: [1, 1.2, 1, 0.8, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-blue/20 dark:bg-primary-blue/30 blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-70"
                />
                <motion.div
                    animate={{
                        x: [0, -100, 0, 100, 0],
                        y: [0, 100, 0, -100, 0],
                        scale: [1, 0.8, 1, 1.2, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent-purple/20 dark:bg-accent-purple/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-60"
                />
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -50, 50, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-emergency-red/10 dark:bg-emergency-red/15 blur-[90px] mix-blend-multiply dark:mix-blend-screen opacity-50"
                />

                {/* Vignette effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,15,25,0.8)_100%)]"></div>
            </div>

            <div className="flex flex-col items-center text-center w-full max-w-6xl space-y-6 sm:space-y-8 md:space-y-12 pt-20 sm:pt-24 md:pt-32 relative z-10 px-4">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-6 sm:space-y-8 max-w-4xl mx-auto"
                >


                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-tight tracking-tighter text-text-dark dark:text-white px-2 font-display" style={{ fontFamily: '"Google Sans Flex", sans-serif' }}>
                        Immediate Help, <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-primary-blue via-blue-500 to-accent-purple bg-clip-text text-transparent inline-block pb-2">
                            Just a Tap Away.
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-2xl text-text-gray dark:text-gray-400 font-medium leading-relaxed">
                        Lightning-fast SOS emergency dispatch and{' '}
                        <span className="font-bold text-text-dark dark:text-white border-b-2 border-primary-blue/30 pb-0.5">
                            reliable scheduled transport
                        </span>
                        . Real-time GPS tracking and 24/7 dedicated medical support. Your safety is our absolute priority.
                    </p>
                </motion.div>



                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-3xl px-4"
                >
                    <Link
                        to="/book-ambulance"
                        className="group flex-1 relative overflow-hidden flex items-center justify-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl h-16 sm:h-20 md:h-24 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-primary-blue via-blue-600 to-accent-purple text-white font-display font-bold hover:shadow-glow transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100"></div>
                        <span className="material-symbols-outlined text-5xl sm:text-6xl md:text-7xl relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                            calendar_month
                        </span>
                        <div className="text-left relative z-10">
                            <div className="text-[10px] sm:text-xs md:text-sm opacity-90 font-medium tracking-wide uppercase">
                                Non-Emergency
                            </div>
                            <div className="text-sm sm:text-base md:text-lg lg:text-2xl font-black tracking-tight drop-shadow-md">
                                SCHEDULE RIDE
                            </div>
                        </div>
                    </Link>
                    <Link
                        to="/sos-activation"
                        className="group flex-1 relative overflow-hidden flex items-center justify-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl h-16 sm:h-20 md:h-24 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-emergency-red via-red-600 to-rose-600 text-white font-display font-bold hover:shadow-glow transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100"></div>
                        <span className="material-symbols-outlined text-5xl sm:text-6xl md:text-7xl relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                            sos
                        </span>
                        <div className="text-left relative z-10">
                            <div className="text-[10px] sm:text-xs md:text-sm opacity-90 font-medium tracking-wide">
                                Emergency
                            </div>
                            <div className="text-sm sm:text-base md:text-lg lg:text-2xl font-black tracking-tight drop-shadow-md">
                                SOS ALERT
                            </div>
                        </div>
                    </Link>
                </motion.div>


            </div>
        </>
    );
};

export default Home;
