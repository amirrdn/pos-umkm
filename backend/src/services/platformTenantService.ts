import { prisma } from '../lib/prisma';
import { TenantStatus, SubscriptionTier } from '@prisma/client';

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

  static async updateTenantStatus(tenantId: string, status: TenantStatus, actorUserId: string) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null }
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan.');
    }

    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { status }
      }),
      prisma.platformAuditLog.create({
        data: {
          actorUserId,
          tenantId,
          action: status === 'SUSPENDED' ? 'TENANT_SUSPEND' : 'TENANT_ACTIVATE',
          metadata: { status }
        }
      })
    ]);

    return { id: tenantId, status };
  }

  static async overrideSubscription(
    tenantId: string,
    tier: SubscriptionTier,
    expiresAt: Date | null,
    actorUserId: string,
    note?: string
  ) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null }
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan.');
    }

    const oldTier = tenant.subscriptionTier;

    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: expiresAt,
        }
      }),
      prisma.subscriptionHistory.create({
        data: {
          tenantId,
          oldTier,
          newTier: tier,
          action: tier === oldTier ? 'RENEWAL' : (tier === 'FREE' ? 'DOWNGRADE' : 'UPGRADE'),
          note: note || 'Platform Admin Override',
          changedById: actorUserId
        }
      }),
      prisma.platformAuditLog.create({
        data: {
          actorUserId,
          tenantId,
          action: 'TIER_OVERRIDE',
          metadata: { tier, expiresAt, note: note || null }
        }
      })
    ]);

    return { id: tenantId, subscriptionTier: tier, subscriptionExpiresAt: expiresAt };
  }
}
