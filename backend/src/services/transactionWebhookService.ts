import { logWarn } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { MidtransService } from './midtransService';
import { processSubscriptionMidtransWebhook } from './subscriptionMidtransWebhookService';
import {
  completeQrisSettlement,
  isQrisFailureStatus,
  voidQrisTransaction,
} from './transactionQrisSettlementService';

export interface MidtransWebhookPayload {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  [key: string]: unknown;
}

export interface WebhookHandleResult {
  httpStatus: number;
  message: string;
}

/**
 * Memproses webhook Midtrans untuk transaksi POS (bukan langganan).
 * Langganan (INV-SUB-*) didelegasikan ke SubscriptionService.
 */
export async function processMidtransPosWebhook(
  payload: MidtransWebhookPayload
): Promise<WebhookHandleResult> {
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = payload;

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    logWarn('midtransWebhook', 'Payload webhook tidak lengkap');
    return { httpStatus: 400, message: 'Payload webhook tidak lengkap.' };
  }

  const isSignatureValid = MidtransService.verifySignature(
    order_id,
    status_code,
    gross_amount,
    signature_key
  );

  if (!isSignatureValid) {
    logWarn('midtransWebhook', `Signature tidak valid untuk order: ${order_id}`);
    return { httpStatus: 403, message: 'Verifikasi tanda tangan digital gagal.' };
  }

  if (order_id.startsWith('INV-SUB-')) {
    await processSubscriptionMidtransWebhook({
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status: transaction_status ?? '',
    });
    return {
      httpStatus: 200,
      message: 'Notifikasi pembayaran langganan berhasil diproses via delegasi webhook.',
    };
  }

  const transaction = await prisma.transaction.findFirst({
    where: { invoiceNumber: order_id },
    include: { items: true },
  });

  if (!transaction) {
    return { httpStatus: 404, message: 'Transaksi tidak ditemukan di sistem POS.' };
  }

  if (transaction.status !== 'PENDING') {
    return { httpStatus: 200, message: 'Status transaksi sudah diproses sebelumnya.' };
  }

  if (transaction_status === 'settlement') {
    await completeQrisSettlement({
      transactionId: transaction.id,
    });
    return { httpStatus: 200, message: 'Pembayaran settlement berhasil diproses.' };
  }

  if (transaction_status && isQrisFailureStatus(transaction_status)) {
    await voidQrisTransaction(transaction.id);
    return { httpStatus: 200, message: 'Pembayaran dibatalkan.' };
  }

  return {
    httpStatus: 200,
    message: `Status pending/lainnya: ${transaction_status ?? 'unknown'}`,
  };
}
