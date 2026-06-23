import { prisma } from '../../lib/prisma';
import { runInSystemContext } from '../../lib/tenantContext';
import { sendMail } from '../../lib/mail';

const DIGEST_ROLES = ['Owner', 'Manager'] as const;

export interface DraftTransferSnapshot {
  count: number;
  transferIds: string[];
}

/** Hitung transfer DRAFT tenant — dipakai polling, SSE, dan digest. */
export async function getDraftTransferSnapshot(
  tenantId: string
): Promise<DraftTransferSnapshot> {
  const count = await prisma.stockTransfer.count({
    where: { tenantId, status: 'DRAFT' },
  });

  return {
    count,
    transferIds: [],
  };
}

/** Email Owner/Manager tenant yang punya transfer DRAFT menunggu. */
export async function sendDraftTransferDigestForTenant(
  tenantId: string,
  tenantName: string
): Promise<{ sent: boolean; recipientCount: number; draftCount: number }> {
  const snapshot = await getDraftTransferSnapshot(tenantId);
  if (snapshot.count === 0) {
    return { sent: false, recipientCount: 0, draftCount: 0 };
  }

  const users = await prisma.user.findMany({
    where: {
      tenantId,
      deletedAt: null,
      isActive: true,
      userRoles: {
        some: {
          role: { name: { in: [...DIGEST_ROLES] } },
        },
      },
    },
    select: { email: true, name: true },
  });

  const emails = [...new Set(users.map((u) => u.email).filter(Boolean))];
  if (emails.length === 0) {
    return { sent: false, recipientCount: 0, draftCount: snapshot.count };
  }

  const sent = await sendMail({
    to: emails,
    subject: `[SaaSPOS] ${snapshot.count} transfer stok DRAFT menunggu persetujuan`,
    text: [
      `Halo,`,
      ``,
      `Toko "${tenantName}" memiliki ${snapshot.count} pengajuan transfer stok berstatus DRAFT.`,
      `Silakan buka menu Inventaris → Transfer Stok untuk meninjau dan menyetujui.`,
      ``,
      `— SaaSPOS (notifikasi otomatis)`,
    ].join('\n'),
  });

  return { sent, recipientCount: emails.length, draftCount: snapshot.count };
}

/** Digest harian semua tenant aktif yang punya DRAFT. */
export async function runDailyDraftTransferDigest(): Promise<{
  tenantsNotified: number;
  totalDrafts: number;
}> {
  return runInSystemContext('platform', async () => {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true, name: true },
  });

  let tenantsNotified = 0;
  let totalDrafts = 0;

  for (const tenant of tenants) {
    const result = await sendDraftTransferDigestForTenant(tenant.id, tenant.name);
    if (result.sent) tenantsNotified += 1;
    totalDrafts += result.draftCount;
  }

  return { tenantsNotified, totalDrafts };
  });
}
