import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { MidtransService } from './midtransService';

export interface MidtransSubscriptionWebhookPayload {
  order_id: string;
  transaction_status: string;
  gross_amount: string;
  signature_key: string;
  status_code?: string;
}

const SUBSCRIPTION_SUCCESS_STATUSES = ['settlement', 'capture'] as const;
const SUBSCRIPTION_FAILURE_STATUSES = ['expire', 'cancel', 'deny'] as const;

function isSubscriptionSuccessStatus(status: string): boolean {
  return (SUBSCRIPTION_SUCCESS_STATUSES as readonly string[]).includes(status);
}

function isSubscriptionFailureStatus(status: string): boolean {
  return (SUBSCRIPTION_FAILURE_STATUSES as readonly string[]).includes(status);
}

/**
 * Memproses webhook Midtrans untuk invoice langganan (INV-SUB-*).
 */
export async function processSubscriptionMidtransWebhook(
  payload: MidtransSubscriptionWebhookPayload
) {
  const { order_id, transaction_status, gross_amount, signature_key, status_code } = payload;

  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { invoiceNumber: order_id },
    include: { tenant: true },
  });

  if (!invoice) {
    throw new Error(`Invoice langganan dengan nomor ${order_id} tidak ditemukan.`);
  }

  const statusCodeStr =
    status_code ||
    (isSubscriptionSuccessStatus(transaction_status) ? '200' : '201');

  const isSignatureValid = MidtransService.verifySignature(
    order_id,
    statusCodeStr,
    gross_amount,
    signature_key
  );

  if (!isSignatureValid) {
    throw new Error('Tanda tangan digital (Signature Key) dari Midtrans tidak valid.');
  }

  if (invoice.status === 'PAID') {
    return invoice;
  }

  return prisma.$transaction(async (tx) => {
    if (isSubscriptionSuccessStatus(transaction_status)) {
      const updatedInvoice = await tx.subscriptionInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      const activeTier = invoice.tier;
      const currentExpiresAt = invoice.tenant.subscriptionExpiresAt;
      const baseDate =
        currentExpiresAt && currentExpiresAt > new Date() ? currentExpiresAt : new Date();
      const nextExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await tx.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          subscriptionTier: activeTier,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionExpiresAt: nextExpiresAt,
          lastBillingAt: new Date(),
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          tenantId: invoice.tenantId,
          oldTier: invoice.tenant.subscriptionTier,
          newTier: activeTier,
          action: 'UPGRADE',
          note: `Pembayaran sukses untuk invoice ${invoice.invoiceNumber}`,
        },
      });

      return updatedInvoice;
    }

    if (isSubscriptionFailureStatus(transaction_status)) {
      return tx.subscriptionInvoice.update({
        where: { id: invoice.id },
        data: { status: 'FAILED' },
      });
    }

    return invoice;
  });
}
