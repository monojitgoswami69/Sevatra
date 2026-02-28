import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HOSPITAL_INFO } from '../../data/sampleData';
import { useTheme } from '../../context/ThemeContext';
import { useNavbar } from '../../context/NavbarContext';

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
  const { isDarkMode, toggleTheme } = useTheme();
  const { navTitle, navActions } = useNavbar();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const hospital = HOSPITAL_INFO;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-background-dark text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform border-r transition-transform duration-300 lg:static lg:translate-x-0
        ${isDarkMode ? 'bg-surface-dark border-surface-darker' : 'bg-white border-slate-200'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isDarkMode ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_15px_rgba(19,236,19,0.2)]' : 'bg-primary text-white border-primary shadow-md'}`}>
               <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <h2 className={`text-xl font-bold leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Lifesevatra
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isDarkMode 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(19,236,19,0.1)]'
                        : 'bg-primary/10 text-primary-dark border border-primary/20'
                      : isDarkMode
                        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Hospital Info Card */}
          <div className="p-4 mt-auto border-t border-white/5">
            <div className={`rounded-xl p-4 mb-3 border ${isDarkMode ? 'bg-surface-darker/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-full border text-sm font-bold ${isDarkMode ? 'bg-surface-dark border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                  {hospital?.hospital_name?.charAt(0) || 'H'}
                </div>
                <div className="overflow-hidden">
                  <p className={`truncate text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{hospital.hospital_name}</p>
                  <p className="truncate text-xs text-slate-500">{hospital.email}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className={`flex h-16 items-center justify-between border-b px-6 lg:px-8 ${isDarkMode ? 'bg-surface-dark border-surface-darker' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className={isDarkMode ? 'text-white' : 'text-slate-800'}>
              {navTitle || <span className="text-lg font-bold tracking-tight">{navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Page-level actions */}
            {navActions && (
              <>
                <div className="flex items-center gap-3">{navActions}</div>
                <div className={`h-6 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span className="material-symbols-outlined text-sm">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Notifications */}
            <button className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
              <span className="material-symbols-outlined text-sm">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 shadow-sm ring-2 ring-transparent"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-8 ${isDarkMode ? 'bg-background-dark' : 'bg-slate-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

