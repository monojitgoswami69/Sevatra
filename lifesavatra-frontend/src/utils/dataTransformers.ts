/**
 * Utility functions for transforming data between service and UI formats
 */

import type { Patient } from '../types';
import type { AdmittedPatient } from '../services/admissionService';

/**
 * Get initials from a full name
 */
const getInitials = (name: string): string => {
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

/**
 * Map condition to UI format
 */
const mapConditionToUI = (condition: string): Patient['condition'] => {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower === 'critical') return 'Critical';
  if (conditionLower === 'serious') return 'Serious';
  if (conditionLower === 'stable') return 'Stable';
  if (conditionLower === 'recovering') return 'Recovering';
  
  // Default to Stable for unknown conditions
  return 'Stable';
};

/**
 * Format admission date to display only the date portion (e.g. "Jan 15, 2026")
 */
const formatAdmissionDate = (dateStr: string): string => {
  if (!dateStr) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

/**
 * Transform AdmittedPatient to Patient for UI display
 */
export const transformAdmittedPatientToUI = (admittedPatient: AdmittedPatient): Patient => {
  return {
    id: `P-${admittedPatient.patient_id}`,
    name: admittedPatient.patient_name,
    initials: getInitials(admittedPatient.patient_name),
    bedId: admittedPatient.bed_id,
    admissionDate: formatAdmissionDate(admittedPatient.admission_date),
    severityScore: admittedPatient.severity_score,
    condition: mapConditionToUI(admittedPatient.condition),
    doctor: admittedPatient.doctor,
    // Extended fields
    age: admittedPatient.age,
    gender: admittedPatient.gender,
    bloodGroup: admittedPatient.blood_group ?? undefined,
    emergencyContact: admittedPatient.emergency_contact ?? undefined,
    address: admittedPatient.address ?? undefined,
    guardianName: admittedPatient.guardian_name ?? undefined,
    guardianRelation: admittedPatient.guardian_relation ?? undefined,
    guardianPhone: admittedPatient.guardian_phone ?? undefined,
    guardianEmail: admittedPatient.guardian_email ?? undefined,
    presentingAilment: admittedPatient.presenting_ailment ?? undefined,
    medicalHistory: admittedPatient.medical_history ?? undefined,
    clinicalNotes: admittedPatient.clinical_notes ?? undefined,
    labResults: admittedPatient.lab_results ?? undefined,
    heartRate: admittedPatient.heart_rate ?? undefined,
    spo2: admittedPatient.spo2 ?? undefined,
    respRate: admittedPatient.resp_rate ?? undefined,
    temperature: admittedPatient.temperature ?? undefined,
    bpSystolic: admittedPatient.blood_pressure?.systolic ?? undefined,
    bpDiastolic: admittedPatient.blood_pressure?.diastolic ?? undefined,
  };
};

/**
 * Transform array of AdmittedPatients to UI format
 */
export const transformAdmittedPatientsToUI = (admittedPatients: AdmittedPatient[]): Patient[] => {
  return admittedPatients.map(transformAdmittedPatientToUI);
};

/**
 * Calculate occupancy percentage
 */
export const calculateOccupancyPercentage = (occupied: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
};

/**
 * Count patients by severity range
 */
export const countCriticalPatients = (patients: AdmittedPatient[]): number => {
  return patients.filter(p => p.severity_score >= 8).length;
};

/**
 * Count patients admitted today
 */
export const countAdmittedToday = (patients: AdmittedPatient[]): number => {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return patients.filter(p => p.admission_date === todayStr).length;
};

