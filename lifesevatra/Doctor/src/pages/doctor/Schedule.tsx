import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSchedule, updateScheduleStatus } from '../../services/admissionService';
import type { ScheduleSlot } from '../../types/dashboard.types';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const typeIcon: Record<string, string> = {
  consultation: 'stethoscope',
  'follow-up': 'event_repeat',
  procedure: 'healing',
  rounds: 'directions_walk',
  break: 'coffee',
};

const typeColor: Record<string, string> = {
  consultation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'follow-up': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  procedure: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  rounds: 'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/20',
  break: 'bg-[#9db99d]/10 text-[#9db99d] border-[#3b543b]/40',
};

const statusBadge: Record<string, { cls: string; label: string; icon: string }> = {
  completed: { cls: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Done', icon: 'check_circle' },
  'in-progress': { cls: 'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/20', label: 'In Progress', icon: 'pending' },
  scheduled: { cls: 'bg-[#233523] text-[#9db99d] border-[#3b543b]/40', label: 'Upcoming', icon: 'schedule' },
  cancelled: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cancelled', icon: 'cancel' },
  'no-show': { cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'No Show', icon: 'person_off' },
};

/* ── component ───────────────────────────────────────────────────────────── */

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchedule().then(setSlots).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (slotId: number, status: ScheduleSlot['status']) => {
    try {
      const updated = await updateScheduleStatus(slotId, status);
      setSlots(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    } catch (err) {
      console.error(err);
    }
  };

  const completed = slots.filter(s => s.status === 'completed').length;
  const inProgress = slots.find(s => s.status === 'in-progress');

  return (
    <DashboardLayout>
      <div className="relative z-10 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Today's Schedule</h1>
          <p className="text-sm text-[#9db99d] mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;•&nbsp;{completed}/{slots.length} completed
          </p>
        </header>

        {/* Progress bar */}
        <div className="bg-[#1c271c] rounded-2xl border border-[#3b543b]/40 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">Day Progress</p>
            <p className="text-[#13ec13] text-sm font-bold">{Math.round((completed / Math.max(slots.length, 1)) * 100)}%</p>
          </div>
          <div className="h-2 bg-[#233523] rounded-full overflow-hidden">
            <div className="h-full bg-[#13ec13] rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(19,236,19,0.4)]"
              style={{ width: `${(completed / Math.max(slots.length, 1)) * 100}%` }} />
          </div>
          {inProgress && (
            <p className="text-[#9db99d] text-xs mt-3 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#13ec13] animate-pulse" />
              Currently: {inProgress.patient_name || inProgress.notes || inProgress.type} ({inProgress.time})
            </p>
          )}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 border-2 border-[#13ec13] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, idx) => {
              const st = statusBadge[slot.status] ?? statusBadge.scheduled;
              const tc = typeColor[slot.type] ?? typeColor.consultation;
              const isActive = slot.status === 'in-progress';

              return (
                <div key={slot.id}
                  className={`bg-[#1c271c] rounded-2xl border shadow-lg overflow-hidden transition-all ${
                    isActive ? 'border-[#13ec13]/30 ring-1 ring-[#13ec13]/10' : 'border-[#3b543b]/40'
                  }`}>
                  <div className="flex items-stretch">
                    {/* Time column */}
                    <div className={`w-24 flex-shrink-0 flex flex-col items-center justify-center p-4 border-r border-[#3b543b]/30 ${
                      isActive ? 'bg-[#13ec13]/5' : slot.status === 'completed' ? 'bg-green-500/5' : ''
                    }`}>
                      <p className={`text-sm font-bold font-mono ${isActive ? 'text-[#13ec13]' : 'text-white'}`}>{slot.time}</p>
                      {/* timeline dot */}
                      <div className="relative my-2">
                        <div className={`h-3 w-3 rounded-full ${
                          isActive ? 'bg-[#13ec13] shadow-[0_0_8px_rgba(19,236,19,0.6)]' :
                          slot.status === 'completed' ? 'bg-green-500' :
                          'bg-[#3b543b]'
                        }`} />
                        {idx < slots.length - 1 && (
                          <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 ${
                            slot.status === 'completed' ? 'bg-green-500/30' : 'bg-[#3b543b]/30'
                          }`} />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex items-center gap-4 flex-wrap">
                      {/* Type badge */}
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${tc}`}>
                        <span className="material-symbols-outlined text-sm">{typeIcon[slot.type] || 'event'}</span>
                        <span className="capitalize">{slot.type.replace('-', ' ')}</span>
                      </span>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {slot.patient_name ? (
                          <button
                            onClick={() => slot.patient_id && navigate(`/patients/${slot.patient_id}`)}
                            className={`font-medium text-sm ${slot.patient_id ? 'text-white hover:text-[#13ec13] transition-colors cursor-pointer' : 'text-white'}`}>
                            {slot.patient_name}
                          </button>
                        ) : null}
                        {slot.notes && (
                          <p className="text-[#9db99d] text-xs mt-0.5 truncate">{slot.notes}</p>
                        )}
                      </div>

                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${st.cls}`}>
                        <span className="material-symbols-outlined text-sm">{st.icon}</span>
                        {st.label}
                      </span>

                      {/* Actions */}
                      {slot.type !== 'break' && slot.status !== 'completed' && slot.status !== 'cancelled' && (
                        <div className="flex gap-1">
                          {slot.status === 'scheduled' && (
                            <button onClick={() => handleStatusChange(slot.id, 'in-progress')}
                              className="p-1.5 rounded-lg bg-[#13ec13]/10 text-[#13ec13] hover:bg-[#13ec13]/20 transition-colors border border-[#13ec13]/20"
                              title="Start">
                              <span className="material-symbols-outlined text-sm">play_arrow</span>
                            </button>
                          )}
                          {slot.status === 'in-progress' && (
                            <button onClick={() => handleStatusChange(slot.id, 'completed')}
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20"
                              title="Complete">
                              <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                          )}
                          <button onClick={() => handleStatusChange(slot.id, 'cancelled')}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                            title="Cancel">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
