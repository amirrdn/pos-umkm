import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesReturnService } from '../../services/salesReturnService';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    transaction: {
      findFirst: vi.fn(),
    },
    salesReturn: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    outletStock: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    stockLedger: {
      create: vi.fn(),
    },
  },
}));

describe('SalesReturnService', () => {
  let service: SalesReturnService;
  const mockTenantId = 'tenant-303';
  const mockUserId = 'user-303';

  beforeEach(() => {
    service = new SalesReturnService();
    vi.clearAllMocks();
  });

  it('should throw an error when returning items from non-existent transaction', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(
      service.createSalesReturn(mockTenantId, mockUserId, {
        transactionId: 'invalid-tx',
        reason: 'Barang Rusak',
        items: [{ productId: 'prod-1', quantity: 1, refundPrice: 10000 }],
      })
    ).rejects.toThrow('Transaksi asal tidak ditemukan.');
  });

  it('should throw an error if return quantity exceeds purchased quantity', async () => {
    const mockTransaction = {
      id: 'tx-1',
      tenantId: mockTenantId,
      status: 'COMPLETED',
      outletId: 'outlet-1',
      items: [{ productId: 'prod-1', quantity: 2 }],
      salesReturns: [],
    };
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(mockTransaction as never);

    await expect(
      service.createSalesReturn(mockTenantId, mockUserId, {
        transactionId: 'tx-1',
        reason: 'Cacat produksi',
        items: [{ productId: 'prod-1', quantity: 5, refundPrice: 10000 }],
      })
    ).rejects.toThrow(/melebihi sisa barang yang dapat dikembalikan/);
  });
});
