import { SubscriptionStatus, SubscriptionTier, type Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';

const TIER_RANK: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.GROWTH]: 1,
  [SubscriptionTier.ENTERPRISE]: 2,
};

type PaidInvoiceSnapshot = {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  tier: SubscriptionTier;
  paidAt: Date | null;
  createdAt: Date;
};

type TenantSubscriptionSnapshot = {
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | null;
};

export async function applyPaidSubscriptionInvoice(
  invoice: PaidInvoiceSnapshot,
  tenant: TenantSubscriptionSnapshot,
  tx: Prisma.TransactionClient
) {
  const activeTier = invoice.tier;
  const currentExpiresAt = tenant.subscriptionExpiresAt;
  const baseDate =
    currentExpiresAt && currentExpiresAt > new Date() ? currentExpiresAt : new Date();
  const nextExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  await tx.tenant.update({
    where: { id: invoice.tenantId },
    data: {
      subscriptionTier: activeTier,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiresAt: nextExpiresAt,
      lastBillingAt: new Date(),
    },
  });

  await tx.subscriptionHistory.create({
    data: {
      tenantId: invoice.tenantId,
      oldTier: tenant.subscriptionTier,
      newTier: activeTier,
      action:
        tenant.subscriptionTier === activeTier
          ? 'RENEWAL'
          : TIER_RANK[activeTier] > TIER_RANK[tenant.subscriptionTier]
            ? 'UPGRADE'
            : 'DOWNGRADE',
      note: `Pembayaran sukses untuk invoice ${invoice.invoiceNumber}`,
    },
  });
}

/**
 * Menyelaraskan tier tenant dengan invoice PAID terbaru jika data tenant tertinggal
 * (mis. webhook gagal, seed reset, atau dev sandbox tanpa callback).
 */
export async function reconcileTenantSubscription(tenantId: string): Promise<void> {
  await runInSystemContext('platform', async () => {
    const latestPaidInvoice = await prisma.subscriptionInvoice.findFirst({
      where: { tenantId, status: 'PAID' },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        tenant: {
          select: {
            subscriptionTier: true,
            subscriptionExpiresAt: true,
          },
        },
      },
    });

    if (!latestPaidInvoice?.tenant) {
      return;
    }

    const { tenant } = latestPaidInvoice;
    if (tenant.subscriptionTier === latestPaidInvoice.tier) {
      return;
    }

    if (TIER_RANK[latestPaidInvoice.tier] <= TIER_RANK[tenant.subscriptionTier]) {
      return;
    }

    const paidReference = latestPaidInvoice.paidAt ?? latestPaidInvoice.createdAt;
    const downgradeAfterPayment = await prisma.subscriptionHistory.findFirst({
      where: {
        tenantId,
        action: 'DOWNGRADE',
        createdAt: { gt: paidReference },
      },
    });

    if (downgradeAfterPayment) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      await applyPaidSubscriptionInvoice(latestPaidInvoice, tenant, tx);
    });
  });
}
