/** Pemilik aplikasi SaaS UMKM — akses lintas tenant & fitur platform */
export const PLATFORM_ADMIN_ROLE = 'Admin';
export const PLATFORM_ADMIN_ROLE_LABEL = 'Admin Platform';

/** Pemilik toko (tenant) */
export const TENANT_OWNER_ROLE = 'Owner';

/** Peran lainnya di toko */
export const ROLE_MANAGER = 'Manager';
export const ROLE_CASHIER = 'Kasir';
export const ROLE_INVENTORY = 'Staf Gudang';

/** Peran yang boleh memilih outlet mana saja / agregat semua outlet dalam tenant */
export const TENANT_WIDE_OUTLET_ROLES = [TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE] as const;

export function isPlatformAdmin(roles: string[]): boolean {
  return roles.includes(PLATFORM_ADMIN_ROLE);
}

/** Owner tenant atau Admin platform — boleh mengelola billing/langganan */
export function canManageSubscription(roles: string[]): boolean {
  return isTenantOwner(roles) || isPlatformAdmin(roles);
}

export function getRoleDisplayLabel(role: string): string {
  return role === PLATFORM_ADMIN_ROLE ? PLATFORM_ADMIN_ROLE_LABEL : role;
}

export function isTenantOwner(roles: string[]): boolean {
  return roles.includes(TENANT_OWNER_ROLE);
}

export function hasTenantWideOutletAccess(roles: string[]): boolean {
  return roles.some((role) => (TENANT_WIDE_OUTLET_ROLES as readonly string[]).includes(role));
}

export function hasAnyRole(roles: string[], allowed: string[]): boolean {
  return roles.some((role) => allowed.includes(role));
}
