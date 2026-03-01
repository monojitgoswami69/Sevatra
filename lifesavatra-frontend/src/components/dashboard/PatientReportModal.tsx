import React, { useEffect, useState, useRef } from 'react';
import type { Patient } from '../../types';
import { getPatientById, type AdmittedPatient } from '../../services/admissionService';
import { HOSPITAL_INFO } from '../../data/sampleData';
import { useTheme } from '../../context/ThemeContext';

interface PatientReportModalProps {
  patient: Patient;
  onClose: () => void;
}

/** Color palette that switches between light & dark — matches app CSS tokens */
const getColors = (dark: boolean) => dark ? {
  // ── Dark theme (green-tinted, matches index.css .dark vars) ──
  bg:           '#111811',          // --background-dark
  cardBg:       '#1c271c',          // --card / --surface-dark
  cardBorder:   'rgba(59,84,59,0.5)', // --border
  accent:       '#13ec13',          // --primary
  accentMuted:  'rgba(19,236,19,0.08)',
  heading:      '#ffffff',          // --card-foreground
  text:         '#e2e8e2',
  textMuted:    '#9db99d',          // --muted-fg
  textEmpty:    '#3b5b3b',
  labelColor:   '#7a9a7a',
  sectionBorder:'rgba(59,84,59,0.5)',
  headerBorder: '#13ec13',
  vitalText:    '#ffffff',
  vitalEmpty:   '#3b5b3b',
  vitalUnit:    '#9db99d',
  sigLine:      '#4a6a4a',
  watermark:    'rgba(19,236,19,0.025)',
  barTrack:     '#152015',          // --muted
  footerBorder: 'rgba(59,84,59,0.5)',
} : {
  // ── Light theme (unchanged) ──
  bg:           '#ffffff',
  cardBg:       '#f8fafc',
  cardBorder:   '#e2e8f0',
  accent:       '#4f46e5',
  accentMuted:  'rgba(79,70,229,0.06)',
  heading:      '#1e293b',
  text:         '#1e293b',
  textMuted:    '#64748b',
  textEmpty:    '#cbd5e1',
  labelColor:   '#94a3b8',
  sectionBorder:'#e2e8f0',
  headerBorder: '#4f46e5',
  vitalText:    '#1e293b',
  vitalEmpty:   '#cbd5e1',
  vitalUnit:    '#64748b',
  sigLine:      '#1e293b',
  watermark:    'rgba(79,70,229,0.03)',
  barTrack:     '#e2e8f0',
  footerBorder: '#e2e8f0',
};

const PatientReportModal: React.FC<PatientReportModalProps> = ({ patient, onClose }) => {
  const [fullPatient, setFullPatient] = useState<AdmittedPatient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();
  const c = getColors(isDarkMode);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setIsLoading(true);
        const rawId = patient.id.replace(/^P-/, '');
        const response = await getPatientById(rawId);
        if (response.success) {
          setFullPatient(response.data);
        } else {
          setError('Failed to load patient data.');
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [patient.id]);

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Report - ${fullPatient?.patient_name || patient.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #1a1a2e !important; background: #fff !important; padding: 0; }
          /* Force light-theme colours for print regardless of inline dark styles */
          body div, body span, body p { color: inherit; }
          .report-preview > div { background: #fff !important; color: #1a1a2e !important; }
          .report-preview > div div[style] { background-color: revert; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 15mm; size: A4; }
          }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: 700; color: rgba(79, 70, 229, 0.03); pointer-events: none; z-index: 0; text-transform: uppercase; letter-spacing: 20px; }
        </style>
      </head>
      <body>
        <div class="watermark">CONFIDENTIAL</div>
        ${(() => {
          // Build print-safe HTML by stripping dark-mode inline colours
          const wrapper = document.createElement('div');
          wrapper.innerHTML = printContent.innerHTML;
          // Override all inline background/color styles to light values
          wrapper.querySelectorAll<HTMLElement>('[style]').forEach(el => {
            const s = el.style;
            // Root wrapper
            if (s.background === c.bg || s.backgroundColor === c.bg) { s.background = '#fff'; s.backgroundColor = '#fff'; }
            // Cards / items
            if (s.background === c.cardBg || s.backgroundColor === c.cardBg) { s.background = '#f8fafc'; s.backgroundColor = '#f8fafc'; }
            // Borders
            if (s.borderColor === c.cardBorder) s.borderColor = '#e2e8f0';
            if (s.borderBottom && s.borderBottom.includes(c.headerBorder)) s.borderBottom = '3px solid #4f46e5';
            // Text colours
            if (s.color === c.text || s.color === c.heading) s.color = '#1e293b';
            if (s.color === c.textMuted) s.color = '#64748b';
            if (s.color === c.labelColor) s.color = '#94a3b8';
            if (s.color === c.textEmpty || s.color === c.vitalEmpty) s.color = '#cbd5e1';
            if (s.color === c.accent) s.color = '#4f46e5';
            if (s.color === c.vitalText) s.color = '#1e293b';
            if (s.color === c.vitalUnit) s.color = '#64748b';
            // Accent backgrounds
            if (s.background === c.accent || s.backgroundColor === c.accent) { s.background = '#4f46e5'; s.backgroundColor = '#4f46e5'; }
            // Signature lines
            if (s.borderTop && s.borderTop.includes(c.sigLine)) s.borderTop = '1.5px solid #1e293b';
            // Section borders
            if (s.borderBottom && s.borderBottom.includes(c.sectionBorder)) s.borderBottom = '1.5px solid #e2e8f0';
            // Footer
            if (s.borderTop && s.borderTop.includes(c.footerBorder)) s.borderTop = '2px solid #e2e8f0';
            // Bar track
            if (s.background === c.barTrack || s.backgroundColor === c.barTrack) { s.background = '#e2e8f0'; s.backgroundColor = '#e2e8f0'; }
          });
          return wrapper.innerHTML;
        })()}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const getConditionBadgeClass = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'serious': return 'badge-serious';
      case 'stable': return 'badge-stable';
      case 'recovering': return 'badge-recovering';
      default: return 'badge-stable';
    }
  };

  const getSeverityBarClass = (score: number) => {
    if (score >= 8) return 'severity-critical';
    if (score >= 5) return 'severity-serious';
    if (score >= 3) return 'severity-stable';
    return 'severity-recovering';
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch { return isoString; }
  };

  const hospital = HOSPITAL_INFO;
  const p = fullPatient;

  // Section title shared inline style
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: c.accent, textTransform: 'uppercase',
    letterSpacing: 1.5, borderBottom: `1.5px solid ${c.sectionBorder}`, paddingBottom: 8,
    marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
  };
  const sectionDot: React.CSSProperties = {
    display: 'inline-block', width: 4, height: 16, background: c.accent, borderRadius: 2,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-card rounded-3xl border border-border shadow-[0_0_60px_rgba(99,102,241,0.15)] dark:shadow-[0_0_60px_rgba(19,236,19,0.1)] overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-primary/10 border border-indigo-500/20 dark:border-primary/20">
              <span className="material-symbols-outlined text-indigo-500 dark:text-primary text-xl">description</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-foreground">Patient Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{patient.name} &bull; ID: {patient.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={isLoading || !!error}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 dark:bg-primary px-5 py-2.5 text-sm font-bold text-white dark:text-green-950 hover:bg-indigo-700 dark:hover:bg-[#3bf03b] shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-muted border border-border text-muted-foreground hover:text-card-foreground hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground text-sm">Loading patient report...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="material-symbols-outlined text-red-500 text-4xl mb-3">error</span>
              <p className="text-red-500 font-semibold mb-2">{error}</p>
              <button onClick={onClose} className="text-sm text-muted-foreground hover:text-card-foreground underline">Close</button>
            </div>
          )}

          {p && !isLoading && !error && (
            <div ref={reportRef} className="report-preview">
              <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: "'Inter', sans-serif", color: c.text, background: c.bg, padding: 32, borderRadius: 16 }}>

                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: `3px solid ${c.headerBorder}`, paddingBottom: 20, marginBottom: 30 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.accent, letterSpacing: 1 }}>{hospital.hospital_name}</div>
                  <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>{hospital.hospital_address} &bull; Tel: {hospital.contact} &bull; Email: {hospital.email}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.heading, marginTop: 16, textTransform: 'uppercase', letterSpacing: 2 }}>Patient Medical Report</div>
                  <div style={{ fontSize: 11, color: c.labelColor, marginTop: 6 }}>Generated on: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                </div>

                {/* Patient Demographics */}
                <div style={{ marginBottom: 24 }}>
                  <div style={sectionTitleStyle}>
                    <span style={sectionDot}></span>
                    Patient Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px' }}>
                    <InfoItem label="Full Name" value={p.patient_name} c={c} />
                    <InfoItem label="Patient ID" value={`P-${p.patient_id}`} c={c} />
                    <InfoItem label="Age" value={`${p.age} years`} c={c} />
                    <InfoItem label="Gender" value={capitalize(p.gender)} c={c} />
                    <InfoItem label="Blood Group" value={p.blood_group} c={c} />
                    <InfoItem label="Government ID" value={p.gov_id_type} c={c} />
                  </div>
                  {p.address && (
                    <div style={{ marginTop: 10 }}>
                      <InfoItem label="Address" value={p.address} fullWidth c={c} />
                    </div>
                  )}
                </div>

                {/* Admission Details */}
                <div style={{ marginBottom: 24 }}>
                  <div style={sectionTitleStyle}>
                    <span style={sectionDot}></span>
                    Admission Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px' }}>
                    <InfoItem label="Admission Date" value={p.admission_date} c={c} />
                    <InfoItem label="Ward / Bed" value={p.bed_id} c={c} />
                    <InfoItem label="Attending Doctor" value={p.doctor} c={c} />
                    <InfoItem label="Condition" value={p.condition} badge={getConditionBadgeClass(p.condition)} c={c} />
                    <InfoItem label="Severity Score" value={`${p.severity_score}/10`} severityScore={p.severity_score} severityClass={getSeverityBarClass(p.severity_score)} c={c} />
                    <InfoItem label="Last Updated" value={formatDateTime(p.updated_at)} c={c} />
                  </div>
                </div>

                {/* Vital Signs */}
                <div style={{ marginBottom: 24 }}>
                  <div style={sectionTitleStyle}>
                    <span style={sectionDot}></span>
                    Vital Signs
                    <span style={{ fontSize: 10, color: c.labelColor, fontWeight: 500, marginLeft: 'auto', textTransform: 'none', letterSpacing: 0 }}>Measured: {formatDateTime(p.measured_time)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <VitalCard label="Heart Rate" value={p.heart_rate} unit="bpm" c={c} />
                    <VitalCard label="SpO₂" value={p.spo2} unit="%" c={c} />
                    <VitalCard label="Respiratory Rate" value={p.resp_rate} unit="br/min" c={c} />
                    <VitalCard label="Temperature" value={p.temperature} unit="°C" c={c} />
                    <VitalCard label="Systolic BP" value={p.blood_pressure.systolic} unit="mmHg" c={c} />
                    <VitalCard label="Diastolic BP" value={p.blood_pressure.diastolic} unit="mmHg" c={c} />
                  </div>
                </div>

                {/* Clinical Information */}
                <div style={{ marginBottom: 24 }}>
                  <div style={sectionTitleStyle}>
                    <span style={sectionDot}></span>
                    Clinical Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <ClinicalBlock label="Presenting Ailment / Chief Complaint" value={p.presenting_ailment} c={c} />
                    <ClinicalBlock label="Medical History" value={p.medical_history} c={c} />
                    <ClinicalBlock label="Clinical Notes" value={p.clinical_notes} c={c} />
                    <ClinicalBlock label="Lab Results / Investigations" value={p.lab_results} c={c} />
                  </div>
                </div>

                {/* Footer — Signatures */}
                <div style={{ marginTop: 40, paddingTop: 20, borderTop: `2px solid ${c.footerBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: `1.5px solid ${c.sigLine}`, width: 200, marginTop: 50, paddingTop: 6 }}></div>
                    <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 500 }}>Attending Physician</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.heading, marginTop: 2 }}>{p.doctor}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: `1.5px solid ${c.sigLine}`, width: 200, marginTop: 50, paddingTop: 6 }}></div>
                    <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 500 }}>Hospital Stamp & Seal</div>
                  </div>
                </div>

                {/* Confidential notice */}
                <div style={{ fontSize: 9, color: c.labelColor, textAlign: 'center', marginTop: 30, letterSpacing: 0.5 }}>
                  This document is confidential and intended solely for the use of the individual(s) named above. Unauthorized disclosure, copying, or distribution is strictly prohibited.
                  <br />
                  &copy; {new Date().getFullYear()} {hospital.hospital_name}. All rights reserved.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────── Helper sub-components (themed via `c` color palette) ──────── */

type Colors = ReturnType<typeof getColors>;

const InfoItem: React.FC<{
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
  badge?: string;
  severityScore?: number;
  severityClass?: string;
  c: Colors;
}> = ({ label, value, fullWidth, badge, severityScore, severityClass, c }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', padding: '8px 12px',
    background: c.cardBg, borderRadius: 6, border: `1px solid ${c.cardBorder}`,
    ...(fullWidth ? { gridColumn: '1 / -1' } : {}),
  }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: c.labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    {badge ? (
      <div style={{ marginTop: 4 }}>
        <span style={{
          display: 'inline-block', padding: '4px 14px', borderRadius: 20,
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
          ...(badge === 'badge-critical' ? { background: '#fef2f218', color: '#f87171', border: '1px solid #dc262640' } :
            badge === 'badge-serious' ? { background: '#fffbeb18', color: '#fbbf24', border: '1px solid #d9770640' } :
            badge === 'badge-stable' ? { background: '#f0fdf418', color: '#4ade80', border: '1px solid #16a34a40' } :
            { background: '#eff6ff18', color: '#60a5fa', border: '1px solid #2563eb40' }),
        }}>
          {value}
        </span>
      </div>
    ) : severityScore != null ? (
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginTop: 2 }}>{value}</div>
        <div style={{ height: 8, background: c.barTrack, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
          <div style={{
            height: '100%', borderRadius: 4, width: `${severityScore * 10}%`,
            background: severityClass === 'severity-critical' ? '#ef4444' :
              severityClass === 'severity-serious' ? '#f59e0b' :
              severityClass === 'severity-stable' ? '#22c55e' : '#3b82f6',
          }}></div>
        </div>
      </div>
    ) : (
      <div style={{ fontSize: 13, fontWeight: 600, color: value ? c.text : c.textEmpty, marginTop: 2, fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Not provided'}
      </div>
    )}
  </div>
);

const VitalCard: React.FC<{ label: string; value: number | null; unit: string; c: Colors }> = ({ label, value, unit, c }) => (
  <div style={{
    textAlign: 'center', padding: '12px 8px', background: c.cardBg,
    borderRadius: 8, border: `1px solid ${c.cardBorder}`,
  }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: value != null ? c.vitalText : c.vitalEmpty }}>
      {value != null ? value : '—'}
    </div>
    <div style={{ fontSize: 11, color: c.vitalUnit, fontWeight: 500 }}>{unit}</div>
    <div style={{ fontSize: 10, fontWeight: 600, color: c.labelColor, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
  </div>
);

const ClinicalBlock: React.FC<{ label: string; value: string | null | undefined; c: Colors }> = ({ label, value, c }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, marginBottom: 4 }}>{label}</div>
    <div style={{
      fontSize: 12, lineHeight: 1.7, color: value ? c.text : c.textEmpty,
      whiteSpace: 'pre-wrap', padding: '10px 14px', background: c.cardBg,
      borderRadius: 6, border: `1px solid ${c.cardBorder}`, fontStyle: value ? 'normal' : 'italic',
    }}>
      {value || 'No information recorded'}
    </div>
  </div>
);

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

export default PatientReportModal;
