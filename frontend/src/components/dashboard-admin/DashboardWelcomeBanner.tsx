import { RefreshCw } from 'lucide-react';

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
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/10 via-slate-100 to-slate-50 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
          Ringkasan Kinerja & Laba Toko
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Analisis pendapatan, harga pokok penjualan (HPP), dan laba bersih secara real-time.
          {activeOutletId
            ? ' — Data difilter per outlet yang dipilih.'
            : tenantWideAccess
              ? ' — Menampilkan agregat semua outlet.'
              : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Laporan</span>
        </button>
      </div>
    </div>
  );
}
