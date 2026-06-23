import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';
import { Prisma } from '@prisma/client';

export class PlatformAnalyticsService {
  static async getAllStaff(page = 1, limit = 50) {
    return runInSystemContext('platform', async () => {
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          userRoles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const mappedData = data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      tenantName: user.tenant ? user.tenant.name : 'Platform Admin',
      roles: user.userRoles.map((ur) => ur.role.name),
    }));

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
    });
  }

  static async getPlatformRevenue() {
    return runInSystemContext('platform', async () => {
    const rawData = await prisma.$queryRaw<
      Array<{ date: Date; revenue: Prisma.Decimal }>
    >`
      SELECT 
        DATE_TRUNC('day', "createdAt") AS date, 
        SUM("grandTotal") AS revenue
      FROM "transactions"
      WHERE status = 'COMPLETED'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    return rawData.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      revenue: Number(row.revenue),
    }));
    });
  }

  static async getTopProducts() {
    return runInSystemContext('platform', async () => {
    const topTransactionItems = await prisma.transactionItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const productIds = topTransactionItems.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return topTransactionItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        tenantName: product?.tenant?.name || 'Unknown Store',
        quantitySold: item._sum.quantity || 0,
        revenueGenerated: Number(item._sum.subtotal || 0),
      };
    });
    });
  }
}
