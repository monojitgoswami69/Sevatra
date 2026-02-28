import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CURRENT_DOCTOR } from '../../data/sampleData';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/overview', label: 'Dashboard', icon: 'dashboard' },
  { path: '/patients', label: 'My Patients', icon: 'masks' },
  { path: '/schedule', label: 'Schedule', icon: 'calendar_month' },
  { path: '/notes', label: 'Clinical Notes', icon: 'clinical_notes' },
  { path: '/profile', label: 'My Profile', icon: 'person' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const doctor = CURRENT_DOCTOR;
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = doctor.full_name
    .replace('Dr. ', '')
    .split(' ')
    .map(w => w[0])
    .join('');

  const sidebar = (
    <>
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] shadow-[0_0_15px_rgba(19,236,19,0.2)]">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold leading-tight text-white tracking-tight">Lifesevatra</h2>
          <p className="text-[10px] uppercase tracking-widest text-[#9db99d]/60 font-semibold">Doctor&nbsp;Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path === '/patients' && location.pathname.startsWith('/patients/'));
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium w-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#13ec13]/10 text-[#13ec13] font-semibold shadow-[0_0_15px_rgba(19,236,19,0.1)] border border-[#13ec13]/20'
                  : 'text-[#9db99d] hover:bg-[#1c271c] hover:text-white hover:translate-x-1 border border-transparent'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#13ec13]' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Doctor card */}
      <div className="px-3 mt-auto">
        <div className="rounded-2xl bg-[#1c271c] p-4 border border-[#3b543b]/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#13ec13]/30 flex items-center justify-center bg-[#13ec13]/10 text-[#13ec13] font-bold text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{doctor.full_name}</p>
              <p className="text-xs text-[#9db99d] truncate">{doctor.specialty}</p>
            </div>
            <span className={`ml-auto h-2.5 w-2.5 rounded-full flex-shrink-0 ${doctor.on_duty ? 'bg-[#13ec13] shadow-[0_0_6px_rgba(19,236,19,0.6)]' : 'bg-[#9db99d]/40'}`}
              title={doctor.on_duty ? 'On Duty' : 'Off Duty'} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#111811]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-[#3b543b]/30 bg-[#111f10] py-6 lg:flex">
        {sidebar}
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[#3b543b]/30 bg-[#111f10] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#13ec13]/10 text-[#13ec13]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-white font-bold text-sm">Lifesevatra</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
          <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col border-r border-[#3b543b]/30 bg-[#111f10] py-6 lg:hidden animate-slide-in">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#111811] relative pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

