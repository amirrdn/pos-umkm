import { canReceiveDraftTransferNotifications } from '../../store/useNotificationStore';
import type { AuthUser } from '../../store/useAuthStore';
import type { InventoryTab } from '../../types/inventory';

export interface InventoryTabBarProps {
  activeTab: InventoryTab;
  setActiveTab: (tab: InventoryTab) => void;
  lowStockCount: number;
  isOwnerOrManager: boolean | undefined;
  stockRequestCount: number;
  currentUser: AuthUser | null;
  draftTransferCount: number;
  isOwner: boolean | undefined;
  requireStockApproval: boolean;
  settingsLoading: boolean;
  onToggleSettings: () => void;
}

export function InventoryTabBar({
  activeTab,
  setActiveTab,
  lowStockCount,
  isOwnerOrManager,
  stockRequestCount,
  currentUser,
  draftTransferCount,
  isOwner,
  requireStockApproval,
  settingsLoading,
  onToggleSettings,
}: InventoryTabBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'inventory'
            ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
            }`}
        >
          Overview Inventaris
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black">
              {lowStockCount}
            </span>
          )}
        </button>
        {isOwnerOrManager && (
          <button
            onClick={() => setActiveTab('requests')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'requests'
              ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
              }`}
          >
            Persetujuan Stok
            {stockRequestCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-indigo-650 text-white rounded-full font-black animate-bounce">
                {stockRequestCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('transfers')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'transfers'
            ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
            }`}
        >
          Transfer Stok
          {currentUser && canReceiveDraftTransferNotifications(currentUser.roles) && draftTransferCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-650 text-white rounded-full font-black animate-pulse">
              {draftTransferCount}
            </span>
          )}
        </button>
      </div>

      {isOwner && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl">
          <span className="text-xs font-semibold text-slate-655 dark:text-slate-400">Persetujuan Stok Oleh Owner/Manager</span>
          <button
            type="button"
            onClick={onToggleSettings}
            disabled={settingsLoading}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${requireStockApproval ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-700'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${requireStockApproval ? 'translate-x-4' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
