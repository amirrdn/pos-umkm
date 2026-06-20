import type { DashboardTab } from '../../types/dashboardAdmin';

export interface DashboardTabBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function DashboardTabBar({ activeTab, onTabChange }: DashboardTabBarProps) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6">
      <button
        type="button"
        onClick={() => onTabChange('OVERVIEW')}
        className={`cursor-pointer pb-4 text-sm font-bold border-b-2 transition-all ${
          activeTab === 'OVERVIEW'
            ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
        }`}
      >
        Ringkasan & Tren Penjualan
      </button>
      <button
        type="button"
        onClick={() => onTabChange('CASHIERS_SHIFTS')}
        className={`cursor-pointer pb-4 text-sm font-bold border-b-2 transition-all ${
          activeTab === 'CASHIERS_SHIFTS'
            ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
        }`}
      >
        Laporan Kasir & Shift Kerja
      </button>
    </div>
  );
}
