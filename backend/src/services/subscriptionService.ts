import { prisma } from '../lib/prisma';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

export const TIER_PRICES = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.GROWTH]: 149000,
  [SubscriptionTier.ENTERPRISE]: 349000,
};

export const TIER_LIMITS = {
  [SubscriptionTier.FREE]: {
    maxTransactionsPerMonth: 150,
    maxProducts: 30,
    maxOutlets: 1,
    maxStaff: 2,
    hasQris: false,
    hasCogs: false,
    maxDebtLimit: 0,
  },
  [SubscriptionTier.GROWTH]: {
    maxTransactionsPerMonth: 3000,
    maxProducts: 500,
    maxOutlets: 3,
    maxStaff: 5,
    hasQris: true,
    hasCogs: true,
    maxDebtLimit: 5000000, // Rp 5.000.000
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxTransactionsPerMonth: Infinity,
    maxProducts: Infinity,
    maxOutlets: Infinity,
    maxStaff: Infinity,
    hasQris: true,
    hasCogs: true,
    maxDebtLimit: Infinity,
  },
};

export interface SubscriptionAccessOptions {
  /** Admin platform — akses penuh tanpa batas kuota/fitur premium */
  bypassLimits?: boolean;
}

const PLATFORM_ADMIN_EFFECTIVE_LIMITS = TIER_LIMITS[SubscriptionTier.ENTERPRISE];

function buildUsageMetric(
  current: number,
  limit: number
): {
  current: number;
  limit: number | null;
  isNearLimit: boolean;
  isFull: boolean;
} {
  const unlimited = !Number.isFinite(limit);
  return {
    current,
    limit: unlimited ? null : limit,
    isNearLimit: !unlimited && current >= limit * 0.9,
    isFull: !unlimited && current >= limit,
  };
}

export class SubscriptionService {
  /**
   * Mendapatkan status paket dan tingkat kapasitas penggunaan data saat ini.
   */
  static async getSubscriptionDetails(tenantId: string, options?: SubscriptionAccessOptions) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        lastBillingAt: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan.');
    }

    const bypassLimits = options?.bypassLimits === true;
    const currentLimits = bypassLimits
      ? PLATFORM_ADMIN_EFFECTIVE_LIMITS
      : TIER_LIMITS[tenant.subscriptionTier];

    // Mengoptimalkan kueri dengan menjalankan count secara paralel
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [productCount, outletCount, staffCount, transactionCount] = await Promise.all([
      prisma.product.count({ where: { tenantId, deletedAt: null } }),
      prisma.outlet.count({ where: { tenantId, deletedAt: null } }),
      prisma.user.count({ where: { tenantId, deletedAt: null } }),
      prisma.transaction.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return {
      tier: tenant.subscriptionTier,
      status: bypassLimits ? SubscriptionStatus.ACTIVE : tenant.subscriptionStatus,
      expiresAt: tenant.subscriptionExpiresAt,
      lastBillingAt: tenant.lastBillingAt,
      platformAdminBypass: bypassLimits,
      usage: {
        products: buildUsageMetric(productCount, currentLimits.maxProducts),
        outlets: buildUsageMetric(outletCount, currentLimits.maxOutlets),
        staff: buildUsageMetric(staffCount, currentLimits.maxStaff),
        transactions: buildUsageMetric(transactionCount, currentLimits.maxTransactionsPerMonth),
      },
      features: {
        hasQris: currentLimits.hasQris,
        hasCogs: currentLimits.hasCogs,
        maxDebtLimit: currentLimits.maxDebtLimit,
      },
    };
  }

  /**
   * Pengecekan sisa kapasitas data sebelum membuat record baru.
   */
  static async checkProductLimit(
    tenantId: string,
    options?: SubscriptionAccessOptions
  ): Promise<boolean> {
    if (options?.bypassLimits) return true;
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.products.isFull;
  }

  static async checkOutletLimit(
    tenantId: string,
    options?: SubscriptionAccessOptions
  ): Promise<boolean> {
    if (options?.bypassLimits) return true;
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.outlets.isFull;
  }

  static async checkStaffLimit(
    tenantId: string,
    options?: SubscriptionAccessOptions
  ): Promise<boolean> {
    if (options?.bypassLimits) return true;
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.staff.isFull;
  }

  static async checkTransactionLimit(
    tenantId: string,
    options?: SubscriptionAccessOptions
  ): Promise<boolean> {
    if (options?.bypassLimits) return true;
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.transactions.isFull;
  }

  static async assertDebtPaymentAllowed(
    tenantId: string,
    options?: SubscriptionAccessOptions
  ): Promise<void> {
    if (options?.bypassLimits) return;
    const details = await this.getSubscriptionDetails(tenantId);
    if (details.features.maxDebtLimit === 0) {
      throw new Error(
        'Fitur hutang pelanggan tidak tersedia pada paket Anda. Silakan upgrade ke paket Tumbuh atau Enterprise.'
      );
    }
  }

  /**
   * Menurunkan tingkat paket ke FREE jika diinginkan user secara manual atau jika kedaluwarsa habis.
   */
  static async downgradeToFree(tenantId: string, userId?: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan.');
    }

    if (tenant.subscriptionTier === SubscriptionTier.FREE) {
      return tenant;
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update tenant ke FREE
      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionExpiresAt: null,
        },
      });

      // 2. Nonaktifkan cabang-cabang tambahan (Hanya sisakan MAIN)
      await tx.outlet.updateMany({
        where: {
          tenantId,
          type: 'BRANCH',
          deletedAt: null,
        },
        data: {
          isActive: false,
        },
      });

      // 3. Nonaktifkan staf tambahan (Hanya sisakan 2 staf terlama yang APPROVED)
      const approvedStaff = await tx.user.findMany({
        where: {
          tenantId,
          deletedAt: null,
          approvalStatus: 'APPROVED',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (approvedStaff.length > 2) {
        const staffToSuspend = approvedStaff.slice(2);
        await tx.user.updateMany({
          where: {
            id: { in: staffToSuspend.map((u) => u.id) },
          },
          data: {
            approvalStatus: 'PENDING', // Diubah ke pending agar tidak bisa login kasir
          },
        });
      }

      // 4. Catat riwayat
      await tx.subscriptionHistory.create({
        data: {
          tenantId,
          oldTier: tenant.subscriptionTier,
          newTier: SubscriptionTier.FREE,
          action: 'DOWNGRADE',
          note: 'Downgrade ke paket GRATIS. Cabang tambahan dinonaktifkan, kapasitas staf dibatasi.',
          changedById: userId,
        },
      });

      return updatedTenant;
    });
  }

  /**
   * Mengambil daftar invoice langganan untuk tenant tertentu.
   */
  static async getInvoices(tenantId: string) {
    return await prisma.subscriptionInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
