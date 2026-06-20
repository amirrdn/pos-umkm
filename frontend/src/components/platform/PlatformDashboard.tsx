import { useEffect } from 'react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { Building2, Users, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

const TIER_LABELS: Record<string, string> = {
  FREE: 'Gratis',
  GROWTH: 'Tumbuh',
  ENTERPRISE: 'Enterprise',
};

export function PlatformDashboard() {
  const { overview, loading, error, fetchOverview } = usePlatformStore();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
        {error}
      </div>
    );
  }

  const stats = [
    { label: 'Total Tenant', value: overview?.totalTenants ?? 0, icon: Building2, accent: 'text-violet-600 dark:text-violet-400' },
    { label: 'Langganan Aktif', value: overview?.activeTenants ?? 0, icon: CheckCircle2, accent: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Langganan Kedaluwarsa', value: overview?.expiredTenants ?? 0, icon: AlertTriangle, accent: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
              </span>
              <Icon className={`w-4 h-4 ${accent}`} />
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {overview?.tierCounts && overview.tierCounts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4">
            Distribusi Paket
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {overview.tierCounts.map((tier) => (
              <div
                key={tier.subscriptionTier}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {TIER_LABELS[tier.subscriptionTier] ?? tier.subscriptionTier}
                </span>
                <span className="text-lg font-black text-violet-600 dark:text-violet-400">
                  {tier._count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-violet-300 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-6">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black text-violet-800 dark:text-violet-200">
              Selamat datang di Platform Console
            </h3>
            <p className="text-xs text-violet-600/80 dark:text-violet-300/70 mt-1 leading-relaxed">
              Ini adalah antarmuka khusus Admin Platform — terpisah dari UI operasional toko (POS,
              kasir, outlet). Gunakan menu Tenant untuk melihat semua toko yang terdaftar di SaaS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
