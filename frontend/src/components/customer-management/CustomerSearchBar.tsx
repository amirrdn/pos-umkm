import { RefreshCw, Search } from 'lucide-react';

export interface CustomerSearchBarProps {
  searchQuery: string;
  loading: boolean;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  onRefresh: () => void;
}

export function CustomerSearchBar({
  searchQuery,
  loading,
  onSearchQueryChange,
  onSearchSubmit,
  onClearSearch,
  onRefresh,
}: CustomerSearchBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <form onSubmit={onSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau no. telepon..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
          />
        </div>
        <button
          type="submit"
          className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          Cari
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-700 px-2"
          >
            Reset
          </button>
        )}
      </form>

      <button
        type="button"
        onClick={onRefresh}
        className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        Perbarui
      </button>
    </div>
  );
}
