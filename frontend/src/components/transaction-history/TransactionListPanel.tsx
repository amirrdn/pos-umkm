import { Eye, History, MessageCircle, X } from 'lucide-react';
import { formatTransactionDateTime, formatTransactionRupiah } from '../../utils/transactionHistoryHelpers';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import type { TransactionRecord } from '../../types/transactionHistory';

export interface TransactionListPanelProps {
  loading: boolean;
  error: string | null;
  transactions: TransactionRecord[];
  onRefresh: () => void;
  onSelectTransaction: (transaction: TransactionRecord) => void;
  onSendWhatsApp?: (transaction: TransactionRecord) => void;
  resetFilters?: () => void;
  isFiltered?: boolean;
}

export function TransactionListPanel({
  loading,
  error,
  transactions,
  onRefresh,
  onSelectTransaction,
  onSendWhatsApp,
  resetFilters,
  isFiltered = false,
}: TransactionListPanelProps) {
  if (loading) {
    return (
      <div className="flex-1 min-h-[560px] lg:min-h-[640px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col backdrop-blur-md">
        <div className="hidden md:block flex-1 overflow-auto animate-pulse">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
                <th className="py-5 px-6.5 w-1/4">Nomor Invoice</th>
                <th className="py-5 px-6.5 w-1/4">Tanggal & Waktu</th>
                <th className="py-5 px-6.5 w-1/5">Pelanggan</th>
                <th className="py-5 px-6.5 w-1/6">Status</th>
                <th className="py-5 px-6.5 w-1/6">Total Tagihan</th>
                <th className="py-5 px-6.5 text-center w-1/6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {[...Array(8)].map((_, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-5.5 px-6.5">
                    <div className="h-5 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-36" />
                  </td>
                  <td className="py-5.5 px-6.5">
                    <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-40" />
                  </td>
                  <td className="py-5.5 px-6.5">
                    <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-28" />
                  </td>
                  <td className="py-5.5 px-6.5">
                    <div className="h-7 bg-slate-200/70 dark:bg-slate-800 rounded-full w-24" />
                  </td>
                  <td className="py-5.5 px-6.5">
                    <div className="h-5 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-28" />
                  </td>
                  <td className="py-5.5 px-6.5 flex justify-center gap-2">
                    <div className="h-9 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-24" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden p-4 space-y-3.5 animate-pulse">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-[560px] lg:min-h-[640px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800">
          <X className="w-7 h-7" />
        </div>
        <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">Gagal Memuat Transaksi</h4>
        <p className="text-xs text-slate-500 max-w-md mb-5">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-sm active:scale-95"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex-1 min-h-[560px] lg:min-h-[640px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-xs backdrop-blur-md">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
          <History className="w-8 h-8 opacity-60" />
        </div>
        <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">Belum Ada Transaksi</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5">
          {isFiltered
            ? 'Tidak ada transaksi yang cocok dengan kriteria filter saat ini.'
            : 'Belum ada riwayat penjualan terekam di sistem.'}
        </p>
        {isFiltered && resetFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="cursor-pointer px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-2xl font-extrabold text-xs transition-all shadow-2xs active:scale-95"
          >
            Bersihkan Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[560px] lg:min-h-[640px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md dark:shadow-none overflow-hidden flex flex-col backdrop-blur-md transition-all">
      <div className="hidden md:block flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider text-[11px] border-b-2 border-slate-200/90 dark:border-slate-700 sticky top-0 z-10 backdrop-blur-md">
              <th className="py-5 px-6.5">Nomor Invoice</th>
              <th className="py-5 px-6.5">Tanggal & Waktu</th>
              <th className="py-5 px-6.5">Pelanggan</th>
              <th className="py-5 px-6.5">Status</th>
              <th className="py-5 px-6.5">Total Tagihan</th>
              <th className="py-5 px-6.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="group hover:bg-indigo-50/60 dark:hover:bg-slate-800/60 transition-colors duration-150 cursor-pointer"
              >
                <td className="py-5.5 px-6.5 font-bold text-slate-900 dark:text-slate-50 font-mono tracking-wide text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tx.invoiceNumber}
                </td>
                <td className="py-5.5 px-6.5 text-slate-600 dark:text-slate-400 font-medium">
                  {formatTransactionDateTime(tx.createdAt)}
                </td>
                <td className="py-5.5 px-6.5 font-bold text-slate-800 dark:text-slate-200">
                  {tx.customer?.name || (
                    <span className="text-slate-400 dark:text-slate-500 font-medium italic">Umum / Walk-in</span>
                  )}
                </td>
                <td className="py-5.5 px-6.5">
                  <TransactionStatusBadge status={tx.status} />
                </td>
                <td className="py-5.5 px-6.5 font-black text-indigo-700 dark:text-indigo-400 text-sm font-mono tracking-tight">
                  {formatTransactionRupiah(tx.grandTotal)}
                </td>
                <td className="py-5.5 px-6.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-2">
                    {onSendWhatsApp && (
                      <button
                        type="button"
                        onClick={() => onSendWhatsApp(tx)}
                        title="Kirim Struk via WhatsApp"
                        className="cursor-pointer p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-900/60 active:scale-90 transition-all shadow-2xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectTransaction(tx)}
                      title="Lihat Detail Transaksi"
                      className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-800 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-2xs active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden flex-1 overflow-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/20">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onSelectTransaction(tx)}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 rounded-3xl shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex flex-col gap-3.5 relative"
          >
            <div className="flex justify-between items-center gap-3">
              <span className="font-mono font-black text-xs text-slate-900 dark:text-white tracking-wide">
                {tx.invoiceNumber}
              </span>
              <TransactionStatusBadge status={tx.status} />
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <p className="font-medium">{formatTransactionDateTime(tx.createdAt)}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Pelanggan: {tx.customer?.name || (
                  <span className="text-slate-400 dark:text-slate-500 font-medium italic">Umum / Walk-in</span>
                )}
              </p>
            </div>

            <div className="flex justify-between items-center gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                  Total Tagihan
                </span>
                <span className="font-black text-base text-indigo-700 dark:text-indigo-400 mt-0.5 font-mono">
                  {formatTransactionRupiah(tx.grandTotal)}
                </span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {onSendWhatsApp && (
                  <button
                    type="button"
                    onClick={() => onSendWhatsApp(tx)}
                    title="Kirim Struk via WhatsApp"
                    className="cursor-pointer p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-90 transition-all shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectTransaction(tx)}
                  title="Lihat Detail Transaksi"
                  className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-800 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-2xs active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  Detail
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
