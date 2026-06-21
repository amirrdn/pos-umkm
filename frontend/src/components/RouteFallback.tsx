import { RefreshCw } from 'lucide-react';

/** Ditampilkan saat chunk route sedang dimuat (React.lazy). */
export function RouteFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
      <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-3" aria-hidden />
      <p className="text-sm font-semibold">Memuat halaman...</p>
    </div>
  );
}
