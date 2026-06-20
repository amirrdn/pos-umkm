import { describe, expect, it } from 'vitest';
import {
  canManageSubscription,
  hasTenantWideOutletAccess,
  isPlatformAdmin,
  isTenantOwner,
  resolveAuthRoles,
} from './roles';

describe('roles', () => {
  it('isPlatformAdmin detects Admin role', () => {
    expect(isPlatformAdmin(['Kasir', 'Admin'])).toBe(true);
    expect(isPlatformAdmin(['Owner'])).toBe(false);
  });

  it('resolveAuthRoles ignores tenant-scoped Admin role', () => {
    const roles = resolveAuthRoles([
      { role: { name: 'Owner', tenantId: 'tenant-1' } },
      { role: { name: 'Admin', tenantId: 'tenant-1' } },
    ]);
    expect(roles).toEqual(['Owner']);
  });

  it('resolveAuthRoles keeps global platform Admin role', () => {
    const roles = resolveAuthRoles([
      { role: { name: 'Kasir', tenantId: 'tenant-1' } },
      { role: { name: 'Admin', tenantId: null } },
    ]);
    expect(roles).toEqual(['Kasir', 'Admin']);
  });

  it('canManageSubscription includes Owner and Admin', () => {
    expect(canManageSubscription(['Owner'])).toBe(true);
    expect(canManageSubscription(['Admin'])).toBe(true);
    expect(canManageSubscription(['Manager'])).toBe(false);
  });

  it('isTenantOwner detects Owner role', () => {
    expect(isTenantOwner(['Owner'])).toBe(true);
    expect(isTenantOwner(['Manager'])).toBe(false);
  });

  it('hasTenantWideOutletAccess includes Owner Manager Admin', () => {
    expect(hasTenantWideOutletAccess(['Owner'])).toBe(true);
    expect(hasTenantWideOutletAccess(['Manager'])).toBe(true);
    expect(hasTenantWideOutletAccess(['Admin'])).toBe(true);
    expect(hasTenantWideOutletAccess(['Kasir'])).toBe(false);
  });
});
