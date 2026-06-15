import React, { useState } from 'react';
import { LogOut, AlertCircle, Loader2, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import type { ActiveShift } from '../store/useShiftStore';

// ==========================================
// INTERFACE
// ==========================================

interface CloseShiftModalProps {
  shift: ActiveShift;
  onClose: (cashActual: number) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

// ==========================================
// HELPER
// ==========================================

function formatRupiah(amount: number): string {
  return `Rp ${Math.abs(amount).toLocaleString('id-ID')}`;
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

// ==========================================
// KOMPONEN
// ==========================================

/**
 * Modal penutupan shift kasir.
 * Menampilkan ringkasan transaksi selama shift dan meminta kasir
 * memasukkan uang fisik aktual di laci untuk rekonsiliasi kas.
 */
export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  shift,
  onClose,
  onCancel,
  isLoading,
}) => {
  const [cashActual, setCashActual] = useState<string>('');
  const [error, setError] = useState<string>('');

  const cashExpected = Number(shift.cashExpected);
  const cashStart = Number(shift.cashStart);
  const totalCashSales = Number(shift.totalCashSales);

  // Hitung selisih sementara berdasarkan input real-time kasir
  const cashActualNum = parseFloat(cashActual.replace(/[^0-9]/g, '') || '0');
  const previewDiff = cashActualNum - cashExpected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(cashActual.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount < 0) {
      setError('Jumlah uang aktual tidak valid. Masukkan angka yang benar.');
      return;
    }

    try {
      await onClose(amount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
      setError(msg);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCashActual(raw);
  };

  const displayValue = cashActual
    ? `Rp ${parseInt(cashActual).toLocaleString('id-ID')}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        style={{ maxHeight: '90vh', animation: 'fadeInScale 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 py-5 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2.5 rounded-xl border border-white/20">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-wide uppercase">Tutup Shift Kasir</h2>
              <div className="flex items-center gap-1.5 text-slate-300 text-xs mt-0.5">
                <Clock className="h-3 w-3" />
                <span>Durasi shift: <span className="font-bold text-white">{formatDuration(shift.startTime)}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Konten scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Ringkasan Kas Shift */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ringkasan Shift</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Modal Awal</span>
                <span className="font-bold text-slate-700">{formatRupiah(cashStart)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Penjualan Tunai</span>
                <span className="font-bold text-emerald-600">+{formatRupiah(totalCashSales)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{shift.totalTransactions} transaksi tercatat</span>
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 pt-2 border-t border-dashed border-slate-200">
                <span>Kas yang Diharapkan</span>
                <span className="text-indigo-600">{formatRupiah(cashExpected)}</span>
              </div>
            </div>
          </div>

          {/* Input Kas Aktual */}
          <div className="space-y-1.5">
            <label htmlFor="cashActual" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Uang Fisik di Laci Sekarang
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                Rp
              </div>
              <input
                id="cashActual"
                type="text"
                inputMode="numeric"
                value={displayValue || cashActual}
                onChange={handleInput}
                placeholder="0"
                autoFocus
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 font-bold text-base placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Preview Selisih Kas Real-time */}
          {cashActual && (
            <div
              className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                previewDiff > 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : previewDiff < 0
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {previewDiff > 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : previewDiff < 0 ? (
                  <TrendingDown className="h-5 w-5 text-rose-600" />
                ) : (
                  <Minus className="h-5 w-5 text-slate-500" />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {previewDiff > 0 ? 'Lebih' : previewDiff < 0 ? 'Kurang' : 'Pas / Sesuai'}
                  </p>
                  <p
                    className={`text-sm font-black ${
                      previewDiff > 0
                        ? 'text-emerald-700'
                        : previewDiff < 0
                        ? 'text-rose-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {previewDiff === 0
                      ? 'Kas sesuai ekspektasi'
                      : `${previewDiff > 0 ? '+' : '-'} ${formatRupiah(previewDiff)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer / Aksi */}
        <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !cashActual}
            className="flex-2 flex items-center justify-center gap-2 flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Menutup...</>
            ) : (
              <><LogOut className="h-4 w-4" /> Tutup Shift Sekarang</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
