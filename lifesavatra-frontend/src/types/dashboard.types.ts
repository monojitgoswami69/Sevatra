export interface Patient {
  id: string;
  name: string;
  initials: string;
  bedId: string;
  admissionDate: string;
  severityScore: number;
  condition: 'Critical' | 'Serious' | 'Stable' | 'Recovering';
  doctor: string;
}

export interface BedStatus {
  type: 'ICU' | 'HDU' | 'General';
  available: number;
  total: number;
  occupancyPercentage: number;
  status: 'Critical' | 'Moderate' | 'Good';
}

export interface PendingDischarge {
  initials: string;
  name: string;
  id: string;
}

export interface DashboardStats {
  totalOccupancy: number;
  admittedToday: number;
  criticalPatients: number;
  dischargesToday: number;
}

// ── Doctor Portal Types ──────────────────────────────────────────────────────

export interface DoctorInfo {
  id: string;
  staff_id: string;
  full_name: string;
  specialty: string;
  qualification?: string | null;
  experience_years: number;
  contact?: string;
  email?: string;
  on_duty: boolean;
  shift: string;
  max_patients: number;
  current_patient_count: number;
  joined_date: string;
  bio?: string;
  languages?: string[];
  consultation_fee?: number;
}

export interface ScheduleSlot {
  id: string;
  time: string;
  patient_name: string;
  patient_id?: string;
  type: string;
  status: 'scheduled' | 'completed' | 'in-progress' | 'cancelled' | 'no-show';
  notes: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name?: string;
  note: string;
  created_at: string;
  type: 'observation' | 'prescription' | 'discharge-summary' | 'progress';
}

