import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';
import { TenantStatus, SubscriptionTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import { normalizeAuthEmail } from '../domain/auth/emailVerification.service';

export class PlatformTenantService {
  static async listTenants() {
    return runInSystemContext('platform', () =>
    prisma.tenant.findMany({
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
    })
    );
  }

  static async getOverview() {
    return runInSystemContext('platform', () =>
    Promise.all([
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
    ]).then(([totalTenants, activeTenants, expiredTenants, tierCounts]) => ({
      totalTenants, activeTenants, expiredTenants, tierCounts,
    }))
    );
  }

  static async createTenant(
    input: { tenantName: string; ownerName: string; email: string; password: string; phone?: string; taxRate?: number },
    actorUserId: string
  ) {
    return runInSystemContext('platform', async () => {
    const normalizedEmail = normalizeAuthEmail(input.email);
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (existingUser) {
      throw new Error('Email sudah digunakan oleh pengguna lain.');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const baseSlug = input.tenantName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = baseSlug || 'toko-baru';

    const count = await prisma.tenant.count({ where: { slug } });
    if (count > 0) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug,
          email: normalizedEmail,
          phone: input.phone || '-',
          taxRate: input.taxRate ?? 0.11,
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: 'FREE',
        }
      });

      const permissions = await tx.permission.findMany();

      const roleOwner = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Owner',
          description: 'Pemilik Toko dengan kontrol dan izin akses penuh'
        }
      });
      
      const ownerPermissionsData = permissions.map((perm) => ({
        roleId: roleOwner.id,
        permissionId: perm.id
      }));
      await tx.rolePermission.createMany({ data: ownerPermissionsData });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.ownerName,
          email: normalizedEmail,
          password: hashedPassword,
          isActive: true,
          approvalStatus: 'APPROVED',
          emailVerifiedAt: new Date(), // Otomatis terverifikasi karena dibuat oleh admin
        }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleOwner.id
        }
      });

      const mainOutlet = await tx.outlet.create({
        data: {
          tenantId: tenant.id,
          name: `${tenant.name} — Pusat`,
          type: 'MAIN',
          code: 'PST'
        }
      });

      await tx.userOutlet.create({
        data: {
          userId: user.id,
          outletId: mainOutlet.id
        }
      });

      await tx.platformAuditLog.create({
        data: {
          actorUserId,
          tenantId: tenant.id,
          action: 'TENANT_CREATE',
          metadata: { name: tenant.name, slug: tenant.slug },
        },
      });

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        ownerName: user.name,
        email: user.email
      };
    });
    });
  }

  static async updateTenant(
    tenantId: string,
    input: { name?: string; phone?: string; taxRate?: number },
    actorUserId: string
  ) {
    return runInSystemContext('platform', async () => {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null }
    });

    if (!tenant) throw new Error('Tenant tidak ditemukan.');

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: input.name !== undefined ? input.name : tenant.name,
          phone: input.phone !== undefined ? input.phone : tenant.phone,
          taxRate: input.taxRate !== undefined ? input.taxRate : tenant.taxRate,
        }
      });

      await tx.platformAuditLog.create({
        data: {
          actorUserId,
          tenantId,
          action: 'TENANT_UPDATE',
          metadata: { input },
        },
      });

      return result;
    });

    return updated;
    });
  }

  static async deleteTenant(tenantId: string, actorUserId: string) {
    return runInSystemContext('platform', async () => {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null }
    });

    if (!tenant) throw new Error('Tenant tidak ditemukan.');

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      
      // Soft delete tenant
      await tx.tenant.update({
        where: { id: tenantId },
        data: { deletedAt: now }
      });

      // Disable and soft delete users associated with the tenant
      await tx.user.updateMany({
        where: { tenantId },
        data: { isActive: false, deletedAt: now }
      });

      await tx.platformAuditLog.create({
        data: {
          actorUserId,
          tenantId,
          action: 'TENANT_DELETE',
          metadata: { deletedAt: now },
        },
      });
    });

    return { id: tenantId, deleted: true };
    });
  }

  static async getTenantById(tenantId: string) {
    return runInSystemContext('platform', async () => {
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
    });
  }

  static async updateTenantStatus(tenantId: string, status: TenantStatus, actorUserId: string) {
    return runInSystemContext('platform', async () => {
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
          metadata: { status },
        },
      }),
    ]);

    return { id: tenantId, status };
    });
  }

  static async overrideSubscription(
    tenantId: string,
    tier: SubscriptionTier,
    expiresAt: Date | null,
    actorUserId: string,
    note?: string
  ) {
    return runInSystemContext('platform', async () => {
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
          metadata: { tier, expiresAt, note: note || null },
        },
      }),
    ]);

    return { id: tenantId, subscriptionTier: tier, subscriptionExpiresAt: expiresAt };
    });
  }
}
