import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockRequest,
  createMockResponse,
  productId,
  tenantId,
  userId,
} from '../test/helpers/http';

const { mockTx, mockPrisma, mockSubscriptionService } = vi.hoisted(() => {
  const tx = {
    product: {
      findFirst: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    },
    mockSubscriptionService: {
      checkTransactionLimit: vi.fn().mockResolvedValue(true),
      checkProductLimit: vi.fn().mockResolvedValue(true),
      checkOutletLimit: vi.fn().mockResolvedValue(true),
      checkStaffLimit: vi.fn().mockResolvedValue(true),
    },
  };
});

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../domain/inventory', () => ({
  decrementOutletStock: vi.fn(),
  buildQrisSaleLedgerEntries: vi.fn(),
  restoreStockForVoidedTransaction: vi.fn(),
}));

vi.mock('../services/midtransService', () => ({
  MidtransService: vi.fn(),
}));

vi.mock('../services/subscriptionService', () => ({
  SubscriptionService: mockSubscriptionService,
}));

import { checkout } from './transactionController';

describe('checkout (INV-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptionService.checkTransactionLimit.mockResolvedValue(true);

    mockTx.product.findFirst.mockResolvedValue({
      id: productId,
      name: 'Produk Test',
      sellingPrice: 10000,
      purchasePrice: 5000,
      deletedAt: null,
    });
  });

  it('rejects checkout when x-outlet-id context is missing', async () => {
    const req = createMockRequest({
      tenantId,
      user: {
        id: userId,
        tenantId,
        name: 'Kasir Test',
        email: 'kasir@test.com',
        roles: ['Kasir'],
        permissions: [],
      },
      body: {
        paymentMethod: 'CASH',
        items: [{ productId, quantity: 1 }],
      },
    } as any);
    const res = createMockResponse();

    await checkout(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Outlet aktif'),
    });
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });
});
