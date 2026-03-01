import React, { useState } from 'react';
import type { Patient } from '../../types';
import { getSeverityColor, getSeverityTextColor, getConditionStyles } from '../../utils/severityCalculator';
import PatientReportModal from './PatientReportModal';

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
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);

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
    <>
    <div className="rounded-2xl border border-border bg-card overflow-hidden w-full shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h3 className="font-bold text-card-foreground text-lg">
          Admitted Patients
          {isLoading && <span className="ml-2 text-primary text-sm animate-pulse">● Refreshing...</span>}
        </h3>
        <div className="flex gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              className="h-9 rounded-xl border border-border bg-muted pl-10 pr-4 text-sm font-medium text-card-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-0 w-40 lg:w-64 transition-all"
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
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-card-foreground hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              <span className="truncate">{selectedWard === 'all' ? 'All Wards' : selectedWard}</span>
              <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 flex-shrink-0 ${showWardDropdown ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {showWardDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWardDropdown(false)}></div>
                <div className="absolute top-full mt-1.5 right-0 z-50 w-[120px] rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {(['all', 'ICU', 'HDU', 'General'] as const).map(ward => (
                    <button
                      key={ward}
                      onClick={() => { setSelectedWard(ward); setShowWardDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold transition-all ${
                        selectedWard === ward ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
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
            className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-bold text-muted-foreground hover:text-card-foreground hover:border-slate-400 dark:hover:border-slate-500 transition-all flex items-center gap-2"
          >
            Sort
            <span className="material-symbols-outlined text-[16px]">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground font-bold tracking-wider border-b border-border">
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
          <tbody className="divide-y divide-border">
            {filteredAndSorted.map((patient) => (
              <tr key={patient.id} className="group hover:bg-muted/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-card-foreground border border-border group-hover:border-primary/40 transition-colors">
                      {patient.initials}
                    </div>
                    <div>
                      <div className="font-bold text-card-foreground">{patient.name}</div>
                      <div className="text-xs text-muted-foreground font-mono tracking-wide mt-0.5">ID: {patient.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 font-bold text-card-foreground">{patient.bedId}</td>
                <td className="px-6 py-5 text-muted-foreground">{patient.admissionDate}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
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
                <td className="px-6 py-5 text-muted-foreground">{patient.doctor}</td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenDetails(patient)}
                      className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary dark:text-primary hover:bg-primary/20 transition-all"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setReportPatient(patient)}
                      className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                    >Report</button>
                    <button
                      onClick={() => onDischarge(patient.id, patient.name)}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      Discharge
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  {patients.length === 0 ? 'No admitted patients found.' : 'No patients match your search/filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-card-foreground hover:border-primary/50 disabled:opacity-50 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-card-foreground hover:border-primary/50 disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Patient Report Modal */}
    {reportPatient && (
      <PatientReportModal
        patient={reportPatient}
        onClose={() => setReportPatient(null)}
      />
    )}
    </>
  );
};

export default PatientTable;

