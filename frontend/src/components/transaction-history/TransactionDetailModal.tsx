import { useState } from 'react';
import {
  Calendar,
  Check,
  Copy,
  CreditCard,
  History,
  MessageCircle,
  Printer,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { formatTransactionDateTime, formatTransactionRupiah } from '../../utils/transactionHistoryHelpers';
import type { TransactionRecord } from '../../types/transactionHistory';

export interface TransactionDetailModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
  onPrint: () => void;
  onSendWhatsApp: (transaction: TransactionRecord) => void;
  accent?: 'indigo' | 'emerald';
}

export function TransactionDetailModal({
  transaction,
  onClose,
  onPrint,
  onSendWhatsApp,
  accent = 'indigo',
}: TransactionDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const handleCopyInvoice = () => {
    void navigator.clipboard.writeText(transaction.invoiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/50 dark:border-slate-800 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95 max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4.5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700/55 rounded-xl border border-slate-700">
              <History className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase">Detail Transaksi</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-300 font-mono">{transaction.invoiceNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyInvoice}
                  className="cursor-pointer text-slate-400 hover:text-white transition-all p-0.5 rounded"
                  title="Salin Nomor Invoice"
                >
                  {copied ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/50">
                      <Check className="h-3 w-3" /> Tersalin
                    </span>
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 p-2 rounded-xl transition-all active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Isi/Body Modal */}
        <div className="p-6 space-y-5 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/30">
          {/* Kartu 1: Ringkasan Pembayaran */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Ringkasan Transaksi
            </h4>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-405">
                  <Calendar className="w-4 h-4 text-slate-400" /> Tanggal
                </span>
                <span className="font-semibold text-slate-805 dark:text-slate-200">
                  {formatTransactionDateTime(transaction.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-405">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Status
                </span>
                <span>
                  {transaction.status === 'COMPLETED' ? (
                    <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide">
                      COMPLETED
                    </span>
                  ) : transaction.status === 'PENDING' ? (
                    <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide animate-pulse">
                      PENDING
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide">
                      VOID
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-405">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Metode Pembayaran
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {transaction.paymentMethod === 'CASH' ? 'TUNAI (CASH)' : 'QRIS'}
                </span>
              </div>
            </div>
          </div>

          {/* Kartu 2: Informasi Pelanggan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Informasi Pelanggan
            </h4>
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-405">
                <User className="w-4 h-4 text-slate-400" /> Nama Pelanggan
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {transaction.customer ? (
                  <span className="flex flex-col items-end">
                    <span>{transaction.customer.name}</span>
                    {transaction.customer.phone && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                        {transaction.customer.phone}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-normal italic">Umum / Walk-in</span>
                )}
              </span>
            </div>
          </div>

          {/* QRIS Polling Area (Jika status pending & payment QRIS) */}
          {transaction.status === 'PENDING' &&
            transaction.paymentMethod === 'QRIS' &&
            transaction.qrisUrl && (
              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 flex flex-col items-center gap-3">
                <div className="text-center">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block">
                    Scan QRIS untuk Melunasi
                  </span>
                  <span className="text-xl font-black text-indigo-900 dark:text-indigo-200 block mt-1">
                    {formatTransactionRupiah(transaction.grandTotal)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-center w-40 h-40">
                  <img
                    src={transaction.qrisUrl}
                    alt="QRIS Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-650 dark:text-indigo-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span className="animate-pulse">Menunggu Pembayaran (Polling)...</span>
                </div>
              </div>
            )}

          {/* Kartu 3: Rincian Belanja */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Daftar Produk Belanja
            </h4>
            
            {/* Daftar Produk */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {transaction.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {item.product?.name || 'Produk'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wide">
                      {item.product?.sku || 'SKU'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatTransactionRupiah(Number(item.subtotal))}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.quantity} x {formatTransactionRupiah(Number(item.priceAtTransaction))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Rincian Keuangan */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2 text-sm">
              {transaction.subTotal !== undefined && (
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-750 dark:text-slate-250">
                    {formatTransactionRupiah(Number(transaction.subTotal))}
                  </span>
                </div>
              )}
              {transaction.discount !== undefined && Number(transaction.discount) > 0 && (
                <div className="flex justify-between items-center text-rose-600">
                  <span>Diskon</span>
                  <span className="font-bold">
                    - {formatTransactionRupiah(Number(transaction.discount))}
                  </span>
                </div>
              )}
              {transaction.tax !== undefined && Number(transaction.tax) > 0 && (
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>PPN (11%)</span>
                  <span className="font-semibold text-slate-750 dark:text-slate-250">
                    {formatTransactionRupiah(Number(transaction.tax))}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-base font-black text-slate-800 dark:text-slate-100 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                <span>Total Transaksi</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {formatTransactionRupiah(transaction.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal: Tombol Aksi */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-305 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-97 transition-all shadow-sm"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => onSendWhatsApp(transaction)}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 active:scale-97 transition-all shadow-sm"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse-subtle" />
            Kirim ke WA
          </button>
          <button
            type="button"
            onClick={onPrint}
            className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl active:scale-97 text-xs font-bold transition-all shadow-md dark:shadow-none ${
              accent === 'emerald'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 dark:shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 dark:shadow-none'
            }`}
          >
            <Printer className="h-4 w-4" />
            Cetak Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
