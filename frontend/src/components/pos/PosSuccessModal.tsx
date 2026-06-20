import React from 'react';
import { Check, AlertTriangle, Printer, MessageCircle } from 'lucide-react';

interface PosSuccessModalProps {
  currentTransaction: any;
  cashReceived: number | '';
  setCashReceived: (val: number | '') => void;
  handlePrint: () => void;
  handleSendWhatsApp: (tx: any) => void;
  handleFinishTransaction: () => void;
}

export const PosSuccessModal: React.FC<PosSuccessModalProps> = ({
  currentTransaction,
  cashReceived,
  setCashReceived,
  handlePrint,
  handleSendWhatsApp,
  handleFinishTransaction,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-center text-white relative">
          <div className="mx-auto bg-white/20 h-16 w-16 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Check className="h-8 w-8 text-white stroke-[3px]" />
          </div>
          <h3 className="text-xl font-black tracking-wide">Transaksi Berhasil!</h3>
          <p className="text-emerald-100 text-xs mt-1 font-medium">Invoice: {currentTransaction.invoiceNumber}</p>
        </div>

        {/* Konten Modal */}
        <div className="p-6 space-y-6 flex-1">
          {/* Ringkasan Transaksi */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Metode Pembayaran</span>
              <span className="font-bold text-slate-700">
                {currentTransaction.paymentMethod === 'CASH'
                  ? 'TUNAI'
                  : currentTransaction.paymentMethod === 'DEBT'
                  ? 'HUTANG'
                  : 'QRIS'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-700">
                Rp {Number(currentTransaction.subTotal || currentTransaction.grandTotal).toLocaleString('id-ID')}
              </span>
            </div>
            {Number(currentTransaction.discount) > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-600">
                <span>Diskon</span>
                <span className="font-bold">- Rp {Number(currentTransaction.discount).toLocaleString('id-ID')}</span>
              </div>
            )}
            {Number(currentTransaction.tax) > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-700">
                <span>PPN (11%)</span>
                <span className="font-bold">Rp {Number(currentTransaction.tax).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 pt-2 border-t border-slate-200/50">
              <span>Total Tagihan</span>
              <span className="text-indigo-600 text-base">
                Rp {Number(currentTransaction.grandTotal).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Rincian Cash / Tunai */}
          {currentTransaction.paymentMethod === 'CASH' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Hitung Kembalian */}
              {cashReceived !== '' && (
                <div className="flex justify-between items-center p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Uang Kembalian</span>
                  <span
                    className={`text-lg font-black ${
                      Number(cashReceived) - currentTransaction.grandTotal < 0
                        ? 'text-rose-600'
                        : 'text-amber-700'
                    }`}
                  >
                    Rp {Math.max(0, Number(cashReceived) - currentTransaction.grandTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {/* Warning Kurang Bayar */}
              {cashReceived !== '' && Number(cashReceived) - currentTransaction.grandTotal < 0 && (
                <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Uang diterima kurang dari total belanja!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal / Tombol Aksi */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Cetak Struk */}
            <button
              type="button"
              onClick={handlePrint}
              className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-97 transition-all shadow-sm"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Cetak Struk
            </button>

            {/* Kirim WhatsApp */}
            <button
              type="button"
              onClick={() => handleSendWhatsApp(currentTransaction)}
              className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 active:scale-97 transition-all shadow-sm"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              Kirim ke WA
            </button>
          </div>

          {/* Selesai */}
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
                ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-97 shadow-indigo-100'
            }`}
          >
            Selesai & Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};
