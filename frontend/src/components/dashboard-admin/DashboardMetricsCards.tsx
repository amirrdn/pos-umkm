import {
  AlertTriangle,
  Award,
  DollarSign,
  Percent,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { formatDashboardRupiah } from '../../utils/dashboardAdminHelpers';
import type { LowStockSummary, SummaryData } from '../../types/dashboardAdmin';

export interface DashboardMetricsCardsProps {
  loading: boolean;
  summary: SummaryData | null;
  lowStock: LowStockSummary | null;
  activeOutletId: string | null;
  todayMargin: number;
  monthMargin: number;
}

export function DashboardMetricsCards({
  loading,
  summary,
  lowStock,
  activeOutletId,
  todayMargin,
  monthMargin,
}: DashboardMetricsCardsProps) {
  const hasLowStock = Boolean(lowStock && lowStock.count > 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
      <div className="group relative overflow-hidden bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md dark:shadow-none transition-all duration-200 hover:-translate-y-1 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Omset Hari Ini
          </span>
          <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-2xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {loading ? (
          <div className="h-8 w-36 bg-slate-200/80 dark:bg-slate-800 animate-pulse rounded-xl my-1" />
        ) : (
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono my-1">
            {formatDashboardRupiah(summary?.revenueToday || 0)}
          </h3>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md">
            <span>{summary?.transactionsTodayCount || 0} Transaksi</span>
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Hari ini</span>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md dark:shadow-none transition-all duration-200 hover:-translate-y-1 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Laba Bersih Hari Ini
          </span>
          <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {loading ? (
          <div className="h-8 w-36 bg-slate-200/80 dark:bg-slate-800 animate-pulse rounded-xl my-1" />
        ) : (
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono my-1">
            {formatDashboardRupiah(summary?.profitToday || 0)}
          </h3>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
            <Percent className="w-3 h-3" />
            <span>Margin {todayMargin}%</span>
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Profit Net</span>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md dark:shadow-none transition-all duration-200 hover:-translate-y-1 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 via-blue-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Omset Bulan Ini
          </span>
          <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 shadow-2xs">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {loading ? (
          <div className="h-8 w-40 bg-slate-200/80 dark:bg-slate-800 animate-pulse rounded-xl my-1" />
        ) : (
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono my-1">
            {formatDashboardRupiah(summary?.revenueMonth || 0)}
          </h3>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md">
            Bulan Berjalan
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Akumulasi</span>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md dark:shadow-none transition-all duration-200 hover:-translate-y-1 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 via-teal-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Laba Bersih Bulan Ini
          </span>
          <div className="p-2.5 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-500/20 shadow-2xs">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {loading ? (
          <div className="h-8 w-40 bg-slate-200/80 dark:bg-slate-800 animate-pulse rounded-xl my-1" />
        ) : (
          <h3 className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight font-mono my-1">
            {formatDashboardRupiah(summary?.profitMonth || 0)}
          </h3>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md">
            <Percent className="w-3 h-3" />
            <span>Margin {monthMargin}%</span>
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Bulanan</span>
        </div>
      </div>

      <div className={`group relative overflow-hidden bg-white dark:bg-slate-900/80 border rounded-3xl p-5 shadow-xs hover:shadow-md dark:shadow-none transition-all duration-200 hover:-translate-y-1 backdrop-blur-md ${hasLowStock
        ? 'border-amber-300 dark:border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
        : 'border-slate-200/90 dark:border-slate-800'
        }`}>
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110 ${hasLowStock ? 'bg-amber-500/15' : 'bg-slate-500/5'
          }`} />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Stok Rendah
          </span>
          <div className={`p-2.5 rounded-2xl border shadow-2xs ${hasLowStock
            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-bounce'
            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
            }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {loading ? (
          <div className="h-8 w-24 bg-slate-200/80 dark:bg-slate-800 animate-pulse rounded-xl my-1" />
        ) : (
          <h3 className={`text-2xl font-extrabold tracking-tight font-mono my-1 ${hasLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
            }`}>
            {lowStock?.count || 0} <span className="text-sm font-semibold">Produk</span>
          </h3>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${hasLowStock
            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
            {hasLowStock ? 'Perlu Restock' : 'Stok Aman'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {activeOutletId ? 'Per Outlet' : 'Semua Outlet'}
          </span>
        </div>
      </div>
    </div>
  );
}
