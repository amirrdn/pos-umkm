import { useEffect, useState } from 'react';
import { ChevronDown, Store } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuthStore, isGlobalAdmin } from '../store/useAuthStore';
import { buildApiHeaders } from '../utils/apiHeaders';

interface OutletOption {
  id: string;
  name: string;
  type?: 'MAIN' | 'BRANCH';
}

interface OutletSwitcherProps {
  className?: string;
  /** Izinkan admin memilih "Semua Outlet" (scope global tanpa filter outlet). */
  allowAllOutlets?: boolean;
}

export function OutletSwitcher({ className = '', allowAllOutlets = false }: OutletSwitcherProps) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const setActiveOutlet = useAuthStore((state) => state.setActiveOutlet);

  const [tenantOutlets, setTenantOutlets] = useState<OutletOption[]>([]);
  const [loading, setLoading] = useState(false);

  const admin = user ? isGlobalAdmin(user.roles) : false;

  useEffect(() => {
    if (!token || !user || !admin) return;

    const fetchOutlets = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/outlets`, {
          headers: buildApiHeaders(),
        });
        const json = await response.json();
        if (response.ok) {
          setTenantOutlets(
            (json.data ?? []).map((o: OutletOption) => ({ id: o.id, name: o.name, type: o.type }))
          );
        }
      } catch (err) {
        console.error('Gagal mengambil daftar outlet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOutlets();
  }, [token, user, admin]);

  if (!user) return null;

  const assignedOutlets: OutletOption[] = user.outlets?.length
    ? user.outlets
    : (user.outletIds ?? []).map((id) => ({ id, name: id.slice(0, 8) }));

  const outlets: OutletOption[] = admin ? tenantOutlets : assignedOutlets;

  useEffect(() => {
    if (!allowAllOutlets && outlets.length > 0 && !activeOutletId) {
      setActiveOutlet(outlets[0].id);
    }
  }, [outlets, activeOutletId, allowAllOutlets, setActiveOutlet]);

  if (outlets.length === 0 && !loading) return null;

  const activeOutlet = outlets.find((o) => o.id === activeOutletId);
  const showDropdown = admin ? outlets.length > 0 : outlets.length > 1;

  if (!showDropdown) {
    const single = outlets[0];
    if (!single) return null;
    return (
      <span className={`inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-bold ${className}`}>
        <Store className="h-3 w-3" />
        {single.name}
      </span>
    );
  }

  const mainOutlets = outlets.filter((o) => o.type === 'MAIN' || !o.type);
  const branchOutlets = outlets.filter((o) => o.type === 'BRANCH');

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Store className="absolute left-2 h-3 w-3 text-indigo-500 pointer-events-none" />
      <select
        value={activeOutletId ?? (allowAllOutlets && admin ? '' : outlets[0]?.id ?? '')}
        onChange={(e) => setActiveOutlet(e.target.value || null)}
        disabled={loading}
        className="appearance-none pl-7 pr-7 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 rounded-md text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[160px] truncate"
        title="Pilih outlet aktif"
      >
        {allowAllOutlets && admin && (
          <option value="">Semua Outlet</option>
        )}
        {mainOutlets.length > 0 && (
          <optgroup label="Outlet Utama">
            {mainOutlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </optgroup>
        )}
        {branchOutlets.length > 0 && (
          <optgroup label="Cabang">
            {branchOutlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <ChevronDown className="absolute right-1.5 h-3 w-3 text-indigo-500 pointer-events-none" />
      {!activeOutlet && activeOutletId === null && allowAllOutlets && admin && (
        <span className="sr-only">Semua Outlet</span>
      )}
    </div>
  );
}
