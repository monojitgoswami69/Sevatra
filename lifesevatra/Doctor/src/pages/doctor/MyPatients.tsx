import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDoctorPatients, type AdmittedPatient } from '../../services/admissionService';
import { getConditionStyles, getConditionDotColor } from '../../utils/severityCalculator';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const conditionBadge = (c: string) => {
  const condition = c as import('../../utils/severityCalculator').Condition;
  return {
    dot: getConditionDotColor(condition) + (c.toLowerCase() === 'critical' ? ' animate-pulse' : ''),
    cls: getConditionStyles(condition),
  };
};

const severityBadge = (s: number) => {
  if (s >= 8) return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
  if (s >= 5) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
  if (s >= 3) return 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(19,236,19,0.2)]';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]';
};

const vitalPill = (label: string, value: string | number | null, unit: string, warn: boolean) => (
  <span key={label} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
    warn ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-muted text-muted-foreground border-border'
  }`}>
    {label}: <b>{value ?? '—'}</b>{unit}
  </span>
);

/* ── component ───────────────────────────────────────────────────────────── */

const MyPatients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<AdmittedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'serious' | 'stable'>('all');

  useEffect(() => {
    getDoctorPatients()
      .then(setPatients)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...patients];
    if (filter === 'critical') list = list.filter(p => p.severity_score >= 8);
    else if (filter === 'serious') list = list.filter(p => p.severity_score >= 5 && p.severity_score < 8);
    else if (filter === 'stable') list = list.filter(p => p.severity_score < 5);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.patient_name.toLowerCase().includes(q) ||
        p.bed_id.toLowerCase().includes(q) ||
        p.presenting_ailment?.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.severity_score - a.severity_score);
  }, [patients, search, filter]);

  const counts = {
    all: patients.length,
    critical: patients.filter(p => p.severity_score >= 8).length,
    serious: patients.filter(p => p.severity_score >= 5 && p.severity_score < 8).length,
    stable: patients.filter(p => p.severity_score < 5).length,
  };

  return (
    <DashboardLayout>
      <div className="relative z-10 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl lg:text-3xl font-bold text-card-foreground tracking-tight">My Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage your assigned patients</p>
        </header>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, bed, ailment…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'critical', 'serious', 'stable'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                  filter === f
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-card text-muted-foreground border-border hover:text-card-foreground'
                }`}>
                {f} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="h-8 w-8 border-2 border-[#13ec13] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
              No patients match your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Patient', 'Bed / Ward', 'Vitals', 'Severity', 'Condition', ''].map(h => (
                      <th key={h} className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(p => {
                    const cond = conditionBadge(p.condition);
                    const hrWarn = (p.heart_rate ?? 0) > 120 || (p.heart_rate ?? 999) < 50;
                    const spo2Warn = (p.spo2 ?? 100) < 94;
                    return (
                      <tr key={p.patient_id} className="hover:bg-muted/50 transition-colors group">
                        {/* Patient */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shadow-[0_0_8px_rgba(19,236,19,0.1)]">
                              {p.patient_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-card-foreground text-sm group-hover:text-primary transition-colors">
                                {p.patient_name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {p.age}y / {p.gender} • {p.presenting_ailment}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Bed */}
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border">
                            {p.bed_id}
                          </span>
                        </td>
                        {/* Vitals mini */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {vitalPill('HR', p.heart_rate, '', hrWarn)}
                            {vitalPill('SpO₂', p.spo2, '%', spo2Warn)}
                            {vitalPill('T', p.temperature, '°C', (p.temperature ?? 37) > 39)}
                          </div>
                        </td>
                        {/* Severity */}
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${severityBadge(p.severity_score)}`}>
                            {p.severity_score}/10
                          </span>
                        </td>
                        {/* Condition */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${cond.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cond.dot}`} />
                            {p.condition}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => navigate(`/patients/${p.patient_id}`)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-card-foreground hover:bg-primary hover:text-green-950 transition-all border border-border hover:border-primary">
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyPatients;
