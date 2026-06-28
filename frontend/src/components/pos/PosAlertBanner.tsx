import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export interface PosAlert {
  type: 'success' | 'error';
  message: string;
}

interface PosAlertBannerProps {
  alert: PosAlert | null;
  onDismiss: () => void;
}

export function PosAlertBanner({ alert, onDismiss }: PosAlertBannerProps) {
  if (!alert) return null;

  const isError = alert.type === 'error';

  return (
    <div
      className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md animate-in slide-in-from-top-2 fade-in duration-200"
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div
        className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg backdrop-blur-sm ${
          isError
            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800'
            : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800'
        }`}
      >
        <div
          className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${
            isError
              ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isError ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </div>

        <p
          className={`flex-1 text-sm font-medium leading-snug pt-0.5 ${
            isError
              ? 'text-rose-800 dark:text-rose-200'
              : 'text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {alert.message}
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className={`cursor-pointer shrink-0 p-1 rounded-lg transition-colors ${
            isError
              ? 'text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              : 'text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
          }`}
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
