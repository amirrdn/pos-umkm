import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { resolveAnalyticsOutletId } from './scope.utils';

function mockReq(overrides: Partial<Request> & { outletId?: string | null; hasTenantWideOutletAccess?: boolean }): Request {
  return {
    query: {},
    ...overrides,
  } as Request;
}

describe('resolveAnalyticsOutletId', () => {
  it('returns null for tenant-wide ALL scope', () => {
    const req = mockReq({
      hasTenantWideOutletAccess: true,
      query: { outletId: 'ALL' },
      outletId: 'branch-1',
    });
    expect(resolveAnalyticsOutletId(req)).toBeNull();
  });

  it('prefers query outletId for tenant-wide roles', () => {
    const req = mockReq({
      hasTenantWideOutletAccess: true,
      query: { outletId: 'branch-2' },
      outletId: 'branch-1',
    });
    expect(resolveAnalyticsOutletId(req)).toBe('branch-2');
  });

  it('returns null for empty string outletId query (ALL)', () => {
    const req = mockReq({
      hasTenantWideOutletAccess: true,
      query: { outletId: '' },
    });
    expect(resolveAnalyticsOutletId(req)).toBeNull();
  });

  it('falls back to header outlet for scoped staff', () => {
    const req = mockReq({
      hasTenantWideOutletAccess: false,
      outletId: 'branch-kasir',
    });
    expect(resolveAnalyticsOutletId(req)).toBe('branch-kasir');
  });
});
