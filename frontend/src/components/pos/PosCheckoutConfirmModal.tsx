import { Loader2, ShoppingBag } from 'lucide-react';

export interface PosCheckoutConfirmModalProps {
  itemCount: number;
  grandTotal: number;
  paymentMethod: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PosCheckoutConfirmModal({
  itemCount,
  grandTotal,
  paymentMethod,
  submitting,
  onClose,
  onConfirm,
}: PosCheckoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Konfirmasi Pembayaran</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {itemCount} item · Rp {grandTotal.toLocaleString('id-ID')} ·{' '}
            {paymentMethod === 'CASH'
              ? 'Tunai'
              : paymentMethod === 'SPLIT'
              ? 'Campuran'
              : 'QRIS'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="cursor-pointer flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Ya, Bayar Sekarang'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
