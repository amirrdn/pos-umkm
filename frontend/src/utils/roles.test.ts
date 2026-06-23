import { describe, it, expect } from 'vitest';
import {
  isPlatformAdmin,
  canManageSubscription,
  getRoleDisplayLabel,
  isTenantOwner,
  hasTenantWideOutletAccess,
  hasAnyRole,
  PLATFORM_ADMIN_ROLE,
  PLATFORM_ADMIN_ROLE_LABEL,
  TENANT_OWNER_ROLE,
} from './roles';

describe('roles utility helpers', () => {
  describe('isPlatformAdmin', () => {
    it('returns true if roles contains Admin', () => {
      expect(isPlatformAdmin([PLATFORM_ADMIN_ROLE])).toBe(true);
      expect(isPlatformAdmin(['Manager', PLATFORM_ADMIN_ROLE])).toBe(true);
    });

    it('returns false if roles does not contain Admin', () => {
      expect(isPlatformAdmin(['Manager', 'Kasir'])).toBe(false);
      expect(isPlatformAdmin([])).toBe(false);
    });
  });

  describe('isTenantOwner', () => {
    it('returns true if roles contains Owner', () => {
      expect(isTenantOwner([TENANT_OWNER_ROLE])).toBe(true);
    });

    it('returns false if roles does not contain Owner', () => {
      expect(isTenantOwner(['Manager'])).toBe(false);
    });
  });

  describe('canManageSubscription', () => {
    it('returns true if roles contains Admin or Owner', () => {
      expect(canManageSubscription([PLATFORM_ADMIN_ROLE])).toBe(true);
      expect(canManageSubscription([TENANT_OWNER_ROLE])).toBe(true);
    });

    it('returns false if roles does not contain Admin or Owner', () => {
      expect(canManageSubscription(['Manager', 'Kasir'])).toBe(false);
    });
  });

  describe('getRoleDisplayLabel', () => {
    it('returns Admin Platform label for Admin role', () => {
      expect(getRoleDisplayLabel(PLATFORM_ADMIN_ROLE)).toBe(PLATFORM_ADMIN_ROLE_LABEL);
    });

    it('returns original role name for other roles', () => {
      expect(getRoleDisplayLabel('Manager')).toBe('Manager');
      expect(getRoleDisplayLabel('Kasir')).toBe('Kasir');
    });
  });

  describe('hasTenantWideOutletAccess', () => {
    it('returns true if user has Owner, Manager, or Admin roles', () => {
      expect(hasTenantWideOutletAccess([TENANT_OWNER_ROLE])).toBe(true);
      expect(hasTenantWideOutletAccess(['Manager'])).toBe(true);
      expect(hasTenantWideOutletAccess([PLATFORM_ADMIN_ROLE])).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(hasTenantWideOutletAccess(['Kasir'])).toBe(false);
      expect(hasTenantWideOutletAccess(['Staf Gudang'])).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('returns true if there is intersection between roles and allowed list', () => {
      expect(hasAnyRole(['Manager', 'Kasir'], ['Kasir', 'Staf Gudang'])).toBe(true);
    });

    it('returns false if there is no intersection', () => {
      expect(hasAnyRole(['Manager'], ['Kasir'])).toBe(false);
    });
  });
});
