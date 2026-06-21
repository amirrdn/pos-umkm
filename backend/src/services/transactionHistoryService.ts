import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const historyInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
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
    },
  },
  outlet: true,
} satisfies Prisma.TransactionInclude;

export type TransactionHistoryRecord = Prisma.TransactionGetPayload<{
  include: typeof historyInclude;
}>;

/**
 * Riwayat transaksi tenant, opsional difilter outlet aktif.
 */
export async function getTransactionHistory(params: {
  tenantId: string;
  outletId?: string | null;
}): Promise<TransactionHistoryRecord[]> {
  const where: Prisma.TransactionWhereInput = {
    tenantId: params.tenantId,
  };

  if (params.outletId) {
    where.outletId = params.outletId;
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: historyInclude,
  });
}
