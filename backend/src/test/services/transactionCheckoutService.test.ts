import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { CheckoutError } from '../../domain/transaction';
import { productId, tenantId, userId } from '../helpers/http';

const outletId = 'outlet-uuid-001';

const activeTenantSubscription = {
  subscriptionTier: SubscriptionTier.GROWTH,
  subscriptionStatus: SubscriptionStatus.ACTIVE,
  subscriptionExpiresAt: null,
  lastBillingAt: null,
};

const { mockTx, mockPrisma, mockSubscriptionService, mockMidtransService } = vi.hoisted(() => {
  const tx = {
    product: {
      findMany: vi.fn(),
    },
    outletProductPrice: {
      findMany: vi.fn(),
    },
    outletStock: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    shift: {
      findFirst: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    stockLedger: {
      createMany: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ count: 1 }]),
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
  };

  return {
    mockTx: tx,
    mockPrisma: {
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
      $executeRawWithTenant: vi.fn(
        async (
          _tenantId: string,
          callback: (innerTx: typeof tx) => Promise<unknown>
        ) => callback(tx)
      ),
      transaction: {
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
    mockSubscriptionService: {
      checkTransactionLimit: vi.fn().mockResolvedValue(true),
    },
    mockMidtransService: {
      createQrisCharge: vi.fn(),
    },
  };
});

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../services/subscriptionService', () => ({
  SubscriptionService: mockSubscriptionService,
  TIER_LIMITS: {
    FREE: {
      maxTransactionsPerMonth: 150,
      maxProducts: 30,
      maxOutlets: 1,
      maxStaff: 2,
      hasQris: false,
      hasCogs: false,
    },
    GROWTH: {
      maxTransactionsPerMonth: 3000,
      maxProducts: 500,
      maxOutlets: 3,
      maxStaff: 5,
      hasQris: true,
      hasCogs: true,
    },
    ENTERPRISE: {
      maxTransactionsPerMonth: Infinity,
      maxProducts: Infinity,
      maxOutlets: Infinity,
      maxStaff: Infinity,
      hasQris: true,
      hasCogs: true,
    },
  },
}));

vi.mock('../../services/midtransService', () => ({
  MidtransService: mockMidtransService,
}));

import { processCheckout } from '../../services/transactionCheckoutService';

describe('processCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptionService.checkTransactionLimit.mockResolvedValue(true);

    mockTx.product.findMany.mockResolvedValue([
      {
        id: productId,
        name: 'Produk Test',
        sellingPrice: 10000,
        purchasePrice: 5000,
        deletedAt: null,
      },
    ]);
    mockTx.outletProductPrice.findMany.mockResolvedValue([]);
    mockTx.outletStock.findMany.mockResolvedValue([{ productId, stock: 10 }]);
    mockTx.outletStock.upsert.mockResolvedValue({});
    mockTx.outletStock.updateMany.mockResolvedValue({ count: 1 });
    mockTx.outletStock.findUnique.mockResolvedValue({ stock: 9 });
    mockTx.tenant.findUnique.mockResolvedValue({
      subscriptionTier: 'GROWTH',
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: null,
    });
    mockTx.$queryRawUnsafe.mockResolvedValue([{ productId, stockAfter: 9, quantity: 1 }]);
    mockTx.$executeRawUnsafe.mockResolvedValue(1);
    mockTx.stockLedger.createMany.mockResolvedValue({ count: 1 });
    mockTx.transaction.create.mockResolvedValue({
      id: 'txn-1',
      invoiceNumber: 'INV-TEST-001',
      grandTotal: 10000,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: [],
      customer: null,
      outlet: null,
    });
  });

  it('throws LIMIT_EXCEEDED when subscription quota is full', async () => {
    mockSubscriptionService.checkTransactionLimit.mockResolvedValue(false);

    await expect(
      processCheckout({
        paymentMethod: 'CASH',
        items: [{ productId, quantity: 1 }],
        tenantId,
        userId,
        outletId,
        bypassSubscriptionLimits: false,
        tenantSubscription: activeTenantSubscription,
      })
    ).rejects.toMatchObject({
      code: 'LIMIT_EXCEEDED',
      httpStatus: 403,
    });

    expect(mockPrisma.$executeRawWithTenant).not.toHaveBeenCalled();
  });

  it('throws OUTLET_REQUIRED when outlet context is missing', async () => {
    await expect(
      processCheckout({
        paymentMethod: 'CASH',
        items: [{ productId, quantity: 1 }],
        tenantId,
        userId,
        outletId: null,
        bypassSubscriptionLimits: false,
        tenantSubscription: activeTenantSubscription,
      })
    ).rejects.toMatchObject({
      code: 'OUTLET_REQUIRED',
      httpStatus: 400,
    });

    expect(mockPrisma.$executeRawWithTenant).toHaveBeenCalledOnce();
  });

  it('throws STOCK_INSUFFICIENT when stock is not enough', async () => {
    mockTx.outletStock.findMany.mockResolvedValue([{ productId, stock: 0 }]);
    mockTx.outletStock.updateMany.mockResolvedValue({ count: 0 });
    mockTx.outletStock.findUnique.mockResolvedValue({ stock: 0 });

    await expect(
      processCheckout({
        paymentMethod: 'CASH',
        items: [{ productId, quantity: 1 }],
        tenantId,
        userId,
        outletId,
        bypassSubscriptionLimits: false,
        tenantSubscription: activeTenantSubscription,
      })
    ).rejects.toMatchObject({
      code: 'STOCK_INSUFFICIENT',
      httpStatus: 400,
    });
  });

  it('completes CASH checkout successfully', async () => {
    const result = await processCheckout({
      paymentMethod: 'CASH',
      items: [{ productId, quantity: 1 }],
      tenantId,
      userId,
      outletId,
      bypassSubscriptionLimits: false,
      tenantSubscription: activeTenantSubscription,
    });

    expect(result.transaction.id).toBe('txn-1');
    expect(mockTx.$queryRawUnsafe).toHaveBeenCalledOnce();
    expect(mockTx.stockLedger.createMany).toHaveBeenCalledOnce();
    expect(mockMidtransService.createQrisCharge).not.toHaveBeenCalled();
  });

  it('rolls back QRIS transaction when Midtrans charge fails', async () => {
    mockTx.transaction.create.mockResolvedValue({
      id: 'txn-qris',
      invoiceNumber: 'INV-QRIS-001',
      grandTotal: 25000,
      paymentMethod: 'QRIS',
      status: 'PENDING',
      items: [],
      customer: null,
      outlet: null,
    });
    mockMidtransService.createQrisCharge.mockRejectedValue(new Error('Midtrans down'));

    await expect(
      processCheckout({
        paymentMethod: 'QRIS',
        items: [{ productId, quantity: 1 }],
        tenantId,
        userId,
        outletId,
        bypassSubscriptionLimits: false,
        tenantSubscription: activeTenantSubscription,
      })
    ).rejects.toMatchObject({
      code: 'QRIS_CHARGE_FAILED',
      httpStatus: 500,
    });

    expect(mockTx.transaction.delete).toHaveBeenCalledWith({
      where: { id: 'txn-qris' },
    });
  });

});
