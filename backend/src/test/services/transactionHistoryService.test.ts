import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getTransactionHistory } from '../../services/transactionHistoryService';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

describe('transactionHistoryService - Query Parameters & Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query transaction history with default tenantId and outletId', async () => {
    (prisma.transaction.findMany as any).mockResolvedValue([
      { id: 'tx-1', invoiceNumber: 'INV-001', grandTotal: 50000, status: 'COMPLETED' },
    ]);

    const result = await getTransactionHistory({
      tenantId: 'tenant-123',
      outletId: 'outlet-456',
    });

    expect(result).toHaveLength(1);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-123',
          outletId: 'outlet-456',
        },
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('should apply search filter for invoice number and customer details', async () => {
    (prisma.transaction.findMany as any).mockResolvedValue([]);

    await getTransactionHistory({
      tenantId: 'tenant-123',
      search: 'INV-2026',
    });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
          OR: [
            { invoiceNumber: { contains: 'INV-2026', mode: 'insensitive' } },
            { customer: { name: { contains: 'INV-2026', mode: 'insensitive' } } },
            { customer: { phone: { contains: 'INV-2026', mode: 'insensitive' } } },
          ],
        }),
      })
    );
  });

  it('should filter by status and paymentMethod', async () => {
    (prisma.transaction.findMany as any).mockResolvedValue([]);

    await getTransactionHistory({
      tenantId: 'tenant-123',
      status: 'COMPLETED',
      paymentMethod: 'QRIS',
    });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
          status: 'COMPLETED',
          payments: {
            some: {
              paymentMethod: 'QRIS',
            },
          },
        }),
      })
    );
  });
});
