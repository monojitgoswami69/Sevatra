/**
 * Severity Score Calculator
 * 
 * This module provides utilities for calculating patient severity scores based on vital signs.
 * The severity score helps in triaging patients and determining appropriate care levels.
 * 
 * Score Range: 0-10
 * - 0-2: Low severity (Recovering/Stable)
 * - 3-4: Mild severity (Stable)
 * - 5-7: Moderate severity (Serious)
 * - 8-10: High severity (Critical)
 */

export interface VitalSigns {
  heartRate?: number;
  spo2?: number;
  respRate?: number;
  temperature?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
}

export interface SeverityResult {
  score: number;
  condition: 'Critical' | 'Serious' | 'Stable' | 'Recovering';
  wardRecommendation: 'ICU' | 'HDU' | 'General';
  riskFactors: string[];
  summary: string;
}

/**
 * Calculate severity score for heart rate (HR)
 * Normal range: 60-100 bpm
 */
const calculateHeartRateScore = (heartRate?: number): { score: number; factor?: string } => {
  if (!heartRate || heartRate <= 0) return { score: 0 };
  
  if (heartRate < 40) return { score: 3, factor: 'Severe bradycardia (HR < 40)' };
  if (heartRate < 50) return { score: 2, factor: 'Bradycardia (HR 40-50)' };
  if (heartRate < 60) return { score: 1, factor: 'Mild bradycardia (HR 50-60)' };
  if (heartRate <= 100) return { score: 0 }; // Normal
  if (heartRate <= 110) return { score: 1, factor: 'Mild tachycardia (HR 100-110)' };
  if (heartRate <= 130) return { score: 2, factor: 'Tachycardia (HR 110-130)' };
  return { score: 3, factor: 'Severe tachycardia (HR > 130)' };
};

/**
 * Calculate severity score for oxygen saturation (SpO2)
 * Normal range: 95-100%
 */
const calculateSpO2Score = (spo2?: number): { score: number; factor?: string } => {
  if (!spo2 || spo2 <= 0) return { score: 0 };
  
  if (spo2 < 85) return { score: 3, factor: 'Critical hypoxemia (SpO2 < 85%)' };
  if (spo2 < 90) return { score: 2, factor: 'Severe hypoxemia (SpO2 85-90%)' };
  if (spo2 < 94) return { score: 1, factor: 'Mild hypoxemia (SpO2 90-94%)' };
  return { score: 0 }; // Normal (94-100%)
};

/**
 * Calculate severity score for respiratory rate (RR)
 * Normal range: 12-20 breaths/min
 */
const calculateRespRateScore = (respRate?: number): { score: number; factor?: string } => {
  if (!respRate || respRate <= 0) return { score: 0 };
  
  if (respRate < 8) return { score: 3, factor: 'Severe bradypnea (RR < 8)' };
  if (respRate < 12) return { score: 1, factor: 'Bradypnea (RR 8-12)' };
  if (respRate <= 20) return { score: 0 }; // Normal
  if (respRate <= 24) return { score: 1, factor: 'Mild tachypnea (RR 20-24)' };
  if (respRate <= 30) return { score: 2, factor: 'Tachypnea (RR 24-30)' };
  return { score: 3, factor: 'Severe tachypnea (RR > 30)' };
};

/**
 * Calculate severity score for temperature
 * Normal range: 36.5-37.5°C (97.7-99.5°F)
 */
const calculateTemperatureScore = (temperature?: number): { score: number; factor?: string } => {
  if (!temperature || temperature <= 0) return { score: 0 };
  
  if (temperature < 35) return { score: 3, factor: 'Severe hypothermia (T < 35°C)' };
  if (temperature < 36) return { score: 2, factor: 'Hypothermia (T 35-36°C)' };
  if (temperature < 36.5) return { score: 1, factor: 'Mild hypothermia (T 36-36.5°C)' };
  if (temperature <= 37.5) return { score: 0 }; // Normal
  if (temperature <= 38) return { score: 1, factor: 'Low-grade fever (T 37.5-38°C)' };
  if (temperature <= 39) return { score: 2, factor: 'Fever (T 38-39°C)' };
  if (temperature <= 40) return { score: 2, factor: 'High fever (T 39-40°C)' };
  return { score: 3, factor: 'Critical hyperthermia (T > 40°C)' };
};

/**
 * Calculate severity score for blood pressure
 * Normal systolic: 90-140 mmHg
 * Normal diastolic: 60-90 mmHg
 */
const calculateBloodPressureScore = (
  bpSystolic?: number,
  bpDiastolic?: number
): { score: number; factor?: string } => {
  if (!bpSystolic || bpSystolic <= 0) return { score: 0 };
  
  let score = 0;
  const factors: string[] = [];
  
  // Systolic BP
  if (bpSystolic < 70) {
    score += 3;
    factors.push('Critical hypotension (SBP < 70)');
  } else if (bpSystolic < 90) {
    score += 2;
    factors.push('Hypotension (SBP 70-90)');
  } else if (bpSystolic < 100) {
    score += 1;
    factors.push('Mild hypotension (SBP 90-100)');
  } else if (bpSystolic > 180) {
    score += 3;
    factors.push('Hypertensive crisis (SBP > 180)');
  } else if (bpSystolic > 160) {
    score += 2;
    factors.push('Severe hypertension (SBP 160-180)');
  } else if (bpSystolic > 140) {
    score += 1;
    factors.push('Hypertension (SBP 140-160)');
  }
  
  // Diastolic BP
  if (bpDiastolic && bpDiastolic > 0) {
    if (bpDiastolic < 40) {
      score += 2;
      factors.push('Critical low DBP (< 40)');
    } else if (bpDiastolic < 60) {
      score += 1;
      factors.push('Low DBP (40-60)');
    } else if (bpDiastolic > 110) {
      score += 2;
      factors.push('Critical high DBP (> 110)');
    } else if (bpDiastolic > 90) {
      score += 1;
      factors.push('High DBP (90-110)');
    }
  }
  
  return {
    score: Math.min(score, 3), // Cap at 3
    factor: factors.length > 0 ? factors.join(', ') : undefined
  };
};

/**
 * Main function to calculate overall severity score
 */
export const calculateSeverityScore = (vitals: VitalSigns): SeverityResult => {
  const scores: { score: number; factor?: string }[] = [];
  const riskFactors: string[] = [];
  
  // Calculate individual scores
  const hrScore = calculateHeartRateScore(vitals.heartRate);
  scores.push(hrScore);
  if (hrScore.factor) riskFactors.push(hrScore.factor);
  
  const spo2Score = calculateSpO2Score(vitals.spo2);
  scores.push(spo2Score);
  if (spo2Score.factor) riskFactors.push(spo2Score.factor);
  
  const rrScore = calculateRespRateScore(vitals.respRate);
  scores.push(rrScore);
  if (rrScore.factor) riskFactors.push(rrScore.factor);
  
  const tempScore = calculateTemperatureScore(vitals.temperature);
  scores.push(tempScore);
  if (tempScore.factor) riskFactors.push(tempScore.factor);
  
  const bpScore = calculateBloodPressureScore(vitals.bpSystolic, vitals.bpDiastolic);
  scores.push(bpScore);
  if (bpScore.factor) riskFactors.push(bpScore.factor);
  
  // Calculate total score (sum of all individual scores)
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  
  // Cap the score at 10
  const finalScore = Math.min(totalScore, 10);
  
  // Determine condition based on score
  let condition: 'Critical' | 'Serious' | 'Stable' | 'Recovering';
  let wardRecommendation: 'ICU' | 'HDU' | 'General';
  let summary: string;
  
  if (finalScore >= 8) {
    condition = 'Critical';
    wardRecommendation = 'ICU';
    summary = 'Patient requires immediate intensive care with continuous monitoring';
  } else if (finalScore >= 5) {
    condition = 'Serious';
    wardRecommendation = 'HDU';
    summary = 'Patient needs high-dependency care with frequent monitoring';
  } else if (finalScore >= 3) {
    condition = 'Stable';
    wardRecommendation = 'General';
    summary = 'Patient is stable and can be admitted to general ward';
  } else {
    condition = 'Recovering';
    wardRecommendation = 'General';
    summary = 'Patient shows good vital signs and is recovering well';
  }
  
  return {
    score: finalScore,
    condition,
    wardRecommendation,
    riskFactors,
    summary
  };
};

/**
 * Get severity color class for UI display
 */
export const getSeverityColor = (score: number): string => {
  if (score >= 8) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
  if (score >= 5) return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
  if (score >= 3) return 'bg-[#13ec13] shadow-[0_0_8px_rgba(19,236,19,0.6)]';
  return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
};

/**
 * Get severity text color class for UI display
 */
export const getSeverityTextColor = (score: number): string => {
  if (score >= 8) return 'text-red-400';
  if (score >= 5) return 'text-yellow-400';
  if (score >= 3) return 'text-[#13ec13]';
  return 'text-emerald-400';
};

/**
 * Get condition style classes for UI display
 */
export const getConditionStyles = (condition: 'Critical' | 'Serious' | 'Stable' | 'Recovering'): string => {
  const styles = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    Serious: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
    Stable: 'bg-[#13ec13]/10 text-[#13ec13] border-[#13ec13]/20 shadow-[0_0_10px_rgba(19,236,19,0.2)]',
    Recovering: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
  };
  return styles[condition];
};

/**
 * Validate vital signs - check if values are within acceptable ranges
 */
export const validateVitalSigns = (vitals: VitalSigns): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (vitals.heartRate !== undefined) {
    if (vitals.heartRate < 0 || vitals.heartRate > 300) {
      errors.push('Heart rate must be between 0 and 300 bpm');
    }
  }
  
  if (vitals.spo2 !== undefined) {
    if (vitals.spo2 < 0 || vitals.spo2 > 100) {
      errors.push('SpO2 must be between 0 and 100%');
    }
  }
  
  if (vitals.respRate !== undefined) {
    if (vitals.respRate < 0 || vitals.respRate > 60) {
      errors.push('Respiratory rate must be between 0 and 60 breaths/min');
    }
  }
  
  if (vitals.temperature !== undefined) {
    if (vitals.temperature < 30 || vitals.temperature > 45) {
      errors.push('Temperature must be between 30 and 45°C');
    }
  }
  
  if (vitals.bpSystolic !== undefined) {
    if (vitals.bpSystolic < 0 || vitals.bpSystolic > 300) {
      errors.push('Systolic BP must be between 0 and 300 mmHg');
    }
  }
  
  if (vitals.bpDiastolic !== undefined) {
    if (vitals.bpDiastolic < 0 || vitals.bpDiastolic > 200) {
      errors.push('Diastolic BP must be between 0 and 200 mmHg');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get normal range information for a vital sign
 */
export const getNormalRange = (vitalType: keyof VitalSigns): string => {
  const ranges = {
    heartRate: '60-100 bpm',
    spo2: '95-100%',
    respRate: '12-20 breaths/min',
    temperature: '36.5-37.5°C',
    bpSystolic: '90-140 mmHg',
    bpDiastolic: '60-90 mmHg'
  };
  return ranges[vitalType] || '';
};

/**
 * Check if a vital sign is within normal range
 */
export const isVitalNormal = (vitalType: keyof VitalSigns, value: number): boolean => {
  const normalRanges: Record<keyof VitalSigns, [number, number]> = {
    heartRate: [60, 100],
    spo2: [95, 100],
    respRate: [12, 20],
    temperature: [36.5, 37.5],
    bpSystolic: [90, 140],
    bpDiastolic: [60, 90]
  };
  
  const range = normalRanges[vitalType];
  if (!range) return true;
  
  return value >= range[0] && value <= range[1];
};

export default calculateSeverityScore;

