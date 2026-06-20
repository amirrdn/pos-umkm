import React from 'react';
import { ShoppingBag, Moon, Sun, LogOut } from 'lucide-react';
import { OutletSwitcher } from '../OutletSwitcher';

interface PosHeaderProps {
  platformAdmin: boolean;
  activeShift: any;
  shiftStartedLabel: string | null;
  setShowCloseShiftModal: (val: boolean) => void;
  setShowCartPanel: (val: boolean) => void;
  cartItemCount: number;
  theme: string;
  toggleTheme: () => void;
  user: any;
  primaryRole: string;
  handleLogout: () => void;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  platformAdmin,
  activeShift,
  shiftStartedLabel,
  setShowCloseShiftModal,
  setShowCartPanel,
  cartItemCount,
  theme,
  toggleTheme,
  user,
  primaryRole,
  handleLogout,
}) => {
  return (
    <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Bar konteks operasional */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 sm:p-2.5 rounded-xl text-white shadow-md shadow-indigo-500/25">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                SaaS POS
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Terminal Kasir
              </p>
            </div>
          </div>

          <div className="hidden md:block h-9 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

          {!platformAdmin && (
            <div className="hidden sm:flex items-center gap-2 min-w-0 max-w-[140px] md:max-w-none">
              <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                Outlet
              </span>
              <OutletSwitcher operationalOnly size="md" className="min-w-0" />
            </div>
          )}

          {platformAdmin && (
            <div className="hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Admin Platform
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {activeShift && (
            <div className="flex items-center gap-1.5 sm:gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <div className="leading-tight">
                <p className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Shift Aktif</p>
                {shiftStartedLabel && (
                  <p className="hidden sm:block text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                    Mulai {shiftStartedLabel}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowCloseShiftModal(true)}
                className="cursor-pointer px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-md transition-colors"
              >
                Tutup
              </button>
            </div>
          )}

          <button
            onClick={() => setShowCartPanel(true)}
            className="cursor-pointer lg:hidden relative p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-all active:scale-95"
            title="Keranjang Belanja"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-indigo-600 text-white text-[9px] font-bold rounded-full">
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="cursor-pointer p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>

          <div className="hidden md:flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase">
              {(user?.name ?? 'K').charAt(0)}
            </div>
            <div className="leading-tight max-w-[140px]">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.name || 'Operator'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
              {primaryRole}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 rounded-xl transition-all active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
