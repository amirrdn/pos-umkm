import { Users } from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
        <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        Laporan Performa Penjualan per Kasir
      </h3>
      {loading ? (
        <div className="space-y-4">
          <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
          <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
        </div>
      ) : cashierReports.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">Belum ada data penjualan kasir.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="pb-3 pt-2 font-black">Nama Kasir</th>
                <th className="pb-3 pt-2 font-black">Email</th>
                <th className="pb-3 pt-2 font-black text-center">Total Transaksi</th>
                <th className="pb-3 pt-2 font-black text-right">Penjualan Tunai</th>
                <th className="pb-3 pt-2 font-black text-right">Penjualan QRIS</th>
                <th className="pb-3 pt-2 font-black text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody>
              {cashierReports.map((report) => (
                <tr
                  key={report.cashierId}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors"
                >
                  <td className="py-4 font-bold text-slate-800 dark:text-slate-250">{report.name}</td>
                  <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">{report.email}</td>
                  <td className="py-4 text-center font-bold font-mono">{report.totalTransactions}</td>
                  <td className="py-4 text-right font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatDashboardRupiah(report.cashSales)}
                  </td>
                  <td className="py-4 text-right font-semibold font-mono text-indigo-650 dark:text-indigo-400">
                    {formatDashboardRupiah(report.qrisSales)}
                  </td>
                  <td className="py-4 text-right font-black font-mono text-slate-800 dark:text-slate-100">
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
