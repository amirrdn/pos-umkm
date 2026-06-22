import { Check, Loader2, Pencil, Power, Trash2, X } from 'lucide-react';
import type { StaffTab, StaffUser } from '../../types/staffManagement';

export interface StaffRowActionsProps {
  staff: StaffUser;
  activeTab: StaffTab;
  isSelf: boolean;
  isProcessing: boolean;
  layout: 'table' | 'card';
  onApprove: (staff: StaffUser) => void;
  onReject: (staff: StaffUser) => void;
  onToggleStatus: (staff: StaffUser) => void;
  onEdit: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
}

export function StaffRowActions({
  staff,
  activeTab,
  isSelf,
  isProcessing,
  layout,
  onApprove,
  onReject,
  onToggleStatus,
  onEdit,
  onDelete,
}: StaffRowActionsProps) {
  const isCardLayout = layout === 'card';

  if (activeTab === 'pending') {
    return (
      <div
        className={
          isCardLayout
            ? 'grid grid-cols-2 gap-2 w-full'
            : 'flex items-center justify-end gap-2'
        }
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onApprove(staff);
          }}
          disabled={isProcessing}
          className={`cursor-pointer inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all ${
            isCardLayout ? 'px-3 py-2.5 w-full' : 'px-3 py-1.5'
          }`}
          title="Setujui Pendaftaran"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Setujui
        </button>
        <button
          type="button"
          onClick={() => onReject(staff)}
          disabled={isProcessing}
          className={`cursor-pointer inline-flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all ${
            isCardLayout ? 'px-3 py-2.5 w-full' : 'px-3 py-1.5'
          }`}
          title="Tolak Pendaftaran"
        >
          <X className="w-3.5 h-3.5" />
          Tolak
        </button>
      </div>
    );
  }

  const iconButtonClassName = (variant: 'toggle-active' | 'toggle-inactive' | 'default') => {
    if (isSelf) {
      return 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-650';
    }

    if (variant === 'toggle-active') {
      return 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95';
    }

    if (variant === 'toggle-inactive') {
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95';
    }

    return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 border-slate-200 dark:border-slate-700';
  };

  const deleteButtonClassName = isSelf
    ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-650'
    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 border-slate-200 dark:border-slate-700';

  if (isCardLayout) {
    return (
      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          type="button"
          onClick={() => onToggleStatus(staff)}
          disabled={isSelf || isProcessing}
          className={`cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
            staff.isActive ? iconButtonClassName('toggle-active') : iconButtonClassName('toggle-inactive')
          }`}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
          {staff.isActive ? 'Nonaktif' : 'Aktifkan'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(staff)}
          disabled={isSelf}
          className={`cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${iconButtonClassName('default')}`}
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(staff)}
          disabled={isSelf}
          className={`cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${deleteButtonClassName}`}
        >
          <Trash2 className="w-4 h-4" />
          Hapus
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onToggleStatus(staff)}
        disabled={isSelf || isProcessing}
        className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 ${
          staff.isActive ? iconButtonClassName('toggle-active') : iconButtonClassName('toggle-inactive')
        }`}
        title={staff.isActive ? 'Nonaktifkan Karyawan' : 'Aktifkan Karyawan'}
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
      </button>
      <button
        type="button"
        onClick={() => onEdit(staff)}
        disabled={isSelf}
        className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 ${iconButtonClassName('default')}`}
        title="Edit Karyawan"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(staff)}
        disabled={isSelf}
        className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 ${deleteButtonClassName}`}
        title="Hapus Karyawan"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
