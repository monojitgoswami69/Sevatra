import React, { useState } from 'react';
import type { Patient } from '../../types';
import { getSeverityColor, getSeverityTextColor, getConditionStyles } from '../../pages/dashboard/SeverityScore';

interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
  onOpenDetails: (patient: Patient) => void;
  onDischarge: (patientId: string, patientName: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  isLoading,
  onOpenDetails,
  onDischarge,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedWard, setSelectedWard] = useState<'all' | 'ICU' | 'HDU' | 'General'>('all');
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const filteredAndSorted = patients
    .filter(patient => {
      const matchesSearch = searchQuery === '' ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWard = selectedWard === 'all' || patient.bedId.startsWith(selectedWard);
      return matchesSearch && matchesWard;
    })
    .sort((a, b) => sortOrder === 'asc' ? a.severityScore - b.severityScore : b.severityScore - a.severityScore);

  return (
    <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] overflow-hidden w-full shadow-lg">
      <div className="flex items-center justify-between border-b border-[#3b543b]/50 p-6">
        <h3 className="font-bold text-white text-lg">
          Admitted Patients
          {isLoading && <span className="ml-2 text-[#13ec13] text-sm animate-pulse">● Refreshing...</span>}
        </h3>
        <div className="flex gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db99d]">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              className="h-9 rounded-xl border border-[#3b543b] bg-[#152015] pl-10 pr-4 text-sm font-medium text-white placeholder-[#9db99d] focus:border-[#13ec13] focus:outline-none focus:ring-0 focus:shadow-[0_0_15px_rgba(19,236,19,0.1)] w-40 lg:w-64 transition-all"
              placeholder="Search ID or Name"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Ward Filter */}
          <div className="relative">
            <button
              onClick={() => setShowWardDropdown(!showWardDropdown)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all flex items-center gap-1.5 w-[120px] justify-between ${
                showWardDropdown
                  ? 'bg-[#13ec13]/10 border-[#13ec13]/50 text-[#13ec13] shadow-[0_0_15px_rgba(19,236,19,0.15)]'
                  : 'bg-[#152015] border-[#3b543b] text-[#9db99d] hover:bg-[#1c271c] hover:text-white hover:border-[#9db99d]'
              }`}
            >
              <span className="truncate">{selectedWard === 'all' ? 'All Wards' : selectedWard}</span>
              <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 flex-shrink-0 ${showWardDropdown ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {showWardDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWardDropdown(false)}></div>
                <div className="absolute top-full mt-1.5 right-0 z-50 w-[120px] rounded-lg border border-[#3b543b] bg-[#1c271c] shadow-lg overflow-hidden">
                  {(['all', 'ICU', 'HDU', 'General'] as const).map(ward => (
                    <button
                      key={ward}
                      onClick={() => { setSelectedWard(ward); setShowWardDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold transition-all ${
                        selectedWard === ward ? 'bg-[#13ec13]/10 text-[#13ec13]' : 'text-[#9db99d] hover:bg-[#152015] hover:text-white'
                      }`}
                    >
                      {ward === 'all' ? 'All Wards' : ward}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded-xl border border-[#3b543b] bg-[#152015] px-4 py-2 text-xs font-bold text-[#9db99d] hover:bg-[#1c271c] hover:text-white hover:border-[#9db99d] transition-all flex items-center gap-2"
          >
            Sort
            <span className="material-symbols-outlined text-[16px]">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#152015] text-xs uppercase text-[#9db99d] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-5">Patient Name</th>
              <th className="px-6 py-5">Bed ID</th>
              <th className="px-6 py-5">Admission Date</th>
              <th className="px-6 py-5">Severity Score</th>
              <th className="px-6 py-5">Condition</th>
              <th className="px-6 py-5">Doctor</th>
              <th className="px-6 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3b543b]/30">
            {filteredAndSorted.map((patient) => (
              <tr key={patient.id} className="group hover:bg-[#13ec13]/5 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#152015] flex items-center justify-center text-xs font-bold text-white border border-[#3b543b] group-hover:border-[#13ec13]/50 transition-colors">
                      {patient.initials}
                    </div>
                    <div>
                      <div className="font-bold text-white">{patient.name}</div>
                      <div className="text-xs text-[#9db99d] font-mono tracking-wide mt-0.5">ID: {patient.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 font-bold text-white">{patient.bedId}</td>
                <td className="px-6 py-5 text-[#9db99d]">{patient.admissionDate}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 rounded-full bg-[#111811] overflow-hidden">
                      <div className={`h-full ${getSeverityColor(patient.severityScore)}`} style={{width: `${patient.severityScore * 10}%`}}></div>
                    </div>
                    <span className={`text-xs font-bold ${getSeverityTextColor(patient.severityScore)}`}>
                      {patient.severityScore.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${getConditionStyles(patient.condition)}`}>
                    {patient.condition}
                  </span>
                </td>
                <td className="px-6 py-5 text-[#9db99d]">{patient.doctor}</td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenDetails(patient)}
                      className="rounded-lg bg-[#13ec13]/10 border border-[#13ec13]/20 px-3 py-1.5 text-xs font-bold text-[#13ec13] hover:bg-[#13ec13]/20 hover:shadow-[0_0_10px_rgba(19,236,19,0.2)] transition-all"
                    >
                      Details
                    </button>
                    <button className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all">Report</button>
                    <button
                      onClick={() => onDischarge(patient.id, patient.name)}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all"
                    >
                      Discharge
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#9db99d]">
                  {patients.length === 0 ? 'No admitted patients found.' : 'No patients match your search/filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#3b543b]/50 px-6 py-4">
          <span className="text-xs text-[#9db99d]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-[#3b543b] bg-[#1c271c] px-3 py-1.5 text-xs font-medium text-[#9db99d] hover:bg-[#13ec13]/5 hover:text-white hover:border-[#13ec13] disabled:opacity-50 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-[#3b543b] bg-[#1c271c] px-3 py-1.5 text-xs font-medium text-[#9db99d] hover:bg-[#13ec13]/5 hover:text-white hover:border-[#13ec13] disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTable;

