import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionTier } from '@prisma/client';
import { tenantId } from '../test/helpers/http';

const { mockPrisma, mockMidtransService } = vi.hoisted(() => ({
  mockPrisma: {
    tenant: {
      findUnique: vi.fn(),
    },
    subscriptionInvoice: {
      create: vi.fn(),
    },
  },
  mockMidtransService: {
    createSnapTransaction: vi.fn(),
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('./midtransService', () => ({
  MidtransService: mockMidtransService,
}));

import { createSubscriptionUpgradeInvoice } from './subscriptionUpgradeService';

describe('createSubscriptionUpgradeInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when target tier is FREE', async () => {
    await expect(
      createSubscriptionUpgradeInvoice(tenantId, SubscriptionTier.FREE)
    ).rejects.toThrow('Paket GRATIS tidak memerlukan pembayaran.');
  });

  it('throws error if tenant does not exist', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(null);

    await expect(
      createSubscriptionUpgradeInvoice(tenantId, SubscriptionTier.GROWTH)
    ).rejects.toThrow('Tenant tidak ditemukan.');
  });

  it('creates PENDING invoice successfully with Midtrans Snap token', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: tenantId });
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
