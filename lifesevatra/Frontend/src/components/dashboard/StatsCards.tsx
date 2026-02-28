import React from 'react';

interface StatsCardsProps {
  dashboardStats: {
    totalPatients: number;
    criticalPatients: number;
    admittedToday: number;
    dischargedToday: number;
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
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Occupancy Card */}
      <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400 border border-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
            <span className="material-symbols-outlined">ward</span>
          </div>
        </div>
        <h3 className="text-4xl font-bold text-white">{occupancyPercentage}%</h3>
        <p className="text-sm font-medium text-[#9db99d] mt-1">Total Occupancy</p>
        <div className="mt-4 h-1.5 w-full rounded-full bg-[#111811]">
          <div className="h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${occupancyPercentage}%`}}></div>
        </div>
      </div>

      {/* Total Admitted Patients */}
      <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-xl bg-[#13ec13]/10 p-3 text-[#13ec13] border border-[#13ec13]/20 group-hover:shadow-[0_0_15px_rgba(19,236,19,0.2)] transition-all">
            <span className="material-symbols-outlined">monitor_heart</span>
          </div>
          <span className="text-xs font-medium text-[#9db99d]">{availableBeds} Available</span>
        </div>
        <h3 className="text-4xl font-bold text-white">{dashboardStats.totalPatients.toString().padStart(2, '0')}</h3>
        <p className="text-sm font-medium text-[#9db99d] mt-1">Total Admitted Patients</p>
      </div>

      {/* Critical Patients */}
      <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400 border border-orange-500/20 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all">
            <span className="material-symbols-outlined">emergency</span>
          </div>
          {dashboardStats.criticalPatients > 0 && (
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">High Alert</span>
          )}
        </div>
        <h3 className="text-4xl font-bold text-white">{dashboardStats.criticalPatients.toString().padStart(2, '0')}</h3>
        <p className="text-sm font-medium text-[#9db99d] mt-1">Critical Patients</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-orange-400/80">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span> Requires immediate attention
        </div>
      </div>

      {/* Discharges Today */}
      <div className="rounded-2xl border border-[#3b543b]/50 bg-[#1c271c] p-6 shadow-lg hover:border-[#13ec13]/30 transition-colors group">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400 border border-purple-500/20 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
            <span className="material-symbols-outlined">event_available</span>
          </div>
        </div>
        <h3 className="text-4xl font-bold text-white">{dashboardStats.dischargedToday}</h3>
        <p className="text-sm font-medium text-[#9db99d] mt-1">Discharges Today</p>
      </div>
    </div>
  );
};

export default StatsCards;

