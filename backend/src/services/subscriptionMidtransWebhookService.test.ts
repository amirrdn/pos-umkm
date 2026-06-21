import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { tenantId } from '../test/helpers/http';

const { mockTx, mockPrisma, mockMidtransService } = vi.hoisted(() => {
  const tx = {
    tenant: {
      update: vi.fn(),
    },
    subscriptionInvoice: {
      update: vi.fn(),
    },
    subscriptionHistory: {
      create: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
      subscriptionInvoice: {
        findUnique: vi.fn(),
      },
    },
    mockMidtransService: {
      verifySignature: vi.fn(),
    },
  };
});

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('./midtransService', () => ({
  MidtransService: mockMidtransService,
}));

import { processSubscriptionMidtransWebhook } from './subscriptionMidtransWebhookService';

describe('processSubscriptionMidtransWebhook', () => {
  const mockPayload = {
    order_id: 'INV-SUB-12345',
    transaction_status: 'settlement',
    gross_amount: '149000.00',
    signature_key: 'valid-signature-key-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error if invoice is not found', async () => {
    mockPrisma.subscriptionInvoice.findUnique.mockResolvedValue(null);

    await expect(processSubscriptionMidtransWebhook(mockPayload)).rejects.toThrow(
      'Invoice langganan dengan nomor INV-SUB-12345 tidak ditemukan.'
    );
  });

  it('throws error if signature is invalid', async () => {
    mockPrisma.subscriptionInvoice.findUnique.mockResolvedValue({
      id: 'inv-123',
      invoiceNumber: 'INV-SUB-12345',
      status: 'PENDING',
      tenant: { id: tenantId },
    });
    mockMidtransService.verifySignature.mockReturnValue(false);

    await expect(processSubscriptionMidtransWebhook(mockPayload)).rejects.toThrow(
      'Tanda tangan digital (Signature Key) dari Midtrans tidak valid.'
    );
  });

  it('does nothing if invoice is already PAID', async () => {
    const mockInvoice = {
      id: 'inv-123',
      invoiceNumber: 'INV-SUB-12345',
      status: 'PAID',
      tenant: { id: tenantId },
    };
    mockPrisma.subscriptionInvoice.findUnique.mockResolvedValue(mockInvoice);
    mockMidtransService.verifySignature.mockReturnValue(true);

    const result = await processSubscriptionMidtransWebhook(mockPayload);
    expect(result).toEqual(mockInvoice);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('processes settlement payment, updates status to PAID, and upgrades tenant tier', async () => {
    mockPrisma.subscriptionInvoice.findUnique.mockResolvedValue({
      id: 'inv-123',
      tenantId,
      invoiceNumber: 'INV-SUB-12345',
      tier: SubscriptionTier.GROWTH,
      status: 'PENDING',
      tenant: {
        id: tenantId,
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionExpiresAt: null,
      },
    });
    mockMidtransService.verifySignature.mockReturnValue(true);

    mockTx.subscriptionInvoice.update.mockResolvedValue({
      id: 'inv-123',
      status: 'PAID',
    });

    await processSubscriptionMidtransWebhook(mockPayload);

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockTx.subscriptionInvoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-123' },
      data: expect.objectContaining({
        status: 'PAID',
        paidAt: expect.any(Date),
      }),
    });
    expect(mockTx.tenant.update).toHaveBeenCalledWith({
      where: { id: tenantId },
      data: expect.objectContaining({
        subscriptionTier: SubscriptionTier.GROWTH,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: expect.any(Date),
        lastBillingAt: expect.any(Date),
      }),
    });
    expect(mockTx.subscriptionHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        oldTier: SubscriptionTier.FREE,
        newTier: SubscriptionTier.GROWTH,
        action: 'UPGRADE',
      }),
    });
  });

  it('updates invoice status to FAILED on expire transaction_status', async () => {
    mockPrisma.subscriptionInvoice.findUnique.mockResolvedValue({
      id: 'inv-123',
      tenantId,
      invoiceNumber: 'INV-SUB-12345',
      tier: SubscriptionTier.GROWTH,
      status: 'PENDING',
      tenant: {
        id: tenantId,
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionExpiresAt: null,
      },
    });
    mockMidtransService.verifySignature.mockReturnValue(true);

    mockTx.subscriptionInvoice.update.mockResolvedValue({
      id: 'inv-123',
      status: 'FAILED',
    });

    await processSubscriptionMidtransWebhook({
      ...mockPayload,
      transaction_status: 'expire',
    });

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockTx.subscriptionInvoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-123' },
      data: { status: 'FAILED' },
    });
    expect(mockTx.tenant.update).not.toHaveBeenCalled();
  });
});
