import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111811] px-4">
      <div className="text-center max-w-md">
        {/* Heartbeat Icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#13ec13]/10 border border-[#13ec13]/20 shadow-[0_0_40px_rgba(19,236,19,0.15)]">
          <svg className="h-14 w-14 text-[#13ec13] opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>

        <h1 className="text-8xl font-black text-[#13ec13] tracking-tight mb-2">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-[#9db99d] mb-8">
          The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to the dashboard.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-[#3b543b] bg-[#1c271c] px-6 py-3 text-sm font-bold text-[#9db99d] hover:text-white hover:border-[#13ec13]/50 transition-all"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/overview')}
            className="rounded-xl bg-[#13ec13] px-6 py-3 text-sm font-bold text-[#111811] hover:bg-[#3bf03b] shadow-[0_0_20px_rgba(19,236,19,0.4)] hover:shadow-[0_0_30px_rgba(19,236,19,0.6)] transition-all"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

