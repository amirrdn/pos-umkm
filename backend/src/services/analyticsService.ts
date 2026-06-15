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
  async getSummary(tenantId: string) {
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayRevenueAggregate = await prisma.transaction.aggregate({
      _sum: {
        grandTotal: true
      },
      where: {
        tenantId: tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay
        }
      }
    });

    const monthRevenueAggregate = await prisma.transaction.aggregate({
      _sum: {
        grandTotal: true
      },
      where: {
        tenantId: tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    const todayTransactionsCount = await prisma.transaction.count({
      where: {
        tenantId: tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay
        }
      }
    });

    const todayTransactions = await prisma.transaction.findMany({
      where: {
        tenantId: tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay
        }
      },
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
      where: {
        tenantId: tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth
        }
      },
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
  async getRevenueAndProfitTrend(tenantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId: tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
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
  async getBestSellers(tenantId: string) {
    const bestSellersGroupBy = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: {
          tenantId: tenantId,
          status: 'COMPLETED'
        }
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
}

