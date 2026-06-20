import {
  Calendar,
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
}

export function TransactionDetailModal({
  transaction,
  onClose,
  onPrint,
  onSendWhatsApp,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase">Detail Transaksi</h3>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">{transaction.invoiceNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white bg-slate-800/40 p-1.5 rounded-xl transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-auto max-h-[60vh] bg-white dark:bg-slate-900">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Transaksi
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {formatTransactionDateTime(transaction.createdAt)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Status Pembayaran
              </span>
              <span className="font-bold uppercase">
                {transaction.status === 'COMPLETED' ? (
                  <span className="text-emerald-600 font-extrabold">COMPLETED</span>
                ) : transaction.status === 'PENDING' ? (
                  <span className="text-amber-500 font-extrabold animate-pulse">PENDING</span>
                ) : (
                  <span className="text-rose-600 font-extrabold">VOID</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Pelanggan
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200 text-right">
                {transaction.customer ? (
                  <span className="flex flex-col items-end">
                    <span>{transaction.customer.name}</span>
                    {transaction.customer.phone && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {transaction.customer.phone}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal italic">Umum / Walk-in</span>
                )}
              </span>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-700 pt-2.5 space-y-1.5">
              {transaction.subTotal !== undefined && (
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-700">
                    {formatTransactionRupiah(Number(transaction.subTotal))}
                  </span>
                </div>
              )}
              {transaction.discount !== undefined && Number(transaction.discount) > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-600">
                  <span>Diskon</span>
                  <span className="font-bold">
                    - {formatTransactionRupiah(Number(transaction.discount))}
                  </span>
                </div>
              )}
              {transaction.tax !== undefined && Number(transaction.tax) > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>PPN (11%)</span>
                  <span className="font-bold text-slate-700">
                    {formatTransactionRupiah(Number(transaction.tax))}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-100 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                <span>Total Transaksi</span>
                <span className="text-indigo-600 text-base">
                  {formatTransactionRupiah(transaction.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {transaction.status === 'PENDING' &&
            transaction.paymentMethod === 'QRIS' &&
            transaction.qrisUrl && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col items-center gap-3">
                <div className="text-center">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">
                    Scan QRIS untuk Melunasi
                  </span>
                  <span className="text-lg font-black text-indigo-900 block mt-0.5">
                    {formatTransactionRupiah(transaction.grandTotal)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm flex items-center justify-center w-40 h-40">
                  <img
                    src={transaction.qrisUrl}
                    alt="QRIS Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span className="animate-pulse">Menunggu Pembayaran (Polling)...</span>
                </div>
              </div>
            )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Daftar Produk Belanja
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {transaction.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {item.product?.name || 'Produk'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                      {item.product?.sku || 'SKU'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {formatTransactionRupiah(Number(item.subtotal))}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.quantity} x {formatTransactionRupiah(Number(item.priceAtTransaction))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-97 transition-all shadow-sm"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => onSendWhatsApp(transaction)}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-850 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-97 transition-all shadow-sm shadow-emerald-50 dark:shadow-none"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Kirim ke WA
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 active:scale-97 transition-all"
          >
            <Printer className="h-4 w-4" />
            Cetak Ulang Struk
          </button>
        </div>
      </div>
    </div>
  );
}
