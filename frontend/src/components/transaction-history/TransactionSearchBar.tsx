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
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col gap-4 shrink-0 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 w-4.5 h-4.5 transition-colors" />
          <input
            type="text"
            placeholder="Cari nomor invoice atau nama pelanggan..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedPayment}
              onChange={(e) => onPaymentChange(e.target.value as typeof selectedPayment)}
              className="cursor-pointer w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all hover:border-indigo-500"
            >
              <option value="ALL">Semua Pembayaran</option>
              <option value="CASH">Tunai (CASH)</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedDateRange}
              onChange={(e) => onDateRangeChange(e.target.value as typeof selectedDateRange)}
              className="cursor-pointer w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all hover:border-indigo-500"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="WEEK">7 Hari Terakhir</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="cursor-pointer group bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
            Segarkan
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800/60 pt-3">
        {statusOptions.map((opt) => {
          const isActive = selectedStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap active:scale-95 ${isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200/50 dark:shadow-none dark:bg-indigo-600 dark:text-white dark:border-indigo-500'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-250 dark:border-slate-750 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-slate-700 dark:hover:text-white'
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
