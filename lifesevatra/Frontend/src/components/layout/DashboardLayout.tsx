import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HOSPITAL_INFO } from '../../data/sampleData';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/overview', label: 'Dashboard', icon: 'dashboard' },
  { path: '/staff', label: 'Staff', icon: 'medical_services' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hospital = HOSPITAL_INFO;

  return (
    <div className="flex h-screen overflow-hidden bg-[#111811]">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-[#3b543b]/30 bg-[#111f10] py-6 lg:flex">
        <div className="mb-10 flex items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] shadow-[0_0_15px_rgba(19,236,19,0.2)]">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold leading-tight text-white tracking-tight">
            Lifesevatra
          </h2>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium w-full transition-all ${
                  isActive
                    ? 'bg-[#13ec13]/10 text-[#13ec13] font-semibold shadow-[0_0_15px_rgba(19,236,19,0.1)] border border-[#13ec13]/20'
                    : 'text-[#9db99d] hover:bg-[#1c271c] hover:text-white hover:translate-x-1'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'text-[#13ec13]' : ''}`}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-auto">
          <div className="rounded-2xl bg-[#1c271c] p-4 border border-[#3b543b]/50 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-[#3b543b] flex items-center justify-center bg-[#152015] text-white font-bold text-sm">
                {hospital?.hospital_name?.charAt(0) || 'H'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{hospital.hospital_name}</p>
                <p className="text-xs text-[#9db99d]">{hospital.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#111811] relative">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

