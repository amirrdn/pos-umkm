import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionTier } from '@prisma/client';
import { tenantId } from '../helpers/http';

const { mockPrisma, mockMidtransService } = vi.hoisted(() => {
  const subscriptionInvoice = {
    create: vi.fn(),
  };

  const tx = { subscriptionInvoice };

  return {
    mockPrisma: {
      subscriptionInvoice,
      $executeRawWithTenant: vi.fn(
        async (_tenantId: string, callback: (innerTx: typeof tx) => Promise<unknown>) =>
          callback(tx)
      ),
    },
    mockMidtransService: {
      createSnapTransaction: vi.fn(),
    },
  };
});

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../services/midtransService', () => ({
  MidtransService: mockMidtransService,
}));

import { createSubscriptionUpgradeInvoice } from '../../services/subscriptionUpgradeService';

describe('createSubscriptionUpgradeInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when target tier is FREE', async () => {
    await expect(
      createSubscriptionUpgradeInvoice(tenantId, SubscriptionTier.FREE)
    ).rejects.toThrow('Paket GRATIS tidak memerlukan pembayaran.');
  });

  it('creates PENDING invoice successfully with Midtrans Snap token', async () => {
    mockMidtransService.createSnapTransaction.mockResolvedValue({
      token: 'snap-token-123',
      redirectUrl: 'https://snap-url.com/pay',
    });
    mockPrisma.subscriptionInvoice.create.mockResolvedValue({
      id: 'invoice-id-xyz',
      tenantId,
      invoiceNumber: 'INV-SUB-12345',
      tier: SubscriptionTier.GROWTH,
      amount: 149000,
      status: 'PENDING',
      paymentToken: 'snap-token-123',
      paymentUrl: 'https://snap-url.com/pay',
    });

    const invoice = await createSubscriptionUpgradeInvoice(tenantId, SubscriptionTier.GROWTH);

    expect(mockMidtransService.createSnapTransaction).toHaveBeenCalledOnce();
    expect(mockPrisma.subscriptionInvoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          tier: SubscriptionTier.GROWTH,
          amount: 149000,
          status: 'PENDING',
          paymentToken: 'snap-token-123',
          paymentUrl: 'https://snap-url.com/pay',
        }),
      })
    );
    expect(invoice.paymentToken).toBe('snap-token-123');
  });
});

