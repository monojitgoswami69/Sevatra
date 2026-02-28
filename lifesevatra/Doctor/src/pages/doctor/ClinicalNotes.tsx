import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getClinicalNotes, addClinicalNote, getDoctorPatients } from '../../services/admissionService';
import type { ClinicalNote } from '../../types/dashboard.types';
import type { AdmittedPatient } from '../../services/admissionService';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const typeConfig: Record<string, { cls: string; icon: string }> = {
  progress: { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'trending_up' },
  observation: { cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: 'visibility' },
  prescription: { cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'medication' },
  'discharge-summary': { cls: 'bg-green-500/10 text-green-400 border-green-500/20', icon: 'logout' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── component ───────────────────────────────────────────────────────────── */

const ClinicalNotes: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [patients, setPatients] = useState<AdmittedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPatient, setFilterPatient] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // New note form
  const [notePatientId, setNotePatientId] = useState<number>(0);
  const [noteType, setNoteType] = useState<ClinicalNote['type']>('progress');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    Promise.all([getClinicalNotes(), getDoctorPatients()])
      .then(([n, p]) => {
        setNotes(n);
        setPatients(p);
        if (p.length > 0) setNotePatientId(p[0].patient_id);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...notes];
    if (filterType !== 'all') list = list.filter(n => n.type === filterType);
    if (filterPatient !== 'all') list = list.filter(n => n.patient_id === parseInt(filterPatient));
    return list;
  }, [notes, filterType, filterPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !notePatientId) return;
    const patient = patients.find(p => p.patient_id === notePatientId);
    if (!patient) return;
    setSaving(true);
    try {
      const newNote = await addClinicalNote({
        patient_id: notePatientId,
        patient_name: patient.patient_name,
        note: noteText.trim(),
        type: noteType,
      });
      setNotes(prev => [newNote, ...prev]);
      setNoteText('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative z-10 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Clinical Notes</h1>
            <p className="text-sm text-[#9db99d] mt-1">
              {notes.length} note{notes.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              showForm
                ? 'bg-[#1c271c] border border-[#3b543b] text-[#9db99d] hover:text-white'
                : 'bg-[#13ec13] text-[#111811] shadow-[0_0_15px_rgba(19,236,19,0.3)] hover:shadow-[0_0_25px_rgba(19,236,19,0.5)]'
            }`}>
            <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'New Note'}
          </button>
        </header>

        {/* New note form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#1c271c] rounded-2xl border border-[#13ec13]/20 shadow-lg p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#13ec13]">note_add</span>
              New Clinical Note
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#9db99d] mb-2">Patient</label>
                <select value={notePatientId} onChange={e => setNotePatientId(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-[#3b543b]/50 bg-[#111811] px-4 py-2.5 text-white text-sm focus:border-[#13ec13] outline-none transition-all">
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>{p.patient_name} ({p.bed_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9db99d] mb-2">Note Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(['progress', 'observation', 'prescription', 'discharge-summary'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setNoteType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                        noteType === t
                          ? 'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/30'
                          : 'bg-[#111811] text-[#9db99d] border-[#3b543b]/40 hover:text-white'
                      }`}>
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9db99d] mb-2">Note Content</label>
              <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Write your clinical note here…"
                className="w-full rounded-xl border border-[#3b543b]/50 bg-[#111811] px-4 py-3 text-white text-sm placeholder:text-[#9db99d]/40 focus:border-[#13ec13] focus:ring-1 focus:ring-[#13ec13]/20 outline-none transition-all resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="submit" disabled={saving || !noteText.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#13ec13] text-[#111811] font-bold shadow-[0_0_15px_rgba(19,236,19,0.3)] hover:shadow-[0_0_25px_rgba(19,236,19,0.5)] hover:scale-[1.02] transition-all text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 flex-wrap">
            {['all', 'progress', 'observation', 'prescription', 'discharge-summary'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                  filterType === t
                    ? 'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/30'
                    : 'bg-[#1c271c] text-[#9db99d] border-[#3b543b]/40 hover:text-white'
                }`}>
                {t === 'all' ? 'All Types' : t.replace('-', ' ')}
              </button>
            ))}
          </div>
          <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)}
            className="rounded-xl border border-[#3b543b]/50 bg-[#1c271c] px-3 py-1.5 text-xs text-[#9db99d] focus:border-[#13ec13] outline-none transition-all">
            <option value="all">All Patients</option>
            {patients.map(p => (
              <option key={p.patient_id} value={p.patient_id}>{p.patient_name}</option>
            ))}
          </select>
        </div>

        {/* Notes list */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 border-2 border-[#13ec13] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1c271c] rounded-2xl border border-[#3b543b]/40 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-[#9db99d] mb-2 block">description</span>
            <p className="text-[#9db99d]">No notes match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(note => {
              const tc = typeConfig[note.type] ?? typeConfig.progress;
              return (
                <div key={note.id} className="bg-[#1c271c] rounded-2xl border border-[#3b543b]/40 shadow-lg p-5 hover:border-[#3b543b]/70 transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tc.cls} border`}>
                        <span className="material-symbols-outlined text-base">{tc.icon}</span>
                      </div>
                      <div>
                        <button onClick={() => navigate(`/patients/${note.patient_id}`)}
                          className="text-white font-semibold text-sm hover:text-[#13ec13] transition-colors">
                          {note.patient_name}
                        </button>
                        <p className="text-[10px] text-[#9db99d]">{timeAgo(note.created_at)} • {new Date(note.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold border capitalize ${tc.cls}`}>
                      {note.type.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-[#9db99d] text-sm leading-relaxed">{note.note}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClinicalNotes;
