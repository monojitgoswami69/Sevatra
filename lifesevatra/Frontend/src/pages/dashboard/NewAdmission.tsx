import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdmission, getBedStats, type AdmissionPayload } from '../../services/admissionService';
import { calculateSeverityScore as calculateSeverity } from '../../utils/severityCalculator';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface VitalsData {
  heartRate: string;
  spo2: string;
  respRate: string;
  temperature: string;
  bpSystolic: string;
  bpDiastolic: string;
}

interface PatientData {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  bloodGroup: string;
  emergencyContact: string;
  presentingAilment: string;
  medicalHistory: string;
  clinicalNotes: string;
  labResults: string;
  // Optional fields
  govIdType?: string;
  idPicture?: string;
  patientPicture?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  whatsappNumber?: string;
  address?: string;
}

const NewAdmission: React.FC = () => {
  const navigate = useNavigate();
  
  const [vitals, setVitals] = useState<VitalsData>({
    heartRate: '',
    spo2: '',
    respRate: '',
    temperature: '',
    bpSystolic: '',
    bpDiastolic: '',
  });

  const [patientData, setPatientData] = useState<PatientData>({
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
    presentingAilment: '',
    medicalHistory: '',
    clinicalNotes: '',
    labResults: '',
    // Optional fields
    govIdType: '',
    idPicture: '',
    patientPicture: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    guardianEmail: '',
    whatsappNumber: '',
    address: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bedAvailability, setBedAvailability] = useState<{
    allocatedBed: string | null;
    severityScore: number;
    recommendedWard: string;
    status: 'available' | 'waiting' | 'shifted' | 'alert';
    message: string;
  } | null>(null);

  const handleVitalChange = (field: keyof VitalsData, value: string) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  const handlePatientDataChange = (field: keyof PatientData, value: string) => {
    setPatientData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAdmission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Validate required fields
      if (!patientData.name || !patientData.age || !patientData.gender || !patientData.bloodGroup || !patientData.emergencyContact) {
        setError('Please fill in all required fields: Name, Age, Gender, Blood Group, and Emergency Contact');
        return;
      }

      // Prepare payload
      const payload: AdmissionPayload = {
        name: patientData.name,
        age: parseInt(patientData.age),
        gender: patientData.gender,
        bloodGroup: patientData.bloodGroup || undefined,
        emergencyContact: patientData.emergencyContact || undefined,
        presentingAilment: patientData.presentingAilment || undefined,
        medicalHistory: patientData.medicalHistory || undefined,
        clinicalNotes: patientData.clinicalNotes || undefined,
        labResults: patientData.labResults || undefined,
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : undefined,
        spo2: vitals.spo2 ? parseInt(vitals.spo2) : undefined,
        respRate: vitals.respRate ? parseInt(vitals.respRate) : undefined,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : undefined,
        bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : undefined,
        bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : undefined,
        // Optional fields
        govIdType: patientData.govIdType || undefined,
        idPicture: patientData.idPicture || undefined,
        patientPicture: patientData.patientPicture || undefined,
        guardianName: patientData.guardianName || undefined,
        guardianRelation: patientData.guardianRelation || undefined,
        guardianPhone: patientData.guardianPhone || undefined,
        guardianEmail: patientData.guardianEmail || undefined,
        whatsappNumber: patientData.whatsappNumber || undefined,
        address: patientData.address || undefined,
      };

      // Call API
      const result = await createAdmission(payload);

      if (result.success) {
        setSuccessMessage(
          `Patient admitted successfully! Patient ID: ${result.data.patient_id}, Bed: ${result.data.bed_id}`
        );
        
        console.log('Admission created:', result.data);

        // Redirect to overview after 2 seconds
        setTimeout(() => {
          navigate('/overview');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create admission';
      setError(errorMessage);
      console.error('Error creating admission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/overview');
  };

  const handleCheckAvailability = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBedAvailability(null);

      // Calculate severity score using the imported function
      const vitalSigns = {
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : undefined,
        spo2: vitals.spo2 ? parseInt(vitals.spo2) : undefined,
        respRate: vitals.respRate ? parseInt(vitals.respRate) : undefined,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : undefined,
        bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : undefined,
        bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : undefined,
      };
      
      const severityResult = calculateSeverity(vitalSigns);
      const severityScore = severityResult.score;

      // Fetch current bed stats
      const statsRes = await getBedStats();
      const { by_type, totals } = statsRes.data;

      // Determine recommended ward from severity
      let recommendedWard = 'General';
      if (severityScore >= 8) recommendedWard = 'ICU';
      else if (severityScore >= 5) recommendedWard = 'HDU';

      const wardRow = by_type.find(r => r.bed_type === (recommendedWard === 'General' ? 'GENERAL' : recommendedWard));
      const wardAvailable = wardRow ? parseInt(wardRow.available_beds) : 0;

      let status: 'available' | 'waiting' | 'shifted' | 'alert' = 'available';
      let message = '';

      if (wardAvailable > 0) {
        message = `${wardAvailable} bed(s) available in ${recommendedWard} Ward. The system will assign the best bed upon admission.`;
      } else if (totals.available_beds > 0) {
        status = 'shifted';
        message = `${recommendedWard} Ward is full. ${totals.available_beds} bed(s) available in other wards — the system will assign an alternative on admission.`;
      } else {
        status = 'alert';
        message = 'CRITICAL: No beds available in any ward. Immediate action required!';
      }

      setBedAvailability({
        allocatedBed: null, // assigned on admission
        severityScore,
        recommendedWard,
        status,
        message,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check bed availability';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen flex flex-col bg-[#111811] text-white font-display">
      <style>
        {`
          /* Hide number input spinners */
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }

          /* Modal animations */
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }

          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}
      </style>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#3b543b]/30 bg-[#111811]/95 backdrop-blur-md px-4 sm:px-10 py-3">
        <div className="flex items-center gap-4 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm group cursor-pointer bg-[#13ec13]/10 border-[#13ec13]/20 text-[#13ec13] shadow-[0_0_25px_rgba(19,236,19,0.3)] hover:shadow-[0_0_40px_rgba(19,236,19,0.6),0_0_60px_rgba(19,236,19,0.3)] transition-all duration-500 hover:scale-110">
            <svg 
              className="w-6 h-6 group-hover:animate-pulse" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2.5" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-white">
            Lifesevatra
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-4 sm:gap-8 items-center">
          <div className="hidden sm:flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-6 bg-[#1c271c] border border-[#3b543b] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#152015] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">Cancel</span>
            </button>
            <button
              onClick={handleSaveAdmission}
              disabled={isLoading}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-6 bg-[#13ec13] hover:bg-[#3bf03b] text-green-950 text-sm font-bold leading-normal tracking-[0.015em] transition-all duration-300 shadow-[0_0_30px_rgba(19,236,19,0.4),0_0_60px_rgba(19,236,19,0.2)] hover:shadow-[0_0_50px_rgba(19,236,19,0.7),0_0_100px_rgba(19,236,19,0.4)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  <span className="truncate">Saving...</span>
                </>
              ) : (
                <span className="truncate">Save Admission</span>
              )}
            </button>
          </div>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-[#3b543b] flex items-center justify-center bg-[#1c271c]">
            <span className="material-symbols-outlined text-[#13ec13] text-2xl">person</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1200px] flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex flex-col gap-2 border-b border-[#3b543b]/30 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] shadow-[0_0_15px_rgba(19,236,19,0.2)] hover:scale-110 transition-all cursor-pointer">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                New Patient Admission
              </h1>
            </div>
            <p className="text-gray-400 text-base font-normal leading-normal max-w-2xl">
              Enter patient details, medical history, and current vitals to assess severity and
              allocate appropriate bed resources.
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <div className="flex-1">
                <h3 className="text-red-500 font-bold mb-1">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {successMessage && (
            <div className="bg-[#13ec13]/10 border border-[#13ec13]/50 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#13ec13]">check_circle</span>
              <div className="flex-1">
                <h3 className="text-[#13ec13] font-bold mb-1">Success!</h3>
                <p className="text-gray-300 text-sm">{successMessage}</p>
                <p className="text-gray-400 text-xs mt-1">Redirecting to overview...</p>
              </div>
            </div>
          )}

          {/* Main Grid - Redesigned Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Essential Inputs */}
            <div className="flex flex-col gap-6">
              {/* Patient Demographics */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-2 rounded-lg bg-[#13ec13]/10 border border-[#13ec13]/20 shadow-[0_0_10px_rgba(19,236,19,0.15)]">
                    <span className="material-symbols-outlined text-[#13ec13] text-xl">badge</span>
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-bold leading-tight">Patient Demographics</h2>
                    <p className="text-xs text-[#9db99d]">Required information</p>
                  </div>
                </div>
                <div className="bg-[#1c271c] rounded-2xl p-6 border border-[#3b543b] shadow-lg hover:border-[#13ec13]/30 transition-all">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="col-span-2 flex flex-col">
                      <span className="text-slate-300 text-sm font-semibold pb-2 ml-1 flex items-center gap-1">
                        Patient Name <span className="text-red-400">*</span>
                      </span>
                      <input
                        className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                        placeholder="Enter full name"
                        type="text"
                        value={patientData.name}
                        onChange={(e) => handlePatientDataChange('name', e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-300 text-sm font-semibold pb-2 ml-1 flex items-center gap-1">
                        Age <span className="text-red-400">*</span>
                      </span>
                      <input
                        className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                        placeholder="Years"
                        type="number"
                        value={patientData.age}
                        onChange={(e) => handlePatientDataChange('age', e.target.value)}
                      />
                    </label>
                    <div className="flex flex-col">
                      <span className="text-slate-300 text-sm font-semibold pb-2 ml-1 flex items-center gap-1">
                        Gender <span className="text-red-400">*</span>
                      </span>
                      <div className="flex gap-2">
                        {(['male', 'female', 'other'] as const).map((gender) => (
                          <label key={gender} className="flex-1 group cursor-pointer">
                            <input
                              className="peer sr-only"
                              name="gender"
                              type="radio"
                              checked={patientData.gender === gender}
                              onChange={() => handlePatientDataChange('gender', gender)}
                            />
                            <div className="flex items-center justify-center rounded-lg border border-[#3b543b] bg-[#152015] h-11 text-[#9db99d] text-xs font-bold transition-all peer-checked:border-[#13ec13] peer-checked:text-[#13ec13] peer-checked:bg-[#13ec13]/10 peer-checked:shadow-[0_0_10px_rgba(19,236,19,0.2)] hover:border-[#3b543b]/80">
                              <span className="capitalize">{gender}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <label className="flex flex-col">
                      <span className="text-slate-300 text-sm font-semibold pb-2 ml-1 flex items-center gap-1">
                        Blood Group <span className="text-red-400">*</span>
                      </span>
                      <select
                        className="form-select block w-full rounded-xl border px-4 py-3 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] cursor-pointer"
                        value={patientData.bloodGroup}
                        onChange={(e) => handlePatientDataChange('bloodGroup', e.target.value)}
                      >
                        <option value="" className="bg-[#152015] text-gray-400">Select blood group</option>
                        <option value="A+" className="bg-[#152015] text-white">A+</option>
                        <option value="A-" className="bg-[#152015] text-white">A-</option>
                        <option value="B+" className="bg-[#152015] text-white">B+</option>
                        <option value="B-" className="bg-[#152015] text-white">B-</option>
                        <option value="AB+" className="bg-[#152015] text-white">AB+</option>
                        <option value="AB-" className="bg-[#152015] text-white">AB-</option>
                        <option value="O+" className="bg-[#152015] text-white">O+</option>
                        <option value="O-" className="bg-[#152015] text-white">O-</option>
                      </select>
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-300 text-sm font-semibold pb-2 ml-1 flex items-center gap-1">
                        Emergency Contact <span className="text-red-400">*</span>
                      </span>
                      <input
                        className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                        placeholder="Phone number"
                        type="tel"
                        value={patientData.emergencyContact}
                        onChange={(e) => handlePatientDataChange('emergencyContact', e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* Current Vitals */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                      <span className="material-symbols-outlined text-red-500 text-xl animate-pulse">ecg_heart</span>
                    </div>
                    <div>
                      <h2 className="text-white text-xl font-bold leading-tight">Current Vitals</h2>
                      <p className="text-xs text-[#9db99d]">Live patient monitoring</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#13ec13] bg-[#13ec13]/10 px-2.5 py-1 rounded-full border border-[#13ec13]/20">
                    Live
                  </span>
                </div>
                <div className="bg-[#1c271c] rounded-2xl p-6 border border-[#3b543b] shadow-lg hover:border-red-500/30 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    {/* Heart Rate */}
                    <div className="bg-[#152015] p-4 rounded-xl border border-[#3b543b] hover:border-red-500/50 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-xs font-medium">Heart Rate</span>
                        <span className="material-symbols-outlined text-red-500 text-lg">favorite</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input
                          className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                          placeholder="--"
                          type="number"
                          value={vitals.heartRate}
                          onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                        />
                        <span className="text-xs text-gray-400 font-bold">bpm</span>
                      </div>
                    </div>

                    {/* SpO2 */}
                    <div className="bg-[#152015] p-4 rounded-xl border border-[#3b543b] hover:border-blue-500/50 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-xs font-medium">SpO2</span>
                        <span className="material-symbols-outlined text-blue-400 text-lg">water_drop</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input
                          className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                          placeholder="--"
                          type="number"
                          value={vitals.spo2}
                          onChange={(e) => handleVitalChange('spo2', e.target.value)}
                        />
                        <span className="text-xs text-gray-400 font-bold">%</span>
                      </div>
                    </div>

                    {/* Respiratory Rate */}
                    <div className="bg-[#152015] p-4 rounded-xl border border-[#3b543b] hover:border-white/30 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-xs font-medium">Resp. Rate</span>
                        <span className="material-symbols-outlined text-white/50 text-lg">air</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input
                          className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                          placeholder="--"
                          type="number"
                          value={vitals.respRate}
                          onChange={(e) => handleVitalChange('respRate', e.target.value)}
                        />
                        <span className="text-xs text-gray-400 font-bold">bpm</span>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="bg-[#152015] p-4 rounded-xl border border-[#3b543b] hover:border-orange-500/50 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-xs font-medium">Temperature</span>
                        <span className="material-symbols-outlined text-orange-400 text-lg">thermostat</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <input
                          className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                          placeholder="--"
                          type="number"
                          value={vitals.temperature}
                          onChange={(e) => handleVitalChange('temperature', e.target.value)}
                        />
                        <span className="text-xs text-gray-400 font-bold">°C</span>
                      </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="col-span-2 bg-[#152015] p-4 rounded-xl border border-[#3b543b] hover:border-[#13ec13]/50 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-xs font-medium">Blood Pressure</span>
                        <span className="material-symbols-outlined text-[#13ec13] text-lg">compress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none text-right"
                          placeholder="120"
                          type="number"
                          value={vitals.bpSystolic}
                          onChange={(e) => handleVitalChange('bpSystolic', e.target.value)}
                        />
                        <span className="text-xl text-gray-400 font-light">/</span>
                        <input
                          className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                          placeholder="80"
                          type="number"
                          value={vitals.bpDiastolic}
                          onChange={(e) => handleVitalChange('bpDiastolic', e.target.value)}
                        />
                        <span className="text-xs text-gray-400 font-bold ml-auto">mmHg</span>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* Bed Allocation */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                    <span className="material-symbols-outlined text-purple-400 text-xl">bed</span>
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-bold leading-tight">Bed Allocation</h2>
                    <p className="text-xs text-[#9db99d]">Check availability & severity</p>
                  </div>
                </div>
                <div className="bg-[#13ec13]/10 border border-[#13ec13]/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(19,236,19,0.1)] hover:border-[#13ec13]/30 transition-all">
                  <p className="text-gray-300 text-sm mb-4">
                    Based on the vitals entered, the system will calculate severity score and recommend an appropriate ward.
                  </p>
                  
                  <button
                    onClick={handleCheckAvailability}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-[#13ec13] text-green-950 text-base font-bold hover:bg-[#3bf03b] transition-all duration-300 shadow-[0_0_30px_rgba(19,236,19,0.4)] hover:shadow-[0_0_50px_rgba(19,236,19,0.7)] hover:scale-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span className="material-symbols-outlined">bed</span>
                    <span>{isLoading ? 'Checking...' : 'Check Availability'}</span>
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column - Additional Information */}
            <div className="flex flex-col gap-6">
              {/* Identity & Authority */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
                    <span className="material-symbols-outlined text-blue-400 text-xl">info</span>
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-bold leading-tight">Identity & Authority</h2>
                    <p className="text-xs text-[#9db99d]">Identification & contact details</p>
                  </div>
                </div>
                <div className="bg-[#1c271c] rounded-2xl p-6 border border-[#3b543b] shadow-lg hover:border-blue-500/30 transition-all">
                  <div className="space-y-5">
                    {/* ID & Patient Pictures */}
                    <div className="space-y-4">
                      <h3 className="text-[#9db99d] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">badge</span>
                        Identification Photos
                      </h3>
                      
                      <div className="space-y-3">
                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            Patient Picture
                          </span>
                          <input
                            className="form-input block w-full rounded-xl border px-4 py-3 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#13ec13] file:text-green-950 hover:file:bg-[#3bf03b] file:cursor-pointer"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Handle file upload here
                                console.log('Patient Picture selected:', file);
                              }
                            }}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            Type of Govt ID
                          </span>
                          <select
                            className="form-select block w-full rounded-xl border px-4 py-3 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] cursor-pointer"
                            value={patientData.govIdType}
                            onChange={(e) => handlePatientDataChange('govIdType', e.target.value)}
                          >
                            <option value="" className="bg-[#152015] text-gray-400">Select ID type</option>
                            <option value="ABHA ID" className="bg-[#152015] text-white">ABHA ID (Ayushman Bharat Health Account)</option>
                            <option value="Ayushman Bharat / PM-JAY Card" className="bg-[#152015] text-white">Ayushman Bharat / PM-JAY Card</option>
                            <option value="Aadhaar Card" className="bg-[#152015] text-white">Aadhaar Card</option>
                            <option value="Passport" className="bg-[#152015] text-white">Passport</option>
                            <option value="Voter ID" className="bg-[#152015] text-white">Voter ID</option>
                            <option value="Driving License" className="bg-[#152015] text-white">Driving License</option>
                            <option value="Swasthya Sathi" className="bg-[#152015] text-white">Swasthya Sathi</option>
                            <option value="Aarogyasri" className="bg-[#152015] text-white">Aarogyasri</option>
                            <option value="ESI Card" className="bg-[#152015] text-white">ESI Card</option>
                          </select>
                        </label>

                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            Upload Govt. ID
                          </span>
                          <input
                            className="form-input block w-full rounded-xl border px-4 py-3 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#13ec13] file:text-green-950 hover:file:bg-[#3bf03b] file:cursor-pointer"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Handle file upload here
                                console.log('ID Picture selected:', file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Guardian Information */}
                    <div className="space-y-4 pt-4 border-t border-[#3b543b]/50">
                      <h3 className="text-[#9db99d] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">family_restroom</span>
                        Guardian / Emergency Contact
                      </h3>
                      
                      <div className="space-y-3">
                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            Guardian Name
                          </span>
                          <input
                            className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                            placeholder="Full name"
                            type="text"
                            value={patientData.guardianName}
                            onChange={(e) => handlePatientDataChange('guardianName', e.target.value)}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            Relationship with patient
                          </span>
                          <input
                            className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                            placeholder="e.g., Parent"
                            type="text"
                            value={patientData.guardianRelation}
                            onChange={(e) => handlePatientDataChange('guardianRelation', e.target.value)}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            Guardian Contact
                          </span>
                          <input
                            className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                            placeholder="Phone number"
                            type="tel"
                            value={patientData.guardianPhone}
                            onChange={(e) => handlePatientDataChange('guardianPhone', e.target.value)}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            Guardian Email
                          </span>
                          <input
                            className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                            placeholder="Email address"
                            type="email"
                            value={patientData.guardianEmail}
                            onChange={(e) => handlePatientDataChange('guardianEmail', e.target.value)}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                            WhatsApp (optional)
                          </span>
                          <input
                            className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                            placeholder="WhatsApp number"
                            type="tel"
                            value={patientData.whatsappNumber}
                            onChange={(e) => handlePatientDataChange('whatsappNumber', e.target.value)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4 pt-4 border-t border-[#3b543b]/50">
                      <h3 className="text-[#9db99d] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">home</span>
                        Address
                      </h3>
                      
                      <label className="flex flex-col">
                        <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                          Full Address
                        </span>
                        <textarea
                          className="form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-y shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] min-h-[99px]"
                          placeholder="Street, city, state, postal code"
                          value={patientData.address}
                          onChange={(e) => handlePatientDataChange('address', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Clinical Information - Full Width Below */}
          <section className="flex flex-col gap-4">
            <div className="flex items-start gap-2 px-1">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <span className="material-symbols-outlined text-cyan-400 text-xl">clinical_notes</span>
              </div>
              <div>
                <h2 className="text-white text-xl font-bold leading-tight">Clinical Information</h2>
                <p className="text-xs text-[#9db99d]">Medical details & notes</p>
              </div>
            </div>
            <div className="bg-[#1c271c] rounded-2xl p-6 border border-[#3b543b] shadow-lg hover:border-cyan-500/30 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="flex flex-col">
                  <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                    Presenting Ailment
                  </span>
                  <textarea
                    className="form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-y shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] min-h-[85px]"
                    placeholder="Current symptoms and complaints..."
                    value={patientData.presentingAilment}
                    onChange={(e) =>
                      handlePatientDataChange('presentingAilment', e.target.value)
                    }
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                    Clinical Notes
                  </span>
                  <textarea
                    className="form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-y shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] min-h-[85px]"
                    placeholder="Doctor's observations..."
                    value={patientData.clinicalNotes}
                    onChange={(e) => handlePatientDataChange('clinicalNotes', e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                    Medical History
                  </span>
                  <textarea
                    className="form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-y shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] min-h-[85px]"
                    placeholder="Previous conditions, surgeries, allergies..."
                    value={patientData.medicalHistory}
                    onChange={(e) =>
                      handlePatientDataChange('medicalHistory', e.target.value)
                    }
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">
                    Lab Results Summary
                  </span>
                  <textarea
                    className="form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-y shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#152015] focus:border-[#13ec13] focus:bg-[#111811] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] min-h-[85px]"
                    placeholder="Key findings from blood work..."
                    value={patientData.labResults}
                    onChange={(e) => handlePatientDataChange('labResults', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Bed Availability Card Modal */}
      {bedAvailability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1c271c] rounded-2xl border-2 border-[#3b543b] shadow-2xl max-w-lg w-full transform transition-all animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#3b543b]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <span className="material-symbols-outlined text-purple-400 text-xl">bed</span>
                </div>
                <h3 className="text-xl font-bold text-white">Bed Availability Results</h3>
              </div>
              <button
                onClick={() => setBedAvailability(null)}
                className="p-2 rounded-lg hover:bg-[#3b543b]/30 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-400 hover:text-white">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Severity Score */}
              <div className="p-4 bg-[#152015] rounded-xl border border-[#3b543b]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Severity Score</span>
                    <div className={`text-3xl font-bold mt-1 ${
                      bedAvailability.severityScore >= 8 ? 'text-red-500' :
                      bedAvailability.severityScore >= 5 ? 'text-orange-400' :
                      bedAvailability.severityScore >= 3 ? 'text-yellow-400' :
                      'text-[#13ec13]'
                    }`}>
                      {bedAvailability.severityScore}/10
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${
                    bedAvailability.severityScore >= 8 ? 'bg-red-500/10' :
                    bedAvailability.severityScore >= 5 ? 'bg-orange-500/10' :
                    bedAvailability.severityScore >= 3 ? 'bg-yellow-500/10' :
                    'bg-[#13ec13]/10'
                  }`}>
                    <span className={`material-symbols-outlined text-3xl ${
                      bedAvailability.severityScore >= 8 ? 'text-red-500' :
                      bedAvailability.severityScore >= 5 ? 'text-orange-400' :
                      bedAvailability.severityScore >= 3 ? 'text-yellow-400' :
                      'text-[#13ec13]'
                    }`}>
                      {bedAvailability.severityScore >= 8 ? 'emergency' :
                       bedAvailability.severityScore >= 5 ? 'warning' :
                       bedAvailability.severityScore >= 3 ? 'info' :
                       'check_circle'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Ward */}
              <div className="p-4 bg-[#152015] rounded-xl border border-[#3b543b]">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Recommended Ward</span>
                <div className="text-2xl font-bold text-white mt-1">{bedAvailability.recommendedWard}</div>
              </div>

              {/* Allocated Bed - Main Result */}
              <div className={`p-5 rounded-xl border-2 ${
                bedAvailability.status === 'alert' ? 'bg-red-500/10 border-red-500/50' :
                bedAvailability.status === 'waiting' ? 'bg-yellow-500/10 border-yellow-500/50' :
                bedAvailability.status === 'shifted' ? 'bg-orange-500/10 border-orange-500/50' :
                'bg-[#13ec13]/10 border-[#13ec13]/50'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${
                    bedAvailability.status === 'alert' ? 'bg-red-500/20' :
                    bedAvailability.status === 'waiting' ? 'bg-yellow-500/20' :
                    bedAvailability.status === 'shifted' ? 'bg-orange-500/20' :
                    'bg-[#13ec13]/20'
                  }`}>
                    <span className={`material-symbols-outlined text-3xl ${
                      bedAvailability.status === 'alert' ? 'text-red-500 animate-pulse' :
                      bedAvailability.status === 'waiting' ? 'text-yellow-400' :
                      bedAvailability.status === 'shifted' ? 'text-orange-400' :
                      'text-[#13ec13]'
                    }`}>
                      {bedAvailability.status === 'alert' ? 'error' :
                       bedAvailability.status === 'waiting' ? 'schedule' :
                       bedAvailability.status === 'shifted' ? 'swap_horiz' :
                       'check_circle'}
                    </span>
                  </div>
                  <div className="flex-1">
                    {bedAvailability.allocatedBed && (
                      <div className="mb-3">
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Allocated Bed ID</span>
                        <div className="text-3xl font-bold text-white mt-1">
                          {bedAvailability.allocatedBed}
                        </div>
                        {bedAvailability.status === 'waiting' && (
                          <div className="mt-2 inline-block px-3 py-1 bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-xs text-yellow-400 font-bold">
                            WAITING LIST
                          </div>
                        )}
                        {bedAvailability.status === 'alert' && (
                          <div className="mt-2 inline-block px-3 py-1 bg-red-500/30 border border-red-500/50 rounded-lg text-xs text-red-400 font-bold animate-pulse">
                            CRITICAL ALERT
                          </div>
                        )}
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${
                      bedAvailability.status === 'alert' ? 'text-red-300' :
                      bedAvailability.status === 'waiting' ? 'text-yellow-300' :
                      bedAvailability.status === 'shifted' ? 'text-orange-300' :
                      'text-gray-300'
                    }`}>
                      {bedAvailability.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#3b543b]/50 flex gap-3">
              <button
                onClick={() => setBedAvailability(null)}
                className="flex-1 rounded-xl h-11 px-6 bg-[#152015] border border-[#3b543b] text-white text-sm font-bold hover:bg-[#1c271c] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setBedAvailability(null);
                  // Could trigger save admission here if needed
                }}
                className="flex-1 rounded-xl h-11 px-6 bg-[#13ec13] text-green-950 text-sm font-bold hover:bg-[#3bf03b] transition-all shadow-[0_0_20px_rgba(19,236,19,0.3)] hover:shadow-[0_0_30px_rgba(19,236,19,0.5)]"
              >
                Proceed with Admission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default NewAdmission;
