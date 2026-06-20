import { useEffect, useMemo, useState } from 'react';
import { Store } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuthStore, hasTenantWideOutletAccess, isPlatformAdmin } from '../store/useAuthStore';
import { buildApiHeaders } from '../utils/apiHeaders';
import { getAssignedOutletIds } from '../utils/outletAccess';
import { AppSelect, type AppSelectGroup } from './AppSelect';

interface OutletOption {
  id: string;
  name: string;
  type?: 'MAIN' | 'BRANCH';
  isActive?: boolean;
}

interface OutletSwitcherProps {
  className?: string;
  /** Ukuran tampilan — `md` untuk header aplikasi. */
  size?: 'sm' | 'md';
  /** Izinkan Owner/Manager/Admin memilih "Semua Outlet" (agregat tanpa filter outlet). */
  allowAllOutlets?: boolean;
  /** Sembunyikan cabang nonaktif — wajib untuk POS/kasir. */
  operationalOnly?: boolean;
}

export function OutletSwitcher({
  className = '',
  size = 'sm',
  allowAllOutlets = false,
  operationalOnly = false,
}: OutletSwitcherProps) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const setActiveOutlet = useAuthStore((state) => state.setActiveOutlet);

  const [tenantOutlets, setTenantOutlets] = useState<OutletOption[]>([]);
  const [loading, setLoading] = useState(false);

  const tenantWideAccess = user ? hasTenantWideOutletAccess(user.roles) : false;

  useEffect(() => {
    if (!token || !user || !tenantWideAccess) return;

    const fetchOutlets = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/outlets${operationalOnly ? '?operationalOnly=true' : ''}`,
          {
            headers: buildApiHeaders(),
          }
        );
        const json = await response.json();
        if (response.ok) {
          setTenantOutlets(
            (json.data ?? []).map((o: OutletOption) => ({
              id: o.id,
              name: o.name,
              type: o.type,
              isActive: o.isActive,
            }))
          );
        }
      } catch (err) {
        console.error('Gagal mengambil daftar outlet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOutlets();
  }, [token, user, tenantWideAccess, operationalOnly]);

  const outlets = useMemo((): OutletOption[] => {
    if (!user) return [];

    const assignedIds = getAssignedOutletIds(user);
    const outletById = new Map((user.outlets ?? []).map((o) => [o.id, o]));

    const assignedOutlets: OutletOption[] = [...assignedIds].map((id) => {
      const outlet = outletById.get(id);
      return outlet
        ? {
            id: outlet.id,
            name: outlet.name,
            type: outlet.type,
            isActive: outlet.isActive,
          }
        : { id, name: id.slice(0, 8) };
    });

    const list = tenantWideAccess ? tenantOutlets : assignedOutlets;
    return operationalOnly ? list.filter((o) => o.isActive !== false) : list;
  }, [user, tenantOutlets, tenantWideAccess, operationalOnly]);

  useEffect(() => {
    if (!operationalOnly || !activeOutletId || outlets.length === 0) return;
    if (!outlets.some((o) => o.id === activeOutletId)) {
      setActiveOutlet(outlets[0]?.id ?? null);
    }
  }, [operationalOnly, outlets, activeOutletId, setActiveOutlet]);

  useEffect(() => {
    if (!user || allowAllOutlets || outlets.length === 0 || activeOutletId) return;
    setActiveOutlet(outlets[0].id);
  }, [user, outlets, activeOutletId, allowAllOutlets, setActiveOutlet]);

  if (!user) return null;
  if (isPlatformAdmin(user.roles)) return null;
  if (outlets.length === 0 && !loading) return null;

  const showDropdown = tenantWideAccess ? outlets.length > 0 : outlets.length > 1;
  const isMd = size === 'md';

  const singleClass = isMd
    ? 'inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700'
    : 'inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-bold';

  if (!showDropdown) {
    const single = outlets[0];
    if (!single) return null;
    return (
      <span className={`${singleClass} ${className}`}>
        <Store className={isMd ? 'h-4 w-4 shrink-0' : 'h-3 w-3'} />
        {single.name}
      </span>
    );
  }

  const mainOutlets = outlets.filter((o) => o.type === 'MAIN' || !o.type);
  const branchOutlets = outlets.filter((o) => o.type === 'BRANCH');

  const outletGroups: AppSelectGroup[] = [];
  if (mainOutlets.length > 0) {
    outletGroups.push({
      label: 'Outlet Utama',
      options: mainOutlets.map((o) => ({ value: o.id, label: o.name })),
    });
  }
  if (branchOutlets.length > 0) {
    outletGroups.push({
      label: 'Cabang',
      options: branchOutlets.map((o) => ({ value: o.id, label: o.name })),
    });
  }

  const selectValue =
    activeOutletId ?? (allowAllOutlets && tenantWideAccess ? '' : outlets[0]?.id ?? '');

  return (
    <AppSelect
      className={className}
      size={isMd ? 'md' : 'sm'}
      value={selectValue}
      onChange={(v) => setActiveOutlet(v || null)}
      disabled={loading}
      searchable={outlets.length > 4}
      searchPlaceholder="Cari outlet..."
      aria-label="Pilih outlet aktif"
      leadingIcon={<Store className={isMd ? 'h-4 w-4' : 'h-3 w-3'} />}
      options={
        allowAllOutlets && tenantWideAccess
          ? [{ value: '', label: 'Semua Outlet' }, ...outlets.map((o) => ({ value: o.id, label: o.name }))]
          : undefined
      }
      groups={allowAllOutlets && tenantWideAccess ? undefined : outletGroups}
    />
  );
}
