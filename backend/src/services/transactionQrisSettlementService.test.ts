import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isQrisFailureStatus } from './transactionQrisSettlementService';

describe('transactionQrisSettlementService helpers', () => {
  it('identifies QRIS failure statuses', () => {
    expect(isQrisFailureStatus('expire')).toBe(true);
    expect(isQrisFailureStatus('cancel')).toBe(true);
    expect(isQrisFailureStatus('deny')).toBe(true);
    expect(isQrisFailureStatus('settlement')).toBe(false);
    expect(isQrisFailureStatus('pending')).toBe(false);
  });
});

const { mockPrisma, mockBuildQrisSaleLedgerEntries, mockMidtransService } = vi.hoisted(() => {
  const tx = {
    transaction: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    stockLedger: {
      createMany: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
      transaction: {
        findFirst: vi.fn(),
      },
    },
    mockBuildQrisSaleLedgerEntries: vi.fn(),
    mockMidtransService: {
      getTransactionStatus: vi.fn(),
    },
  };
});

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../domain/inventory', () => ({
  buildQrisSaleLedgerEntries: mockBuildQrisSaleLedgerEntries,
}));

vi.mock('./midtransService', () => ({
  MidtransService: mockMidtransService,
}));

import {
  completeQrisSettlement,
  syncPendingQrisFromMidtrans,
  voidQrisTransaction,
} from './transactionQrisSettlementService';

describe('completeQrisSettlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildQrisSaleLedgerEntries.mockResolvedValue([]);
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockPrisma.$transaction.mock.calls.length ? {
      transaction: { update: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: 'txn-1', items: [] }) },
      stockLedger: { createMany: vi.fn() },
    } : undefined));
  });

  it('updates transaction to COMPLETED inside prisma transaction', async () => {
    const innerTx = {
      transaction: {
        update: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({
          id: 'txn-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          outletId: 'outlet-1',
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      },
      stockLedger: { createMany: vi.fn() },
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ count: 1 }]),
      $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => callback(innerTx));

    await completeQrisSettlement({
      transactionId: 'txn-1',
      ledgerNote: 'Penjualan QRIS',
    });

    expect(innerTx.transaction.update).toHaveBeenCalledWith({
      where: { id: 'txn-1' },
      data: { status: 'COMPLETED' },
    });
  });
});

describe('voidQrisTransaction', () => {
  it('updates transaction to VOID', async () => {
    const innerTx = {
      transaction: { 
        update: vi.fn().mockResolvedValue({
          id: 'txn-void',
          outletId: 'outlet-1',
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      },
      stockLedger: { create: vi.fn(), createMany: vi.fn() },
      outletStock: { upsert: vi.fn().mockResolvedValue({ stock: 2 }), findUnique: vi.fn().mockResolvedValue({ stock: 2 }) },
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ productId: 'prod-1', stockAfter: 1, quantity: 1 }]),
      $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    };
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(innerTx));

    await voidQrisTransaction('txn-void');

    expect(innerTx.transaction.update).toHaveBeenCalledWith({
      where: { id: 'txn-void' },
      data: { status: 'VOID' },
      include: { items: true },
    });
  });
});

describe('syncPendingQrisFromMidtrans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildQrisSaleLedgerEntries.mockResolvedValue([]);
  });

  it('returns COMPLETED when Midtrans reports settlement', async () => {
    mockMidtransService.getTransactionStatus.mockResolvedValue('settlement');

    const innerTx = {
      transaction: {
        update: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({ id: 'txn-1', items: [] }),
      },
      stockLedger: { createMany: vi.fn() },
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ count: 1 }]),
      $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    };
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(innerTx));

    const result = await syncPendingQrisFromMidtrans({
      transactionId: 'txn-1',
      invoiceNumber: 'INV-001',
    });

    expect(result).toBe('COMPLETED');
  });

  it('returns PENDING when Midtrans call fails', async () => {
    mockMidtransService.getTransactionStatus.mockRejectedValue(new Error('network'));

    const result = await syncPendingQrisFromMidtrans({
      transactionId: 'txn-1',
      invoiceNumber: 'INV-001',
    });

    expect(result).toBe('PENDING');
  });
});
