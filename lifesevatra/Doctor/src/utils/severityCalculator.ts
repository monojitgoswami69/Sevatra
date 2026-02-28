/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                    Severity Score Calculator                         ║
 * ║                                                                      ║
 * ║  Calculates patient severity scores based on vital signs.            ║
 * ║  Used for triage, ward allocation, and clinical decision support.    ║
 * ║                                                                      ║
 * ║  Score Range: 0–10 (sum of 5 sub-scores, each 0–3, capped at 10)     ║
 * ║    0–2  Recovering  → General ward                                   ║
 * ║    3–4  Stable      → General ward                                   ║
 * ║    5–7  Serious     → HDU                                            ║
 * ║    8–10 Critical    → ICU                                            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ────────────────────────────── Types ──────────────────────────────

export type Condition = 'Critical' | 'Serious' | 'Stable' | 'Recovering';
export type Ward = 'ICU' | 'HDU' | 'General';
export type VitalKey = keyof VitalSigns;

export interface VitalSigns {
  heartRate?: number;
  spo2?: number;
  respRate?: number;
  temperature?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
}

export interface SubScore {
  vital: string;
  score: number;
  maxScore: 3;
  factor?: string;
}

export interface SeverityResult {
  /** Overall score 0–10 */
  score: number;
  /** Clinical condition classification */
  condition: Condition;
  /** Recommended ward based on score */
  wardRecommendation: Ward;
  /** Human-readable risk factors for each abnormal vital */
  riskFactors: string[];
  /** Clinical summary sentence */
  summary: string;
  /** Individual sub-scores per vital sign */
  breakdown: SubScore[];
  /** Percentage 0–100 for progress bars */
  percentage: number;
  /** Urgency level for prioritized display */
  urgency: 'immediate' | 'urgent' | 'routine' | 'low';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface NormalRange {
  min: number;
  max: number;
  unit: string;
  label: string;
}

// ────────────────────── Normal Range Reference ──────────────────────

export const NORMAL_RANGES: Record<VitalKey, NormalRange> = {
  heartRate:   { min: 60,   max: 100,  unit: 'bpm',          label: 'Heart Rate' },
  spo2:        { min: 95,   max: 100,  unit: '%',            label: 'SpO₂' },
  respRate:    { min: 12,   max: 20,   unit: 'breaths/min',  label: 'Respiratory Rate' },
  temperature: { min: 36.5, max: 37.5, unit: '°C',           label: 'Temperature' },
  bpSystolic:  { min: 90,   max: 140,  unit: 'mmHg',         label: 'Systolic BP' },
  bpDiastolic: { min: 60,   max: 90,   unit: 'mmHg',         label: 'Diastolic BP' },
};

// ────────────────────── Sub-Score Calculators ──────────────────────

/**
 * Heart Rate (HR) — Normal: 60–100 bpm
 * Scores bradycardia (low) and tachycardia (high)
 */
const calcHR = (hr?: number): SubScore => {
  const base: SubScore = { vital: 'Heart Rate', score: 0, maxScore: 3 };
  if (!hr || hr <= 0) return base;

  if (hr < 40)  return { ...base, score: 3, factor: 'Severe bradycardia (HR < 40)' };
  if (hr < 50)  return { ...base, score: 2, factor: 'Bradycardia (HR 40–50)' };
  if (hr < 60)  return { ...base, score: 1, factor: 'Mild bradycardia (HR 50–60)' };
  if (hr <= 100) return base;
  if (hr <= 110) return { ...base, score: 1, factor: 'Mild tachycardia (HR 100–110)' };
  if (hr <= 130) return { ...base, score: 2, factor: 'Tachycardia (HR 110–130)' };
  return { ...base, score: 3, factor: 'Severe tachycardia (HR > 130)' };
};

/**
 * Oxygen Saturation (SpO₂) — Normal: 95–100%
 * Lower values scored more severely
 */
const calcSpO2 = (spo2?: number): SubScore => {
  const base: SubScore = { vital: 'SpO₂', score: 0, maxScore: 3 };
  if (!spo2 || spo2 <= 0) return base;

  if (spo2 < 85) return { ...base, score: 3, factor: 'Critical hypoxemia (SpO₂ < 85%)' };
  if (spo2 < 90) return { ...base, score: 2, factor: 'Severe hypoxemia (SpO₂ 85–90%)' };
  if (spo2 < 94) return { ...base, score: 1, factor: 'Mild hypoxemia (SpO₂ 90–94%)' };
  return base;
};

/**
 * Respiratory Rate (RR) — Normal: 12–20 breaths/min
 * Scores both bradypnea (low) and tachypnea (high)
 */
const calcRR = (rr?: number): SubScore => {
  const base: SubScore = { vital: 'Respiratory Rate', score: 0, maxScore: 3 };
  if (!rr || rr <= 0) return base;

  if (rr < 8)  return { ...base, score: 3, factor: 'Severe bradypnea (RR < 8)' };
  if (rr < 12) return { ...base, score: 1, factor: 'Bradypnea (RR 8–12)' };
  if (rr <= 20) return base;
  if (rr <= 24) return { ...base, score: 1, factor: 'Mild tachypnea (RR 20–24)' };
  if (rr <= 30) return { ...base, score: 2, factor: 'Tachypnea (RR 24–30)' };
  return { ...base, score: 3, factor: 'Severe tachypnea (RR > 30)' };
};

/**
 * Temperature — Normal: 36.5–37.5 °C
 * Scores hypothermia and fever/hyperthermia
 */
const calcTemp = (t?: number): SubScore => {
  const base: SubScore = { vital: 'Temperature', score: 0, maxScore: 3 };
  if (!t || t <= 0) return base;

  if (t < 35)   return { ...base, score: 3, factor: 'Severe hypothermia (T < 35°C)' };
  if (t < 36)   return { ...base, score: 2, factor: 'Hypothermia (T 35–36°C)' };
  if (t < 36.5) return { ...base, score: 1, factor: 'Mild hypothermia (T 36–36.5°C)' };
  if (t <= 37.5) return base;
  if (t <= 38)  return { ...base, score: 1, factor: 'Low-grade fever (T 37.5–38°C)' };
  if (t <= 39)  return { ...base, score: 2, factor: 'Fever (T 38–39°C)' };
  if (t <= 40)  return { ...base, score: 2, factor: 'High fever (T 39–40°C)' };
  return { ...base, score: 3, factor: 'Critical hyperthermia (T > 40°C)' };
};

/**
 * Blood Pressure — Normal SBP: 90–140, DBP: 60–90 mmHg
 * Evaluates both systolic and diastolic, combined score capped at 3
 */
const calcBP = (sbp?: number, dbp?: number): SubScore => {
  const base: SubScore = { vital: 'Blood Pressure', score: 0, maxScore: 3 };
  if (!sbp || sbp <= 0) return base;

  let score = 0;
  const factors: string[] = [];

  // Systolic
  if (sbp < 70)       { score += 3; factors.push('Critical hypotension (SBP < 70)'); }
  else if (sbp < 90)  { score += 2; factors.push('Hypotension (SBP 70–90)'); }
  else if (sbp < 100) { score += 1; factors.push('Mild hypotension (SBP 90–100)'); }
  else if (sbp > 180) { score += 3; factors.push('Hypertensive crisis (SBP > 180)'); }
  else if (sbp > 160) { score += 2; factors.push('Severe hypertension (SBP 160–180)'); }
  else if (sbp > 140) { score += 1; factors.push('Hypertension (SBP 140–160)'); }

  // Diastolic
  if (dbp && dbp > 0) {
    if (dbp < 40)       { score += 2; factors.push('Critical low DBP (< 40)'); }
    else if (dbp < 60)  { score += 1; factors.push('Low DBP (40–60)'); }
    else if (dbp > 110) { score += 2; factors.push('Critical high DBP (> 110)'); }
    else if (dbp > 90)  { score += 1; factors.push('High DBP (90–110)'); }
  }

  return {
    ...base,
    score: Math.min(score, 3),
    factor: factors.length > 0 ? factors.join(', ') : undefined,
  };
};

// ──────────────────── Main Calculator Function ────────────────────

/**
 * Calculate the overall severity score from vital signs.
 *
 * @param vitals - Patient vital signs (all optional; missing = score 0)
 * @returns Full severity result with score, condition, ward, risk factors,
 *          per-vital breakdown, and UI helpers
 */
export const calculateSeverityScore = (vitals: VitalSigns): SeverityResult => {
  // Compute each sub-score
  const breakdown: SubScore[] = [
    calcHR(vitals.heartRate),
    calcSpO2(vitals.spo2),
    calcRR(vitals.respRate),
    calcTemp(vitals.temperature),
    calcBP(vitals.bpSystolic, vitals.bpDiastolic),
  ];

  // Collect risk factors from abnormal vitals
  const riskFactors = breakdown
    .filter((s) => s.factor)
    .map((s) => s.factor!);

  // Sum and cap at 10
  const rawTotal = breakdown.reduce((sum, s) => sum + s.score, 0);
  const score = Math.min(rawTotal, 10);

  // Classify
  const { condition, wardRecommendation, summary, urgency } = classifyScore(score);

  return {
    score,
    condition,
    wardRecommendation,
    riskFactors,
    summary,
    breakdown,
    percentage: score * 10,
    urgency,
  };
};

// ──────────────────── Score Classification ────────────────────────

interface Classification {
  condition: Condition;
  wardRecommendation: Ward;
  summary: string;
  urgency: 'immediate' | 'urgent' | 'routine' | 'low';
}

const classifyScore = (score: number): Classification => {
  if (score >= 8) return {
    condition: 'Critical',
    wardRecommendation: 'ICU',
    summary: 'Patient requires immediate intensive care with continuous monitoring',
    urgency: 'immediate',
  };
  if (score >= 5) return {
    condition: 'Serious',
    wardRecommendation: 'HDU',
    summary: 'Patient needs high-dependency care with frequent monitoring',
    urgency: 'urgent',
  };
  if (score >= 3) return {
    condition: 'Stable',
    wardRecommendation: 'General',
    summary: 'Patient is stable and can be admitted to general ward',
    urgency: 'routine',
  };
  return {
    condition: 'Recovering',
    wardRecommendation: 'General',
    summary: 'Patient shows good vital signs and is recovering well',
    urgency: 'low',
  };
};

// ────────────────────── UI Style Helpers ──────────────────────────

/**
 * Severity bar / dot colour background + glow shadow by score
 */
export const getSeverityColor = (score: number): string => {
  if (score >= 8) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
  if (score >= 5) return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
  if (score >= 3) return 'bg-[#13ec13] shadow-[0_0_8px_rgba(19,236,19,0.6)]';
  return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
};

/**
 * Text colour for severity value labels
 */
export const getSeverityTextColor = (score: number): string => {
  if (score >= 8) return 'text-red-400';
  if (score >= 5) return 'text-yellow-400';
  if (score >= 3) return 'text-[#13ec13]';
  return 'text-emerald-400';
};

/**
 * Badge / pill styles for condition labels (bg + text + border + glow)
 */
export const getConditionStyles = (condition: Condition): string => {
  const map: Record<Condition, string> = {
    Critical:   'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    Serious:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
    Stable:     'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/20 shadow-[0_0_10px_rgba(19,236,19,0.2)]',
    Recovering: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]',
  };
  return map[condition] ?? map.Stable;
};

/**
 * Ring / border colour for urgency indicators
 */
export const getUrgencyStyles = (urgency: SeverityResult['urgency']): string => {
  const map: Record<SeverityResult['urgency'], string> = {
    immediate: 'ring-2 ring-red-500 animate-pulse',
    urgent:    'ring-2 ring-yellow-500',
    routine:   'ring-1 ring-[#13ec13]/40',
    low:       'ring-1 ring-emerald-500/30',
  };
  return map[urgency] ?? '';
};

/**
 * Status dot colour for condition badges
 */
export const getConditionDotColor = (condition: Condition): string => {
  const map: Record<Condition, string> = {
    Critical:   'bg-red-500',
    Serious:    'bg-yellow-500',
    Stable:     'bg-[#13ec13]',
    Recovering: 'bg-emerald-400',
  };
  return map[condition] ?? 'bg-gray-400';
};

// ────────────────────── Validation Helpers ────────────────────────

/** Physiologically plausible limits for each vital */
const VALIDATION_LIMITS: Record<VitalKey, [number, number, string]> = {
  heartRate:   [0, 300, 'Heart rate must be between 0 and 300 bpm'],
  spo2:        [0, 100, 'SpO₂ must be between 0 and 100%'],
  respRate:    [0, 60,  'Respiratory rate must be between 0 and 60 breaths/min'],
  temperature: [25, 45, 'Temperature must be between 25 and 45°C'],
  bpSystolic:  [0, 300, 'Systolic BP must be between 0 and 300 mmHg'],
  bpDiastolic: [0, 200, 'Diastolic BP must be between 0 and 200 mmHg'],
};

/**
 * Validate that all provided vital values are within plausible instrument ranges.
 * Does NOT flag absence — missing vitals are simply scored as 0.
 */
export const validateVitalSigns = (vitals: VitalSigns): ValidationResult => {
  const errors: string[] = [];

  for (const [key, [min, max, msg]] of Object.entries(VALIDATION_LIMITS)) {
    const val = vitals[key as VitalKey];
    if (val !== undefined && val !== null && (val < min || val > max)) {
      errors.push(msg);
    }
  }

  // Cross-field: SBP should be ≥ DBP
  if (
    vitals.bpSystolic !== undefined &&
    vitals.bpDiastolic !== undefined &&
    vitals.bpSystolic < vitals.bpDiastolic
  ) {
    errors.push('Systolic BP should be greater than or equal to diastolic BP');
  }

  return { valid: errors.length === 0, errors };
};

// ────────────────────── Range Query Helpers ───────────────────────

/**
 * Get the normal range display string for a vital type, e.g. "60–100 bpm"
 */
export const getNormalRange = (vitalType: VitalKey): string => {
  const r = NORMAL_RANGES[vitalType];
  return r ? `${r.min}–${r.max} ${r.unit}` : '';
};

/**
 * Check if a single vital value is within its normal range.
 */
export const isVitalNormal = (vitalType: VitalKey, value: number): boolean => {
  const r = NORMAL_RANGES[vitalType];
  if (!r) return true;
  return value >= r.min && value <= r.max;
};

/**
 * Get the deviation direction for a vital value.
 * Returns 'low', 'normal', or 'high'.
 */
export const getVitalDeviation = (
  vitalType: VitalKey,
  value: number
): 'low' | 'normal' | 'high' => {
  const r = NORMAL_RANGES[vitalType];
  if (!r) return 'normal';
  if (value < r.min) return 'low';
  if (value > r.max) return 'high';
  return 'normal';
};

// ──────────────────────── Trend Helpers ───────────────────────────

export type Trend = 'improving' | 'stable' | 'worsening';

/**
 * Compare two severity scores to determine trend direction.
 *
 * @param previous - Previous severity score
 * @param current  - Current (latest) severity score
 * @param threshold - Minimum difference to count as a change (default 0.5)
 */
export const getSeverityTrend = (
  previous: number,
  current: number,
  threshold = 0.5
): Trend => {
  const diff = current - previous;
  if (diff > threshold) return 'worsening';
  if (diff < -threshold) return 'improving';
  return 'stable';
};

/**
 * Get trend display info for UI rendering
 */
export const getTrendDisplay = (trend: Trend): { icon: string; color: string; label: string } => {
  const map: Record<Trend, { icon: string; color: string; label: string }> = {
    improving: { icon: '↓', color: 'text-emerald-400', label: 'Improving' },
    stable:    { icon: '→', color: 'text-gray-400',    label: 'Stable' },
    worsening: { icon: '↑', color: 'text-red-400',     label: 'Worsening' },
  };
  return map[trend];
};

// ──────────────────────── Default Export ──────────────────────────

export default calculateSeverityScore;
