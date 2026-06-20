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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Omset Hari Ini
          </span>
          <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-405 rounded-xl border border-indigo-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
            {formatDashboardRupiah(summary?.revenueToday || 0)}
          </h3>
        )}
        <p className="text-[10px] text-indigo-600 dark:text-indigo-405 mt-2 flex items-center gap-1 font-semibold">
          <span>{summary?.transactionsTodayCount || 0} Transaksi Berhasil</span>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Laba Bersih Hari Ini
          </span>
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
            {formatDashboardRupiah(summary?.profitToday || 0)}
          </h3>
        )}
        <p
          className={`text-[10px] mt-2 flex items-center gap-1 font-semibold ${
            todayMargin >= 10
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Percent className="w-3 h-3" />
          <span>Margin Keuntungan: {todayMargin}%</span>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Omset Bulan Ini
          </span>
          <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="h-7 w-40 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
            {formatDashboardRupiah(summary?.revenueMonth || 0)}
          </h3>
        )}
        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 font-semibold">
          <span>Periode Bulan Berjalan</span>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Laba Bersih Bulan Ini
          </span>
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
            <Award className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="h-7 w-40 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
            {formatDashboardRupiah(summary?.profitMonth || 0)}
          </h3>
        )}
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
          <Percent className="w-3 h-3" />
          <span>Margin Keuntungan: {monthMargin}%</span>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-150">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Stok Rendah
          </span>
          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="h-7 w-16 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
            {lowStock?.count ?? 0}
          </h3>
        )}
        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-semibold">
          {activeOutletId
            ? 'Produk di bawah min. stok outlet ini'
            : 'Produk di bawah min. stok (semua outlet)'}
        </p>
      </div>
    </div>
  );
}
