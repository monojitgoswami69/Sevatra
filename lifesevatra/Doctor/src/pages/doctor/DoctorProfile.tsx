import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDoctorProfile, updateDoctorProfile } from '../../services/admissionService';
import type { DoctorInfo } from '../../types/dashboard.types';

/* ── component ───────────────────────────────────────────────────────────── */

const DoctorProfile: React.FC = () => {
  const [profile, setProfile] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [form, setForm] = useState({
    full_name: '',
    specialty: '',
    qualification: '',
    experience_years: 0,
    contact: '',
    email: '',
    bio: '',
    languages: '',
    consultation_fee: 0,
    shift: 'day' as 'day' | 'night' | 'rotating',
  });

  useEffect(() => {
    getDoctorProfile()
      .then(p => {
        setProfile(p);
        setForm({
          full_name: p.full_name,
          specialty: p.specialty,
          qualification: p.qualification,
          experience_years: p.experience_years,
          contact: p.contact,
          email: p.email,
          bio: p.bio,
          languages: p.languages.join(', '),
          consultation_fee: p.consultation_fee,
          shift: p.shift,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateDoctorProfile({
        full_name: form.full_name,
        specialty: form.specialty,
        qualification: form.qualification,
        experience_years: form.experience_years,
        contact: form.contact,
        email: form.email,
        bio: form.bio,
        languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
        consultation_fee: form.consultation_fee,
        shift: form.shift,
      });
      setProfile(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        specialty: profile.specialty,
        qualification: profile.qualification,
        experience_years: profile.experience_years,
        contact: profile.contact,
        email: profile.email,
        bio: profile.bio,
        languages: profile.languages.join(', '),
        consultation_fee: profile.consultation_fee,
        shift: profile.shift,
      });
    }
    setEditing(false);
  };

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const initials = profile.full_name.replace('Dr. ', '').split(' ').map(w => w[0]).join('');

  return (
    <DashboardLayout>
      <div className="relative z-10 p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-card-foreground tracking-tight">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage your professional details</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:border-primary hover:text-primary transition-all">
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Profile
            </button>
          )}
        </header>

        {/* Success */}
        {saved && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">check_circle</span>
            <p className="text-primary text-sm font-medium">Profile updated successfully</p>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          {/* Banner + avatar */}
          <div className="relative h-32 bg-gradient-to-r from-primary/10 via-muted to-card">
            <div className="absolute -bottom-10 left-6">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 border-[3px] border-card flex items-center justify-center text-primary text-3xl font-bold shadow-lg">
                {initials}
              </div>
            </div>
            <div className="absolute bottom-3 right-6">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                profile.on_duty
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                <span className={`h-2 w-2 rounded-full ${profile.on_duty ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                {profile.on_duty ? 'On Duty' : 'Off Duty'}
              </span>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6">
            {editing ? (
              /* ── Edit form ──────────────────────────────────────────── */
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: 'Full Name', key: 'full_name', type: 'text' },
                    { label: 'Specialty', key: 'specialty', type: 'text' },
                    { label: 'Qualifications', key: 'qualification', type: 'text' },
                    { label: 'Experience (years)', key: 'experience_years', type: 'number' },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Phone', key: 'contact', type: 'text' },
                    { label: 'Consultation Fee (₹)', key: 'consultation_fee', type: 'number' },
                    { label: 'Languages (comma-separated)', key: 'languages', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">{f.label}</label>
                      <input
                        type={f.type}
                        value={form[f.key as keyof typeof form]}
                        onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                        className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-2.5 text-[var(--input-text)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Shift</label>
                    <select
                      value={form.shift}
                      onChange={e => setForm({ ...form, shift: e.target.value as 'day' | 'night' | 'rotating' })}
                      className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-2.5 text-[var(--input-text)] focus:border-primary outline-none transition-all text-sm">
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                      <option value="rotating">Rotating</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bio / About</label>
                  <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                    className="w-full rounded-xl border border-border bg-[var(--input-bg)] px-4 py-3 text-[var(--input-text)] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors text-sm">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-primary text-green-950 font-bold shadow-[0_0_15px_rgba(19,236,19,0.3)] hover:shadow-[0_0_25px_rgba(19,236,19,0.5)] hover:scale-[1.02] transition-all text-sm disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── View mode ──────────────────────────────────────────── */
              <div className="space-y-6">
                {/* Name + specialty */}
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">{profile.full_name}</h2>
                  <p className="text-primary font-medium mt-0.5">{profile.specialty}</p>
                </div>
                {/* Bio */}
                {profile.bio && (
                  <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
                )}
                {/* Detail grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 border-t border-border">
                  {[
                    { icon: 'school', label: 'Qualifications', value: profile.qualification },
                    { icon: 'work_history', label: 'Experience', value: `${profile.experience_years} Years` },
                    { icon: 'badge', label: 'Staff ID', value: profile.staff_id },
                    { icon: 'mail', label: 'Email', value: profile.email },
                    { icon: 'call', label: 'Phone', value: profile.contact },
                    { icon: 'schedule', label: 'Shift', value: profile.shift.charAt(0).toUpperCase() + profile.shift.slice(1) },
                    { icon: 'group', label: 'Current Patients', value: `${profile.current_patient_count} / ${profile.max_patients}` },
                    { icon: 'payments', label: 'Consultation Fee', value: `₹${profile.consultation_fee}` },
                    { icon: 'calendar_today', label: 'Joined', value: new Date(profile.joined_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-muted-foreground text-lg mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                        <p className="text-card-foreground font-medium text-sm">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Languages */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">translate</span>
                    Languages
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {profile.languages.map(lang => (
                      <span key={lang} className="px-3 py-1 rounded-full bg-muted text-card-foreground text-xs font-medium border border-border">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfile;
