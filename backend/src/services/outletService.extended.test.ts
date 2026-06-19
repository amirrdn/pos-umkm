import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OutletType } from '@prisma/client';

const { mockFindMainOutletByTenant, mockPrisma } = vi.hoisted(() => ({
  mockFindMainOutletByTenant: vi.fn(),
  mockPrisma: {
    outlet: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    product: { findMany: vi.fn() },
    outletStock: { createMany: vi.fn() },
    shift: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('../domain/outlet/outlet.repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/outlet/outlet.repository')>();
  return {
    ...actual,
    findMainOutletByTenant: (...args: unknown[]) => mockFindMainOutletByTenant(...args),
    fetchOutletStats: vi.fn().mockResolvedValue({
      staffByOutlet: new Map(),
      stockSkuByOutlet: new Map(),
    }),
  };
});

import { OutletService } from './outletService';

describe('OutletService — extended coverage', () => {
  const service = new OutletService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllOutlets filters operationalOnly', async () => {
    mockPrisma.outlet.findMany.mockResolvedValue([{ id: 'o1', isActive: true }]);

    const result = await service.getAllOutlets('tenant-a', true);

    expect(mockPrisma.outlet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
    expect(result).toHaveLength(1);
  });

  it('createBranch creates outlet and seeds outlet stock', async () => {
    mockFindMainOutletByTenant.mockResolvedValue({ id: 'main-1' });
    mockPrisma.outlet.count.mockResolvedValue(1);
    mockPrisma.$transaction.mockImplementation(async (cb) =>
      cb({
        outlet: {
          create: vi.fn().mockResolvedValue({ id: 'branch-1', name: 'Cabang Baru' }),
        },
        product: {
          findMany: vi.fn().mockResolvedValue([{ id: 'p1' }]),
        },
        outletStock: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      })
    );

    const result = await service.createBranch('tenant-a', { name: 'Cabang Baru' });

    expect(result).toMatchObject({ id: 'branch-1' });
  });

  it('updateOutlet applies isActive for branch', async () => {
    mockPrisma.outlet.findFirst.mockResolvedValue({
      id: 'branch-1',
      tenantId: 'tenant-a',
      type: OutletType.BRANCH,
      name: 'Cabang',
      code: 'CBG-01',
      address: null,
      phone: null,
      isActive: true,
    });
    mockPrisma.shift.findFirst.mockResolvedValue(null);
    mockPrisma.outlet.update.mockResolvedValue({ id: 'branch-1', isActive: false });

    const result = await service.updateOutlet('tenant-a', 'branch-1', { isActive: false });

    expect(mockPrisma.outlet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    );
    expect(result.isActive).toBe(false);
  });
});
