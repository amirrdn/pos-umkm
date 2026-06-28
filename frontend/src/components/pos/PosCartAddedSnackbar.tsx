import { Check, ShoppingBag } from 'lucide-react';

export interface CartAddedFeedback {
  name: string;
  price: number;
  quantity: number;
}

interface PosCartAddedSnackbarProps {
  feedback: CartAddedFeedback | null;
}

export function PosCartAddedSnackbar({ feedback }: PosCartAddedSnackbarProps) {
  if (!feedback) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none left-4 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:left-auto lg:right-6 lg:bottom-6 lg:w-80"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-lg shadow-slate-900/10 animate-in slide-in-from-bottom-3 fade-in duration-200">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Check className="h-5 w-5 text-white stroke-[2.5px]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {feedback.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Rp {feedback.price.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="text-xs font-bold tabular-nums">{feedback.quantity}</span>
        </div>
      </div>
    </div>
  );
}
