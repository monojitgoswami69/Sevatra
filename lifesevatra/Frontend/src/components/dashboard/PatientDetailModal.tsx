import React, { useState } from 'react';
import type { Patient } from '../../types';
import { getSeverityColor, getSeverityTextColor, getConditionStyles, calculateSeverityScore } from '../../pages/dashboard/SeverityScore';
import { updateVitals } from '../../services/admissionService';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdated: () => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, onClose, onUpdated }) => {
  const [vitals, setVitals] = useState({
    heartRate: '',
    spo2: '',
    respRate: '',
    temperature: '',
    bpSystolic: '',
    bpDiastolic: '',
  });

  const [patientData, setPatientData] = useState({
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    emergencyContact: '',
    address: '',
    bloodGroup: '',
    presentingAilment: '',
    medicalHistory: '',
    clinicalNotes: '',
    labResults: '',
  });

  const [bedId, setBedId] = useState(patient.bedId);
  const [severityScore, setSeverityScore] = useState(patient.severityScore);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVitalChange = (field: string, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientDataChange = (field: string, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleRecheckStatus = async () => {
    const vitalSigns = {
      heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : undefined,
      spo2: vitals.spo2 ? parseInt(vitals.spo2) : undefined,
      respRate: vitals.respRate ? parseInt(vitals.respRate) : undefined,
      temperature: vitals.temperature ? parseFloat(vitals.temperature) : undefined,
      bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : undefined,
      bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : undefined,
    };

    // Check if any vitals entered
    const hasVitals = Object.values(vitalSigns).some(v => v !== undefined);
    if (!hasVitals) {
      alert('Please enter at least one vital sign to recheck status.');
      return;
    }

    try {
      setIsUpdating(true);
      // Call API to update vitals
      const result = await updateVitals(parseInt(patient.id), vitalSigns);
      if (result.success) {
        setSeverityScore(result.data.severity_score);
        onUpdated();
      }
    } catch (err) {
      console.error('Error updating vitals:', err);
      // Fallback to local calculation
      const localResult = calculateSeverityScore(vitalSigns);
      setSeverityScore(localResult.score);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePatient = async () => {
    // For now update vitals if entered
    const hasVitals = Object.values(vitals).some(v => v !== '');
    if (hasVitals) {
      await handleRecheckStatus();
    }
    onClose();
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#1c271c] rounded-3xl border border-[#3b543b] shadow-[0_0_60px_rgba(19,236,19,0.2)] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1c271c]/95 backdrop-blur-md border-b border-[#3b543b]/50 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#152015] flex items-center justify-center text-sm font-bold text-white border-2 border-[#13ec13]/50">
              {patient.initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{patient.name}</h2>
              <p className="text-sm text-[#9db99d] font-mono">ID: {patient.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-[#152015] border border-[#3b543b] text-[#9db99d] hover:text-white hover:border-[#13ec13]/50 hover:bg-[#13ec13]/10 transition-all flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-8 py-6">
          <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}`}</style>

          {/* Guardian & Contact */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <span className="material-symbols-outlined">contacts</span>
              </div>
              <h3 className="text-xl font-bold text-white">Guardian & Contact Information</h3>
            </div>
            <div className="bg-[#152015] rounded-2xl p-6 border border-[#3b543b]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Guardian Name', field: 'guardianName', placeholder: 'Enter guardian name', type: 'text' },
                  { label: 'Guardian Phone', field: 'guardianPhone', placeholder: 'Enter phone number', type: 'tel' },
                  { label: 'Relation to Patient', field: 'guardianRelation', placeholder: 'e.g., Spouse, Parent, Sibling', type: 'text' },
                  { label: 'Emergency Contact', field: 'emergencyContact', placeholder: 'Alternative contact number', type: 'tel' },
                  { label: 'Blood Group', field: 'bloodGroup', placeholder: 'e.g., A+, O-, AB+', type: 'text' },
                ].map(({ label, field, placeholder, type }) => (
                  <label key={field} className="flex flex-col">
                    <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">{label}</span>
                    <input
                      className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                      placeholder={placeholder}
                      type={type}
                      value={patientData[field as keyof typeof patientData]}
                      onChange={(e) => handlePatientDataChange(field, e.target.value)}
                    />
                  </label>
                ))}
                <label className="flex flex-col md:col-span-2">
                  <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">Address</span>
                  <textarea
                    className="form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-y shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] min-h-[80px]"
                    placeholder="Enter full address"
                    value={patientData.address}
                    onChange={(e) => handlePatientDataChange('address', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left - Vitals & Bed */}
            <div className="flex flex-col gap-8">
              {/* Update Vitals */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <span className="material-symbols-outlined animate-pulse">ecg_heart</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Update Vitals</h3>
                </div>
                <div className="bg-[#152015] rounded-2xl p-6 border border-[#3b543b]/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Heart Rate', field: 'heartRate', unit: 'bpm', icon: 'favorite', iconColor: 'text-red-500' },
                      { label: 'SpO2', field: 'spo2', unit: '%', icon: 'water_drop', iconColor: 'text-blue-400' },
                      { label: 'Resp. Rate', field: 'respRate', unit: 'bpm', icon: 'air', iconColor: 'text-white/50' },
                      { label: 'Temperature', field: 'temperature', unit: '°C', icon: 'thermostat', iconColor: 'text-orange-400' },
                    ].map(({ label, field, unit, icon, iconColor }) => (
                      <div key={field} className="bg-[#1c271c] p-4 rounded-xl border border-[#3b543b] hover:border-[#13ec13]/50 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-gray-400 text-xs font-medium">{label}</span>
                          <span className={`material-symbols-outlined ${iconColor} text-lg`}>{icon}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <input
                            className="w-20 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                            placeholder="--"
                            type="number"
                            value={vitals[field as keyof typeof vitals]}
                            onChange={(e) => handleVitalChange(field, e.target.value)}
                          />
                          <span className="text-xs text-gray-400 font-bold">{unit}</span>
                        </div>
                      </div>
                    ))}
                    {/* Blood Pressure - wider */}
                    <div className="col-span-1 sm:col-span-2 bg-[#1c271c] p-4 rounded-xl border border-[#3b543b] hover:border-[#13ec13]/50 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 text-xs font-medium">Blood Pressure</span>
                        <span className="material-symbols-outlined text-[#13ec13] text-lg">compress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none text-right" placeholder="120" type="number" value={vitals.bpSystolic} onChange={(e) => handleVitalChange('bpSystolic', e.target.value)} />
                        <span className="text-xl text-gray-400">/</span>
                        <input className="w-16 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none" placeholder="80" type="number" value={vitals.bpDiastolic} onChange={(e) => handleVitalChange('bpDiastolic', e.target.value)} />
                        <span className="text-xs text-gray-400 font-bold ml-auto">mmHg</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRecheckStatus}
                    disabled={isUpdating}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl h-11 bg-[#13ec13] text-green-950 text-sm font-bold hover:bg-[#3bf03b] transition-all duration-300 shadow-[0_0_20px_rgba(19,236,19,0.3)] hover:shadow-[0_0_30px_rgba(19,236,19,0.5)] disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                    {isUpdating ? 'Updating...' : 'Recheck Status & Calculate Severity'}
                  </button>
                </div>
              </section>

              {/* Bed Allocation & Severity */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <span className="material-symbols-outlined">hotel</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Bed Allocation & Severity</h3>
                </div>
                <div className="bg-[#152015] rounded-2xl p-6 border border-[#3b543b]/50 space-y-4">
                  <div className="p-4 bg-[#1c271c] rounded-xl border border-[#3b543b]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm font-medium">Current Bed</span>
                      <span className="text-[#13ec13] font-bold text-lg">{patient.bedId}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-[#1c271c] rounded-xl border border-[#3b543b]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm font-medium">Severity Score</span>
                      <span className={`text-2xl font-bold ${getSeverityTextColor(severityScore)}`}>{severityScore.toFixed(1)}/10</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#111811] overflow-hidden">
                      <div className={`h-full ${getSeverityColor(severityScore)}`} style={{width: `${severityScore * 10}%`}}></div>
                    </div>
                  </div>
                  <label className="flex flex-col">
                    <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">Change Bed Allocation</span>
                    <input
                      className="form-input block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)]"
                      placeholder="e.g., ICU-01, HDU-05, GEN-12"
                      type="text"
                      value={bedId}
                      onChange={(e) => setBedId(e.target.value)}
                    />
                    <span className="text-xs text-gray-500 mt-2 ml-1">Format: ICU-XX, HDU-XX, or GEN-XX</span>
                  </label>
                  <div className="p-4 bg-[#1c271c] rounded-xl border border-[#3b543b]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-medium">Current Condition</span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${getConditionStyles(patient.condition)}`}>{patient.condition}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right - Clinical Info */}
            <div className="flex flex-col gap-8">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13]">
                    <span className="material-symbols-outlined">clinical_notes</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Clinical Information</h3>
                </div>
                <div className="bg-[#152015] rounded-2xl p-6 border border-[#3b543b]/50 space-y-6">
                  {[
                    { label: 'Presenting Ailment', field: 'presentingAilment', placeholder: 'Current symptoms and complaints' },
                    { label: 'Medical History', field: 'medicalHistory', placeholder: 'Previous conditions, surgeries, allergies' },
                    { label: 'Clinical Notes', field: 'clinicalNotes', placeholder: "Doctor's observations and notes" },
                    { label: 'Lab Results Summary', field: 'labResults', placeholder: 'Key findings from lab tests' },
                  ].map(({ label, field, placeholder }) => (
                    <label key={field} className="flex flex-col">
                      <span className="text-slate-300 text-sm font-semibold pb-2 ml-1">{label}</span>
                      <textarea
                        className="form-textarea block w-full rounded-xl border px-4 py-3 placeholder:text-gray-500 transition-all resize-y shadow-sm focus:outline-0 focus:ring-0 text-white border-[#3b543b] bg-[#1c271c] focus:border-[#13ec13] focus:bg-[#152015] placeholder:text-[#9db99d] focus:shadow-[0_0_20px_rgba(19,236,19,0.2)] min-h-[80px]"
                        placeholder={placeholder}
                        value={patientData[field as keyof typeof patientData]}
                        onChange={(e) => handlePatientDataChange(field, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>

              {/* Patient Summary */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Patient Summary</h3>
                </div>
                <div className="bg-[#152015] rounded-2xl p-6 border border-[#3b543b]/50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[#1c271c] rounded-lg">
                      <span className="text-gray-400 text-sm">Admission Date:</span>
                      <span className="text-white font-semibold">{patient.admissionDate}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#1c271c] rounded-lg">
                      <span className="text-gray-400 text-sm">Assigned Doctor:</span>
                      <span className="text-white font-semibold">{patient.doctor}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#1c271c] rounded-lg">
                      <span className="text-gray-400 text-sm">Patient ID:</span>
                      <span className="text-[#13ec13] font-mono font-semibold">{patient.id}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1c271c]/95 backdrop-blur-md border-t border-[#3b543b]/50 px-8 py-6 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 rounded-xl border border-[#3b543b] bg-transparent text-[#9db99d] hover:text-white hover:border-white/30 font-bold text-sm transition-all">Cancel</button>
          <button onClick={handleUpdatePatient} disabled={isUpdating} className="px-8 py-3 rounded-xl bg-[#13ec13] hover:bg-[#3bf03b] text-green-950 font-bold text-sm transition-all duration-300 shadow-[0_0_30px_rgba(19,236,19,0.4)] hover:shadow-[0_0_50px_rgba(19,236,19,0.7)] hover:scale-105 disabled:opacity-50">
            {isUpdating ? 'Updating...' : 'Update Patient Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;

