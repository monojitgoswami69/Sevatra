import React from 'react';

interface BedStatusProps {
  dashboardStats: {
    bedOccupancy: {
      icuOccupied: number;
      hduOccupied: number;
      generalOccupied: number;
    };
  };
  bedData: {
    icuBeds: number;
    hduBeds: number;
    generalBeds: number;
  };
  patients: Array<{ id: string; name: string; initials: string; severityScore: number }>;
  onDischarge: (patientId: string, patientName: string) => void;
}

const BedStatus: React.FC<BedStatusProps> = ({ dashboardStats, bedData, patients, onDischarge }) => {
  const getBedAvailabilityStatus = (occupied: number, total: number) => {
    if (total === 0) return { label: 'No Beds', color: 'text-gray-400', bgColor: 'bg-gray-500', borderColor: 'border-gray-500/50', glowColor: 'hover:shadow-[0_0_20px_rgba(156,163,175,0.1)]', indicatorBg: 'bg-gray-500' };
    const occupancyPercentage = (occupied / total) * 100;
    if (occupancyPercentage > 80) {
      return { label: 'Critical Availability', color: 'text-red-500', bgColor: 'bg-red-500', borderColor: 'border-red-500/50', glowColor: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]', indicatorBg: 'bg-red-500' };
    } else if (occupancyPercentage > 40) {
      return { label: 'Moderate Availability', color: 'text-yellow-500', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-500/50', glowColor: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]', indicatorBg: 'bg-yellow-500' };
    }
    return { label: 'Good Availability', color: 'text-primary', bgColor: 'bg-primary', borderColor: 'border-primary/50', glowColor: 'hover:shadow-lg', indicatorBg: 'bg-primary' };
  };

  const renderBedCard = (label: string, occupied: number, total: number) => {
    const status = getBedAvailabilityStatus(occupied, total);
    const percentage = total > 0 ? (occupied / total) * 100 : 0;
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="relative">
          <h4 className="text-sm font-semibold text-muted-foreground">{label}</h4>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-card-foreground">{occupied.toString().padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground">/ {total} Total</span>
          </div>
          <div className={`mt-4 text-xs font-bold ${status.color} flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.indicatorBg} ${percentage > 80 ? 'animate-pulse' : ''}`}></span>
            {status.label}
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div className={`h-1.5 rounded-full ${status.bgColor}`} style={{width: `${percentage}%`}}></div>
          </div>
        </div>
      </div>
    );
  };

  const dischargeCandidates = patients.filter(p => p.severityScore <= 3);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {renderBedCard('ICU Beds', dashboardStats.bedOccupancy.icuOccupied, bedData.icuBeds)}
      {renderBedCard('HDU Beds', dashboardStats.bedOccupancy.hduOccupied, bedData.hduBeds)}
      {renderBedCard('General Beds', dashboardStats.bedOccupancy.generalOccupied, bedData.generalBeds)}

      {/* Discharge Candidates */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md flex flex-col lg:col-span-2">
        <div className="relative flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Discharge Candidates</h4>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
              {dischargeCandidates.length} Candidates
            </span>
          </div>
          <div className="space-y-4 mt-auto">
            {dischargeCandidates.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-card-foreground font-bold border border-border">{p.initials}</div>
                  <div><p className="text-sm font-medium text-card-foreground">{p.name}</p></div>
                </div>
                <button onClick={() => onDischarge(p.id, p.name)} className="text-xs font-bold text-primary hover:text-primary-dark hover:underline">Process</button>
              </div>
            ))}
            {dischargeCandidates.length === 0 && (
              <p className="text-xs text-muted-foreground/60 text-center py-4">No discharge candidates</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BedStatus;

