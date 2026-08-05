import { RefreshCw, Search, X, Shield, ChevronDown } from 'lucide-react';
import { getRoleDisplayLabel } from '../../utils/roles';
import type { StaffRole, StaffRoleFilter } from '../../types/staffManagement';
import { StaffSearchBarSkeleton } from './StaffSearchBarSkeleton';

export interface StaffSearchBarProps {
  searchQuery: string;
  roleFilter: StaffRoleFilter;
  availableRoles: StaffRole[];
  loading: boolean;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent) => void;
  onClearSearch: () => void;
  onRoleFilterChange: (roleFilter: StaffRoleFilter) => void;
  onRefresh: () => void;
}

export function StaffSearchBar({
  searchQuery,
  roleFilter,
  availableRoles,
  loading,
  onSearchQueryChange,
  onSearchSubmit,
  onClearSearch,
  onRoleFilterChange,
  onRefresh,
}: StaffSearchBarProps) {
  if (loading) {
    return <StaffSearchBarSkeleton />;
  }

  const hasActiveFilters = searchQuery.trim().length > 0 || roleFilter !== 'all';

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center">
        {/* Form Input Pencarian */}
        <form onSubmit={onSearchSubmit} className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 w-4.5 h-4.5 transition-colors" />
          <input
            type="text"
            placeholder="Cari nama atau email karyawan..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
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
        </form>

        {/* Filter Role & Refresh Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {availableRoles.length > 0 && (
            <div className="relative flex-1 sm:flex-initial">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 w-4 h-4 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => onRoleFilterChange(e.target.value as StaffRoleFilter)}
                className="cursor-pointer appearance-none w-full sm:w-auto pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs hover:border-indigo-500"
              >
                <option value="all">Semua Role / Peran</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {getRoleDisplayLabel(role.name)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
            </div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearSearch}
              className="cursor-pointer px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-extrabold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Bersihkan Filter
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="cursor-pointer group p-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0 shadow-2xs"
            title="Muat ulang data staf"
          >
            <RefreshCw
              className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${
                loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
