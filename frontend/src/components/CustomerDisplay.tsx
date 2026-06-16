import React, { useEffect, useState } from 'react';

/**
 * CustomerDisplay — Halaman layar customer untuk pembayaran QRIS.
 * Dibuka di window baru oleh kasir (Opsi A) dan dapat ditampilkan di monitor kedua.
 * Data dikirim via URL query params: qrisUrl, amount, invoice.
 */
const CustomerDisplay: React.FC = () => {
  const [qrisUrl, setQrisUrl] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [invoice, setInvoice] = useState<string>('');
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQrisUrl(params.get('qrisUrl') || '');
    setAmount(Number(params.get('amount') || 0));
    setInvoice(params.get('invoice') || '');

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'QRIS_PAID') {
        setPaid(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 flex flex-col items-center justify-center gap-8 p-8">
        {/* Checkmark besar */}
        <div className="h-36 w-36 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center">
          <svg className="h-20 w-20 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-5xl font-black text-white tracking-tight">Pembayaran Berhasil!</p>
          <p className="text-emerald-400/70 text-lg font-bold mt-3">Terima kasih atas pembelian Anda 🎉</p>
        </div>
        <p className="text-white/30 text-sm font-medium">Invoice: {invoice}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex flex-col items-center justify-center gap-10 p-8">
      {/* Header toko */}
      <div className="text-center">
        <p className="text-white/40 text-sm font-bold uppercase tracking-[0.3em] mb-2">Scan untuk Membayar</p>
        <p className="text-white/20 text-xs font-medium tracking-wide">Invoice: {invoice}</p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-4xl p-8 shadow-2xl shadow-indigo-500/30 ring-1 ring-white/10">
        {qrisUrl ? (
          <img
            src={qrisUrl}
            alt="QRIS Payment Code"
            className="w-80 h-80 object-contain"
          />
        ) : (
          <div className="w-80 h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-indigo-400">
              <svg className="h-16 w-16 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-bold">Menyiapkan QRIS...</p>
            </div>
          </div>
        )}
      </div>

      {/* Total tagihan */}
      <div className="text-center">
        <p className="text-white/40 text-base font-bold uppercase tracking-widest mb-3">Total Tagihan</p>
        <p className="text-6xl font-black text-white tracking-tight">
          Rp {amount.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Accepted payment apps */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Diterima melalui</p>
        <p className="text-white/40 text-sm font-semibold">
          GoPay · OVO · Dana · LinkAja · ShopeePay · Mobile Banking
        </p>
      </div>

      {/* Polling indicator */}
      <div className="flex items-center gap-2.5 text-indigo-400 text-sm font-bold animate-pulse">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Menunggu Pembayaran...</span>
      </div>
    </div>
  );
};

export default CustomerDisplay;
