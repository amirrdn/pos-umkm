import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  branchOutletId,
  mainOutletId,
  productId,
  tenantId,
  userId,
} from '../test/helpers/http';

const { mockTx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    tenant: { findUnique: vi.fn() },
    outlet: { findFirst: vi.fn() },
    product: { findMany: vi.fn() },
    outletStock: { findUnique: vi.fn(), upsert: vi.fn() },
    stockLedger: { create: vi.fn() },
    stockTransfer: { create: vi.fn() },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    },
  };
});

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { createTransfer } from './transferService';

describe('createTransfer — outlet guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockTx.tenant.findUnique.mockResolvedValue({ requireStockApproval: true });
    mockTx.outlet.findFirst.mockImplementation(
      async ({ where }: { where: { id: string; isActive?: boolean } }) => {
        const outlets: Record<
          string,
          { id: string; name: string; type: string; isActive: boolean }
        > = {
          [mainOutletId]: { id: mainOutletId, name: 'Pusat', type: 'MAIN', isActive: true },
          [branchOutletId]: {
            id: branchOutletId,
            name: 'Cabang',
            type: 'BRANCH',
            isActive: true,
          },
        };
        const outlet = outlets[where.id];
        if (!outlet) return null;
        if (where.isActive === true && !outlet.isActive) return null;
        return outlet;
      }
    );
    mockTx.product.findMany.mockResolvedValue([{ id: productId, name: 'Produk A' }]);
    mockTx.stockTransfer.create.mockResolvedValue({ id: 'transfer-1', status: 'DRAFT' });
  });

  it('rejects transfer when source outlet is inactive', async () => {
    mockTx.outlet.findFirst.mockImplementation(
      async ({ where }: { where: { id: string; isActive?: boolean } }) => {
        const outlets: Record<
          string,
          { id: string; name: string; type: string; isActive: boolean }
        > = {
          [mainOutletId]: { id: mainOutletId, name: 'Pusat', type: 'MAIN', isActive: false },
          [branchOutletId]: {
            id: branchOutletId,
            name: 'Cabang',
            type: 'BRANCH',
            isActive: true,
          },
        };
        const outlet = outlets[where.id];
        if (!outlet) return null;
        if (where.isActive === true && !outlet.isActive) return null;
        return outlet;
      }
    );

    await expect(
      createTransfer(tenantId, userId, {
        fromOutletId: mainOutletId,
        toOutletId: branchOutletId,
        items: [{ productId, quantity: 1 }],
      })
    ).rejects.toThrow('Outlet asal atau tujuan tidak ditemukan atau tidak aktif.');

    expect(mockTx.stockTransfer.create).not.toHaveBeenCalled();
  });

  it('rejects MAIN to MAIN transfer (INV transfer rule)', async () => {
    await expect(
      createTransfer(tenantId, userId, {
        fromOutletId: mainOutletId,
        toOutletId: mainOutletId,
        items: [{ productId, quantity: 1 }],
      })
    ).rejects.toThrow('Outlet Utama ke Outlet Utama');

    expect(mockTx.stockTransfer.create).not.toHaveBeenCalled();
  });
});
