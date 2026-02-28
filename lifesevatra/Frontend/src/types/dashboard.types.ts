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

