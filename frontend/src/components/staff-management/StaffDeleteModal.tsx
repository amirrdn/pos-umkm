import { AlertTriangle, Loader2 } from 'lucide-react';
import type { StaffUser } from '../../types/staffManagement';

export interface StaffDeleteModalProps {
  deleteTarget: StaffUser | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function StaffDeleteModal({
  deleteTarget,
  submitting,
  onClose,
  onConfirm,
}: StaffDeleteModalProps) {
  if (!deleteTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={() => !submitting && onClose()}
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4 border border-rose-200 dark:border-rose-500/20">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Hapus Karyawan?</h3>
        <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed mb-6">
          Apakah Anda yakin ingin menghapus karyawan{' '}
          <strong className="text-slate-850 dark:text-slate-200 font-semibold">
            &quot;{deleteTarget.name}&quot;
          </strong>
          ? Akun ini akan dinonaktifkan secara permanen dan tidak akan bisa masuk ke dalam outlet Anda
          lagi.
        </p>

        <div className="flex items-center gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer flex-1 px-4 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 duration-150"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 duration-150"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Hapus Akun'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
