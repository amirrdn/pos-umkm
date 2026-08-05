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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'inventory'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Persetujuan Stok
            {stockRequestCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white rounded-full font-black animate-bounce">
                {stockRequestCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('transfers')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'transfers'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Transfer Stok
          {currentUser && canReceiveDraftTransferNotifications(currentUser.roles) && draftTransferCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white rounded-full font-black animate-pulse">
              {draftTransferCount}
            </span>
          )}
        </button>
      </div>

      {isOwner && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-2xs backdrop-blur-md">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Persetujuan Stok Oleh Owner/Manager
          </span>
          <button
            type="button"
            onClick={onToggleSettings}
            disabled={settingsLoading}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              requireStockApproval ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                requireStockApproval ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
