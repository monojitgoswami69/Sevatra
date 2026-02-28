import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../types';
import { HOSPITAL_INFO } from '../../data/sampleData';
import { getAllAdmissions, getDashboardStats, dischargePatient } from '../../services/admissionService';
import { transformAdmittedPatientsToUI } from '../../utils/dataTransformers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCards from '../../components/dashboard/StatsCards';
import BedStatus from '../../components/dashboard/BedStatus';
import PatientTable from '../../components/dashboard/PatientTable';
import PatientDetailModal from '../../components/dashboard/PatientDetailModal';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const hospital = HOSPITAL_INFO;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);
  
  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    admittedToday: 0,
    dischargedToday: 0,
    bedOccupancy: {
      icuOccupied: 0,
      hduOccupied: 0,
      generalOccupied: 0
    }
  });
  
  // Get bed capacity from hospital info
  const [bedData, setBedData] = useState({
    icuBeds: 0,
    hduBeds: 0,
    generalBeds: 0
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const response = await getDashboardStats();
      
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  // Fetch admitted patients
  const fetchAdmittedPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getAllAdmissions({ limit: 100 });
      
      if (response.success && response.data.length > 0) {
        const transformedPatients = transformAdmittedPatientsToUI(response.data);
        setPatients(transformedPatients);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error('Error fetching admitted patients:', err);
      setError('Failed to load patient data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const icuBeds = hospital.icu_beds;
    const hduBeds = hospital.hdu_beds;
    const generalBeds = hospital.general_beds;
    
    setBedData({
      icuBeds,
      hduBeds,
      generalBeds
    });

    // Fetch dashboard stats and admitted patients
    fetchDashboardStats();
    fetchAdmittedPatients();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchDashboardStats();
      fetchAdmittedPatients();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleDischarge = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to discharge ${patientName}?`)) return;
    try {
      await dischargePatient(parseInt(patientId));
      fetchDashboardStats();
      fetchAdmittedPatients();
    } catch (err) {
      console.error('Discharge error:', err);
      alert('Failed to discharge patient.');
    }
  };

  const refreshAll = () => {
    fetchDashboardStats();
    fetchAdmittedPatients();
  };

  return (
    <DashboardLayout>
      <div className="relative z-10 p-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Hospital Overview</h1>
            <p className="text-sm text-[#9db99d] mt-1">
              Real-time bed allocation and patient status monitoring.
              {isLoading && (
                <span className="ml-2 text-[#13ec13]">
                  <span className="animate-pulse">● Refreshing...</span>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              className="flex items-center gap-2 rounded-full bg-[#1c271c] border border-[#3b543b] px-4 py-2 text-sm font-medium text-[#9db99d] hover:text-white hover:border-[#13ec13] hover:bg-[#13ec13]/5 transition-all"
              title="Refresh patient data"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
            <button
              onClick={() => navigate('/newadmission')}
              className="flex items-center gap-2 rounded-full bg-[#13ec13] px-6 py-3 text-sm font-bold text-[#111811] hover:bg-[#3bf03b] shadow-[0_0_20px_rgba(19,236,19,0.4)] hover:shadow-[0_0_30px_rgba(19,236,19,0.6)] hover:scale-105 transition-all duration-300"
            >
              <span className="material-symbols-outlined text-xl">add_circle</span>
              New Admission
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-yellow-400">warning</span>
            <p className="text-sm text-yellow-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-yellow-400 hover:text-yellow-300">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <StatsCards dashboardStats={dashboardStats} bedData={bedData} />

        {/* Bed Status & Discharge Candidates */}
        <div className="flex flex-col gap-6">
          <BedStatus
            dashboardStats={dashboardStats}
            bedData={bedData}
            patients={patients}
            onDischarge={handleDischarge}
          />

          {/* Patient Table */}
          <PatientTable
            patients={patients}
            isLoading={isLoading}
            onOpenDetails={(patient) => setSelectedPatient(patient)}
            onDischarge={handleDischarge}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onUpdated={refreshAll}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;


