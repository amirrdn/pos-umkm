import React, { useState } from 'react';
import { Wallet, LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface ShiftModalProps {
  /** Name of the cashier currently logged in. */
  cashierName: string;
  /** Callback invoked with the starting cash amount on form submit. */
  onOpen: (cashStart: number) => Promise<void>;
  /** Whether an async operation is in progress. */
  isLoading: boolean;
}

/**
 * Cashier shift opening modal.
 * Blocks POS access until the cashier enters the starting cash
 * amount in the drawer to initialize the shift.
 */
export const ShiftModal: React.FC<ShiftModalProps> = ({ cashierName, onOpen, isLoading }) => {
  const [cashStart, setCashStart] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(cashStart.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount < 0) {
      setError('Modal awal tidak valid. Masukkan angka yang benar (0 atau lebih).');
      return;
    }

    try {
      await onOpen(amount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
      setError(msg);
    }
  };

  const handleCashInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCashStart(raw);
  };

  const displayValue = cashStart
    ? `Rp ${parseInt(cashStart).toLocaleString('id-ID')}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
        style={{ animation: 'fadeInScale 0.25s ease-out' }}
      >
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-8 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Buka Shift Kasir</h2>
              <p className="text-indigo-200 text-sm mt-0.5">Halo, <span className="font-bold text-white">{cashierName}</span>!</p>
            </div>
          </div>
          <p className="mt-4 text-indigo-100 text-sm leading-relaxed">
            Sebelum memulai transaksi, masukkan jumlah uang yang ada di laci kas sebagai modal awal shift Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="cashStart" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Modal Awal (Uang di Laci Kas)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                Rp
              </div>
              <input
                id="cashStart"
                type="text"
                inputMode="numeric"
                value={displayValue || cashStart}
                onChange={handleCashInput}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 font-bold text-base placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-400 pl-1">
              Masukkan 0 jika laci kas kosong. Jumlah ini akan digunakan untuk rekonsiliasi saat tutup shift.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Membuka Shift...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Buka Shift & Mulai Kerja</span>
              </>
            )}
          </button>
        </form>
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
