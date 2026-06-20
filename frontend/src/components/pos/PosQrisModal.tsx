import React from 'react';
import { X, RefreshCw, CreditCard, Maximize2, Monitor } from 'lucide-react';

interface PosQrisModalProps {
  qrisUrl: string;
  qrisInvoiceNumber: string;
  qrisGrandTotal: number;
  qrisFullscreen: boolean;
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
  setQrisFullscreen,
  handleCancelQris,
  handleOpenCustomerDisplay,
  showToast,
}) => {
  return (
    <>
      {/* QRIS Fullscreen Overlay (Opsi B) - Layar untuk diputar ke Customer */}
      {qrisFullscreen && (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center gap-8 p-8">
          {/* Exit Fullscreen button */}
          <button
            type="button"
            onClick={() => setQrisFullscreen(false)}
            className="cursor-pointer absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Store info */}
          <div className="text-center">
            <p className="text-white/55 text-sm font-bold uppercase tracking-widest mb-2">Scan untuk Membayar</p>
            <p className="text-white/35 text-xs font-medium">Invoice: {qrisInvoiceNumber}</p>
          </div>

          {/* QR Code besar */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-indigo-500/20">
            {qrisUrl ? (
              <img src={qrisUrl} alt="QRIS Code" className="w-72 h-72 object-contain" />
            ) : (
              <div className="w-72 h-72 flex items-center justify-center">
                <RefreshCw className="h-12 w-12 animate-spin text-indigo-500" />
              </div>
            )}
          </div>

          {/* Total tagihan besar */}
          <div className="text-center">
            <p className="text-white/55 text-sm font-bold uppercase tracking-widest mb-1">Total Tagihan</p>
            <p className="text-5xl font-black text-white tracking-tight">
              Rp {qrisGrandTotal.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Accepted apps */}
          <p className="text-white/35 text-xs font-medium text-center max-w-xs leading-relaxed">
            GoPay · OVO · Dana · LinkAja · ShopeePay · Mobile Banking
          </p>

          {/* Polling indicator */}
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="animate-pulse">Menunggu Pembayaran...</span>
          </div>
        </div>
      )}

      {/* Modal QRIS Pembayaran Dinamis */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
          {/* Header Modal */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 text-center text-white relative">
            <div className="mx-auto bg-white/20 h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-black tracking-wide">Scan QRIS Dinamis</h3>
            <p className="text-indigo-100 text-xs mt-1 font-medium">Invoice: {qrisInvoiceNumber}</p>
          </div>

          {/* Konten QRIS */}
          <div className="p-6 flex flex-col items-center space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Tagihan</span>
              <span className="text-3xl font-extrabold text-indigo-600 block mt-1">
                Rp {qrisGrandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="relative p-4 bg-white rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center w-60 h-60">
              {qrisUrl ? (
                <img src={qrisUrl} alt="QRIS Code" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs font-bold">Menyiapkan QRIS...</span>
                </div>
              )}
            </div>

            {/* Loader Polling Status */}
            <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-4 py-2.5 rounded-full text-indigo-700 text-xs font-bold">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span className="animate-pulse">Menunggu Pembayaran...</span>
            </div>

            {/* Aksi Customer Display */}
            {qrisUrl && (
              <div className="flex gap-2 w-full">
                {/* Opsi B: Fullscreen - putar layar ke customer */}
                <button
                  type="button"
                  onClick={() => setQrisFullscreen(true)}
                  title="Tampilkan fullscreen, lalu putar layar ke arah customer"
                  className="cursor-pointer flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Putar Layar
                </button>

                {/* Opsi A: Customer Display Window */}
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

            {/* Tombol Simulator */}
            {qrisUrl && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrisUrl);
                  showToast('success', 'Tautan Gambar QRIS disalin ke clipboard!');
                }}
                className="cursor-pointer w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 border border-slate-200"
              >
                🔗 Salin Tautan QRIS (Simulator)
              </button>
            )}

            <p className="text-[10px] text-center text-slate-400 font-medium px-4 leading-relaxed">
              Scan kode QR di atas menggunakan GoPay, OVO, Dana, LinkAja, ShopeePay, atau aplikasi Mobile Banking Anda.
            </p>
          </div>

          {/* Footer Modal / Tombol Batal */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelQris}
              className="cursor-pointer w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-97 flex items-center justify-center gap-1.5"
            >
              Batal Pembayaran (Kembali ke POS)
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
