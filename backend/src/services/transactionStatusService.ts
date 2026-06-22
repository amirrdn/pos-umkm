import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { syncPendingQrisFromMidtrans } from './transactionQrisSettlementService';

const statusPollInclude = {
  items: {
    include: {
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      points: true,
    },
  },
  outlet: true,
} satisfies Prisma.TransactionInclude;

export type TransactionStatusRecord = Prisma.TransactionGetPayload<{
  include: typeof statusPollInclude;
}>;

/**
 * Ambil transaksi untuk polling status — sinkronkan QRIS PENDING dari Midtrans bila perlu.
 */
export async function getTransactionForStatusPolling(params: {
  tenantId: string;
  invoiceNumber: string;
}): Promise<TransactionStatusRecord | null> {
  const { tenantId, invoiceNumber } = params;

  const transaction = await prisma.transaction.findFirst({
    where: { invoiceNumber, tenantId },
    select: { id: true, status: true },
  });

  if (!transaction) return null;

  if (transaction.status === 'PENDING') {
    await syncPendingQrisFromMidtrans({
      transactionId: transaction.id,
      invoiceNumber,
    });
  }

  return prisma.transaction.findFirst({
    where: { id: transaction.id },
    include: statusPollInclude,
  });
}
