import { prisma } from '../lib/prisma';
import { MidtransService } from './midtransService';

export class PlatformBillingService {
  /**
   * Mengambil metrik utama untuk Platform Billing Dashboard (MRR, ARR, Active Tenants, Churn Rate).
   * Menggunakan aggregasi Prisma untuk optimasi query.
   */
  static async getMetrics() {
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
  }

  /**
   * Mengambil daftar invoice lintas-tenant beserta paginasi.
   */
  static async getInvoices(page: number = 1, limit: number = 20) {
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
  }

  /**
   * Mengambil detail transaksi secara langsung dari Midtrans API
   */
  static async getMidtransInvoiceDetail(invoiceNumber: string) {
    // Validasi apakah invoice ini terdaftar di sistem kita
    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { invoiceNumber },
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan di sistem.');
    }

    return MidtransService.getFullTransactionStatus(invoiceNumber);
  }
}
