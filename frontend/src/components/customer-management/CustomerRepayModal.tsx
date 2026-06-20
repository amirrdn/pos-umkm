import { CreditCard, DollarSign, RefreshCw } from 'lucide-react';
import type { UseCustomerManagementReturn } from '../../hooks/useCustomerManagement';
import { formatCustomerDebt } from '../../utils/customerManagementHelpers';

export interface CustomerRepayModalProps {
  customerManagement: UseCustomerManagementReturn;
}

export function CustomerRepayModal({ customerManagement }: CustomerRepayModalProps) {
  const {
    isRepayModalOpen,
    repayCustomer,
    repayAmount,
    setRepayAmount,
    repayMethod,
    setRepayMethod,
    repayNote,
    setRepayNote,
    isRepaying,
    closeRepayModal,
    handleRepaySubmit,
  } = customerManagement;

  if (!isRepayModalOpen || !repayCustomer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-rose-600" />
            Bayar Cicilan Hutang
          </h3>
          <button
            type="button"
            onClick={closeRepayModal}
            className="cursor-pointer text-slate-400 hover:text-slate-650 text-xs font-bold"
          >
            Tutup
          </button>
        </div>

        <div className="mt-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl space-y-1">
          <p className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-wide">
            Pelanggan
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{repayCustomer.name}</p>
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-rose-200/50 dark:border-rose-900/30">
            <span className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-wide">
              Total Hutang
            </span>
            <span className="text-sm font-black text-rose-700 dark:text-rose-300">
              {formatCustomerDebt(repayCustomer.debtBalance)}
            </span>
          </div>
        </div>

        <form onSubmit={handleRepaySubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRepayMethod('CASH')}
                className={`cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  repayMethod === 'CASH'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Tunai / Cash
              </button>
              <button
                type="button"
                onClick={() => setRepayMethod('QRIS')}
                className={`cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  repayMethod === 'QRIS'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                QRIS / E-Wallet
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Jumlah Pembayaran (Rp) *
              </label>
              <button
                type="button"
                onClick={() => setRepayAmount(Number(repayCustomer.debtBalance))}
                className="cursor-pointer text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wide"
              >
                Bayar Lunas
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                required
                min={1}
                max={Number(repayCustomer.debtBalance)}
                placeholder="Masukkan nominal..."
                value={repayAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setRepayAmount(val === '' ? '' : Number(val));
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Keterangan / Catatan
            </label>
            <textarea
              placeholder="Contoh: Cicilan pertama, pembayaran tunai oleh kasir"
              rows={2}
              value={repayNote}
              onChange={(e) => setRepayNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={closeRepayModal}
              className="cursor-pointer flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isRepaying}
              className="cursor-pointer flex-1 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-150 transition-all flex items-center justify-center"
            >
              {isRepaying ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Catat Pembayaran'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
