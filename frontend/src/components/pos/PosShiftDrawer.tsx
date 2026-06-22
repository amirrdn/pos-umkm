import { Clock, LogOut, Receipt, Wallet, X } from 'lucide-react';
import type { ActiveShift } from '../../store/useShiftStore';

export interface PosShiftDrawerProps {
  shift: ActiveShift | null;
  onClose: () => void;
  onCloseShift: () => void;
}

function formatDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes} menit`;
}

export function PosShiftDrawer({ shift, onClose, onCloseShift }: PosShiftDrawerProps) {
  if (!shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <button
        type="button"
        aria-label="Tutup detail shift"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
      />

      <div className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-sm h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Ringkasan Shift</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold">Shift Aktif</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Durasi</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatDuration(shift.startTime)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <Wallet className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Modal Awal</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Rp {Number(shift.cashStart).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <Receipt className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Transaksi Sesi</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {shift.totalTransactions} transaksi
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Penjualan tunai: Rp {Number(shift.totalCashSales).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCloseShift();
            }}
            className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Tutup Shift
          </button>
        </div>
      </div>
    </div>
  );
}
