import { RefreshCw, Search } from 'lucide-react';

export interface TransactionSearchBarProps {
  searchQuery: string;
  loading: boolean;
  onSearchQueryChange: (value: string) => void;
  onRefresh: () => void;
  selectedStatus: 'ALL' | 'COMPLETED' | 'PENDING' | 'VOID';
  onStatusChange: (status: 'ALL' | 'COMPLETED' | 'PENDING' | 'VOID') => void;
  selectedPayment: 'ALL' | 'CASH' | 'QRIS';
  onPaymentChange: (payment: 'ALL' | 'CASH' | 'QRIS') => void;
  selectedDateRange: 'ALL' | 'TODAY' | 'WEEK';
  onDateRangeChange: (range: 'ALL' | 'TODAY' | 'WEEK') => void;
}

export function TransactionSearchBar({
  searchQuery,
  loading,
  onSearchQueryChange,
  onRefresh,
  selectedStatus,
  onStatusChange,
  selectedPayment,
  onPaymentChange,
  selectedDateRange,
  onDateRangeChange,
}: TransactionSearchBarProps) {
  const statusOptions: { value: typeof selectedStatus; label: string; countClass?: string }[] = [
    { value: 'ALL', label: 'Semua Transaksi' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'VOID', label: 'Batal (Void)' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col gap-4 shrink-0">
      {/* Baris Pertama: Pencarian Teks & Dropdown Filter & Refresh */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Input Pencarian */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-500 w-4.5 h-4.5 transition-colors" />
          <input
            type="text"
            placeholder="Cari nomor invoice atau nama pelanggan..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all shadow-inner-sm"
          />
        </div>

        {/* Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Metode Pembayaran */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedPayment}
              onChange={(e) => onPaymentChange(e.target.value as typeof selectedPayment)}
              className="cursor-pointer w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="ALL">Semua Pembayaran</option>
              <option value="CASH">Tunai (CASH)</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          {/* Filter Waktu */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedDateRange}
              onChange={(e) => onDateRangeChange(e.target.value as typeof selectedDateRange)}
              className="cursor-pointer w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="WEEK">7 Hari Terakhir</option>
            </select>
          </div>

          {/* Tombol Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Baris Kedua: Pills Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800/60 pt-3">
        {statusOptions.map((opt) => {
          const isActive = selectedStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-indigo-650 text-white border-indigo-600 shadow-sm shadow-indigo-100 dark:shadow-none'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700/80'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
