/** Pemilik aplikasi SaaS UMKM — akses lintas tenant & fitur platform */
export const PLATFORM_ADMIN_ROLE = 'Admin';

/** Pemilik toko (tenant) */
export const TENANT_OWNER_ROLE = 'Owner';

/** Peran yang boleh memilih outlet mana saja / agregat semua outlet dalam tenant */
export const TENANT_WIDE_OUTLET_ROLES = [TENANT_OWNER_ROLE, 'Manager', PLATFORM_ADMIN_ROLE] as const;

export function isPlatformAdmin(roles: string[]): boolean {
  return roles.includes(PLATFORM_ADMIN_ROLE);
}

export function isTenantOwner(roles: string[]): boolean {
  return roles.includes(TENANT_OWNER_ROLE);
}

export function hasTenantWideOutletAccess(roles: string[]): boolean {
  return roles.some((role) => (TENANT_WIDE_OUTLET_ROLES as readonly string[]).includes(role));
}
