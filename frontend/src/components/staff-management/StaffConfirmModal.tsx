import { Check, Loader2, Power, X } from 'lucide-react';
import type { StaffConfirmAction } from '../../types/staffManagement';

export interface StaffConfirmModalProps {
  confirmAction: StaffConfirmAction | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface ConfirmDialogContent {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName: string;
  icon: typeof Check;
  iconClassName: string;
}

function buildConfirmDialogContent(action: StaffConfirmAction): ConfirmDialogContent {
  if (action.type === 'bulk-approve') {
    const count = action.staffIds?.length ?? 0;
    return {
      title: 'Setujui Beberapa Permintaan?',
      message: `Setujui ${count} permintaan staf sekaligus? Mereka bisa langsung login setelah disetujui.`,
      confirmLabel: `Setujui ${count}`,
      confirmClassName: 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800',
      icon: Check,
      iconClassName:
        'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    };
  }

  const staffName = action.staff?.name ?? 'staf';

  switch (action.type) {
    case 'approve':
      return {
        title: 'Setujui Pendaftaran?',
        message: `Setujui ${staffName} sebagai staf? Ia bisa langsung login setelah disetujui.`,
        confirmLabel: 'Setujui',
        confirmClassName: 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800',
        icon: Check,
        iconClassName: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      };
    case 'reject':
      return {
        title: 'Tolak Pendaftaran?',
        message: `Tolak pendaftaran ${staffName}? Akun ini akan dihapus dari daftar staf.`,
        confirmLabel: 'Tolak',
        confirmClassName: 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800',
        icon: X,
        iconClassName: 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
      };
    case 'deactivate':
      return {
        title: 'Nonaktifkan Staf?',
        message: `Nonaktifkan ${staffName}? Ia tidak bisa login hingga diaktifkan kembali.`,
        confirmLabel: 'Nonaktifkan',
        confirmClassName: 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800',
        icon: Power,
        iconClassName: 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
      };
    case 'activate':
      return {
        title: 'Aktifkan Staf?',
        message: `Aktifkan kembali ${staffName}? Ia bisa login dan mengakses outlet sesuai peran.`,
        confirmLabel: 'Aktifkan',
        confirmClassName: 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800',
        icon: Power,
        iconClassName: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      };
    default: {
      const exhaustiveCheck: never = action.type;
      return exhaustiveCheck;
    }
  }
}

export function StaffConfirmModal({
  confirmAction,
  submitting,
  onClose,
  onConfirm,
}: StaffConfirmModalProps) {
  if (!confirmAction) {
    return null;
  }

  const dialog = buildConfirmDialogContent(confirmAction);
  const IconComponent = dialog.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={() => !submitting && onClose()}
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 border ${dialog.iconClassName}`}
        >
          <IconComponent className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{dialog.title}</h3>
        <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed mb-6">{dialog.message}</p>

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
            className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-lg transition-all active:scale-95 duration-150 ${dialog.confirmClassName}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              dialog.confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
