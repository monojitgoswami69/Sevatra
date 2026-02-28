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
}

const BedStatus: React.FC<BedStatusProps> = ({ dashboardStats, bedData }) => {
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {renderBedCard('ICU Beds', dashboardStats.bedOccupancy.icuOccupied, bedData.icuBeds)}
      {renderBedCard('HDU Beds', dashboardStats.bedOccupancy.hduOccupied, bedData.hduBeds)}
      {renderBedCard('General Beds', dashboardStats.bedOccupancy.generalOccupied, bedData.generalBeds)}
    </div>
  );
};

export default BedStatus;

