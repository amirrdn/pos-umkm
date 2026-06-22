import React from 'react';
import { X, RefreshCw, CreditCard, Maximize2, Monitor, Check } from 'lucide-react';

interface PosQrisModalProps {
  qrisUrl: string;
  qrisInvoiceNumber: string;
  qrisGrandTotal: number;
  qrisFullscreen: boolean;
  qrisPaymentStatus: 'waiting' | 'paid';
  setQrisFullscreen: (val: boolean) => void;
  handleCancelQris: () => void;
  handleOpenCustomerDisplay: () => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}

export const PosQrisModal: React.FC<PosQrisModalProps> = ({
  qrisUrl,
  qrisInvoiceNumber,
  qrisGrandTotal,
  qrisFullscreen,
  qrisPaymentStatus,
  setQrisFullscreen,
  handleCancelQris,
  handleOpenCustomerDisplay,
  showToast,
}) => {
  const isDev = import.meta.env.DEV;

  return (
    <>
      {qrisFullscreen && (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center gap-8 p-8">
          <button
            type="button"
            onClick={() => setQrisFullscreen(false)}
            className="cursor-pointer absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center">
            <p className="text-white/55 text-sm font-bold uppercase tracking-widest mb-2">Scan untuk Membayar</p>
            <p className="text-white/35 text-xs font-medium">Invoice: {qrisInvoiceNumber}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-indigo-500/20">
            {qrisUrl ? (
              <img src={qrisUrl} alt="QRIS Code" className="w-72 h-72 object-contain" />
            ) : (
              <div className="w-72 h-72 flex items-center justify-center">
                <RefreshCw className="h-12 w-12 animate-spin text-indigo-500" />
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-white/55 text-sm font-bold uppercase tracking-widest mb-1">Total Tagihan</p>
            <p className="text-5xl font-black text-white tracking-tight">
              Rp {qrisGrandTotal.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
            {qrisPaymentStatus === 'paid' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Pembayaran Lunas</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="animate-pulse">Menunggu Pembayaran...</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 text-center text-white relative">
            <div className="mx-auto bg-white/20 h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-black tracking-wide">Scan QRIS Dinamis</h3>
            <p className="text-indigo-100 text-xs mt-1 font-medium">Invoice: {qrisInvoiceNumber}</p>
          </div>

          <div className="p-6 flex flex-col items-center space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Tagihan</span>
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 block mt-1">
                Rp {qrisGrandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="w-full flex items-center justify-between gap-2 px-1">
              {(['Menunggu Scan', 'Lunas'] as const).map((label, index) => {
                const isActive = index === 0 ? qrisPaymentStatus === 'waiting' : qrisPaymentStatus === 'paid';
                const isDone = index === 0 && qrisPaymentStatus === 'paid';
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isActive
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center">{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="relative p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner flex items-center justify-center w-60 h-60">
              {qrisUrl ? (
                <img src={qrisUrl} alt="QRIS Code" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs font-bold">Menyiapkan QRIS...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-4 py-2.5 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              {qrisPaymentStatus === 'paid' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Pembayaran Berhasil</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span className="animate-pulse">Menunggu Pembayaran...</span>
                </>
              )}
            </div>

            {qrisUrl && (
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setQrisFullscreen(true)}
                  title="Tampilkan fullscreen, lalu putar layar ke arah customer"
                  className="cursor-pointer flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Putar Layar
                </button>

                <button
                  type="button"
                  onClick={handleOpenCustomerDisplay}
                  title="Buka di window baru untuk layar customer / monitor kedua"
                  className="cursor-pointer flex-1 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Layar Customer
                </button>
              </div>
            )}

            {isDev && qrisUrl && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrisUrl);
                  showToast('success', 'Tautan Gambar QRIS disalin ke clipboard!');
                }}
                className="cursor-pointer w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                Salin Tautan QRIS (Dev)
              </button>
            )}

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium px-4 leading-relaxed">
              Scan kode QR di atas menggunakan GoPay, OVO, Dana, LinkAja, ShopeePay, atau aplikasi Mobile Banking Anda.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancelQris}
              className="cursor-pointer w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-97 flex items-center justify-center gap-1.5"
            >
              Batal Pembayaran (Kembali ke POS)
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
