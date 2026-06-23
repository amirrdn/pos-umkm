import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tenantMiddleware } from './tenantMiddleware';

const { mockFindUnique, mockFindFirst, mockExecuteRawWithTenant } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockExecuteRawWithTenant: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    tenant: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    outlet: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    $executeRawWithTenant: (...args: unknown[]) => mockExecuteRawWithTenant(...args),
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $executeRawUnsafe: vi.fn().mockResolvedValue(1),
      };
      return callback(tx);
    }),
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
    once(event: string, handler: () => void) {
      if (event === 'finish' || event === 'close') {
        queueMicrotask(handler);
      }
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
    mockExecuteRawWithTenant.mockImplementation(
      async (_tenantId: string, callback: (tx: { outlet: { findFirst: typeof mockFindFirst } }) => unknown) =>
        callback({ outlet: { findFirst: mockFindFirst } })
    );
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

  it('blocks POST when outlet header does not resolve to an active tenant outlet', async () => {
    mockFindUnique.mockResolvedValue(activeTenant);
    mockFindFirst.mockResolvedValue(null);

    const req = {
      method: 'POST',
      header: vi.fn().mockReturnValue(undefined),
      user: { tenantId: 'tenant-123' },
      isPlatformAdmin: false,
      outletId: 'outlet-missing',
      originalUrl: '/api/transactions/checkout',
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(mockExecuteRawWithTenant).toHaveBeenCalledWith('tenant-123', expect.any(Function));
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Outlet tidak aktif atau tidak tersedia'),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows POST when outlet header resolves inside a dedicated tenant session', async () => {
    mockFindUnique.mockResolvedValue(activeTenant);
    mockFindFirst.mockResolvedValue({ id: 'outlet-1' });

    const req = {
      method: 'POST',
      header: vi.fn().mockReturnValue(undefined),
      user: { tenantId: 'tenant-123' },
      isPlatformAdmin: false,
      outletId: 'outlet-1',
      originalUrl: '/api/transactions/checkout',
    } as any;
    const res = mockRes();
    const next = vi.fn();

    await tenantMiddleware(req, res, next);

    expect(mockExecuteRawWithTenant).toHaveBeenCalledWith('tenant-123', expect.any(Function));
    expect(next).toHaveBeenCalledOnce();
  });
});
