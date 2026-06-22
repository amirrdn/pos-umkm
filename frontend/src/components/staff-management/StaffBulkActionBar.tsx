import { Check, Loader2 } from 'lucide-react';

export interface StaffBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  submitting: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onBulkApprove: () => void;
}

export function StaffBulkActionBar({
  selectedCount,
  totalCount,
  isAllSelected,
  submitting,
  onToggleSelectAll,
  onClearSelection,
  onBulkApprove,
}: StaffBulkActionBarProps) {
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={onToggleSelectAll}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/30"
          />
          <span className="font-medium">
            {selectedCount > 0 ? `${selectedCount} dipilih` : 'Pilih semua'}
          </span>
        </label>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClearSelection}
            className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            Bersihkan
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onBulkApprove}
          disabled={submitting}
          className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Setujui {selectedCount} Permintaan
        </button>
      )}
    </div>
  );
}
