import { Activity, Building2, RefreshCw, Store } from 'lucide-react';

export interface DashboardWelcomeBannerProps {
  activeOutletId: string | null;
  tenantWideAccess: boolean;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardWelcomeBanner({
  activeOutletId,
  tenantWideAccess,
  loading,
  onRefresh,
}: DashboardWelcomeBannerProps) {
  const getScopeBadge = () => {
    if (activeOutletId) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Store className="w-3.5 h-3.5 text-indigo-500" />
          Filter Per Outlet
        </span>
      );
    }
    if (tenantWideAccess) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          Agregat Semua Outlet
        </span>
      );
    }
    return null;
  };

  const getSubtext = () => {
    if (activeOutletId) return ' Data difilter khusus untuk outlet terpilih.';
    if (tenantWideAccess) return ' Menampilkan akumulasi omset seluruh jaringan toko.';
    return '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
              Live Real-Time Analytics
            </span>
            {getScopeBadge()}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ringkasan Kinerja & Laba Toko
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            Pantau arus kas, pendapatan bersih, harga pokok penjualan (HPP), dan kinerja outlet secara langsung.
            {getSubtext()}
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memuat...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
