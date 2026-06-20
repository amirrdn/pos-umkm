import { RefreshCw, Search } from 'lucide-react';

export interface TransactionSearchBarProps {
  searchQuery: string;
  loading: boolean;
  onSearchQueryChange: (value: string) => void;
  onRefresh: () => void;
}

export function TransactionSearchBar({
  searchQuery,
  loading,
  onSearchQueryChange,
  onRefresh,
}: TransactionSearchBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shrink-0">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Cari berdasarkan nomor invoice..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 self-end sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        Segarkan Data
      </button>
    </div>
  );
}
