import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDoctorPatients, getSchedule, getClinicalNotes, type AdmittedPatient } from '../../services/admissionService';
import type { ScheduleSlot, ClinicalNote } from '../../types/dashboard.types';
import { CURRENT_DOCTOR } from '../../data/sampleData';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const conditionBadge = (c: string) => {
  const map: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    serious: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    stable: 'bg-green-500/10 text-green-400 border-green-500/20',
    recovering: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return map[c.toLowerCase()] ?? 'bg-[#233523] text-[#9db99d] border-[#3b543b]';
};

const scheduleTypeIcon: Record<string, string> = {
  consultation: 'stethoscope',
  'follow-up': 'event_repeat',
  procedure: 'healing',
  rounds: 'directions_walk',
  break: 'coffee',
};

const scheduleStatusColor: Record<string, string> = {
  completed: 'text-green-400',
  'in-progress': 'text-[#13ec13]',
  scheduled: 'text-[#9db99d]',
  cancelled: 'text-red-400 line-through',
  'no-show': 'text-yellow-500',
};

const noteTypeColor: Record<string, string> = {
  progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  observation: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  prescription: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'discharge-summary': 'bg-green-500/10 text-green-400 border-green-500/20',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── component ───────────────────────────────────────────────────────────── */

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<AdmittedPatient[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDoctorPatients(), getSchedule(), getClinicalNotes()])
      .then(([p, s, n]) => { setPatients(p); setSchedule(s); setNotes(n); })
      .finally(() => setLoading(false));
  }, []);

  const criticalCount = patients.filter(p => p.severity_score >= 8).length;
  const seriousCount = patients.filter(p => p.severity_score >= 5 && p.severity_score < 8).length;
  const upcomingSlots = schedule.filter(s => s.status === 'scheduled' || s.status === 'in-progress');
  const completedSlots = schedule.filter(s => s.status === 'completed').length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-[#13ec13] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#9db99d] text-sm">Loading dashboard…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative z-10 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {greeting}, {CURRENT_DOCTOR.full_name.replace('Dr. ', '')}
          </h1>
          <p className="text-sm text-[#9db99d] mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;•&nbsp;{CURRENT_DOCTOR.specialty}
          </p>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: patients.length, icon: 'group', color: 'text-[#13ec13]', bg: 'bg-[#13ec13]/10', border: 'border-[#13ec13]/20' },
            { label: 'Critical', value: criticalCount, icon: 'warning', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Serious', value: seriousCount, icon: 'monitor_heart', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
            { label: 'Schedule Left', value: upcomingSlots.length, icon: 'schedule', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          ].map(s => (
            <div key={s.label} className={`bg-[#1c271c] rounded-2xl p-5 border ${s.border} shadow-lg relative overflow-hidden`}>
              <div className={`absolute -top-2 -right-2 h-16 w-16 rounded-full ${s.bg} blur-xl`} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
                  <span className="text-xs font-medium text-[#9db99d] uppercase tracking-wider">{s.label}</span>
                </div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Critical alert banner */}
        {criticalCount > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 animate-pulse">emergency</span>
            </div>
            <div className="flex-1">
              <p className="text-red-400 font-semibold text-sm">
                {criticalCount} critical patient{criticalCount > 1 ? 's' : ''} require{criticalCount === 1 ? 's' : ''} attention
              </p>
              <p className="text-red-400/60 text-xs mt-0.5">
                {patients.filter(p => p.severity_score >= 8).map(p => p.patient_name).join(', ')}
              </p>
            </div>
            <button onClick={() => navigate('/patients')}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors flex-shrink-0">
              View Patients
            </button>
          </div>
        )}

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient list */}
          <div className="bg-[#1c271c] rounded-2xl border border-[#3b543b]/40 shadow-lg flex flex-col">
            <div className="p-4 border-b border-[#3b543b]/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#13ec13] text-lg">masks</span>
                <h3 className="text-white font-semibold">My Patients</h3>
              </div>
              <button onClick={() => navigate('/patients')} className="text-[#13ec13] text-xs font-semibold hover:underline">
                View All →
              </button>
            </div>
            <div className="p-3 flex-1 space-y-2 overflow-y-auto max-h-80">
              {patients.map(p => (
                <button key={p.patient_id}
                  onClick={() => navigate(`/patients/${p.patient_id}`)}
                  className="w-full p-3 rounded-xl bg-[#111f10] border border-[#3b543b]/20 flex items-center gap-3 hover:border-[#13ec13]/30 transition-all text-left group">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#13ec13]/10 flex items-center justify-center text-[#13ec13] font-bold text-sm">
                    {p.patient_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate group-hover:text-[#13ec13] transition-colors">
                      {p.patient_name}
                    </p>
                    <p className="text-[#9db99d] text-xs truncate">
                      {p.presenting_ailment} • Bed {p.bed_id}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${conditionBadge(p.condition)}`}>
                      {p.condition === 'Critical' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                      {p.condition}
                    </span>
                    <span className="text-[#9db99d]/60 text-[10px]">Score {p.severity_score}/10</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Today's schedule */}
          <div className="bg-[#1c271c] rounded-2xl border border-[#3b543b]/40 shadow-lg flex flex-col">
            <div className="p-4 border-b border-[#3b543b]/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#13ec13] text-lg">calendar_month</span>
                <h3 className="text-white font-semibold">Today's Schedule</h3>
                <span className="text-[10px] px-2 py-0.5 bg-[#13ec13]/10 text-[#13ec13] rounded-full font-semibold border border-[#13ec13]/20">
                  {completedSlots}/{schedule.length} done
                </span>
              </div>
              <button onClick={() => navigate('/schedule')} className="text-[#13ec13] text-xs font-semibold hover:underline">
                Full View →
              </button>
            </div>
            <div className="p-3 flex-1 space-y-1 overflow-y-auto max-h-80">
              {schedule.slice(0, 8).map(slot => (
                <div key={slot.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    slot.status === 'in-progress'
                      ? 'bg-[#13ec13]/5 border border-[#13ec13]/20'
                      : 'bg-[#111f10] border border-transparent hover:border-[#3b543b]/30'
                  }`}>
                  <span className="text-xs text-[#9db99d] w-16 flex-shrink-0 font-mono">{slot.time}</span>
                  <span className={`material-symbols-outlined text-lg ${scheduleStatusColor[slot.status]}`}>
                    {scheduleTypeIcon[slot.type] || 'event'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${scheduleStatusColor[slot.status]}`}>
                      {slot.patient_name || slot.notes || slot.type}
                    </p>
                    <p className="text-[#9db99d]/60 text-[10px] capitalize">{slot.type}</p>
                  </div>
                  {slot.status === 'in-progress' && (
                    <span className="h-2 w-2 rounded-full bg-[#13ec13] animate-pulse flex-shrink-0" />
                  )}
                  {slot.status === 'completed' && (
                    <span className="material-symbols-outlined text-green-500 text-base flex-shrink-0">check_circle</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent clinical notes */}
        <div className="bg-[#1c271c] rounded-2xl border border-[#3b543b]/40 shadow-lg">
          <div className="p-4 border-b border-[#3b543b]/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13] text-lg">clinical_notes</span>
              <h3 className="text-white font-semibold">Recent Clinical Notes</h3>
            </div>
            <button onClick={() => navigate('/notes')} className="text-[#13ec13] text-xs font-semibold hover:underline">
              All Notes →
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {notes.slice(0, 4).map(n => (
              <div key={n.id} className="p-4 rounded-xl bg-[#111f10] border border-[#3b543b]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{n.patient_name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${noteTypeColor[n.type]}`}>
                    {n.type}
                  </span>
                </div>
                <p className="text-[#9db99d] text-xs line-clamp-2 leading-relaxed">{n.note}</p>
                <p className="text-[#9db99d]/50 text-[10px] mt-2">{timeAgo(n.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
