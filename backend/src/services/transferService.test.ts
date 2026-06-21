import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  branchOutletId,
  mainOutletId,
  productId,
  tenantId,
  transferId,
  userId,
} from '../test/helpers/http';

const { mockTx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    stockTransfer: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    outletStock: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    stockLedger: {
      create: vi.fn(),
    },
    userOutlet: {
      findFirst: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      user: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    },
  };
});

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { completeTransfer } from './transferService';

describe('completeTransfer — transfer integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
      userRoles: [{ role: { name: 'Owner' } }],
    });

    mockTx.stockTransfer.findFirst.mockResolvedValue({
      id: transferId,
      tenantId,
      status: 'IN_TRANSIT',
      fromOutletId: mainOutletId,
      toOutletId: branchOutletId,
      note: null,
      fromOutlet: { id: mainOutletId, name: 'Pusat', type: 'MAIN' },
      toOutlet: { id: branchOutletId, name: 'Cabang', type: 'BRANCH' },
      items: [
        {
          productId,
          quantity: 5,
          product: { id: productId, name: 'Produk A' },
        },
      ],
    });

    mockTx.outletStock.findUnique.mockResolvedValue({ stock: 10 });
    mockTx.outletStock.upsert.mockResolvedValue({ stock: 15 });
    mockTx.stockLedger.create.mockResolvedValue({});
    mockTx.stockTransfer.update.mockResolvedValue({
      id: transferId,
      status: 'COMPLETED',
    });
  });

  it('updates destination stock and marks transfer COMPLETED atomically in one transaction', async () => {
    const result = await completeTransfer(tenantId, userId, transferId);

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockTx.outletStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          outletId_productId: { outletId: branchOutletId, productId },
        },
        update: { stock: { increment: 5 } },
        create: expect.objectContaining({ stock: 5 }),
      })
    );
    expect(mockTx.stockLedger.create).toHaveBeenCalledOnce();
    expect(mockTx.stockTransfer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: transferId },
        data: { status: 'COMPLETED', completedAt: expect.any(Date) },
      })
    );
    expect(result).toMatchObject({ status: 'COMPLETED' });
  });
});
