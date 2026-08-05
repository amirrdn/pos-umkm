import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * ============================================================================
 * SERVICE: TRANSACTION HISTORY SERVICE
 * ============================================================================
 * Handles querying, filtering, and pagination of tenant sales transaction history
 * by active outlet, search terms (invoice/customer name/phone), transaction status,
 * payment method, and custom/preset date ranges.
 * ============================================================================
 */

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
  payments: true,
} satisfies Prisma.TransactionInclude;

export type TransactionHistoryRecord = Prisma.TransactionGetPayload<{
  include: typeof historyInclude;
}>;

export interface GetTransactionHistoryParams {
  tenantId: string;
  outletId?: string | null;
  search?: string;
  status?: string;
  paymentMethod?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

/**
 * Retrieves transaction history records matching filter criteria and pagination settings.
 *
 * @param params GetTransactionHistoryParams containing filter criteria and pagination parameters.
 * @returns Array of transaction records with complete relations.
 */
export async function getTransactionHistory(
  params: GetTransactionHistoryParams
): Promise<TransactionHistoryRecord[]> {
  const where: Prisma.TransactionWhereInput = {
    tenantId: params.tenantId,
  };

  if (params.outletId) {
    where.outletId = params.outletId;
  }

  /**
   * 1. Invoice Number, Customer Name, or Phone Search Filter
   */
  if (params.search && params.search.trim() !== '') {
    const q = params.search.trim();
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { customer: { phone: { contains: q, mode: 'insensitive' } } },
    ];
  }

  /**
   * 2. Transaction Status Filter (COMPLETED, PENDING, VOID, FAILED)
   */
  if (params.status && params.status !== 'ALL') {
    const uppercaseStatus = params.status.toUpperCase();
    if (['COMPLETED', 'PENDING', 'VOID', 'FAILED'].includes(uppercaseStatus)) {
      where.status = uppercaseStatus as Prisma.TransactionWhereInput['status'];
    }
  }

  /**
   * 3. Payment Method Filter (CASH, QRIS)
   */
  if (params.paymentMethod && params.paymentMethod !== 'ALL') {
    const uppercasePayment = params.paymentMethod.toUpperCase();
    where.payments = {
      some: {
        paymentMethod: uppercasePayment,
      },
    };
  }

  /**
   * 4. Date Range & Custom Period Filter
   */
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.createdAt.lte = new Date(params.endDate);
    }
  } else if (params.dateRange && params.dateRange !== 'ALL') {
    const now = new Date();
    if (params.dateRange === 'TODAY') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.createdAt = {
        gte: startOfToday,
        lte: endOfToday,
      };
    } else if (params.dateRange === 'WEEK') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = {
        gte: sevenDaysAgo,
      };
    }
  }

  const take = params.limit && params.limit > 0 ? params.limit : undefined;
  const skip = params.page && params.page > 0 && take ? (params.page - 1) * take : undefined;

  return prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: historyInclude,
    take,
    skip,
  });
}
