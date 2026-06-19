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
    product: {
      findMany: vi.fn(),
    },
    outletStock: {
      createMany: vi.fn(),
    },
    shift: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../domain/outlet/outlet.repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/outlet/outlet.repository')>();
  return {
    ...actual,
    findMainOutletByTenant: (...args: unknown[]) => mockFindMainOutletByTenant(...args),
  };
});

import { OutletService } from './outletService';

describe('OutletService — invariant guards', () => {
  const service = new OutletService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createBranch throws if tenant has no MAIN (INV-1)', async () => {
    mockFindMainOutletByTenant.mockResolvedValue(null);

    await expect(
      service.createBranch('tenant-a', { name: 'Cabang Baru' })
    ).rejects.toThrow('Outlet utama (pusat) tidak ditemukan');

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('deleteOutlet rejects MAIN outlet (INV-5)', async () => {
    mockPrisma.outlet.findFirst.mockResolvedValue({
      id: 'main-id',
      type: OutletType.MAIN,
    });

    await expect(service.deleteOutlet('tenant-a', 'main-id')).rejects.toThrow(
      'Outlet utama (pusat) tidak dapat dihapus'
    );

    expect(mockPrisma.outlet.update).not.toHaveBeenCalled();
  });

  it('updateOutlet rejects deactivating MAIN outlet', async () => {
    mockPrisma.outlet.findFirst.mockResolvedValue({
      id: 'main-id',
      tenantId: 'tenant-a',
      type: OutletType.MAIN,
      name: 'Pusat',
      code: 'MAIN',
      address: null,
      phone: null,
      isActive: true,
    });

    await expect(
      service.updateOutlet('tenant-a', 'main-id', { isActive: false })
    ).rejects.toThrow('Outlet utama (pusat) tidak dapat dinonaktifkan');
  });

  it('updateOutlet rejects deactivate when branch has OPEN shift', async () => {
    mockPrisma.outlet.findFirst.mockResolvedValue({
      id: 'branch-id',
      tenantId: 'tenant-a',
      type: OutletType.BRANCH,
      name: 'Cabang',
      code: 'CBG-01',
      address: null,
      phone: null,
      isActive: true,
    });
    mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift-open' });

    await expect(
      service.updateOutlet('tenant-a', 'branch-id', { isActive: false })
    ).rejects.toThrow('shift kasir yang aktif');

    expect(mockPrisma.outlet.update).not.toHaveBeenCalled();
  });
});
