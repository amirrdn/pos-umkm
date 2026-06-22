import React from 'react';
import { Check, AlertTriangle, Printer, MessageCircle } from 'lucide-react';
import type { PosReceiptTransaction } from '../../hooks/usePos';

interface PosSuccessModalProps {
  currentTransaction: PosReceiptTransaction;
  cashReceived: number | '';
  setCashReceived: (val: number | '') => void;
  handlePrint: () => void;
  handleSendWhatsApp: (tx: PosReceiptTransaction) => void;
  handleFinishTransaction: () => void;
}

const QUICK_CASH_AMOUNTS = [20000, 50000, 100000];

export const PosSuccessModal: React.FC<PosSuccessModalProps> = ({
  currentTransaction,
  cashReceived,
  setCashReceived,
  handlePrint,
  handleSendWhatsApp,
  handleFinishTransaction,
}) => {
  const changeAmount =
    cashReceived !== '' ? Number(cashReceived) - currentTransaction.grandTotal : null;
  const isInsufficient = changeAmount !== null && changeAmount < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-center text-white relative">
          <div className="mx-auto bg-white/20 h-16 w-16 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Check className="h-8 w-8 text-white stroke-[3px]" />
          </div>
          <h3 className="text-xl font-black tracking-wide">Transaksi Berhasil!</h3>
          <p className="text-emerald-100 text-xs mt-1 font-medium">Invoice: {currentTransaction.invoiceNumber}</p>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Metode Pembayaran</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {currentTransaction.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Rp {Number(currentTransaction.subTotal || currentTransaction.grandTotal).toLocaleString('id-ID')}
              </span>
            </div>
            {Number(currentTransaction.discount) > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-400">
                <span>Diskon</span>
                <span className="font-bold">- Rp {Number(currentTransaction.discount).toLocaleString('id-ID')}</span>
              </div>
            )}
            {Number(currentTransaction.tax) > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-700 dark:text-amber-400">
                <span>PPN (11%)</span>
                <span className="font-bold">Rp {Number(currentTransaction.tax).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-100 pt-2 border-t border-slate-200/50 dark:border-slate-700">
              <span>Total Tagihan</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-base">
                Rp {Number(currentTransaction.grandTotal).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {currentTransaction.paymentMethod === 'CASH' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_CASH_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashReceived(amount)}
                    className="cursor-pointer px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Rp {(amount / 1000).toFixed(0)}rb
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashReceived(currentTransaction.grandTotal)}
                  className="cursor-pointer px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors"
                >
                  Pas
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCashReceived(val === '' ? '' : Number(val));
                    }}
                    placeholder="Masukkan nominal..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {cashReceived !== '' && (
                <div
                  className={`flex justify-between items-center p-4 rounded-2xl border ${
                    isInsufficient
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Uang Kembalian
                  </span>
                  <span
                    className={`text-lg font-black ${
                      isInsufficient ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    Rp {Math.max(0, Number(cashReceived) - currentTransaction.grandTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {isInsufficient && (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Uang diterima kurang dari total belanja!</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-97 transition-all shadow-sm"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Cetak Struk
            </button>

            <button
              type="button"
              onClick={() => handleSendWhatsApp(currentTransaction)}
              className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-97 transition-all shadow-sm"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Kirim ke WA
            </button>
          </div>

          <button
            type="button"
            onClick={handleFinishTransaction}
            disabled={
              currentTransaction.paymentMethod === 'CASH' &&
              (cashReceived === '' || Number(cashReceived) - currentTransaction.grandTotal < 0)
            }
            className={`cursor-pointer w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all ${
              currentTransaction.paymentMethod === 'CASH' &&
              (cashReceived === '' || Number(cashReceived) - currentTransaction.grandTotal < 0)
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 shadow-none cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-97 shadow-indigo-100 dark:shadow-none'
            }`}
          >
            Selesai & Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};
