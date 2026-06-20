import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { InventoryTab, LowStockItem } from '../../types/inventory';

export interface InventoryAlertsProps {
  error: string | null;
  successMsg: string | null;
  lowStockCount: number;
  activeTab: InventoryTab;
  lowStockItems: LowStockItem[];
}

export function InventoryAlerts({
  error,
  successMsg,
  lowStockCount,
  activeTab,
  lowStockItems,
}: InventoryAlertsProps) {
  return (
    <>
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 animate-pulse">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {lowStockCount > 0 && activeTab === 'inventory' && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {lowStockCount} produk stok di bawah batas minimum
            </p>
            <p className="text-xs mt-0.5 opacity-90 truncate">
              {lowStockItems.slice(0, 3).map((item) => item.productName).join(', ')}
              {lowStockCount > 3 ? ` +${lowStockCount - 3} lainnya` : ''}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
