import { RefreshCw, Search } from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email karyawan..."
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            Cari
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearSearch}
              className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2"
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

      {availableRoles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
            Peran
          </span>
          <button
            type="button"
            onClick={() => onRoleFilterChange('all')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              roleFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            Semua
          </button>
          {availableRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => onRoleFilterChange(role.name)}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                roleFilter === role.name
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {getRoleDisplayLabel(role.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
