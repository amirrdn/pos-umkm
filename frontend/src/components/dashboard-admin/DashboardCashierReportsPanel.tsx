import { UserCheck, Users } from 'lucide-react';
import { formatDashboardRupiah } from '../../utils/dashboardAdminHelpers';
import type { CashierReport } from '../../types/dashboardAdmin';

export interface DashboardCashierReportsPanelProps {
  loading: boolean;
  cashierReports: CashierReport[];
}

export function DashboardCashierReportsPanel({
  loading,
  cashierReports,
}: DashboardCashierReportsPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md dark:shadow-none backdrop-blur-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <Users className="w-4 h-4" />
          </div>
          Laporan Performa Penjualan per Kasir
        </h3>
        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full">
          Ringkasan Tim
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-16 bg-slate-100/70 dark:bg-slate-800/40 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : cashierReports.length === 0 ? (
        <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <UserCheck className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-semibold">Belum ada data penjualan kasir.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
                <th className="pb-3.5 pt-2 font-extrabold">Nama Kasir</th>
                <th className="pb-3.5 pt-2 font-extrabold">Email</th>
                <th className="pb-3.5 pt-2 font-extrabold text-center">Total Transaksi</th>
                <th className="pb-3.5 pt-2 font-extrabold text-right">Penjualan Tunai</th>
                <th className="pb-3.5 pt-2 font-extrabold text-right">Penjualan QRIS</th>
                <th className="pb-3.5 pt-2 font-extrabold text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {cashierReports.map((report) => (
                <tr
                  key={report.cashierId}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs border border-indigo-200/60 dark:border-indigo-800">
                      {report.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{report.name}</span>
                  </td>
                  <td className="py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{report.email}</td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                      {report.totalTransactions}
                    </span>
                  </td>
                  <td className="py-4 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatDashboardRupiah(report.cashSales)}
                  </td>
                  <td className="py-4 text-right font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {formatDashboardRupiah(report.qrisSales)}
                  </td>
                  <td className="py-4 text-right font-black font-mono text-slate-900 dark:text-white text-sm">
                    {formatDashboardRupiah(report.totalSales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
