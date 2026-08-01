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
  return (
    <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-indigo-900/10 via-slate-100/80 to-white dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-md backdrop-blur-md transition-all">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              <Activity className="w-3 h-3 animate-pulse text-indigo-600 dark:text-indigo-400" />
              Live Real-Time Analytics
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700/50">
              {activeOutletId ? (
                <>
                  <Store className="w-3 h-3 text-indigo-500" />
                  Filter Per Outlet
                </>
              ) : tenantWideAccess ? (
                <>
                  <Building2 className="w-3 h-3 text-emerald-500" />
                  Agregat Semua Outlet
                </>
              ) : null}
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-1">
            Ringkasan Kinerja & Laba Toko
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Pantau arus kas, pendapatan bersih, harga pokok penjualan (HPP), dan kinerja outlet secara langsung.
            {activeOutletId
              ? ' Data difilter khusus untuk outlet terpilih.'
              : tenantWideAccess
                ? ' Menampilkan akumulasi omset seluruh jaringan toko.'
                : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="cursor-pointer group flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-750 rounded-2xl transition-all shadow-xs hover:shadow-md hover:border-indigo-500/40 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
            <span>{loading ? 'Memuat Data...' : 'Segarkan Laporan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
