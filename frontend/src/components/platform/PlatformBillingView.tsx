import { CreditCard, Sparkles } from 'lucide-react';

export function PlatformBillingView() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-7 h-7 text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
          Billing Platform
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Ringkasan pendapatan langganan lintas-tenant, invoice Midtrans, dan metrik churn akan
          tersedia di sini pada fase berikutnya.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Invoice Lintas-Tenant</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Segera hadir</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <CreditCard className="w-5 h-5 text-violet-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Override Paket Manual</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Segera hadir</p>
        </div>
      </div>
    </div>
  );
}
