import { prisma } from '../lib/prisma';

export class PlatformTenantService {
  static async listTenants() {
    return prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        status: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            outlets: true,
            users: true,
            transactions: true,
          },
        },
      },
    });
  }

  static async getOverview() {
    const [totalTenants, activeTenants, expiredTenants, tierCounts] = await Promise.all([
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.tenant.count({
        where: { deletedAt: null, subscriptionStatus: 'ACTIVE' },
      }),
      prisma.tenant.count({
        where: { deletedAt: null, subscriptionStatus: 'EXPIRED' },
      }),
      prisma.tenant.groupBy({
        by: ['subscriptionTier'],
        where: { deletedAt: null },
        _count: true,
      }),
    ]);

    return { totalTenants, activeTenants, expiredTenants, tierCounts };
  }

  static async getTenantById(tenantId: string) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        status: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        lastBillingAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            outlets: true,
            users: true,
            transactions: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan.');
    }

    return tenant;
  }
}
