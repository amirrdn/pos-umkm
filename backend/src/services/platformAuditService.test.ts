import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockDeleteMany,
  mockCreateSession,
  mockCreateAudit,
  mockFindFirstSession,
  mockFindFirstTenant,
  mockTransaction,
  mockAuditFindMany,
  mockAuditCount,
} = vi.hoisted(() => ({
  mockDeleteMany: vi.fn(),
  mockCreateSession: vi.fn(),
  mockCreateAudit: vi.fn(),
  mockFindFirstSession: vi.fn(),
  mockFindFirstTenant: vi.fn(),
  mockTransaction: vi.fn(),
  mockAuditFindMany: vi.fn(),
  mockAuditCount: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    platformAdminSession: {
      deleteMany: mockDeleteMany,
      create: mockCreateSession,
      findFirst: mockFindFirstSession,
    },
    platformAuditLog: {
      create: mockCreateAudit,
      findMany: mockAuditFindMany,
      count: mockAuditCount,
    },
    tenant: {
      findFirst: mockFindFirstTenant,
    },
    $transaction: mockTransaction,
  },
}));

import {
  getActiveTenantInspection,
  listPlatformAuditLogs,
  recordPlatformAudit,
  startTenantInspection,
  stopTenantInspection,
} from './platformAuditService';

describe('platformAuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      platformAdminSession: {
        deleteMany: mockDeleteMany,
        create: mockCreateSession,
      },
      platformAuditLog: {
        create: mockCreateAudit,
      },
    }));
    mockCreateAudit.mockResolvedValue({});
    mockDeleteMany.mockResolvedValue({ count: 1 });
  });

  it('records platform audit entries', async () => {
    await recordPlatformAudit({
      actorUserId: 'admin-1',
      tenantId: 'tenant-1',
      action: 'TENANT_SUSPEND',
      metadata: { status: 'SUSPENDED' },
    });

    expect(mockCreateAudit).toHaveBeenCalledWith({
      data: {
        actorUserId: 'admin-1',
        tenantId: 'tenant-1',
        action: 'TENANT_SUSPEND',
        metadata: { status: 'SUSPENDED' },
      },
    });
  });

  it('starts tenant inspection session and writes IMPERSONATE_START audit', async () => {
    mockFindFirstTenant.mockResolvedValue({ id: 'tenant-1', name: 'Toko A' });
    mockCreateSession.mockResolvedValue({
      switchedAt: new Date('2026-06-23T10:00:00.000Z'),
    });

    const result = await startTenantInspection({
      actorUserId: 'admin-1',
      tenantId: 'tenant-1',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });

    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { platformUserId: 'admin-1' } });
    expect(mockCreateSession).toHaveBeenCalled();
    expect(mockCreateAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        tenantId: 'tenant-1',
        action: 'IMPERSONATE_START',
      }),
    });
    expect(result).toEqual({
      tenantId: 'tenant-1',
      tenantName: 'Toko A',
      switchedAt: '2026-06-23T10:00:00.000Z',
    });
  });

  it('stops tenant inspection session and writes IMPERSONATE_END audit', async () => {
    mockFindFirstSession.mockResolvedValue({
      activeTenantId: 'tenant-1',
      activeTenant: { id: 'tenant-1', name: 'Toko A' },
    });

    const result = await stopTenantInspection('admin-1');

    expect(result).toEqual({ stopped: true });
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { platformUserId: 'admin-1' } });
    expect(mockCreateAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        tenantId: 'tenant-1',
        action: 'IMPERSONATE_END',
      }),
    });
  });

  it('returns active tenant inspection context', async () => {
    mockFindFirstSession.mockResolvedValue({
      switchedAt: new Date('2026-06-23T10:00:00.000Z'),
      activeTenant: { id: 'tenant-1', name: 'Toko A' },
    });

    const result = await getActiveTenantInspection('admin-1');

    expect(result).toEqual({
      tenantId: 'tenant-1',
      tenantName: 'Toko A',
      switchedAt: '2026-06-23T10:00:00.000Z',
    });
  });

  it('lists audit logs with pagination metadata', async () => {
    mockAuditFindMany.mockResolvedValue([{ id: 'log-1', action: 'TENANT_CREATE' }]);
    mockAuditCount.mockResolvedValue(1);

    const result = await listPlatformAuditLogs({ page: 1, limit: 25 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.totalPages).toBe(1);
  });
});
