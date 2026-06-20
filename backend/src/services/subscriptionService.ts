import { prisma } from '../lib/prisma';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { MidtransService } from './midtransService';

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

export class SubscriptionService {
  /**
   * Mendapatkan status paket dan tingkat kapasitas penggunaan data saat ini.
   */
  static async getSubscriptionDetails(tenantId: string) {
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

    const currentLimits = TIER_LIMITS[tenant.subscriptionTier];

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
      status: tenant.subscriptionStatus,
      expiresAt: tenant.subscriptionExpiresAt,
      lastBillingAt: tenant.lastBillingAt,
      usage: {
        products: {
          current: productCount,
          limit: currentLimits.maxProducts,
          isNearLimit: currentLimits.maxProducts !== Infinity && productCount >= currentLimits.maxProducts * 0.9,
          isFull: currentLimits.maxProducts !== Infinity && productCount >= currentLimits.maxProducts,
        },
        outlets: {
          current: outletCount,
          limit: currentLimits.maxOutlets,
          isNearLimit: currentLimits.maxOutlets !== Infinity && outletCount >= currentLimits.maxOutlets,
          isFull: currentLimits.maxOutlets !== Infinity && outletCount >= currentLimits.maxOutlets,
        },
        staff: {
          current: staffCount,
          limit: currentLimits.maxStaff,
          isNearLimit: currentLimits.maxStaff !== Infinity && staffCount >= currentLimits.maxStaff,
          isFull: currentLimits.maxStaff !== Infinity && staffCount >= currentLimits.maxStaff,
        },
        transactions: {
          current: transactionCount,
          limit: currentLimits.maxTransactionsPerMonth,
          isNearLimit: currentLimits.maxTransactionsPerMonth !== Infinity && transactionCount >= currentLimits.maxTransactionsPerMonth * 0.9,
          isFull: currentLimits.maxTransactionsPerMonth !== Infinity && transactionCount >= currentLimits.maxTransactionsPerMonth,
        },
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
  static async checkProductLimit(tenantId: string): Promise<boolean> {
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.products.isFull;
  }

  static async checkOutletLimit(tenantId: string): Promise<boolean> {
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.outlets.isFull;
  }

  static async checkStaffLimit(tenantId: string): Promise<boolean> {
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.staff.isFull;
  }

  static async checkTransactionLimit(tenantId: string): Promise<boolean> {
    const details = await this.getSubscriptionDetails(tenantId);
    return !details.usage.transactions.isFull;
  }

  /**
   * Membuat tagihan baru dan request Snap Token Midtrans untuk upgrade paket.
   */
  static async createUpgradeInvoice(tenantId: string, targetTier: SubscriptionTier) {
    if (targetTier === SubscriptionTier.FREE) {
      throw new Error('Paket GRATIS tidak memerlukan pembayaran.');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan.');
    }

    const amount = TIER_PRICES[targetTier];
    const invoiceNumber = `INV-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Batas transfer 24 jam

    // 1. Panggil Midtrans Snap API
    const snapResult = await MidtransService.createSnapTransaction(invoiceNumber, amount);

    // 2. Simpan invoice langganan ke database
    const invoice = await prisma.subscriptionInvoice.create({
      data: {
        tenantId,
        invoiceNumber,
        tier: targetTier,
        amount,
        status: 'PENDING',
        paymentToken: snapResult.token,
        paymentUrl: snapResult.redirectUrl,
        expiredAt,
      },
    });

    return invoice;
  }

  /**
   * Memproses status pembayaran callback Midtrans (Webhook).
   */
  static async processWebhook(payload: {
    order_id: string;
    transaction_status: string;
    gross_amount: string;
    signature_key: string;
    status_code?: string;
  }) {
    const { order_id, transaction_status, gross_amount, signature_key, status_code } = payload;

    // 1. Ambil data invoice terlebih dahulu
    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { invoiceNumber: order_id },
      include: { tenant: true },
    });

    if (!invoice) {
      throw new Error(`Invoice langganan dengan nomor ${order_id} tidak ditemukan.`);
    }

    // 2. Validasi Signature Key
    const statusCodeStr = status_code || (transaction_status === 'settlement' || transaction_status === 'capture' ? '200' : '201');
    const isSignatureValid = MidtransService.verifySignature(
      order_id,
      statusCodeStr,
      gross_amount,
      signature_key
    );

    if (!isSignatureValid) {
      throw new Error('Tanda tangan digital (Signature Key) dari Midtrans tidak valid.');
    }

    // Jika invoice sudah dibayar, abaikan
    if (invoice.status === 'PAID') {
      return invoice;
    }

    // 3. Tangani perubahan status transaksi secara atomik
    return await prisma.$transaction(async (tx) => {
      if (['settlement', 'capture'].includes(transaction_status)) {
        // Pembayaran sukses
        const updatedInvoice = await tx.subscriptionInvoice.update({
          where: { id: invoice.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });

        const activeTier = invoice.tier;
        const currentExpiresAt = invoice.tenant.subscriptionExpiresAt;
        const baseDate = currentExpiresAt && currentExpiresAt > new Date() ? currentExpiresAt : new Date();
        const nextExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Tambah 30 hari

        // Update status tenant
        await tx.tenant.update({
          where: { id: invoice.tenantId },
          data: {
            subscriptionTier: activeTier,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionExpiresAt: nextExpiresAt,
            lastBillingAt: new Date(),
          },
        });

        // Catat di riwayat langganan
        await tx.subscriptionHistory.create({
          data: {
            tenantId: invoice.tenantId,
            oldTier: invoice.tenant.subscriptionTier,
            newTier: activeTier,
            action: 'UPGRADE',
            note: `Pembayaran sukses untuk invoice ${invoice.invoiceNumber}`,
          },
        });

        return updatedInvoice;
      } else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
        // Pembayaran gagal/kedaluwarsa
        const updatedInvoice = await tx.subscriptionInvoice.update({
          where: { id: invoice.id },
          data: {
            status: 'FAILED',
          },
        });

        return updatedInvoice;
      }

      return invoice;
    });
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
