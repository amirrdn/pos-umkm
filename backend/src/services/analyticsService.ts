import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * Mengambil rangkuman metrik penjualan tenant:
   * - Total Pendapatan hari ini
   * - Total Pendapatan bulan ini
   * - Total Transaksi hari ini
   * - Total Laba Bersih hari ini
   * - Total Laba Bersih bulan ini
   */
  async getSummary(tenantId: string, outletId?: string | null) {
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayWhere: any = {
      tenantId: tenantId,
      status: 'COMPLETED',
      createdAt: {
        gte: startOfDay
      }
    };
    if (outletId) {
      todayWhere.outletId = outletId;
    }

    const todayRevenueAggregate = await prisma.transaction.aggregate({
      _sum: {
        grandTotal: true
      },
      where: todayWhere
    });

    const monthWhere: any = {
      tenantId: tenantId,
      status: 'COMPLETED',
      createdAt: {
        gte: startOfMonth
      }
    };
    if (outletId) {
      monthWhere.outletId = outletId;
    }

    const monthRevenueAggregate = await prisma.transaction.aggregate({
      _sum: {
        grandTotal: true
      },
      where: monthWhere
    });

    const todayTransactionsCount = await prisma.transaction.count({
      where: todayWhere
    });

    const todayTransactions = await prisma.transaction.findMany({
      where: todayWhere,
      include: {
        items: {
          select: {
            priceAtTransaction: true,
            costAtTransaction: true,
            quantity: true
          }
        }
      }
    });

    const monthTransactions = await prisma.transaction.findMany({
      where: monthWhere,
      include: {
        items: {
          select: {
            priceAtTransaction: true,
            costAtTransaction: true,
            quantity: true
          }
        }
      }
    });

    let profitToday = 0;
    for (const tx of todayTransactions) {
      const itemsProfit = (tx as any).items.reduce((sum: number, item: any) => {
        const price = Number(item.priceAtTransaction);
        const cost = Number(item.costAtTransaction ?? 0);
        return sum + (price - cost) * item.quantity;
      }, 0);
      profitToday += (itemsProfit - Number(tx.discount));
    }

    let profitMonth = 0;
    for (const tx of monthTransactions) {
      const itemsProfit = (tx as any).items.reduce((sum: number, item: any) => {
        const price = Number(item.priceAtTransaction);
        const cost = Number(item.costAtTransaction ?? 0);
        return sum + (price - cost) * item.quantity;
      }, 0);
      profitMonth += (itemsProfit - Number(tx.discount));
    }

    const revenueToday = todayRevenueAggregate._sum.grandTotal ? Number(todayRevenueAggregate._sum.grandTotal) : 0;
    const revenueMonth = monthRevenueAggregate._sum.grandTotal ? Number(monthRevenueAggregate._sum.grandTotal) : 0;

    return {
      revenueToday,
      revenueMonth,
      transactionsTodayCount: todayTransactionsCount,
      profitToday: Math.round(profitToday),
      profitMonth: Math.round(profitMonth)
    };
  }

  /**
   * Mengambil tren pendapatan dan laba bersih harian selama 30 hari terakhir.
   */
  async getRevenueAndProfitTrend(tenantId: string, outletId?: string | null) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const whereClause: any = {
      tenantId: tenantId,
      status: 'COMPLETED',
      createdAt: {
        gte: thirtyDaysAgo
      }
    };
    if (outletId) {
      whereClause.outletId = outletId;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        items: {
          select: {
            priceAtTransaction: true,
            costAtTransaction: true,
            quantity: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const trendMap = new Map<string, { revenue: number; profit: number }>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      trendMap.set(dateStr, { revenue: 0, profit: 0 });
    }

    for (const tx of transactions) {
      const dateStr = tx.createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');

      const current = trendMap.get(dateStr) || { revenue: 0, profit: 0 };
      const revenue = Number(tx.grandTotal);

      const itemsProfit = (tx as any).items.reduce((sum: number, item: any) => {
        const price = Number(item.priceAtTransaction);
        const cost = Number(item.costAtTransaction ?? 0);
        return sum + (price - cost) * item.quantity;
      }, 0);
      const profit = itemsProfit - Number(tx.discount);

      trendMap.set(dateStr, {
        revenue: current.revenue + revenue,
        profit: current.profit + profit
      });
    }

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      profit: Math.round(data.profit)
    }));
  }

  /**
   * Mengambil 5 produk terlaris berdasarkan total kuantitas transaksi.
   */
  async getBestSellers(tenantId: string, outletId?: string | null) {
    const transWhereClause: any = {
      tenantId: tenantId,
      status: 'COMPLETED'
    };
    if (outletId) {
      transWhereClause.outletId = outletId;
    }

    const bestSellersGroupBy = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: transWhereClause
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    if (bestSellersGroupBy.length === 0) {
      return [];
    }

    const productIds = bestSellersGroupBy.map(item => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        name: true,
        sku: true
      }
    });

    return bestSellersGroupBy.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Produk Tidak Dikenal',
        sku: product?.sku || '',
        totalQuantity: item._sum.quantity || 0
      };
    });
  }

  async getCashierReports(tenantId: string, outletId?: string | null) {
    const whereClause: any = {
      tenantId,
      status: 'COMPLETED',
    };
    if (outletId) {
      whereClause.outletId = outletId;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    const reportMap = new Map<string, {
      cashierId: string;
      name: string;
      email: string;
      totalTransactions: number;
      totalSales: number;
      cashSales: number;
      qrisSales: number;
      debtSales: number;
    }>();

    for (const tx of transactions) {
      const cashierId = tx.userId;
      const cashierName = tx.user.name;
      const cashierEmail = tx.user.email;
      const amount = Number(tx.grandTotal);

      const current = reportMap.get(cashierId) || {
        cashierId,
        name: cashierName,
        email: cashierEmail,
        totalTransactions: 0,
        totalSales: 0,
        cashSales: 0,
        qrisSales: 0,
        debtSales: 0,
      };

      current.totalTransactions += 1;
      current.totalSales += amount;
      if (tx.paymentMethod === 'CASH') {
        current.cashSales += amount;
      } else if (tx.paymentMethod === 'QRIS') {
        current.qrisSales += amount;
      } else if (tx.paymentMethod === 'DEBT') {
        current.debtSales += amount;
      }

      reportMap.set(cashierId, current);
    }

    return Array.from(reportMap.values());
  }

  async getShiftReports(tenantId: string, outletId?: string | null) {
    const whereClause: any = {
      tenantId,
    };
    if (outletId) {
      whereClause.outletId = outletId;
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
          }
        },
        transactions: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            grandTotal: true,
            paymentMethod: true,
          }
        }
      },
      orderBy: {
        startTime: 'desc',
      }
    });

    return shifts.map((shift) => {
      let totalSales = 0;
      let cashSales = 0;
      let qrisSales = 0;
      let debtSales = 0;

      for (const tx of shift.transactions) {
        const amount = Number(tx.grandTotal);
        totalSales += amount;
        if (tx.paymentMethod === 'CASH') {
          cashSales += amount;
        } else if (tx.paymentMethod === 'QRIS') {
          qrisSales += amount;
        } else if (tx.paymentMethod === 'DEBT') {
          debtSales += amount;
        }
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
}

