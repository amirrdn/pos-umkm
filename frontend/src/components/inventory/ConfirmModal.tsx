import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import type { ConfirmModalState } from '../../types/inventory';

export interface ConfirmModalProps {
  confirmModal: ConfirmModalState;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  confirmLoading: boolean;
  setConfirmLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ConfirmModal({
  confirmModal,
  setConfirmModal,
  confirmLoading,
  setConfirmLoading,
}: ConfirmModalProps) {
  if (!confirmModal.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={() => !confirmLoading && setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className={`h-1.5 w-full ${
          confirmModal.type === 'danger' ? 'bg-rose-500' :
          confirmModal.type === 'warning' ? 'bg-amber-500' :
          confirmModal.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
        }`} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border flex-shrink-0 ${
              confirmModal.type === 'danger' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-500' :
              confirmModal.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-550' :
              confirmModal.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-500' :
              'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-500'
            }`}>
              {confirmModal.type === 'danger' && <AlertCircle className="w-6 h-6" />}
              {confirmModal.type === 'warning' && <AlertCircle className="w-6 h-6" />}
              {confirmModal.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {(!confirmModal.type || confirmModal.type === 'info') && <Info className="w-6 h-6" />}
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={confirmLoading}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="cursor-pointer px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
            >
              {confirmModal.cancelText || 'Batal'}
            </button>
            <button
              type="button"
              disabled={confirmLoading}
              onClick={async () => {
                try {
                  setConfirmLoading(true);
                  await confirmModal.onConfirm();
                } catch (err) {
                  console.error('Error in confirm action:', err);
                } finally {
                  setConfirmLoading(false);
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              }}
              className={`cursor-pointer flex items-center gap-1.5 px-4 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20' :
                confirmModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-950/20' :
                confirmModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20' :
                'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/20'
              }`}
            >
              {confirmLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                confirmModal.confirmText || 'Konfirmasi'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
