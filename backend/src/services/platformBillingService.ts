import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';
import { MidtransService } from './midtransService';

/**
 * ============================================================================
 * SERVICE: PLATFORM BILLING SERVICE
 * ============================================================================
 * Aggregates SaaS platform financial metrics (MRR, ARR, Active Tenants, Churn Rate),
 * manages cross-tenant subscription invoices, and integrates with Midtrans payment status.
 * ============================================================================
 */
export class PlatformBillingService {
  /**
   * Retrieves high-level SaaS billing metrics (MRR, ARR, active tenant count, churn rate).
   * Uses Prisma aggregation queries for optimal performance.
   *
   * @returns Key platform financial and subscription metrics.
   */
  static async getMetrics() {
    return runInSystemContext('platform', async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [mrrResult, activeTenants, churnedTenants] = await Promise.all([
        prisma.subscriptionInvoice.aggregate({
          _sum: { amount: true },
          where: {
            status: 'PAID',
            paidAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.tenant.count({
          where: { subscriptionStatus: 'ACTIVE', deletedAt: null },
        }),
        prisma.tenant.count({
          where: { subscriptionStatus: 'EXPIRED', deletedAt: null },
        }),
      ]);

      const mrr = Number(mrrResult._sum.amount || 0);
      const arr = mrr * 12;

      const churnRate =
        activeTenants + churnedTenants > 0
          ? (churnedTenants / (activeTenants + churnedTenants)) * 100
          : 0;

      return {
        mrr,
        arr,
        activeTenants,
        churnRate: Number(churnRate.toFixed(2)),
      };
    });
  }

  /**
   * Retrieves paginated list of cross-tenant subscription invoices.
   *
   * @param page Page index (1-based).
   * @param limit Maximum number of records per page.
   * @returns Paginated invoice list with metadata.
   */
  static async getInvoices(page: number = 1, limit: number = 20) {
    return runInSystemContext('platform', async () => {
      const skip = (page - 1) * limit;

      const [total, data] = await Promise.all([
        prisma.subscriptionInvoice.count(),
        prisma.subscriptionInvoice.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  /**
   * Fetches real-time payment transaction details directly from Midtrans API.
   *
   * @param invoiceNumber Invoice reference number.
   * @returns Raw Midtrans transaction status response.
   */
  static async getMidtransInvoiceDetail(invoiceNumber: string) {
    return runInSystemContext('platform', async () => {
      const invoice = await prisma.subscriptionInvoice.findUnique({
        where: { invoiceNumber },
      });

      if (!invoice) {
        throw new Error('Invoice tidak ditemukan di sistem.');
      }

      return MidtransService.getFullTransactionStatus(invoiceNumber);
    });
  }
}
