import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStaff, getStaffStats, updateDutyStatus, deleteStaff } from '../../services/staffService';
import type { StaffMember, StaffStats } from '../../services/staffService';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ROLE_COLORS: Record<string, string> = {
  doctor: 'bg-blue-900/40 text-blue-200',
  surgeon: 'bg-red-900/40 text-red-200',
  specialist: 'bg-purple-900/40 text-purple-200',
  nurse: 'bg-orange-900/40 text-orange-200',
};

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [staffRes, statsRes] = await Promise.all([getAllStaff(), getStaffStats()]);
      setStaffList(staffRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch staff data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleDuty = async (staffId: string) => {
    try {
      await updateDutyStatus(staffId);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await deleteStaff(staffId);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const filteredStaff = staffList.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = s.full_name.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q) || s.staff_id.toLowerCase().includes(q);
    const matchesRole =
      filterRole === 'All' ||
      (filterRole === 'Doctors' && ['doctor', 'surgeon', 'specialist'].includes(s.role)) ||
      (filterRole === 'Nurses' && s.role === 'nurse');
    return matchesSearch && matchesRole;
  });

  const totalStaff = stats ? parseInt(stats.total_staff) : staffList.length;
  const onDuty = stats ? parseInt(stats.on_duty) : 0;
  const totalDoctors = stats ? parseInt(stats.total_doctors) : 0;
  const totalNurses = stats ? parseInt(stats.total_nurses) : 0;
  const doctorPct = totalStaff > 0 ? Math.round((totalDoctors / totalStaff) * 100) : 0;
  const nursePct = totalStaff > 0 ? Math.round((totalNurses / totalStaff) * 100) : 0;

  return (
    <DashboardLayout>
        <div className="relative z-10 p-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Staff Management</h1>
              <p className="text-sm text-[#9db99d] mt-1">Manage hospital staff, roles, and duty schedules.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-full bg-[#1c271c] border border-[#3b543b] px-4 py-2.5 text-sm font-medium text-[#9db99d] hover:text-white hover:border-[#13ec13] hover:bg-[#13ec13]/5 transition-all">
                <span className="material-symbols-outlined text-lg">download</span>
                Export List
              </button>
              <button 
                onClick={() => navigate('/new-staff')}
                className="flex items-center gap-2 rounded-full bg-[#13ec13] px-6 py-3 text-sm font-bold text-[#111811] hover:bg-[#3bf03b] shadow-[0_0_20px_rgba(19,236,19,0.4)] hover:shadow-[0_0_30px_rgba(19,236,19,0.6)] hover:scale-105 transition-all duration-300"
              >
                <span className="material-symbols-outlined text-xl">person_add</span>
                Add New Staff
              </button>
            </div>
          </header>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400 border border-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  Total Active
                </span>
              </div>
              <h3 className="text-4xl font-bold text-white">{totalStaff}</h3>
              <p className="text-sm font-medium text-[#9db99d] mt-1">Total Staff Members</p>
            </div>
            <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-[#13ec13]/10 p-3 text-[#13ec13] border border-[#13ec13]/20 group-hover:shadow-[0_0_15px_rgba(19,236,19,0.2)] transition-all">
                  <span className="material-symbols-outlined">how_to_reg</span>
                </div>
                <span className="flex items-center gap-2 text-xs font-medium text-[#13ec13]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ec13] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13ec13]"></span>
                  </span>
                  Live Status
                </span>
              </div>
              <h3 className="text-4xl font-bold text-white">{onDuty}</h3>
              <p className="text-sm font-medium text-[#9db99d] mt-1">On Duty Now</p>
            </div>
            <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400 border border-purple-500/20 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                  <span className="material-symbols-outlined">stethoscope</span>
                </div>
                <span className="text-xs font-medium text-[#9db99d]">Specialists</span>
              </div>
              <h3 className="text-4xl font-bold text-white">{totalDoctors}</h3>
              <p className="text-sm font-medium text-[#9db99d] mt-1">Doctors</p>
              <div className="mt-4 h-1.5 w-full rounded-full bg-[#152015]">
                <div className="h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{width: `${doctorPct}%`}}></div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400 border border-orange-500/20 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all">
                  <span className="material-symbols-outlined">medication_liquid</span>
                </div>
                <span className="text-xs font-medium text-[#9db99d]">Care Team</span>
              </div>
              <h3 className="text-4xl font-bold text-white">{totalNurses}</h3>
              <p className="text-sm font-medium text-[#9db99d] mt-1">Nursing Staff</p>
              <div className="mt-4 h-1.5 w-full rounded-full bg-[#152015]">
                <div className="h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{width: `${nursePct}%`}}></div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] overflow-hidden w-full shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3b543b]/50 p-6 gap-4">
              <h3 className="font-bold text-white text-lg">Staff Directory</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db99d]">
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  </span>
                  <input 
                    className="h-9 rounded-xl border border-[#3b543b] bg-[#152015] pl-10 pr-4 text-sm font-medium text-white placeholder-[#9db99d] focus:border-[#13ec13] focus:outline-none focus:ring-0 focus:shadow-[0_0_15px_rgba(19,236,19,0.1)] w-full sm:w-64 transition-all" 
                    placeholder="Search by Name, Role or ID" 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="h-8 w-px bg-[#3b543b] mx-1 hidden sm:block"></div>
                <div className="flex bg-[#152015] p-1 rounded-lg border border-[#3b543b]">
                  <button 
                    onClick={() => setFilterRole('All')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterRole === 'All' ? 'bg-[#13ec13]/10 text-[#13ec13] border border-[#13ec13]/20' : 'text-[#9db99d] hover:text-white'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterRole('Doctors')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterRole === 'Doctors' ? 'bg-[#13ec13]/10 text-[#13ec13] border border-[#13ec13]/20' : 'text-[#9db99d] hover:text-white'}`}
                  >
                    Doctors
                  </button>
                  <button 
                    onClick={() => setFilterRole('Nurses')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterRole === 'Nurses' ? 'bg-[#13ec13]/10 text-[#13ec13] border border-[#13ec13]/20' : 'text-[#9db99d] hover:text-white'}`}
                  >
                    Nurses
                  </button>
                  <button 
                    onClick={() => setFilterRole('Admin')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterRole === 'Admin' ? 'bg-[#13ec13]/10 text-[#13ec13] border border-[#13ec13]/20' : 'text-[#9db99d] hover:text-white'}`}
                  >
                    Admin
                  </button>
                </div>
                <button className="flex items-center justify-center h-9 w-9 rounded-lg border border-[#3b543b] bg-[#152015] text-[#9db99d] hover:text-white hover:bg-[#1c271c] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#152015] text-xs uppercase text-[#9db99d]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Staff Member</th>
                    <th className="px-6 py-4 font-semibold">Role & Department</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Shift Timing</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3b543b]/30">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-[#9db99d]">Loading staff data...</td></tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-[#9db99d]">No staff members found</td></tr>
                  ) : filteredStaff.map((staff) => (
                    <tr key={staff.staff_id} className="group hover:bg-[#13ec13]/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full ${ROLE_COLORS[staff.role] || 'bg-gray-800 text-gray-300'} flex items-center justify-center text-sm font-bold ring-2 ring-transparent group-hover:ring-[#13ec13]/50 transition-all`}>
                            {getInitials(staff.full_name)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{staff.full_name}</div>
                            <div className="text-xs text-[#9db99d] font-mono tracking-wide">ID: {staff.staff_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white capitalize">{staff.role}</div>
                        <div className="text-xs text-[#9db99d]">{staff.specialty}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {staff.email && (
                            <div className="flex items-center gap-1.5 text-xs text-[#9db99d]">
                              <span className="material-symbols-outlined text-[14px]">mail</span>
                              {staff.email}
                            </div>
                          )}
                          {staff.contact && (
                            <div className="flex items-center gap-1.5 text-xs text-[#9db99d]">
                              <span className="material-symbols-outlined text-[14px]">call</span>
                              {staff.contact}
                            </div>
                          )}
                          {!staff.email && !staff.contact && (
                            <span className="text-xs text-[#9db99d]/50">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#152015] px-2.5 py-1 text-xs font-medium text-[#9db99d] border border-[#3b543b] capitalize">
                          <span className="material-symbols-outlined text-[14px] text-[#13ec13]">schedule</span>
                          {staff.shift} shift
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggleDuty(staff.staff_id)} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border cursor-pointer transition-all ${
                          staff.on_duty
                            ? 'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/20 hover:bg-[#13ec13]/20'
                            : 'bg-[#152015] text-[#9db99d] border-[#3b543b] hover:bg-[#1c271c]'
                        }`}>
                          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${staff.on_duty ? 'bg-[#13ec13]' : 'bg-[#9db99d]'}`}></span>
                          {staff.on_duty ? 'On Duty' : 'Off Duty'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-[#9db99d]">{staff.current_patient_count}/{staff.max_patients} pts</span>
                          <button onClick={() => handleDelete(staff.staff_id)} className="h-8 w-8 rounded-lg bg-[#152015] border border-[#3b543b] flex items-center justify-center text-[#9db99d] hover:text-red-400 hover:border-red-500/50 transition-all">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[#3b543b]/50 bg-[#152015] px-6 py-4">
              <div className="text-xs text-[#9db99d]">
                Showing <span className="font-semibold text-white">1</span> to <span className="font-semibold text-white">{filteredStaff.length}</span> of <span className="font-semibold text-white">{totalStaff}</span> staff members
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border border-[#3b543b] bg-[#1c271c] px-3 py-1.5 text-xs font-medium text-[#9db99d] hover:bg-[#13ec13]/5 hover:text-white hover:border-[#13ec13] disabled:opacity-50 transition-all" disabled>Previous</button>
                <button className="rounded-lg border border-[#3b543b] bg-[#1c271c] px-3 py-1.5 text-xs font-medium text-[#9db99d] hover:bg-[#13ec13]/5 hover:text-white hover:border-[#13ec13] transition-all">Next</button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );
};

export default Staff;

