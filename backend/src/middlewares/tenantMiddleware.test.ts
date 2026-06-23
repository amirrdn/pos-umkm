import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tenantMiddleware } from './tenantMiddleware';

const { mockFindUnique, mockFindFirst } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    tenant: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    outlet: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
  },
}));

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as any;
}

const activeTenant = {
  id: 'tenant-123',
  name: 'Toko',
  status: 'ACTIVE',
  deletedAt: null,
  subscriptionTier: 'FREE',
  subscriptionStatus: 'ACTIVE',
  subscriptionExpiresAt: null,
  lastBillingAt: null,
  requireStockApproval: false,
};

describe('tenantMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when no tenant header and no req.user context', async () => {
    const req = {
      header: vi.fn().mockReturnValue(undefined),
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Header tenant (x-tenant-id) atau konteks tenant tidak ditemukan'),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('uses req.user.tenantId when no header is supplied', async () => {
    mockFindUnique.mockResolvedValue(activeTenant);

    const req = {
      header: vi.fn().mockReturnValue(undefined),
      user: { tenantId: 'tenant-123' },
      isPlatformAdmin: false,
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(req.tenantId).toBe('tenant-123');
    expect(req.tenant).toEqual(activeTenant);
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks request with 403 when header tenant does not match req.user.tenantId (tampering attempt)', async () => {
    const req = {
      header: vi.fn().mockImplementation((name: string) => {
        if (name.toLowerCase() === 'x-tenant-id') return 'tenant-target-456';
        return undefined;
      }),
      user: { tenantId: 'tenant-attacker-123' },
      isPlatformAdmin: false,
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Anda tidak memiliki wewenang untuk mengakses lingkungan tenant ini'),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows Platform Admin to impersonate/access a different tenant ID via header', async () => {
    mockFindUnique.mockResolvedValue({
      ...activeTenant,
      id: 'tenant-target-456',
    });

    const req = {
      header: vi.fn().mockImplementation((name: string) => {
        if (name.toLowerCase() === 'x-tenant-id') return 'tenant-target-456';
        return undefined;
      }),
      user: { tenantId: null },
      isPlatformAdmin: true,
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(req.tenantId).toBe('tenant-target-456');
    expect(next).toHaveBeenCalledOnce();
  });

  it('allows Platform Admin to inspect a suspended/inactive tenant', async () => {
    mockFindUnique.mockResolvedValue({
      ...activeTenant,
      id: 'tenant-suspended-789',
      status: 'SUSPENDED',
    });

    const req = {
      header: vi.fn().mockImplementation((name: string) => {
        if (name.toLowerCase() === 'x-tenant-id') return 'tenant-suspended-789';
        return undefined;
      }),
      user: { tenantId: null },
      isPlatformAdmin: true,
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(req.tenantId).toBe('tenant-suspended-789');
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks non-admin users from accessing suspended/inactive tenants', async () => {
    mockFindUnique.mockResolvedValue({
      ...activeTenant,
      id: 'tenant-suspended-789',
      status: 'SUSPENDED',
    });

    const req = {
      header: vi.fn().mockReturnValue(undefined),
      user: { tenantId: 'tenant-suspended-789' },
      isPlatformAdmin: false,
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Tenant ditangguhkan atau tidak lagi aktif'),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when tenant is not found or has been soft-deleted', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = {
      header: vi.fn().mockReturnValue(undefined),
      user: { tenantId: 'tenant-nonexistent' },
      isPlatformAdmin: false,
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Tenant tidak terdaftar'),
    });
    expect(next).not.toHaveBeenCalled();
  });
});
