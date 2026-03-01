import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getAllAdmissions, getDashboardStats, dischargePatient } from '../../services/admissionService';
import { transformAdmittedPatientsToUI } from '../../utils/dataTransformers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCards from '../../components/dashboard/StatsCards';
import BedStatus from '../../components/dashboard/BedStatus';
import PatientTable from '../../components/dashboard/PatientTable';
import PatientDetailModal from '../../components/dashboard/PatientDetailModal';
import { useNavbar } from '../../context/NavbarContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hospital: authHospital } = useAuth();
  const hospital = authHospital ?? { id: '', hospital_name: '', email: '', contact: '', hospital_address: '', icu_beds: 0, hdu_beds: 0, general_beds: 0, status: 'active' };
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);
  const [dischargeConfirm, setDischargeConfirm] = useState<{ patientId: string; patientName: string } | null>(null);
  const [isDischarging, setIsDischarging] = useState(false);
  
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

  const handleDischarge = (patientId: string, patientName: string) => {
    setDischargeConfirm({ patientId, patientName });
  };

  const confirmDischarge = async () => {
    if (!dischargeConfirm) return;
    setIsDischarging(true);
    try {
      await dischargePatient(dischargeConfirm.patientId.replace(/^P-/, ''));
      setDischargeConfirm(null);
      fetchDashboardStats();
      fetchAdmittedPatients();
    } catch (err) {
      console.error('Discharge error:', err);
      alert('Failed to discharge patient.');
    } finally {
      setIsDischarging(false);
    }
  };

  const refreshAll = () => {
    fetchDashboardStats();
    fetchAdmittedPatients();
  };

  // Inject title and actions into the top navbar
  const { setNavTitle, setNavActions } = useNavbar();
  const refreshRef = useRef(refreshAll);
  refreshRef.current = refreshAll;

  useEffect(() => {
    setNavTitle(
      <span className="text-lg font-bold tracking-tight">Hospital Overview</span>
    );
    setNavActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => refreshRef.current()}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-indigo-400 dark:hover:border-primary hover:bg-indigo-50 dark:hover:bg-primary/10 hover:text-indigo-600 dark:hover:text-white transition-all duration-300 group hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform duration-500">refresh</span>
          Refresh
        </button>
        <button
          onClick={() => navigate('/newadmission')}
          className="flex items-center gap-2 rounded-full bg-indigo-600 dark:bg-primary px-5 py-1.5 text-sm font-bold text-white dark:text-green-950 hover:bg-indigo-700 dark:hover:bg-[#3bf03b] shadow-md shadow-indigo-500/20 dark:shadow-primary/20 hover:shadow-indigo-500/40 dark:hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          New Admission
        </button>
      </div>
    );
    return () => { setNavTitle(null); setNavActions(null); };
  }, [navigate]);

  return (
    <DashboardLayout>
      <div className="relative z-10 p-8">

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-yellow-500">warning</span>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-300">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <StatsCards dashboardStats={dashboardStats} bedData={bedData} />

        {/* Bed Status */}
        <div className="flex flex-col gap-6">
          <BedStatus
            dashboardStats={dashboardStats}
            bedData={bedData}
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

      {/* Discharge Confirmation Modal */}
      {dischargeConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-8 flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-3xl">warning</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-card-foreground mb-2">Discharge Patient?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You are about to discharge <span className="font-bold text-card-foreground">{dischargeConfirm.patientName}</span>.<br />
                This will release their bed and remove them from the active patient list.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDischargeConfirm(null)}
                disabled={isDischarging}
                className="flex-1 py-3 rounded-xl border border-border bg-transparent text-muted-foreground hover:text-card-foreground hover:border-card-foreground/30 font-bold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDischarge}
                disabled={isDischarging}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDischarging ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                    Discharging...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">logout</span>
                    Confirm Discharge
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;


