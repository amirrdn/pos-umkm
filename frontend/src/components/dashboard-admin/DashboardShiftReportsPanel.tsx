import { Clock, History } from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md dark:shadow-none backdrop-blur-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <Clock className="w-4 h-4" />
          </div>
          Riwayat Shift Kerja & Rekonsiliasi Kasir
        </h3>
        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full">
          Audit Shift
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-16 bg-slate-100/70 dark:bg-slate-800/40 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : shiftReports.length === 0 ? (
        <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
          <History className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-semibold">Belum ada riwayat shift kerja terekam.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-extrabold">
                <th className="pb-3.5 pt-2 font-extrabold">Kasir</th>
                <th className="pb-3.5 pt-2 font-extrabold">Buka Shift</th>
                <th className="pb-3.5 pt-2 font-extrabold">Tutup Shift</th>
                <th className="pb-3.5 pt-2 font-extrabold text-right">Modal Awal</th>
                <th className="pb-3.5 pt-2 font-extrabold text-right">Ekspektasi Uang</th>
                <th className="pb-3.5 pt-2 font-extrabold text-right">Uang Aktual</th>
                <th className="pb-3.5 pt-2 font-extrabold text-right">Selisih</th>
                <th className="pb-3.5 pt-2 font-extrabold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {shiftReports.map((shift) => (
                <tr
                  key={shift.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-4 font-bold text-slate-900 dark:text-slate-100">{shift.cashierName}</td>
                  <td className="py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {formatShiftDateTime(shift.startTime)}
                  </td>
                  <td className="py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {formatShiftDateTime(shift.endTime)}
                  </td>
                  <td className="py-4 text-right font-semibold font-mono text-slate-700 dark:text-slate-300">
                    {formatDashboardRupiah(shift.cashStart)}
                  </td>
                  <td className="py-4 text-right font-semibold font-mono text-indigo-600 dark:text-indigo-400">
                    {formatDashboardRupiah(shift.cashExpected)}
                  </td>
                  <td className="py-4 text-right font-bold font-mono text-slate-900 dark:text-white">
                    {shift.cashActual !== null ? formatDashboardRupiah(shift.cashActual) : '-'}
                  </td>
                  <td className={`py-4 text-right font-bold font-mono ${getShiftDifferenceClass(shift.difference)}`}>
                    {formatShiftDifference(shift.difference, formatDashboardRupiah)}
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        shift.status === 'OPEN'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {shift.status === 'OPEN' ? 'AKtif' : 'Selesai'}
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
