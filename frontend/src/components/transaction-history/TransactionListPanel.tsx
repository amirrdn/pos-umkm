import { Eye, History, RefreshCw, X } from 'lucide-react';
import { formatTransactionDateTime, formatTransactionRupiah } from '../../utils/transactionHistoryHelpers';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import type { TransactionRecord } from '../../types/transactionHistory';

export interface TransactionListPanelProps {
  loading: boolean;
  error: string | null;
  transactions: TransactionRecord[];
  onRefresh: () => void;
  onSelectTransaction: (transaction: TransactionRecord) => void;
}

export function TransactionListPanel({
  loading,
  error,
  transactions,
  onRefresh,
  onSelectTransaction,
}: TransactionListPanelProps) {
  return (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Memuat riwayat transaksi...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20 px-6">
          <div className="bg-rose-50 text-rose-600 p-3 rounded-full border border-rose-100">
            <X className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-rose-600">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="cursor-pointer bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6">
          <div className="bg-slate-50 dark:bg-slate-800 text-slate-400 p-4 rounded-full mb-3">
            <History className="h-8 w-8" />
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Tidak ada transaksi ditemukan</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Belum ada riwayat transaksi yang tercatat di tenant Anda.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                <th className="py-4 px-6">Nomor Invoice</th>
                <th className="py-4 px-6">Tanggal & Waktu</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Total Tagihan</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {tx.invoiceNumber}
                  </td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                    {formatTransactionDateTime(tx.createdAt)}
                  </td>
                  <td className="py-4 px-6">
                    <TransactionStatusBadge status={tx.status} />
                  </td>
                  <td className="py-4 px-6 font-black text-indigo-600 text-[13px]">
                    {formatTransactionRupiah(tx.grandTotal)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectTransaction(tx)}
                      className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-400 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-97"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail / Cetak Ulang
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
