import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  
  // Initialize theme from localStorage, default to dark mode (true)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' ? false : true;
  });

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCredentials({ ...credentials, email: value });
    setEmailError('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setEmailError('');

    // Validate email format
    if (!validateEmail(credentials.email)) {
      setEmailError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      // Process login
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to dashboard overview
      navigate('/overview');
    } catch (error) {
      console.error('Login error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen w-full overflow-hidden ${isDarkMode ? 'bg-[#111811]' : 'bg-white'} relative`}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all shadow-lg ${
          isDarkMode 
            ? 'bg-[#1c271c] border border-[#3b543b] text-[#13ec13] hover:bg-[#152015]' 
            : 'bg-white border border-slate-200 text-primary hover:bg-slate-50'
        }`}
        aria-label="Toggle theme"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isDarkMode ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          )}
        </svg>
      </button>

      {/* Left Side: Visual Hero */}
      <div className={`hidden lg:flex lg:w-1/2 relative ${isDarkMode ? 'bg-[#111f10]' : 'bg-emerald-50'} items-center justify-center overflow-hidden`}>
        {/* Background Image */}
        <img
          className={`absolute inset-0 h-full w-full object-cover hover:scale-105 transition-transform duration-2000 ${
            isDarkMode ? 'opacity-70 mix-blend-overlay grayscale' : 'opacity-50 mix-blend-multiply'
          }`}
          src="/src/components/assets/loginBg.png"
          alt="Abstract blurry hospital corridor with medical lighting"
        />
        <div className={`absolute inset-0 bg-linear-to-t ${
          isDarkMode ? 'from-[#111f10] via-[#111f10]/30 to-transparent' : 'from-emerald-50 via-emerald-50/30 to-transparent'
        }`}></div>
        <div className="relative z-10 max-w-lg p-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full backdrop-blur-sm animate-pulse-slow ${
              isDarkMode 
                ? 'bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] shadow-[0_0_40px_rgba(19,236,19,0.4),0_0_80px_rgba(19,236,19,0.2)] hover:shadow-[0_0_60px_rgba(19,236,19,0.6),0_0_100px_rgba(19,236,19,0.3)]' 
                : 'bg-white/60 border border-green-600/20 text-green-600 shadow-[0_0_30px_rgba(22,163,74,0.3)] hover:shadow-[0_0_45px_rgba(22,163,74,0.5)]'
            } transition-all duration-500`}>
              <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <h2 className={`text-4xl font-bold tracking-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-emerald-950'
          }`}>Dedicated to Your Health</h2>
          <p className={`text-lg leading-relaxed ${
            isDarkMode ? 'text-[#9db99d]' : 'text-emerald-700'
          }`}>
            Secure access for medical professionals. Manage patient records, schedules, and vital data with our encrypted portal.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className={`w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-12 relative ${
        isDarkMode ? 'bg-[#111811]' : 'bg-white'
      }`}>
        {/* Background Pattern for light mode */}
        <div className={`absolute inset-0 pointer-events-none ${
          isDarkMode ? 'opacity-0' : 'opacity-[0.03]'
        }`} style={{ 
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23000000\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}></div>

        <div className="w-full max-w-120 flex flex-col gap-2 relative z-10">
          {/* Logo & Header */}
          <div className="mb-8 flex flex-col gap-6">
            <div className={`flex items-center gap-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm group cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#13ec13]/10 border-[#13ec13]/20 text-[#13ec13] shadow-[0_0_25px_rgba(19,236,19,0.3)] hover:shadow-[0_0_40px_rgba(19,236,19,0.6),0_0_60px_rgba(19,236,19,0.3)]' 
                  : 'bg-emerald-50 border-green-600/20 text-green-600 shadow-[0_0_15px_-3px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)]'
              } transition-all duration-500 hover:scale-110`}>
                <svg className="w-7 h-7 group-hover:animate-pulse" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h2 className={`text-3xl font-bold leading-tight tracking-[-0.015em] ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Lifesevatra
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className={`tracking-light text-[32px] font-bold leading-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>Welcome Back</h1>
              <p className={`text-sm font-normal leading-normal ${
                isDarkMode ? 'text-[#9db99d]' : 'text-slate-500'
              }`}>Please enter your credentials to access patient records.</p>
            </div>
          </div>

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Error Message */}
            {error && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isDarkMode 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Email Input */}
            <label className="flex flex-col w-full group">
              <p className={`text-base font-medium leading-normal pb-2 transition-colors ${
                isDarkMode 
                  ? 'text-white group-focus-within:text-[#13ec13]' 
                  : 'text-slate-700 group-focus-within:text-green-600'
              }`}>
                Mail
              </p>
              <div className="relative">
                <input
                  className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl focus:outline-0 focus:ring-0 border h-14 px-4 py-4 pl-12 text-base font-normal leading-normal transition-all ${
                    emailError
                      ? 'border-red-500 bg-red-500/5 focus:border-red-500'
                      : isDarkMode 
                      ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80' 
                      : 'text-slate-900 border-slate-200 bg-slate-50 focus:border-green-600 focus:bg-white placeholder:text-slate-400 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                  }`}
                  placeholder="mail@hospital.domain"
                  type="text"
                  value={credentials.email}
                  onChange={handleEmailChange}
                  required
                />
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  isDarkMode 
                    ? 'text-[#9db99d] group-focus-within:text-[#13ec13]' 
                    : 'text-slate-400 group-focus-within:text-green-600'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {emailError && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              )}
            </label>

            {/* Password Input */}
            <label className="flex flex-col w-full group">
              <div className="flex justify-between items-center pb-2">
                <p className={`text-base font-medium leading-normal transition-colors ${
                  isDarkMode 
                    ? 'text-white group-focus-within:text-[#13ec13]' 
                    : 'text-slate-700 group-focus-within:text-green-600'
                }`}>
                  Password
                </p>
                <a className={`text-sm font-medium hover:underline ${
                  isDarkMode 
                    ? 'text-[#13ec13] hover:text-[#3bf03b]' 
                    : 'text-green-600 hover:text-green-700'
                }`} href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="flex w-full flex-1 items-stretch rounded-xl relative">
                <input
                  className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl focus:outline-0 focus:ring-0 border h-14 px-4 py-4 pl-12 pr-12 text-base font-normal leading-normal transition-all ${
                    isDarkMode 
                      ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80' 
                      : 'text-slate-900 border-slate-200 bg-slate-50 focus:border-green-600 focus:bg-white placeholder:text-slate-400 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                  }`}
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
                {/* Leading Icon */}
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                  isDarkMode 
                    ? 'text-[#9db99d] group-focus-within:text-[#13ec13]' 
                    : 'text-slate-400 group-focus-within:text-green-600'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                {/* Trailing Icon (Show/Hide) */}
                <button
                  className={`absolute right-0 top-0 h-full px-4 flex items-center justify-center focus:outline-none transition-colors ${
                    isDarkMode 
                      ? 'text-[#9db99d] hover:text-white' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </label>

            {/* Login Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 active:scale-[0.98] transition-all duration-300 text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed relative group ${
                  isDarkMode 
                    ? 'bg-[#13ec13] hover:bg-[#3bf03b] text-[#111811] shadow-[0_0_30px_rgba(19,236,19,0.4),0_0_60px_rgba(19,236,19,0.2)] hover:shadow-[0_0_50px_rgba(19,236,19,0.7),0_0_100px_rgba(19,236,19,0.4)] hover:scale-105' 
                    : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_25px_rgba(22,163,74,0.4),0_0_50px_rgba(22,163,74,0.2)] hover:shadow-[0_0_40px_rgba(22,163,74,0.6),0_0_80px_rgba(22,163,74,0.3)] hover:scale-105'
                }`}
              >
                <span className="truncate relative z-10">{isLoading ? 'Logging in...' : 'Login'}</span>
                <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDarkMode ? 'bg-linear-to-r from-[#13ec13]/20 via-[#3bf03b]/30 to-[#13ec13]/20' : 'bg-linear-to-r from-green-400/20 via-green-500/30 to-green-400/20'
                } animate-shimmer`}></div>
              </button>
            </div>
          </form>

          {/* Footer / Sign Up */}
          <div className="mt-8 text-center">
            <p className={`text-sm ${
              isDarkMode ? 'text-[#9db99d]' : 'text-slate-500'
            }`}>
              Don't have an account?
              <Link to="/register" className={`font-bold hover:underline ml-1 ${
                isDarkMode ? 'text-[#13ec13]' : 'text-green-600'
              }`}>
                Register
              </Link>
            </p>
            <div className={`mt-8 flex justify-center gap-6 ${
              isDarkMode ? 'opacity-50' : 'opacity-70'
            }`}>
              <a className={`transition-colors text-xs ${
                isDarkMode ? 'text-[#9db99d] hover:text-white' : 'text-slate-400 hover:text-slate-600'
              }`} href="#">
                Privacy Policy
              </a>
              <a className={`transition-colors text-xs ${
                isDarkMode ? 'text-[#9db99d] hover:text-white' : 'text-slate-400 hover:text-slate-600'
              }`} href="#">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

