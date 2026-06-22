import type { StaffTab } from '../../types/staffManagement';

export interface StaffTabBarProps {
  activeTab: StaffTab;
  activeStaffCount: number;
  pendingStaffCount: number;
  onTabChange: (tab: StaffTab) => void;
}

export function StaffTabBar({
  activeTab,
  activeStaffCount,
  pendingStaffCount,
  onTabChange,
}: StaffTabBarProps) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6">
      <button
        type="button"
        onClick={() => onTabChange('active')}
        className={`cursor-pointer pb-3 text-sm font-bold transition-all relative ${
          activeTab === 'active'
            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
            : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-350'
        }`}
      >
        Staf Aktif ({activeStaffCount})
      </button>
      <button
        type="button"
        onClick={() => onTabChange('pending')}
        className={`cursor-pointer pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
          activeTab === 'pending'
            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
            : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-350'
        }`}
      >
        Permintaan Persetujuan ({pendingStaffCount})
        {pendingStaffCount > 0 && activeTab !== 'pending' && (
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </button>
    </div>
  );
}
