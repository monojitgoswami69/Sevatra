// ── Doctor Types ─────────────────────────────────────────────────────────────

export interface DoctorInfo {
  id: number;
  staff_id: string;
  full_name: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  contact: string;
  email: string;
  on_duty: boolean;
  shift: 'day' | 'night' | 'rotating';
  max_patients: number;
  current_patient_count: number;
  joined_date: string;
  bio: string;
  languages: string[];
  consultation_fee: number;
}

export interface ScheduleSlot {
  id: number;
  time: string;
  patient_name: string | null;
  patient_id: number | null;
  type: 'consultation' | 'follow-up' | 'procedure' | 'rounds' | 'break';
  status: 'scheduled' | 'completed' | 'in-progress' | 'cancelled' | 'no-show';
  notes?: string;
}

export interface ClinicalNote {
  id: number;
  patient_id: number;
  patient_name: string;
  note: string;
  created_at: string;
  type: 'observation' | 'prescription' | 'discharge-summary' | 'progress';
}

