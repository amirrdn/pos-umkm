import { prisma } from '../lib/prisma';
import { getOutletBreakdown } from '../domain/analytics/breakdown.service';
import {
  calculateTransactionProfit,
  startOfLocalDay,
  startOfLocalMonth,
} from '../domain/analytics';

const TX_ITEMS_SELECT = {
  priceAtTransaction: true,
  costAtTransaction: true,
  quantity: true,
} as const;

function completedTxWhere(tenantId: string, outletId?: string | null, since?: Date) {
  return {
    tenantId,
    status: 'COMPLETED' as const,
    ...(since ? { createdAt: { gte: since } } : {}),
    ...(outletId ? { outletId } : {}),
  };
}

/**
 * Service Layer analitik penjualan — scope outlet via parameter outletId (null = agregat).
 */
export class AnalyticsService {
  async getSummary(tenantId: string, outletId?: string | null) {
    const dayStart = startOfLocalDay();
    const monthStart = startOfLocalMonth();

    const todayWhere = completedTxWhere(tenantId, outletId, dayStart);
    const monthWhere = completedTxWhere(tenantId, outletId, monthStart);

    const [todayRevenueAggregate, monthRevenueAggregate, todayTransactionsCount, todayTransactions, monthTransactions] =
      await Promise.all([
        prisma.transaction.aggregate({ _sum: { grandTotal: true }, where: todayWhere }),
        prisma.transaction.aggregate({ _sum: { grandTotal: true }, where: monthWhere }),
        prisma.transaction.count({ where: todayWhere }),
        prisma.transaction.findMany({
          where: todayWhere,
          select: { discount: true, items: { select: TX_ITEMS_SELECT } },
        }),
        prisma.transaction.findMany({
          where: monthWhere,
          select: { discount: true, items: { select: TX_ITEMS_SELECT } },
        }),
      ]);

    const profitToday = todayTransactions.reduce(
      (sum, tx) => sum + calculateTransactionProfit(tx),
      0
    );
    const profitMonth = monthTransactions.reduce(
      (sum, tx) => sum + calculateTransactionProfit(tx),
      0
    );

    return {
      revenueToday: Number(todayRevenueAggregate._sum.grandTotal ?? 0),
      revenueMonth: Number(monthRevenueAggregate._sum.grandTotal ?? 0),
      transactionsTodayCount: todayTransactionsCount,
      profitToday,
      profitMonth,
    };
  }

  async getRevenueAndProfitTrend(tenantId: string, outletId?: string | null) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: completedTxWhere(tenantId, outletId, thirtyDaysAgo),
      select: {
        createdAt: true,
        grandTotal: true,
        discount: true,
        items: { select: TX_ITEMS_SELECT },
      },
      orderBy: { createdAt: 'asc' },
    });

    const trendMap = new Map<string, { revenue: number; profit: number }>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d
        .toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .split('/')
        .reverse()
        .join('-');
      trendMap.set(dateStr, { revenue: 0, profit: 0 });
    }

    for (const tx of transactions) {
      const dateStr = tx.createdAt
        .toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .split('/')
        .reverse()
        .join('-');

      const current = trendMap.get(dateStr) ?? { revenue: 0, profit: 0 };
      trendMap.set(dateStr, {
        revenue: current.revenue + Number(tx.grandTotal),
        profit: current.profit + calculateTransactionProfit(tx),
      });
    }

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      profit: Math.round(data.profit),
    }));
  }

  async getBestSellers(tenantId: string, outletId?: string | null) {
    const bestSellersGroupBy = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: { transaction: completedTxWhere(tenantId, outletId) },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    if (bestSellersGroupBy.length === 0) return [];

    const productIds = bestSellersGroupBy.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });

    return bestSellersGroupBy.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name ?? 'Produk Tidak Dikenal',
        sku: product?.sku ?? '',
        totalQuantity: item._sum.quantity ?? 0,
      };
    });
  }

  async getCashierReports(tenantId: string, outletId?: string | null) {
    const transactions = await prisma.transaction.findMany({
      where: completedTxWhere(tenantId, outletId),
      select: {
        userId: true,
        grandTotal: true,
        paymentMethod: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const reportMap = new Map<
      string,
      {
        cashierId: string;
        name: string;
        email: string;
        totalTransactions: number;
        totalSales: number;
        cashSales: number;
        qrisSales: number;
        debtSales: number;
      }
    >();

    for (const tx of transactions) {
      const current = reportMap.get(tx.userId) ?? {
        cashierId: tx.userId,
        name: tx.user.name,
        email: tx.user.email,
        totalTransactions: 0,
        totalSales: 0,
        cashSales: 0,
        qrisSales: 0,
        debtSales: 0,
      };

      const amount = Number(tx.grandTotal);
      current.totalTransactions += 1;
      current.totalSales += amount;
      if (tx.paymentMethod === 'CASH') current.cashSales += amount;
      else if (tx.paymentMethod === 'QRIS') current.qrisSales += amount;
      else if (tx.paymentMethod === 'DEBT') current.debtSales += amount;

      reportMap.set(tx.userId, current);
    }

    return Array.from(reportMap.values());
  }

  async getShiftReports(tenantId: string, outletId?: string | null) {
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        ...(outletId ? { outletId } : {}),
      },
      include: {
        user: { select: { name: true } },
        transactions: {
          where: { status: 'COMPLETED' },
          select: { grandTotal: true, paymentMethod: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return shifts.map((shift) => {
      let totalSales = 0;
      let cashSales = 0;
      let qrisSales = 0;
      let debtSales = 0;

      for (const tx of shift.transactions) {
        const amount = Number(tx.grandTotal);
        totalSales += amount;
        if (tx.paymentMethod === 'CASH') cashSales += amount;
        else if (tx.paymentMethod === 'QRIS') qrisSales += amount;
        else if (tx.paymentMethod === 'DEBT') debtSales += amount;
      }

      return {
        id: shift.id,
        cashierName: shift.user.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        cashStart: Number(shift.cashStart),
        cashExpected: Number(shift.cashExpected),
        cashActual: shift.cashActual ? Number(shift.cashActual) : null,
        difference: shift.difference ? Number(shift.difference) : null,
        status: shift.status,
        totalSales,
        cashSales,
        qrisSales,
        debtSales,
        transactionCount: shift.transactions.length,
      };
    });
  }

  /** Breakdown penjualan per outlet + agregat MAIN vs BRANCH (hari & bulan berjalan). */
  getOutletBreakdown(tenantId: string) {
    return getOutletBreakdown(tenantId);
  }
}
