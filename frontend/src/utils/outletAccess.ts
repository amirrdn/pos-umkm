import type { AuthOutlet, AuthUser } from '../store/useAuthStore';
import type { Outlet } from '../store/useOutletStore';
import { hasTenantWideOutletAccess } from './roles';

/** Gabungkan ID outlet dari login payload — hindari stale `outlets` tanpa `outletIds`. */
export function getAssignedOutletIds(user: Pick<AuthUser, 'outletIds' | 'outlets'>): Set<string> {
  const ids = new Set<string>();
  for (const id of user.outletIds ?? []) ids.add(id);
  for (const outlet of user.outlets ?? []) ids.add(outlet.id);
  return ids;
}

function authOutletToStoreOutlet(outlet: AuthOutlet, tenantId: string): Outlet {
  return {
    id: outlet.id,
    tenantId,
    name: outlet.name,
    type: outlet.type ?? 'BRANCH',
    parentOutletId: null,
    code: outlet.code ?? null,
    address: null,
    phone: null,
    isActive: outlet.isActive ?? true,
    createdAt: '',
    updatedAt: '',
  };
}

/** Outlet yang boleh diakses staf terbatas; owner/manager/admin dapat semua outlet aktif tenant. */
export function resolveAccessibleOutlets(
  tenantOutlets: Outlet[],
  user: AuthUser | null
): Outlet[] {
  if (!user) return [];

  const activeTenantOutlets = tenantOutlets.filter((o) => o.isActive !== false);
  if (hasTenantWideOutletAccess(user.roles)) return activeTenantOutlets;

  const assignedIds = getAssignedOutletIds(user);
  if (assignedIds.size === 0) return [];

  const tenantById = new Map(activeTenantOutlets.map((o) => [o.id, o]));
  const resolved: Outlet[] = [];
  const seen = new Set<string>();

  for (const id of assignedIds) {
    const fromTenant = tenantById.get(id);
    if (fromTenant) {
      resolved.push(fromTenant);
      seen.add(id);
      continue;
    }

    const fromAuth = user.outlets?.find((o) => o.id === id);
    if (fromAuth && fromAuth.isActive !== false && !seen.has(id)) {
      resolved.push(authOutletToStoreOutlet(fromAuth, user.tenantId));
      seen.add(id);
    }
  }

  return resolved;
}

export function isOutletAssignedToUser(
  user: Pick<AuthUser, 'outletIds' | 'outlets'> | null | undefined,
  outletId: string
): boolean {
  if (!user) return false;
  return getAssignedOutletIds(user).has(outletId);
}
