import { OutletType, Prisma, type Outlet } from '@prisma/client';
import { prisma, type PrismaTx } from '../../lib/prisma';
import type { OutletIntegrityIssue, OutletIntegrityIssueCode } from './outlet.types';

/** Baris outlet aktif — dipakai audit & repair. */
export interface ActiveOutletRow {
  id: string;
  tenantId: string;
  name: string;
  type: 'MAIN' | 'BRANCH';
  parentOutletId: string | null;
  createdAt: Date;
}

const ACTIVE_OUTLET_SQL = Prisma.sql`
  SELECT
    id,
    "tenantId",
    name,
    type::text AS type,
    "parentOutletId",
    "createdAt"
  FROM outlets
  WHERE "deletedAt" IS NULL
  ORDER BY "tenantId", "createdAt" ASC
`;

/** Outlet MAIN aktif tenant — satu query indexed (tenantId + type). */
export async function findMainOutletByTenant(
  tenantId: string,
  tx: PrismaTx = prisma
): Promise<Outlet | null> {
  return tx.outlet.findFirst({
    where: { tenantId, type: OutletType.MAIN, deletedAt: null },
  });
}

/** Satu query untuk seluruh outlet aktif — basis audit in-memory O(n). */
export async function fetchActiveOutlets(tx?: PrismaTx): Promise<ActiveOutletRow[]> {
  const client = tx ?? prisma;
  return client.$queryRaw<ActiveOutletRow[]>(ACTIVE_OUTLET_SQL);
}

/**
 * Perbaikan hierarki outlet — batch SQL idempotent dalam satu transaksi.
 * Urutan: promote MAIN → demote duplikat → clear parent MAIN → link BRANCH.
 */
export async function repairOutletHierarchyBatch(tx: PrismaTx): Promise<{
  promoted: number;
  demoted: number;
  clearedMainParent: number;
  linkedBranches: number;
}> {
  const promoted = await tx.$executeRaw`
    UPDATE outlets o
    SET
      type = 'MAIN'::"OutletType",
      "parentOutletId" = NULL,
      "updatedAt" = NOW()
    FROM (
      SELECT DISTINCT ON ("tenantId") id
      FROM outlets
      WHERE "deletedAt" IS NULL
        AND "tenantId" IN (
          SELECT "tenantId"
          FROM outlets
          WHERE "deletedAt" IS NULL
          GROUP BY "tenantId"
          HAVING COUNT(*) FILTER (WHERE type = 'MAIN') = 0
        )
      ORDER BY "tenantId", "createdAt" ASC
    ) oldest
    WHERE o.id = oldest.id
  `;

  const demoted = await tx.$executeRaw`
    UPDATE outlets o
    SET
      type = 'BRANCH'::"OutletType",
      "parentOutletId" = canonical.main_id,
      "updatedAt" = NOW()
    FROM (
      SELECT DISTINCT ON ("tenantId") id AS main_id, "tenantId"
      FROM outlets
      WHERE type = 'MAIN' AND "deletedAt" IS NULL
      ORDER BY "tenantId", "createdAt" ASC
    ) canonical
    WHERE o."tenantId" = canonical."tenantId"
      AND o.type = 'MAIN'
      AND o."deletedAt" IS NULL
      AND o.id <> canonical.main_id
  `;

  const clearedMainParent = await tx.$executeRaw`
    UPDATE outlets
    SET "parentOutletId" = NULL, "updatedAt" = NOW()
    WHERE type = 'MAIN'
      AND "parentOutletId" IS NOT NULL
      AND "deletedAt" IS NULL
  `;

  const linkedBranches = await tx.$executeRaw`
    UPDATE outlets branch
    SET "parentOutletId" = main.id, "updatedAt" = NOW()
    FROM outlets main
    WHERE branch."tenantId" = main."tenantId"
      AND main.type = 'MAIN'
      AND main."deletedAt" IS NULL
      AND branch.type = 'BRANCH'
      AND branch."deletedAt" IS NULL
      AND branch.id <> main.id
      AND branch."parentOutletId" IS DISTINCT FROM main.id
  `;

  return { promoted, demoted, clearedMainParent, linkedBranches };
}

/** Bangun laporan issue dari snapshot outlet (tanpa query tambahan). */
export function detectIssues(outlets: ActiveOutletRow[]): OutletIntegrityIssue[] {
  const byTenant = new Map<string, ActiveOutletRow[]>();

  for (const outlet of outlets) {
    const list = byTenant.get(outlet.tenantId) ?? [];
    list.push(outlet);
    byTenant.set(outlet.tenantId, list);
  }

  const issues: OutletIntegrityIssue[] = [];

  for (const [tenantId, tenantOutlets] of byTenant) {
    const mains = tenantOutlets.filter((o) => o.type === 'MAIN');
    const branches = tenantOutlets.filter((o) => o.type === 'BRANCH');
    const canonicalMain = mains.length > 0 ? resolveOldest(mains) : null;

    if (mains.length === 0 && tenantOutlets.length > 0) {
      issues.push({
        code: 'TENANT_WITHOUT_MAIN',
        tenantId,
        detail: `Tenant memiliki ${tenantOutlets.length} outlet aktif tanpa Outlet Utama (MAIN).`,
      });
    }

    if (mains.length > 1) {
      for (const main of mains) {
        if (main.id === canonicalMain?.id) continue;
        issues.push({
          code: 'MULTIPLE_MAIN',
          tenantId,
          outletId: main.id,
          outletName: main.name,
          detail: 'Lebih dari satu outlet bertipe MAIN dalam tenant yang sama.',
        });
      }
    }

    for (const main of mains) {
      if (main.parentOutletId !== null) {
        issues.push({
          code: 'MAIN_HAS_PARENT',
          tenantId,
          outletId: main.id,
          outletName: main.name,
          detail: `Outlet MAIN "${main.name}" memiliki parentOutletId yang seharusnya NULL.`,
        });
      }
    }

    for (const branch of branches) {
      if (!branch.parentOutletId) {
        issues.push({
          code: 'ORPHAN_BRANCH',
          tenantId,
          outletId: branch.id,
          outletName: branch.name,
          detail: `Cabang "${branch.name}" tidak memiliki parentOutletId.`,
        });
        continue;
      }

      if (!canonicalMain || branch.parentOutletId !== canonicalMain.id) {
        issues.push({
          code: 'BRANCH_WRONG_PARENT',
          tenantId,
          outletId: branch.id,
          outletName: branch.name,
          detail: canonicalMain
            ? `Cabang "${branch.name}" harus menempel ke MAIN "${canonicalMain.name}".`
            : `Cabang "${branch.name}" memiliki parent yang tidak valid.`,
        });
      }
    }
  }

  return issues;
}

function resolveOldest(outlets: ActiveOutletRow[]): ActiveOutletRow {
  return [...outlets].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
}

export function buildSummary(
  issues: OutletIntegrityIssue[]
): Record<OutletIntegrityIssueCode, number> {
  const summary: Record<OutletIntegrityIssueCode, number> = {
    TENANT_WITHOUT_MAIN: 0,
    ORPHAN_BRANCH: 0,
    MAIN_HAS_PARENT: 0,
    BRANCH_WRONG_PARENT: 0,
    MULTIPLE_MAIN: 0,
  };

  for (const issue of issues) {
    summary[issue.code] += 1;
  }

  return summary;
}

/** Agregat statistik outlet — 2 query groupBy paralel, bukan N+1. */
export async function fetchOutletStats(outletIds: string[]): Promise<{
  staffByOutlet: Map<string, number>;
  stockSkuByOutlet: Map<string, number>;
}> {
  const staffByOutlet = new Map<string, number>();
  const stockSkuByOutlet = new Map<string, number>();

  if (outletIds.length === 0) {
    return { staffByOutlet, stockSkuByOutlet };
  }

  const [staffGroups, stockGroups] = await Promise.all([
    prisma.userOutlet.groupBy({
      by: ['outletId'],
      where: {
        outletId: { in: outletIds },
        user: { deletedAt: null, approvalStatus: 'APPROVED' },
      },
      _count: { _all: true },
    }),
    prisma.outletStock.groupBy({
      by: ['outletId'],
      where: {
        outletId: { in: outletIds },
        product: { deletedAt: null },
      },
      _count: { _all: true },
    }),
  ]);

  for (const row of staffGroups) {
    staffByOutlet.set(row.outletId, row._count._all);
  }
  for (const row of stockGroups) {
    stockSkuByOutlet.set(row.outletId, row._count._all);
  }

  return { staffByOutlet, stockSkuByOutlet };
}

export function attachOutletStats<T extends { id: string }>(
  outlets: T[],
  staffByOutlet: Map<string, number>,
  stockSkuByOutlet: Map<string, number>
): Array<T & { activeStaff: number; totalStockSKUs: number }> {
  return outlets.map((outlet) => ({
    ...outlet,
    activeStaff: staffByOutlet.get(outlet.id) ?? 0,
    totalStockSKUs: stockSkuByOutlet.get(outlet.id) ?? 0,
  }));
}
