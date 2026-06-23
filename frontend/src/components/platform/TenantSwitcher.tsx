import { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { AppSelect } from '../AppSelect';

export function TenantSwitcher({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  const tenants = usePlatformStore((state) => state.tenants);
  const activeTenantId = usePlatformStore((state) => state.activeTenantId);
  const loading = usePlatformStore((state) => state.loading);
  const fetchTenants = usePlatformStore((state) => state.fetchTenants);
  const ensureActiveTenant = usePlatformStore((state) => state.ensureActiveTenant);
  const setActiveTenant = usePlatformStore((state) => state.setActiveTenant);

  useEffect(() => {
    const init = async () => {
      await fetchTenants();
      await ensureActiveTenant();
    };
    init();
  }, [fetchTenants, ensureActiveTenant]);

  if (tenants.length === 0 && !loading) {
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">Tidak ada tenant</span>
    );
  }

  const isMd = size === 'md';

  return (
    <AppSelect
      className={className}
      size={isMd ? 'md' : 'sm'}
      value={activeTenantId ?? ''}
      onChange={(value) => {
        void setActiveTenant(value || null);
      }}
      disabled={loading || tenants.length === 0}
      searchable={tenants.length > 4}
      searchPlaceholder="Cari tenant..."
      aria-label="Pilih tenant aktif"
      leadingIcon={<Building2 className={isMd ? 'h-4 w-4' : 'h-3 w-3'} />}
      options={tenants.map((tenant) => ({
        value: tenant.id,
        label: tenant.name,
        description: `${tenant.subscriptionTier} · ${tenant._count.products} SKU`,
      }))}
    />
  );
}
