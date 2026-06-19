/** Tailwind-only interaction classes for links & buttons */

export const pointer = 'cursor-pointer';
export const pointerDisabled = 'disabled:cursor-not-allowed';
export const pointerWait = 'disabled:cursor-wait';

export const btnDismiss = 'cursor-pointer hover:opacity-75 transition-opacity';
export const btnIcon =
  'cursor-pointer transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95';
export const btnGhost =
  'cursor-pointer transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-800';
export const btnLogout =
  'cursor-pointer transition-all duration-150 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-900/50 active:scale-95';
export const btnLink =
  'cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50';
export const btnNavInactive =
  'cursor-pointer text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white';
