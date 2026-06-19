import { prisma } from '../../lib/prisma';

export type TransactionOutletBackfillSource =
  | 'shift'
  | 'user_outlet'
  | 'main_outlet'
  | 'unresolved';

export interface TransactionOutletBackfillCandidate {
  transactionId: string;
  tenantId: string;
  invoiceNumber: string;
  resolvedOutletId: string | null;
  source: TransactionOutletBackfillSource;
}

export interface TransactionOutletBackfillReport {
  checkedAt: string;
  stats: {
    totalNullOutlet: number;
    resolvable: number;
    unresolved: number;
    byShift: number;
    byUserOutlet: number;
    byMainOutlet: number;
  };
  candidates: TransactionOutletBackfillCandidate[];
  unresolved: TransactionOutletBackfillCandidate[];
}

export interface TransactionOutletBackfillResult {
  dryRun: boolean;
  updatedTransactions: number;
  updatedLedgers: number;
  report: TransactionOutletBackfillReport;
}

/** Pure resolver — urutan: shift → user outlet → MAIN tenant. */
export function resolveTransactionOutletId(input: {
  shiftOutletId?: string | null;
  userOutletIds: string[];
  mainOutletId?: string | null;
}): { outletId: string | null; source: TransactionOutletBackfillSource } {
  if (input.shiftOutletId) {
    return { outletId: input.shiftOutletId, source: 'shift' };
  }

  if (input.userOutletIds.length > 0) {
    return { outletId: input.userOutletIds[0], source: 'user_outlet' };
  }

  if (input.mainOutletId) {
    return { outletId: input.mainOutletId, source: 'main_outlet' };
  }

  return { outletId: null, source: 'unresolved' };
}

async function loadBackfillContext() {
  const [transactions, mainByTenant] = await Promise.all([
    prisma.transaction.findMany({
      where: { outletId: null },
      select: {
        id: true,
        tenantId: true,
        invoiceNumber: true,
        userId: true,
        shift: { select: { outletId: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.outlet.findMany({
      where: { type: 'MAIN', deletedAt: null },
      select: { id: true, tenantId: true },
    }),
  ]);

  const mainOutletByTenant = new Map(mainByTenant.map((o) => [o.tenantId, o.id]));

  const userIds = [...new Set(transactions.map((t) => t.userId))];
  const userOutlets = userIds.length
    ? await prisma.userOutlet.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          outletId: true,
          outlet: { select: { tenantId: true, deletedAt: true } },
        },
        orderBy: { id: 'asc' },
      })
    : [];

  const userOutletIdsByUserTenant = new Map<string, string[]>();
  for (const row of userOutlets) {
    if (row.outlet.deletedAt !== null) continue;
    const key = `${row.userId}:${row.outlet.tenantId}`;
    const list = userOutletIdsByUserTenant.get(key) ?? [];
    list.push(row.outletId);
    userOutletIdsByUserTenant.set(key, list);
  }

  return { transactions, mainOutletByTenant, userOutletIdsByUserTenant };
}

function buildCandidates(
  transactions: Awaited<ReturnType<typeof loadBackfillContext>>['transactions'],
  mainOutletByTenant: Map<string, string>,
  userOutletIdsByUserTenant: Map<string, string[]>
): TransactionOutletBackfillCandidate[] {
  return transactions.map((tx) => {
    const { outletId, source } = resolveTransactionOutletId({
      shiftOutletId: tx.shift?.outletId,
      userOutletIds: userOutletIdsByUserTenant.get(`${tx.userId}:${tx.tenantId}`) ?? [],
      mainOutletId: mainOutletByTenant.get(tx.tenantId) ?? null,
    });

    return {
      transactionId: tx.id,
      tenantId: tx.tenantId,
      invoiceNumber: tx.invoiceNumber,
      resolvedOutletId: outletId,
      source,
    };
  });
}

function summarizeCandidates(
  candidates: TransactionOutletBackfillCandidate[]
): TransactionOutletBackfillReport['stats'] {
  const unresolved = candidates.filter((c) => !c.resolvedOutletId);
  const resolvable = candidates.filter((c) => c.resolvedOutletId);

  return {
    totalNullOutlet: candidates.length,
    resolvable: resolvable.length,
    unresolved: unresolved.length,
    byShift: resolvable.filter((c) => c.source === 'shift').length,
    byUserOutlet: resolvable.filter((c) => c.source === 'user_outlet').length,
    byMainOutlet: resolvable.filter((c) => c.source === 'main_outlet').length,
  };
}

/** Audit transaksi legacy tanpa outletId — tidak mengubah data. */
export async function auditTransactionOutletBackfill(): Promise<TransactionOutletBackfillReport> {
  const { transactions, mainOutletByTenant, userOutletIdsByUserTenant } =
    await loadBackfillContext();

  const candidates = buildCandidates(
    transactions,
    mainOutletByTenant,
    userOutletIdsByUserTenant
  );
  const unresolved = candidates.filter((c) => !c.resolvedOutletId);

  return {
    checkedAt: new Date().toISOString(),
    stats: summarizeCandidates(candidates),
    candidates,
    unresolved,
  };
}

/** Terapkan backfill outletId + sinkronkan stock_ledgers terkait. */
export async function applyTransactionOutletBackfill(
  dryRun = false
): Promise<TransactionOutletBackfillResult> {
  const report = await auditTransactionOutletBackfill();
  const toApply = report.candidates.filter((c) => c.resolvedOutletId);

  if (dryRun || toApply.length === 0) {
    return {
      dryRun,
      updatedTransactions: 0,
      updatedLedgers: 0,
      report,
    };
  }

  let updatedTransactions = 0;
  let updatedLedgers = 0;

  await prisma.$transaction(async (tx) => {
    for (const candidate of toApply) {
      await tx.transaction.update({
        where: { id: candidate.transactionId },
        data: { outletId: candidate.resolvedOutletId! },
      });
      updatedTransactions += 1;
    }

    for (const candidate of toApply) {
      const result = await tx.stockLedger.updateMany({
        where: {
          transactionId: candidate.transactionId,
          outletId: null,
        },
        data: { outletId: candidate.resolvedOutletId! },
      });
      updatedLedgers += result.count;
    }
  });

  const reportAfter = await auditTransactionOutletBackfill();

  return {
    dryRun: false,
    updatedTransactions,
    updatedLedgers,
    report: reportAfter,
  };
}
