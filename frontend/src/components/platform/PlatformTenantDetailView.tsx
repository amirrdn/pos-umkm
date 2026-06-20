import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Loader2,
  Package,
  Store,
  Users,
  ShoppingCart,
  Mail,
  Phone,
} from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';

const TIER_LABELS: Record<string, string> = {
  FREE: 'Gratis',
  GROWTH: 'Tumbuh',
  ENTERPRISE: 'Enterprise',
};

export function PlatformTenantDetailView() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const tenants = usePlatformStore((state) => state.tenants);
  const setActiveTenant = usePlatformStore((state) => state.setActiveTenant);
  const fetchTenants = usePlatformStore((state) => state.fetchTenants);
  const { subscription, loading, error, fetchActiveSubscription } = useSubscriptionStore();

  const tenant = tenants.find((item) => item.id === tenantId);

  useEffect(() => {
    if (tenants.length === 0) {
      fetchTenants();
    }
  }, [tenants.length, fetchTenants]);

  useEffect(() => {
    if (!tenantId) return;
    setActiveTenant(tenantId);
  }, [tenantId, setActiveTenant]);

  useEffect(() => {
    if (!tenantId) return;
    fetchActiveSubscription();
  }, [tenantId, fetchActiveSubscription]);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const usageCards = subscription
    ? [
        { label: 'Produk', icon: Package, data: subscription.usage.products },
        { label: 'Outlet', icon: Store, data: subscription.usage.outlets },
        { label: 'Staf', icon: Users, data: subscription.usage.staff },
        { label: 'Transaksi/bln', icon: ShoppingCart, data: subscription.usage.transactions },
      ]
    : [];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/platform/tenants')}
        className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke daftar tenant
      </button>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{tenant.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{tenant.slug}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {TIER_LABELS[tenant.subscriptionTier] ?? tenant.subscriptionTier}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {tenant.subscriptionStatus}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {tenant.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Mail className="w-4 h-4 shrink-0" />
            {tenant.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Phone className="w-4 h-4 shrink-0" />
            {tenant.phone}
          </div>
        </div>
      </div>

      {loading && !subscription && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {subscription && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4">
            Kuota Langganan (Inspeksi)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {usageCards.map(({ label, icon: Icon, data }) => (
              <div
                key={label}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                </div>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {data.current}
                  <span className="text-xs font-semibold text-slate-400">
                    {' '}
                    / {data.limit === Infinity ? '∞' : data.limit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-violet-300 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4">
        <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
          Tenant ini dipilih sebagai <strong>Tenant Aktif</strong>. Semua API inspeksi dari konsol
          platform akan memakai <code className="text-[10px]">x-tenant-id: {tenant.id}</code>.
        </p>
      </div>
    </div>
  );
}
