import { RefreshCw } from 'lucide-react';
import {
  formatDashboardRupiah,
  formatShiftDateTime,
  formatShiftDifference,
  getShiftDifferenceClass,
} from '../../utils/dashboardAdminHelpers';
import type { ShiftReport } from '../../types/dashboardAdmin';

export interface DashboardShiftReportsPanelProps {
  loading: boolean;
  shiftReports: ShiftReport[];
}

export function DashboardShiftReportsPanel({ loading, shiftReports }: DashboardShiftReportsPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg backdrop-blur-sm">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
        <RefreshCw className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        Riwayat Shift Kerja & Rekonsiliasi Kasir
      </h3>
      {loading ? (
        <div className="space-y-4">
          <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
          <div className="h-12 bg-slate-100 dark:bg-slate-900/20 animate-pulse rounded-2xl" />
        </div>
      ) : shiftReports.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">Belum ada riwayat shift kerja.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="pb-3 pt-2 font-black">Kasir</th>
                <th className="pb-3 pt-2 font-black">Buka Shift</th>
                <th className="pb-3 pt-2 font-black">Tutup Shift</th>
                <th className="pb-3 pt-2 font-black text-right">Modal Awal</th>
                <th className="pb-3 pt-2 font-black text-right">Ekspektasi Uang</th>
                <th className="pb-3 pt-2 font-black text-right">Uang Aktual</th>
                <th className="pb-3 pt-2 font-black text-right">Selisih</th>
                <th className="pb-3 pt-2 font-black text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {shiftReports.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors"
                >
                  <td className="py-4 font-bold text-slate-800 dark:text-slate-250">{shift.cashierName}</td>
                  <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">
                    {formatShiftDateTime(shift.startTime)}
                  </td>
                  <td className="py-4 text-slate-500 dark:text-slate-400 font-mono">
                    {formatShiftDateTime(shift.endTime)}
                  </td>
                  <td className="py-4 text-right font-medium font-mono">
                    {formatDashboardRupiah(shift.cashStart)}
                  </td>
                  <td className="py-4 text-right font-medium font-mono">
                    {formatDashboardRupiah(shift.cashExpected)}
                  </td>
                  <td className="py-4 text-right font-medium font-mono">
                    {shift.cashActual !== null ? formatDashboardRupiah(shift.cashActual) : '-'}
                  </td>
                  <td className={`py-4 text-right font-bold font-mono ${getShiftDifferenceClass(shift.difference)}`}>
                    {formatShiftDifference(shift.difference, formatDashboardRupiah)}
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        shift.status === 'OPEN'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {shift.status === 'OPEN' ? 'Aktif' : 'Tutup'}
                    </span>
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
