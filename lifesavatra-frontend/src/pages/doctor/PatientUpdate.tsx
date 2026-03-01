import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  getPatientById,
  updatePatientVitals,
  updatePatientClinicalInfo,
  addClinicalNote,
  type AdmittedPatient,
} from '../../services/doctorService';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const conditionBadge = (c: string) => {
  const map: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    serious: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    stable: 'bg-green-500/10 text-green-400 border-green-500/20',
    recovering: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return map[c.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border';
};

const normalRange: Record<string, { label: string; min: number; max: number; unit: string }> = {
  heart_rate: { label: 'Heart Rate', min: 60, max: 100, unit: 'bpm' },
  spo2: { label: 'SpO₂', min: 95, max: 100, unit: '%' },
  temperature: { label: 'Temperature', min: 36.1, max: 37.5, unit: '°C' },
  resp_rate: { label: 'Resp Rate', min: 12, max: 20, unit: '/min' },
  systolic: { label: 'Systolic BP', min: 90, max: 140, unit: 'mmHg' },
  diastolic: { label: 'Diastolic BP', min: 60, max: 90, unit: 'mmHg' },
};

function isAbnormal(key: string, val: number | null): boolean {
  if (val === null) return false;
  const r = normalRange[key];
  return r ? val < r.min || val > r.max : false;
}

/* ── component ───────────────────────────────────────────────────────────── */

const PatientUpdate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<AdmittedPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'clinical' | 'note'>('vitals');

  // Vitals form
  const [hr, setHR] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temp, setTemp] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [rr, setRR] = useState('');

  // Clinical form
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [labResults, setLabResults] = useState('');

  // New note form
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'observation' | 'prescription' | 'progress' | 'discharge-summary'>('progress');

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getPatientById(id || '0');
        setPatient(p);
        setHR(p.heart_rate?.toString() ?? '');
        setSpo2(p.spo2?.toString() ?? '');
        setTemp(p.temperature?.toString() ?? '');
        setSys(p.blood_pressure?.systolic?.toString() ?? '');
        setDia(p.blood_pressure?.diastolic?.toString() ?? '');
        setRR(p.resp_rate?.toString() ?? '');
        setClinicalNotes(p.clinical_notes ?? '');
        setLabResults(p.lab_results ?? '');
      } catch {
        setPatient(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    try {
      const updated = await updatePatientVitals(String(patient.patient_id), {
        heartRate: parseInt(hr) || undefined,
        spo2: parseInt(spo2) || undefined,
        respRate: parseInt(rr) || undefined,
        temperature: parseFloat(temp) || undefined,
        bpSystolic: parseInt(sys) || undefined,
        bpDiastolic: parseInt(dia) || undefined,
      });
      setPatient(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClinical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    try {
      const updated = await updatePatientClinicalInfo(String(patient.patient_id), {
        clinicalNotes: clinicalNotes,
        labResults: labResults,
      });
      setPatient(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !noteText.trim()) return;
    setSaving(true);
    try {
      await addClinicalNote({
        patient_id: String(patient.patient_id),
        patient_name: patient.patient_name,
        note: noteText.trim(),
        type: noteType,
      });
      setNoteText('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── renders ─────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-red-500">error</span>
          <p className="text-card-foreground font-semibold text-lg">Patient Not Found</p>
          <button onClick={() => navigate('/patients')}
            className="px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-card-foreground text-sm transition-colors">
            ← Back to Patients
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const vitalItems = [
    { key: 'heart_rate', val: patient.heart_rate, icon: 'favorite' },
    { key: 'spo2', val: patient.spo2, icon: 'pulmonology' },
    { key: 'temperature', val: patient.temperature, icon: 'thermostat' },
    { key: 'resp_rate', val: patient.resp_rate, icon: 'respiratory_rate' },
    { key: 'systolic', val: patient.blood_pressure?.systolic, icon: 'blood_pressure' },
    { key: 'diastolic', val: patient.blood_pressure?.diastolic, icon: 'blood_pressure' },
  ];

  return (
    <DashboardLayout>
      <div className="relative z-10 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Back + header */}
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/patients')}
            className="mt-1 flex items-center justify-center h-10 w-10 rounded-xl bg-card text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors border border-border flex-shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-card-foreground">{patient.patient_name}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${conditionBadge(patient.condition)}`}>
                {patient.condition === 'Critical' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                {patient.condition}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                patient.severity_score >= 8 ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                patient.severity_score >= 5 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]' :
                patient.severity_score >= 3 ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(19,236,19,0.2)]' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
              }`}>
                Score: {patient.severity_score}/10
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {patient.age}y / {patient.gender} • Bed {patient.bed_id} • Admitted {patient.admission_date}
            </p>
          </div>
        </div>

        {/* Patient summary card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {vitalItems.map(v => {
              const r = normalRange[v.key];
              const abnormal = isAbnormal(v.key, v.val ?? null);
              return (
                <div key={v.key} className={`rounded-xl p-3 border ${abnormal ? 'bg-red-500/5 border-red-500/20' : 'bg-muted border-border'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`material-symbols-outlined text-sm ${abnormal ? 'text-red-400' : 'text-muted-foreground'}`}>{v.icon}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{r.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${abnormal ? 'text-red-400' : 'text-card-foreground'}`}>
                    {v.val ?? '—'}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{r.unit}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Normal: {r.min}–{r.max}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Clinical summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Presenting Ailment</p>
              <p className="text-card-foreground text-sm">{patient.presenting_ailment || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Medical History</p>
              <p className="text-card-foreground text-sm">{patient.medical_history || '—'}</p>
            </div>
          </div>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-primary">check_circle</span>
            <p className="text-primary text-sm font-medium">Changes saved successfully</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-card p-1 rounded-xl border border-border w-fit">
          {([
            { key: 'vitals', label: 'Update Vitals', icon: 'vital_signs' },
            { key: 'clinical', label: 'Clinical Info', icon: 'medical_information' },
            { key: 'note', label: 'Add Note', icon: 'note_add' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-card-foreground'
              }`}>
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Vitals */}
        {activeTab === 'vitals' && (
          <form onSubmit={handleSaveVitals} className="bg-card p-6 rounded-2xl border border-border shadow-lg">
            <h2 className="text-lg font-semibold text-card-foreground mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">vital_signs</span>
              Vital Signs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { label: 'Heart Rate (bpm)', value: hr, set: setHR, type: 'number' },
                { label: 'SpO₂ (%)', value: spo2, set: setSpo2, type: 'number' },
                { label: 'Temperature (°C)', value: temp, set: setTemp, type: 'number', step: '0.1' },
                { label: 'Resp Rate (/min)', value: rr, set: setRR, type: 'number' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{f.label}</label>
                  <input type={f.type} step={f.step} value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-2.5 text-[var(--input-text)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Blood Pressure (mmHg)</label>
                <div className="flex gap-3 items-center">
                  <input type="number" placeholder="Systolic" value={sys} onChange={e => setSys(e.target.value)}
                    className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-2.5 text-[var(--input-text)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  <span className="text-muted-foreground text-lg font-bold">/</span>
                  <input type="number" placeholder="Diastolic" value={dia} onChange={e => setDia(e.target.value)}
                    className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-2.5 text-[var(--input-text)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button type="button" onClick={() => navigate('/patients')}
                className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors text-sm">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-primary text-green-950 font-bold shadow-[0_0_15px_rgba(19,236,19,0.3)] hover:shadow-[0_0_25px_rgba(19,236,19,0.5)] hover:scale-[1.02] transition-all text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Vitals'}
              </button>
            </div>
          </form>
        )}

        {/* Tab: Clinical */}
        {activeTab === 'clinical' && (
          <form onSubmit={handleSaveClinical} className="bg-card p-6 rounded-2xl border border-border shadow-lg">
            <h2 className="text-lg font-semibold text-card-foreground mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">medical_information</span>
              Clinical Information
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Clinical Notes & Observations</label>
                <textarea rows={5} value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-3 text-[var(--input-text)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Lab Results</label>
                <textarea rows={4} value={labResults} onChange={e => setLabResults(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-3 text-[var(--input-text)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button type="button" onClick={() => navigate('/patients')}
                className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors text-sm">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-primary text-green-950 font-bold shadow-[0_0_15px_rgba(19,236,19,0.3)] hover:shadow-[0_0_25px_rgba(19,236,19,0.5)] hover:scale-[1.02] transition-all text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Clinical Info'}
              </button>
            </div>
          </form>
        )}

        {/* Tab: Add Note */}
        {activeTab === 'note' && (
          <form onSubmit={handleAddNote} className="bg-card p-6 rounded-2xl border border-border shadow-lg">
            <h2 className="text-lg font-semibold text-card-foreground mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">note_add</span>
              Add Clinical Note
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Note Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(['progress', 'observation', 'prescription', 'discharge-summary'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setNoteType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                        noteType === t
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground border-border hover:text-card-foreground'
                      }`}>
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Note Content</label>
                <textarea rows={5} value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Write your clinical note here…"
                  className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-3 text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button type="button" onClick={() => setNoteText('')}
                className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors text-sm">Clear</button>
              <button type="submit" disabled={saving || !noteText.trim()}
                className="px-5 py-2.5 rounded-xl bg-primary text-green-950 font-bold shadow-[0_0_15px_rgba(19,236,19,0.3)] hover:shadow-[0_0_25px_rgba(19,236,19,0.5)] hover:scale-[1.02] transition-all text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientUpdate;
