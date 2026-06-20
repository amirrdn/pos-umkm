import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { tenantId, userId } from '../test/helpers/http';

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
    outlet: {
      updateMany: vi.fn(),
    },
    user: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      tenant: {
        findUnique: vi.fn(),
      },
      product: {
        count: vi.fn(),
      },
      outlet: {
        count: vi.fn(),
      },
      user: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      transaction: {
        count: vi.fn(),
      },
      subscriptionInvoice: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      subscriptionHistory: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    },
    mockMidtransService: {
      createSnapTransaction: vi.fn(),
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

import { SubscriptionService } from './subscriptionService';

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscriptionDetails', () => {
    it('throws error if tenant is not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(SubscriptionService.getSubscriptionDetails(tenantId)).rejects.toThrow(
        'Tenant tidak ditemukan.'
      );
    });

    it('returns subscription details and limits for FREE tier', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: null,
        lastBillingAt: null,
      });

      // Mock counts below limits
      mockPrisma.product.count.mockResolvedValue(10);
      mockPrisma.outlet.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.transaction.count.mockResolvedValue(50);

      const details = await SubscriptionService.getSubscriptionDetails(tenantId);

      expect(details.tier).toBe(SubscriptionTier.FREE);
      expect(details.status).toBe(SubscriptionStatus.ACTIVE);
      expect(details.usage.products.current).toBe(10);
      expect(details.usage.products.limit).toBe(30);
      expect(details.usage.products.isNearLimit).toBe(false);
      expect(details.usage.products.isFull).toBe(false);

      expect(details.usage.outlets.current).toBe(0);
      expect(details.usage.outlets.limit).toBe(1);
      expect(details.usage.outlets.isNearLimit).toBe(false);
      expect(details.usage.outlets.isFull).toBe(false);

      expect(details.usage.transactions.current).toBe(50);
      expect(details.usage.transactions.limit).toBe(150);
      expect(details.usage.transactions.isNearLimit).toBe(false);
      expect(details.usage.transactions.isFull).toBe(false);
    });

    it('identifies near limit and full statuses correctly', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: null,
        lastBillingAt: null,
      });

      // Products: 27/30 (90% -> near limit), Outlets: 1/1 (full), Staff: 2/2 (full)
      mockPrisma.product.count.mockResolvedValue(27);
      mockPrisma.outlet.count.mockResolvedValue(1);
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.transaction.count.mockResolvedValue(150);

      const details = await SubscriptionService.getSubscriptionDetails(tenantId);

      expect(details.usage.products.isNearLimit).toBe(true);
      expect(details.usage.products.isFull).toBe(false);

      expect(details.usage.outlets.isNearLimit).toBe(true);
      expect(details.usage.outlets.isFull).toBe(true);

      expect(details.usage.staff.isNearLimit).toBe(true);
      expect(details.usage.staff.isFull).toBe(true);

      expect(details.usage.transactions.isNearLimit).toBe(true);
      expect(details.usage.transactions.isFull).toBe(true);
    });
  });

  describe('limits check helpers', () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: null,
        lastBillingAt: null,
      });
    });

    it('returns true if product limit is not reached', async () => {
      mockPrisma.product.count.mockResolvedValue(29);
      const canCreate = await SubscriptionService.checkProductLimit(tenantId);
      expect(canCreate).toBe(true);
    });

    it('returns false if product limit is reached', async () => {
      mockPrisma.product.count.mockResolvedValue(30);
      const canCreate = await SubscriptionService.checkProductLimit(tenantId);
      expect(canCreate).toBe(false);
    });

    it('returns true if outlet limit is not reached', async () => {
      mockPrisma.outlet.count.mockResolvedValue(0);
      const canCreate = await SubscriptionService.checkOutletLimit(tenantId);
      expect(canCreate).toBe(true);
    });

    it('returns false if outlet limit is reached', async () => {
      mockPrisma.outlet.count.mockResolvedValue(1);
      const canCreate = await SubscriptionService.checkOutletLimit(tenantId);
      expect(canCreate).toBe(false);
    });

    it('returns true if staff limit is not reached', async () => {
      mockPrisma.user.count.mockResolvedValue(1);
      const canCreate = await SubscriptionService.checkStaffLimit(tenantId);
      expect(canCreate).toBe(true);
    });

    it('returns false if staff limit is reached', async () => {
      mockPrisma.user.count.mockResolvedValue(2);
      const canCreate = await SubscriptionService.checkStaffLimit(tenantId);
      expect(canCreate).toBe(false);
    });

    it('returns true if transaction limit is not reached', async () => {
      mockPrisma.transaction.count.mockResolvedValue(149);
      const canCreate = await SubscriptionService.checkTransactionLimit(tenantId);
      expect(canCreate).toBe(true);
    });

    it('returns false if transaction limit is reached', async () => {
      mockPrisma.transaction.count.mockResolvedValue(150);
      const canCreate = await SubscriptionService.checkTransactionLimit(tenantId);
      expect(canCreate).toBe(false);
    });
  });

  describe('createUpgradeInvoice', () => {
    it('throws error when target tier is FREE', async () => {
      await expect(
        SubscriptionService.createUpgradeInvoice(tenantId, SubscriptionTier.FREE)
      ).rejects.toThrow('Paket GRATIS tidak memerlukan pembayaran.');
    });

    it('throws error if tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        SubscriptionService.createUpgradeInvoice(tenantId, SubscriptionTier.GROWTH)
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

      const invoice = await SubscriptionService.createUpgradeInvoice(
        tenantId,
        SubscriptionTier.GROWTH
      );

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

  describe('processWebhook', () => {
    const mockPayload = {
      order_id: 'INV-SUB-12345',
      transaction_status: 'settlement',
      gross_amount: '149000.00',
      signature_key: 'valid-signature-key-123',
    };

    it('throws error if invoice is not found', async () => {
      mockPrisma.subscriptionInvoice.findUnique.mockResolvedValue(null);

      await expect(SubscriptionService.processWebhook(mockPayload)).rejects.toThrow(
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

      await expect(SubscriptionService.processWebhook(mockPayload)).rejects.toThrow(
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

      const result = await SubscriptionService.processWebhook(mockPayload);
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

      await SubscriptionService.processWebhook(mockPayload);

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

      const failedPayload = {
        ...mockPayload,
        transaction_status: 'expire',
      };

      await SubscriptionService.processWebhook(failedPayload);

      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
      expect(mockTx.subscriptionInvoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        data: { status: 'FAILED' },
      });
      expect(mockTx.tenant.update).not.toHaveBeenCalled();
    });
  });

  describe('downgradeToFree', () => {
    it('throws error if tenant is not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        SubscriptionService.downgradeToFree(tenantId, userId)
      ).rejects.toThrow('Tenant tidak ditemukan.');
    });

    it('returns early without updates if tenant is already on FREE tier', async () => {
      const mockTenant = {
        id: tenantId,
        subscriptionTier: SubscriptionTier.FREE,
      };
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await SubscriptionService.downgradeToFree(tenantId, userId);
      expect(result).toEqual(mockTenant);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('performs downgrade, deactivates branch outlets and restricts staff successfully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        subscriptionTier: SubscriptionTier.GROWTH,
      });

      mockTx.user.findMany.mockResolvedValue([
        { id: 'staff-1', createdAt: new Date(2026, 1, 1) },
        { id: 'staff-2', createdAt: new Date(2026, 1, 2) },
        { id: 'staff-3', createdAt: new Date(2026, 1, 3) },
        { id: 'staff-4', createdAt: new Date(2026, 1, 4) },
      ]);

      mockTx.tenant.update.mockResolvedValue({
        id: tenantId,
        subscriptionTier: SubscriptionTier.FREE,
      });

      await SubscriptionService.downgradeToFree(tenantId, userId);

      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
      expect(mockTx.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionExpiresAt: null,
        },
      });

      // Deactivate branch outlets
      expect(mockTx.outlet.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          type: 'BRANCH',
          deletedAt: null,
        },
        data: {
          isActive: false,
        },
      });

      // Staf 3 and 4 should be updated to PENDING (since staff limit on FREE is 2)
      expect(mockTx.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['staff-3', 'staff-4'] },
        },
        data: {
          approvalStatus: 'PENDING',
        },
      });

      // History log created
      expect(mockTx.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          oldTier: SubscriptionTier.GROWTH,
          newTier: SubscriptionTier.FREE,
          action: 'DOWNGRADE',
          changedById: userId,
        }),
      });
    });
  });
});
