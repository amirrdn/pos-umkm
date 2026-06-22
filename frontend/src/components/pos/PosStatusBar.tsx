import { Clock, ShoppingBag, Store, Wifi, WifiOff } from 'lucide-react';

export interface PosStatusBarProps {
  activeOutletName: string | null;
  shiftActive: boolean;
  shiftStartedLabel: string | null;
  cartItemCount: number;
  grandTotal: number;
  isOnline: boolean;
  onShiftClick?: () => void;
}

export function PosStatusBar({
  activeOutletName,
  shiftActive,
  shiftStartedLabel,
  cartItemCount,
  grandTotal,
  isOnline,
  onShiftClick,
}: PosStatusBarProps) {
  return (
    <div className="shrink-0 px-3 sm:px-5 py-2 bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      {activeOutletName && (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
          <Store className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px] sm:max-w-none">
            {activeOutletName}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onShiftClick}
        disabled={!shiftActive || !onShiftClick}
        className={`flex items-center gap-1.5 ${shiftActive && onShiftClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      >
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${shiftActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
        />
        <span className={`font-semibold ${shiftActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {shiftActive ? 'Shift Aktif' : 'Shift Belum Dibuka'}
        </span>
        {shiftStartedLabel && (
          <span className="text-slate-500 dark:text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {shiftStartedLabel}
          </span>
        )}
      </button>

      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 ml-auto">
        <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {cartItemCount} item
        </span>
        <span className="text-slate-400">·</span>
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          Rp {grandTotal.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-500">
        {isOnline ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-rose-600 dark:text-rose-400">Offline</span>
          </>
        )}
      </div>
    </div>
  );
}
