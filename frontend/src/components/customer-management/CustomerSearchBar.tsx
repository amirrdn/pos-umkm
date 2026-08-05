import { RefreshCw, Search, X, Users } from 'lucide-react';

export interface CustomerSearchBarProps {
  searchQuery: string;
  loading: boolean;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  onRefresh: () => void;
  totalCount?: number;
}

export function CustomerSearchBar({
  searchQuery,
  loading,
  onSearchQueryChange,
  onSearchSubmit,
  onClearSearch,
  onRefresh,
  totalCount,
}: CustomerSearchBarProps) {
  return (
    <div className="p-5 border-b border-slate-200/90 dark:border-slate-800 flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-t-3xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2 min-w-0">
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <Users className="h-4 w-4 shrink-0" />
          </div>
          <span className="truncate">
            Daftar Pelanggan {totalCount !== undefined ? `(${totalCount})` : ''}
          </span>
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          className="cursor-pointer group p-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0 shadow-2xs"
          title="Muat ulang daftar"
          aria-label="Muat ulang pelanggan"
        >
          <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
        </button>
      </div>

      <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 w-4.5 h-4.5 transition-colors" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pelanggan atau nomor telepon WhatsApp..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10.5 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          Cari Pelanggan
        </button>
      </form>
    </div>
  );
}
