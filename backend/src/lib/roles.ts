/** Pemilik aplikasi SaaS UMKM — akses lintas tenant & fitur platform */
export const PLATFORM_ADMIN_ROLE = 'Admin';
export const PLATFORM_ADMIN_ROLE_LABEL = 'Admin Platform';

/** Pemilik toko (tenant) */
export const TENANT_OWNER_ROLE = 'Owner';

/** Peran yang boleh memilih outlet mana saja / agregat semua outlet dalam tenant */
export const TENANT_WIDE_OUTLET_ROLES = [TENANT_OWNER_ROLE, 'Manager', PLATFORM_ADMIN_ROLE] as const;

export interface AuthRoleAssignment {
  role: {
    name: string;
    tenantId: string | null;
  };
}

/**
 * Hanya menyertakan role Admin jika berasal dari role global platform (tenantId = null).
 * Mencegah tenant membuat role lokal bernama "Admin" untuk mem-bypass langganan.
 */
export function resolveAuthRoles(userRoles: AuthRoleAssignment[]): string[] {
  return userRoles
    .filter(
      (assignment) =>
        assignment.role.name !== PLATFORM_ADMIN_ROLE || assignment.role.tenantId === null
    )
    .map((assignment) => assignment.role.name);
}

export function isPlatformAdmin(roles: string[]): boolean {
  return roles.includes(PLATFORM_ADMIN_ROLE);
}

/** Owner tenant atau Admin platform — boleh mengelola billing/langganan */
export function canManageSubscription(roles: string[]): boolean {
  return isTenantOwner(roles) || isPlatformAdmin(roles);
}

export function isTenantOwner(roles: string[]): boolean {
  return roles.includes(TENANT_OWNER_ROLE);
}

export function hasTenantWideOutletAccess(roles: string[]): boolean {
  return roles.some((role) => (TENANT_WIDE_OUTLET_ROLES as readonly string[]).includes(role));
}
