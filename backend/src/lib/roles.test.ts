import { describe, expect, it } from 'vitest';
import {
  hasTenantWideOutletAccess,
  isPlatformAdmin,
  isTenantOwner,
} from './roles';

describe('roles', () => {
  it('isPlatformAdmin detects Admin role', () => {
    expect(isPlatformAdmin(['Kasir', 'Admin'])).toBe(true);
    expect(isPlatformAdmin(['Owner'])).toBe(false);
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
