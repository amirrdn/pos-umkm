import { BarChart3, Users } from 'lucide-react';
import type { DashboardTab } from '../../types/dashboardAdmin';

export interface DashboardTabBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function DashboardTabBar({ activeTab, onTabChange }: DashboardTabBarProps) {
  return (
    <div className="mb-8 flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
      <div className="inline-flex p-1.5 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-300/60 dark:border-slate-800 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onTabChange('OVERVIEW')}
          className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'OVERVIEW'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-md border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Ringkasan & Tren Penjualan</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('CASHIERS_SHIFTS')}
          className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'CASHIERS_SHIFTS'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-md border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Laporan Kasir & Shift Kerja</span>
        </button>
      </div>

      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        Sistem Terhubung
      </div>
    </div>
  );
}
