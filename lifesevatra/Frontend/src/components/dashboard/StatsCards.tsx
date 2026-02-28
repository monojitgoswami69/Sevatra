import React from 'react';

interface StatsCardsProps {
  dashboardStats: {
    totalPatients: number;
    criticalPatients: number;
    admittedToday: number;
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

const StatsCards: React.FC<StatsCardsProps> = ({ dashboardStats, bedData }) => {
  const totalOccupied = dashboardStats.bedOccupancy.icuOccupied + dashboardStats.bedOccupancy.hduOccupied + dashboardStats.bedOccupancy.generalOccupied;
  const totalBeds = bedData.icuBeds + bedData.hduBeds + bedData.generalBeds;
  const occupancyPercentage = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;
  const availableBeds = totalBeds - totalOccupied;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Total Occupancy Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-400/40 transition-colors group">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500 border border-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
            <span className="material-symbols-outlined">ward</span>
          </div>
        </div>
        <h3 className="text-4xl font-bold text-card-foreground">{occupancyPercentage}%</h3>
        <p className="text-sm font-medium text-muted-foreground mt-1">Total Occupancy</p>
        <div className="mt-4 h-1.5 w-full rounded-full bg-muted">
          <div className="h-1.5 rounded-full bg-blue-500" style={{width: `${occupancyPercentage}%`}}></div>
        </div>
      </div>

      {/* Total Admitted Patients */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/30 transition-colors group">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-xl bg-primary/10 p-3 text-primary border border-primary/20 group-hover:shadow-[0_0_15px_rgba(19,236,19,0.2)] transition-all">
            <span className="material-symbols-outlined">monitor_heart</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{availableBeds} Available</span>
        </div>
        <h3 className="text-4xl font-bold text-card-foreground">{dashboardStats.totalPatients.toString().padStart(2, '0')}</h3>
        <p className="text-sm font-medium text-muted-foreground mt-1">Total Admitted Patients</p>
      </div>

      {/* Critical Patients */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-orange-400/40 transition-colors group">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500 border border-orange-500/20 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all">
            <span className="material-symbols-outlined">emergency</span>
          </div>
          {dashboardStats.criticalPatients > 0 && (
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">High Alert</span>
          )}
        </div>
        <h3 className="text-4xl font-bold text-card-foreground">{dashboardStats.criticalPatients.toString().padStart(2, '0')}</h3>
        <p className="text-sm font-medium text-muted-foreground mt-1">Critical Patients</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span> Requires immediate attention
        </div>
      </div>

    </div>
  );
};

export default StatsCards;

