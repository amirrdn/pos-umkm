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
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Skeleton Tabel Desktop */}
        <div className="hidden md:block flex-1 overflow-auto animate-pulse">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                <th className="py-4 px-6 w-1/4">Nomor Invoice</th>
                <th className="py-4 px-6 w-1/4">Tanggal & Waktu</th>
                <th className="py-4 px-6 w-1/6">Status</th>
                <th className="py-4 px-6 w-1/6">Total Tagihan</th>
                <th className="py-4 px-6 text-center w-1/6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150/60 dark:divide-slate-800/80">
              {[...Array(5)].map((_, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-4 px-6">
                    <div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-xl w-32" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-xl w-40" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6.5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
                  </td>
                  <td className="py-4 px-6 flex justify-center gap-2">
                    <div className="h-8.5 bg-slate-200 dark:bg-slate-800 rounded-xl w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Skeleton Kartu Mobile */}
        <div className="block md:hidden flex-1 overflow-auto p-4 space-y-3 animate-pulse">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-4.5 bg-slate-200 dark:bg-slate-850 rounded-xl w-32" />
                <div className="h-6 bg-slate-200 dark:bg-slate-850 rounded-full w-16" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-855 rounded-xl w-44" />
                <div className="h-3.5 bg-slate-200 dark:bg-slate-855 rounded-xl w-36" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="h-4.5 bg-slate-200 dark:bg-slate-855 rounded-xl w-24" />
                <div className="flex gap-2">
                  <div className="h-8 bg-slate-200 dark:bg-slate-855 rounded-xl w-10" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-855 rounded-xl w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tampilan Error
  if (error) {
    return (
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-3 text-center py-20 px-6">
        <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-full border border-rose-100 dark:border-rose-900/50">
          <X className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-rose-600 dark:text-rose-450">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="cursor-pointer bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Tampilan Kosong (Empty State)
  if (transactions.length === 0) {
    return (
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="bg-slate-50 dark:bg-slate-800 text-slate-400 p-4.5 rounded-full mb-3 border border-slate-100 dark:border-slate-750">
          <History className="h-7 w-7" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {isFiltered ? 'Hasil Pencarian Tidak Ditemukan' : 'Tidak Ada Transaksi'}
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
          {isFiltered
            ? 'Tidak ada riwayat transaksi yang cocok dengan filter atau kata kunci pencarian Anda.'
            : 'Belum ada riwayat transaksi yang tercatat di tenant Anda.'}
        </p>
        {isFiltered && resetFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="cursor-pointer mt-4 bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Atur Ulang Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Tampilan Tabel DESKTOP (md ke atas) */}
      <div className="hidden md:block flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-155 dark:border-slate-700">
              <th className="py-3.5 px-6">Nomor Invoice</th>
              <th className="py-3.5 px-6">Tanggal & Waktu</th>
              <th className="py-3.5 px-6">Pelanggan</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Total Tagihan</th>
              <th className="py-3.5 px-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 active:bg-indigo-100/30 dark:active:bg-indigo-950/40 transition-colors border-b border-slate-100 dark:border-slate-800"
              >
                {/* Invoice ID */}
                <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-slate-100 font-mono tracking-wide text-xs">
                  {tx.invoiceNumber}
                </td>
                {/* Tanggal & Waktu */}
                <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400">
                  {formatTransactionDateTime(tx.createdAt)}
                </td>
                {/* Nama Pelanggan */}
                <td className="py-3.5 px-6 font-semibold text-slate-750 dark:text-slate-250">
                  {tx.customer?.name || (
                    <span className="text-slate-400 font-normal italic">Umum / Walk-in</span>
                  )}
                </td>
                {/* Status */}
                <td className="py-3.5 px-6">
                  <TransactionStatusBadge status={tx.status} />
                </td>
                {/* Total Tagihan */}
                <td className="py-3.5 px-6 font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                  {formatTransactionRupiah(tx.grandTotal)}
                </td>
                {/* Tombol Aksi */}
                <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-2">
                    {/* Tombol WhatsApp (Cepat) */}
                    {onSendWhatsApp && (
                      <button
                        type="button"
                        onClick={() => onSendWhatsApp(tx)}
                        title="Kirim Struk via WhatsApp"
                        className="cursor-pointer p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-100 dark:hover:bg-emerald-900/45 active:scale-90 transition-all shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Tombol Detail */}
                    <button
                      type="button"
                      onClick={() => onSelectTransaction(tx)}
                      title="Lihat Detail Transaksi"
                      className="cursor-pointer inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu MOBILE (di bawah md) */}
      <div className="block md:hidden flex-1 overflow-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/10">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onSelectTransaction(tx)}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col gap-3 relative"
          >
            {/* Header Kartu: Invoice & Status */}
            <div className="flex justify-between items-center gap-3">
              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white tracking-wide">
                {tx.invoiceNumber}
              </span>
              <TransactionStatusBadge status={tx.status} />
            </div>

            {/* Detail/Metadata Kartu */}
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <p>{formatTransactionDateTime(tx.createdAt)}</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Pelanggan: {tx.customer?.name || (
                  <span className="text-slate-400 font-normal italic">Umum / Walk-in</span>
                )}
              </p>
            </div>

            {/* Footer Kartu: Total & Tombol Aksi */}
            <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                  Total Tagihan
                </span>
                <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {formatTransactionRupiah(tx.grandTotal)}
                </span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {onSendWhatsApp && (
                  <button
                    type="button"
                    onClick={() => onSendWhatsApp(tx)}
                    title="Kirim Struk via WhatsApp"
                    className="cursor-pointer p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 active:scale-90 transition-all shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectTransaction(tx)}
                  title="Lihat Detail Transaksi"
                  className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-650 dark:text-slate-300 hover:text-indigo-800 dark:hover:text-indigo-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
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
