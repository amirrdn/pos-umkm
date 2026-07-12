import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  branchOutletId,
  mainOutletId,
  productId,
  tenantId,
  transferId,
  userId,
} from '../helpers/http';

const { mockTx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    stockTransfer: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    outletStock: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
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
      user: { findFirst: vi.fn() },
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    },
  };
});

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { approveTransfer, cancelTransfer } from '../../services/transferService';

const draftTransfer = {
  id: transferId,
  tenantId,
  status: 'DRAFT',
  fromOutletId: mainOutletId,
  toOutletId: branchOutletId,
  requestedById: userId,
  note: null,
  fromOutlet: { id: mainOutletId, name: 'Pusat', type: 'MAIN' },
  toOutlet: { id: branchOutletId, name: 'Cabang', type: 'BRANCH' },
  items: [
    {
      productId,
      quantity: 3,
      product: { id: productId, name: 'Produk A' },
    },
  ],
};

describe('approveTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.stockTransfer.findFirst.mockResolvedValue(draftTransfer);
    mockTx.outletStock.findUnique.mockResolvedValue({ stock: 10 });
    mockTx.outletStock.upsert.mockResolvedValue({});
    mockTx.outletStock.updateMany.mockResolvedValue({ count: 1 });
    mockTx.stockLedger.create.mockResolvedValue({});
    mockTx.stockTransfer.update.mockResolvedValue({ ...draftTransfer, status: 'IN_TRANSIT' });
  });

  it('deducts source stock and moves DRAFT to IN_TRANSIT', async () => {
    const result = await approveTransfer(tenantId, userId, transferId);

    expect(mockTx.outletStock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stock: expect.objectContaining({ gte: 3 }) }),
      })
    );
    expect(mockTx.stockTransfer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'IN_TRANSIT' }),
      })
    );
    expect(result.status).toBe('IN_TRANSIT');
  });

  it('rejects non-DRAFT transfer', async () => {
    mockTx.stockTransfer.findFirst.mockResolvedValue({ ...draftTransfer, status: 'IN_TRANSIT' });

    await expect(approveTransfer(tenantId, userId, transferId)).rejects.toThrow('DRAFT');
  });
});

describe('cancelTransfer — DRAFT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
      userRoles: [{ role: { name: 'Owner' } }],
    });
    mockTx.stockTransfer.findFirst.mockResolvedValue(draftTransfer);
    mockTx.stockTransfer.update.mockResolvedValue({ ...draftTransfer, status: 'CANCELLED' });
  });

  it('cancels DRAFT without stock mutation', async () => {
    const result = await cancelTransfer(tenantId, userId, transferId);

    expect(mockTx.outletStock.upsert).not.toHaveBeenCalled();
    expect(mockTx.stockTransfer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CANCELLED' },
      })
    );
    expect(result.status).toBe('CANCELLED');
  });
});

describe('cancelTransfer — IN_TRANSIT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findFirst.mockResolvedValue({
      id: userId,
      userRoles: [{ role: { name: 'Owner' } }],
    });
    mockTx.stockTransfer.findFirst.mockResolvedValue({
      ...draftTransfer,
      status: 'IN_TRANSIT',
    });
    mockTx.outletStock.findUnique.mockResolvedValue({ stock: 5 });
    mockTx.outletStock.upsert.mockResolvedValue({});
    mockTx.stockLedger.create.mockResolvedValue({});
    mockTx.stockTransfer.update.mockResolvedValue({ ...draftTransfer, status: 'CANCELLED' });
  });

  it('restores stock to source outlet when cancelling IN_TRANSIT', async () => {
    await cancelTransfer(tenantId, userId, transferId);

    expect(mockTx.outletStock.upsert).toHaveBeenCalled();
    expect(mockTx.stockLedger.create).toHaveBeenCalled();
  });
});
