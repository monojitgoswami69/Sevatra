import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface FormData {
  hospitalName: string;
  email: string;
  contactNumber: string;
  address: string;
  icuBeds: string;
  hduBeds: string;
  generalBeds: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    hospitalName: '',
    email: '',
    contactNumber: '',
    address: '',
    icuBeds: '',
    hduBeds: '',
    generalBeds: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');

  // Initialize theme from localStorage, default to dark mode (true)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' ? false : true;
  });

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Validate bed fields and contact number to accept only positive integers
    if (name === 'icuBeds' || name === 'hduBeds' || name === 'generalBeds' || name === 'contactNumber') {
      // Allow empty string for clearing the field
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        return;
      }
      
      // Only accept positive integers (no decimal, no negative, no leading zeros except '0' itself)
      const isValidInteger = /^[1-9]\d*$/.test(value);
      if (!isValidInteger) {
        return; // Don't update if invalid
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Hospital Name validation
    if (!formData.hospitalName.trim()) {
      newErrors.hospitalName = 'Hospital name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Contact Number validation
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (formData.contactNumber.length < 10) {
      newErrors.contactNumber = 'Contact number must be at least 10 digits';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Hospital address is required';
    }

    // ICU Beds validation
    if (!formData.icuBeds) {
      newErrors.icuBeds = 'ICU beds count is required';
    }

    // HDU Beds validation
    if (!formData.hduBeds) {
      newErrors.hduBeds = 'HDU beds count is required';
    }

    // General Beds validation
    if (!formData.generalBeds) {
      newErrors.generalBeds = 'General beds count is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');
    
    if (validateForm()) {
      try {
        // Process registration
        await new Promise(resolve => setTimeout(resolve, 500));

        // Show success message and redirect
        setSuccessMessage('Registration successful! Redirecting...');
        setTimeout(() => navigate('/overview'), 1500);
      } catch (error) {
        console.error('Error during registration:', error);
        setApiError('Something went wrong. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              address: data.display_name
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              address: `${latitude}, ${longitude}`
            }));
          }
        } catch (error) {
          console.error('Error getting address:', error);
          // Fallback to coordinates if reverse geocoding fails
          setFormData(prev => ({
            ...prev,
            address: `Latitude: ${latitude}, Longitude: ${longitude}`
          }));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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

      {/* Left Side - Info Panel */}
      <div className={`hidden lg:flex lg:w-1/2 ${isDarkMode ? 'bg-[#111f10]' : 'bg-emerald-50'} items-center justify-center overflow-hidden fixed h-full z-20`}>
        {/* Background Image */}
        <img
          className={`absolute inset-0 h-full w-full object-cover hover:scale-105 transition-transform duration-2000 ${
            isDarkMode ? 'opacity-40 mix-blend-overlay grayscale' : 'opacity-40 mix-blend-multiply grayscale'
          }`}
          src="/src/components/assets/loginBg.png"
          alt="Abstract blurry hospital corridor with medical lighting"
        />
        <div className={`absolute inset-0 bg-linear-to-t ${
          isDarkMode ? 'from-[#111f10] via-[#111f10]/60 to-[#111f10]/10' : 'from-emerald-50 via-emerald-50/60 to-emerald-50/10'
        }`}></div>
        
        <div className="relative z-10 max-w-lg px-12 py-16 text-center">
          <div className="mb-12 flex justify-center">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full animate-pulse-slow ${
              isDarkMode 
                ? 'bg-white border border-emerald-100 text-emerald-600 shadow-[0_0_50px_rgba(16,185,129,0.5),0_0_80px_rgba(16,185,129,0.3)] hover:shadow-[0_0_70px_rgba(16,185,129,0.7),0_0_100px_rgba(16,185,129,0.4)]'
                : 'bg-white border border-emerald-100 text-green-600 shadow-[0_0_40px_rgba(16,185,129,0.4),0_0_70px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6),0_0_90px_rgba(16,185,129,0.3)]'
            } transition-all duration-500 cursor-pointer hover:scale-110`}>
              <svg className="w-10 h-10 group-hover:animate-pulse" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M19 8v6M22 11h-6"></path>
              </svg>
            </div>
          </div>
          
          <h2 className={`text-4xl font-bold tracking-tight mb-6 ${
            isDarkMode ? 'text-white' : 'text-emerald-950'
          }`}>Partner with Lifesevatra</h2>
          <p className={`text-lg leading-relaxed ${
            isDarkMode ? 'text-[#9db99d]' : 'text-emerald-700'
          }`}>
            Join the largest network of connected emergency care providers. Streamline patient intake and manage bed availability in real-time.
          </p>
          
          <div className={`mt-12 grid grid-cols-3 gap-4 text-center border-t ${
            isDarkMode ? 'border-[#13ec13]/30' : 'border-emerald-200'
          } pt-8`}>
            <div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>24/7</div>
              <div className={`text-xs uppercase tracking-wider mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-emerald-600'
              }`}>Support</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>500+</div>
              <div className={`text-xs uppercase tracking-wider mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-emerald-600'
              }`}>Hospitals</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>0s</div>
              <div className={`text-xs uppercase tracking-wider mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-emerald-600'
              }`}>Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={`w-full lg:w-1/2 lg:ml-auto flex flex-col min-h-screen ${
        isDarkMode ? 'bg-[#111811]' : 'bg-white'
      } relative overflow-y-auto`}>
        {/* Background Pattern for light mode */}
        <div className={`absolute inset-0 pointer-events-none ${
          isDarkMode ? 'opacity-0' : 'opacity-[0.03]'
        }`} style={{ 
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23000000\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}></div>

        <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 relative z-10 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm group cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#13ec13]/10 border-[#13ec13]/20 text-[#13ec13] shadow-[0_0_25px_rgba(19,236,19,0.3)] hover:shadow-[0_0_40px_rgba(19,236,19,0.6),0_0_60px_rgba(19,236,19,0.3)]' 
                  : 'bg-green-50 border-green-100 text-green-600 shadow-[0_0_15px_rgba(22,163,74,0.2)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)]'
              } transition-all duration-500 hover:scale-110`}>
                <svg 
                  className="w-6 h-6 group-hover:animate-pulse" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2.5" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h2 className={`text-2xl font-bold leading-tight tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Lifesevatra
              </h2>
            </div>
            
            <div>
              <h1 className={`tracking-tight text-3xl font-bold leading-tight mb-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Register Hospital
              </h1>
              <p className={`text-base font-normal ${
                isDarkMode ? 'text-gray-400' : 'text-slate-500'
              }`}>
                Enter your facility details to create an administrative account.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Error Message */}
            {apiError && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isDarkMode 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{apiError}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isDarkMode 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-green-50 border-green-200 text-green-600'
              }`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{successMessage}</span>
              </div>
            )}

            {/* Hospital Name */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="col-span-full">
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Hospital Name
                </label>
                <div className="relative group">
                  <input 
                    className={`form-input block w-full rounded-xl border px-4 py-3.5 pl-11 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 ${
                      errors.hospitalName
                        ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : isDarkMode 
                        ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                    }`}
                    placeholder="e.g. Saint Mary's General Hospital"
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.hospitalName
                      ? 'text-red-500'
                      : isDarkMode 
                      ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                      : 'text-slate-400 group-focus-within:text-green-600'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
                    </svg>
                  </div>
                </div>
                {errors.hospitalName && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.hospitalName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Email Address
                </label>
                <div className="relative group">
                  <input 
                    className={`form-input block w-full rounded-xl border px-4 py-3.5 pl-11 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 ${
                      errors.email
                        ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : isDarkMode 
                        ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                    }`}
                    placeholder="admin@hospital.com"
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.email
                      ? 'text-red-500'
                      : isDarkMode 
                      ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                      : 'text-slate-400 group-focus-within:text-green-600'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Contact Number
                </label>
                <div className="relative group">
                  <input 
                    className={`form-input block w-full rounded-xl border px-4 py-3.5 pl-11 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 ${
                      errors.contactNumber
                        ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : isDarkMode 
                        ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                    }`}
                    placeholder="1234567890"
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.contactNumber
                      ? 'text-red-500'
                      : isDarkMode 
                      ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                      : 'text-slate-400 group-focus-within:text-green-600'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                </div>
                {errors.contactNumber && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.contactNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Address Section */}
            <div className={`p-5 rounded-2xl border shadow-sm ${
              isDarkMode 
                ? 'border-[#1a3d1a]/60 bg-[#0f240f]/30'
                : 'bg-slate-50 border-slate-200 shadow-slate-200/50'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <label className={`block text-sm font-semibold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Hospital Address
                </label>
                <button 
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'text-[#13ec13] hover:text-[#13ec13]/80 hover:bg-[#13ec13]/10'
                      : 'text-green-700 hover:text-green-800 hover:bg-green-100'
                  }`}
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                      </svg>
                      Use Current Location
                    </>
                  )}
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  className={`form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-none shadow-sm focus:outline-0 focus:ring-0 ${
                    errors.address
                      ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      : isDarkMode 
                      ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-green-600 focus:outline-none focus:ring-0 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                  }`}
                  placeholder="Street Address, City, State, Zip Code"
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                ></textarea>
              </div>
              {errors.address && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.address}
                </p>
              )}
              {locationError && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {locationError}
                </p>
              )}
            </div>

            {/* Bed Availability */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Bed Availability Setup
              </label>
              <div className="grid grid-cols-3 gap-4">
                {/* ICU Beds */}
                <div className="relative group">
                  <label className={`block text-xs font-medium mb-1.5 ml-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    ICU Beds
                  </label>
                  <div className="relative">
                    <input 
                      className={`form-input block w-full rounded-xl border px-3 py-3 pl-10 placeholder:text-gray-500 transition-all font-semibold shadow-sm focus:outline-0 focus:ring-0 ${
                        errors.icuBeds
                          ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                          : isDarkMode 
                          ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                      }`}
                      placeholder="00"
                      type="text"
                      name="icuBeds"
                      value={formData.icuBeds}
                      onChange={handleChange}
                    />
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                      errors.icuBeds
                        ? 'text-red-500'
                        : isDarkMode 
                        ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                        : 'text-slate-400 group-focus-within:text-green-600'
                    }`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                      </svg>
                    </div>
                  </div>
                  {errors.icuBeds && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.icuBeds}
                    </p>
                  )}
                </div>

                {/* HDU Beds */}
                <div className="relative group">
                  <label className={`block text-xs font-medium mb-1.5 ml-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    HDU Beds
                  </label>
                  <div className="relative">
                    <input 
                      className={`form-input block w-full rounded-xl border px-3 py-3 pl-10 placeholder:text-gray-500 transition-all font-semibold shadow-sm focus:outline-0 focus:ring-0 ${
                        errors.hduBeds
                          ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                          : isDarkMode 
                          ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                      }`}
                      placeholder="00"
                      type="text"
                      name="hduBeds"
                      value={formData.hduBeds}
                      onChange={handleChange}
                    />
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                      errors.hduBeds
                        ? 'text-red-500'
                        : isDarkMode 
                        ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                        : 'text-slate-400 group-focus-within:text-green-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"/>
                      </svg>
                    </div>
                  </div>
                  {errors.hduBeds && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.hduBeds}
                    </p>
                  )}
                </div>

                {/* General Beds */}
                <div className="relative group">
                  <label className={`block text-xs font-medium mb-1.5 ml-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    General Beds
                  </label>
                  <div className="relative">
                    <input 
                      className={`form-input block w-full rounded-xl border px-3 py-3 pl-10 placeholder:text-gray-500 transition-all font-semibold shadow-sm focus:outline-0 focus:ring-0 ${
                        errors.generalBeds
                          ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                          : isDarkMode 
                          ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                      }`}
                      placeholder="00"
                      type="text"
                      name="generalBeds"
                      value={formData.generalBeds}
                      onChange={handleChange}
                    />
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                      errors.generalBeds
                        ? 'text-red-500'
                        : isDarkMode 
                        ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                        : 'text-slate-400 group-focus-within:text-green-600'
                    }`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 12c0-1.1-.9-2-2-2V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v5h1.33L4 19h1l.67-2h12.67l.66 2h1l.67-2H22v-5zm-4-2h-5V7h5v3zM6 7h5v3H6V7zm-2 5h16v3H4v-3z"/>
                      </svg>
                    </div>
                  </div>
                  {errors.generalBeds && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.generalBeds}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid gap-6 md:grid-cols-2 pt-2">
              {/* Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Set Password
                </label>
                <div className="relative group">
                  <input 
                    className={`form-input block w-full rounded-xl border px-4 py-3.5 pl-11 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 ${
                      errors.password
                        ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : isDarkMode 
                        ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                    }`}
                    placeholder="••••••••"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.password
                      ? 'text-red-500'
                      : isDarkMode 
                      ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                      : 'text-slate-400 group-focus-within:text-green-600'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Confirm Password
                </label>
                <div className="relative group">
                  <input 
                    className={`form-input block w-full rounded-xl border px-4 py-3.5 pl-11 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 ${
                      errors.confirmPassword
                        ? 'border-red-500 bg-red-500/5 text-white focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : isDarkMode 
                        ? 'text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-0 shadow-slate-200/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.15)] hover:border-slate-300'
                    }`}
                    placeholder="••••••••"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.confirmPassword
                      ? 'text-red-500'
                      : isDarkMode 
                      ? 'text-gray-500 group-focus-within:text-[#13ec13]'
                      : 'text-slate-400 group-focus-within:text-green-600'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                    </svg>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 pb-6">
              <button 
                type="submit"
                className={`flex w-full cursor-pointer items-center justify-center overflow-hidden h-14 px-5 active:scale-[0.98] transition-all duration-300 text-lg font-bold leading-normal tracking-wide relative group ${
                  isDarkMode 
                    ? 'rounded-xl bg-[#13ec13] hover:bg-[#3bf03b] text-green-950 shadow-[0_0_30px_rgba(19,236,19,0.4),0_0_60px_rgba(19,236,19,0.2)] hover:shadow-[0_0_50px_rgba(19,236,19,0.7),0_0_100px_rgba(19,236,19,0.4)] hover:scale-105'
                    : 'rounded-full bg-[#13ec13] hover:bg-[#3bf03b] text-green-950 shadow-[0_0_30px_rgba(19,236,19,0.5),0_0_60px_rgba(19,236,19,0.3)] hover:shadow-[0_0_50px_rgba(19,236,19,0.8),0_0_100px_rgba(19,236,19,0.5)] hover:scale-105'
                }`}
              >
                <span className="truncate relative z-10">Complete Registration</span>
                <div className={`absolute inset-0 ${
                  isDarkMode ? 'rounded-xl' : 'rounded-full'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-r from-[#13ec13]/20 via-[#3bf03b]/30 to-[#13ec13]/20 animate-shimmer`}></div>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pb-8">
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-slate-500'
            }`}>
              Already registered? 
              <Link to="/login" className={`font-bold hover:underline ml-1 ${
                isDarkMode ? 'text-[#13ec13]' : 'text-green-600'
              }`}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

