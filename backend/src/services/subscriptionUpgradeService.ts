import { SubscriptionTier } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { MidtransService } from './midtransService';
import { TIER_PRICES } from './subscriptionService';

/**
 * Membuat tagihan baru dan request Snap Token Midtrans untuk upgrade paket.
 */
export async function createSubscriptionUpgradeInvoice(
  tenantId: string,
  targetTier: SubscriptionTier
) {
  if (targetTier === SubscriptionTier.FREE) {
    throw new Error('Paket GRATIS tidak memerlukan pembayaran.');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant tidak ditemukan.');
  }

  const amount = TIER_PRICES[targetTier];
  const invoiceNumber = `INV-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const snapResult = await MidtransService.createSnapTransaction(invoiceNumber, amount);

  const invoice = await prisma.subscriptionInvoice.create({
    data: {
      tenantId,
      invoiceNumber,
      tier: targetTier,
      amount,
      status: 'PENDING',
      paymentToken: snapResult.token,
      paymentUrl: snapResult.redirectUrl,
      expiredAt,
    },
  });

  return invoice;
}
