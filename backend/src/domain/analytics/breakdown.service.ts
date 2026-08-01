import { prisma } from '../../lib/prisma';
import type {
  OutletBreakdownResult,
  OutletBreakdownRow,
  OutletMetricsAccumulator,
  PeriodMetrics,
  TransactionProfitInput,
  TypeBreakdownRow,
} from './analytics.types';
import {
  addMonthMetrics,
  addTodayMetrics,
  calculateTransactionProfit,
  emptyMetrics,
  startOfLocalDay,
  startOfLocalMonth,
} from './metrics.utils';

const TX_SELECT = {
  outletId: true,
  grandTotal: true,
  discount: true,
  createdAt: true,
  items: {
    select: {
      priceAtTransaction: true,
      costAtTransaction: true,
      quantity: true,
    },
  },
} as const;

type TxRow = TransactionProfitInput & {
  outletId: string | null;
  createdAt: Date;
};

function accumulateTransaction(
  bucket: OutletMetricsAccumulator,
  tx: TxRow,
  isToday: boolean
): void {
  const revenue = Number(tx.grandTotal ?? 0);
  const profit = calculateTransactionProfit(tx);

  addMonthMetrics(bucket, revenue, profit);
  if (isToday) {
    addTodayMetrics(bucket, revenue, profit);
  }
}

function toTypeRow(
  rows: OutletBreakdownRow[],
  type: 'MAIN' | 'BRANCH'
): TypeBreakdownRow {
  const filtered = rows.filter((r) => r.type === type && r.outletId !== 'unassigned');
  return {
    revenueToday: filtered.reduce((s, r) => s + r.revenueToday, 0),
    revenueMonth: filtered.reduce((s, r) => s + r.revenueMonth, 0),
    profitToday: filtered.reduce((s, r) => s + r.profitToday, 0),
    profitMonth: filtered.reduce((s, r) => s + r.profitMonth, 0),
    transactionsToday: filtered.reduce((s, r) => s + r.transactionsToday, 0),
    outletCount: filtered.length,
  };
}

/**
 * Breakdown penjualan per outlet + agregat MAIN vs BRANCH.
 * 3 query paralel: outlets + transaksi bulan ini (filter hari di memory).
 */
export async function getOutletBreakdown(tenantId: string): Promise<OutletBreakdownResult> {
  return prisma.$executeRawWithTenant(tenantId, async () => {
    const dayStart = startOfLocalDay();
    const monthStart = startOfLocalMonth();

    const [outlets, monthTransactions] = await Promise.all([
      prisma.outlet.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true, type: true, code: true },
        orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.transaction.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: { gte: monthStart },
        },
        select: TX_SELECT,
      }),
    ]);

  const metricsByOutlet = new Map<string, OutletMetricsAccumulator>();
  const unassigned = emptyMetrics();
  const aggregate = emptyMetrics();

  for (const outlet of outlets) {
    metricsByOutlet.set(outlet.id, emptyMetrics());
  }

  for (const tx of monthTransactions) {
    const row = tx as TxRow;
    const isToday = row.createdAt >= dayStart;
    const revenue = Number(row.grandTotal ?? 0);
    const profit = calculateTransactionProfit(row);

    addMonthMetrics(aggregate, revenue, profit);
    if (isToday) addTodayMetrics(aggregate, revenue, profit);

    if (!row.outletId) {
      accumulateTransaction(unassigned, row, isToday);
      continue;
    }

    const bucket = metricsByOutlet.get(row.outletId);
    if (bucket) {
      accumulateTransaction(bucket, row, isToday);
    } else {
      accumulateTransaction(unassigned, row, isToday);
    }
  }

  const byOutlet: OutletBreakdownRow[] = outlets.map((outlet) => {
    const m = metricsByOutlet.get(outlet.id) ?? emptyMetrics();
    return {
      outletId: outlet.id,
      type: outlet.type,
      name: outlet.name,
      code: outlet.code,
      ...m,
    };
  });

  if (unassigned.transactionsToday > 0 || unassigned.revenueMonth > 0) {
    byOutlet.push({
      outletId: 'unassigned',
      type: 'BRANCH',
      name: 'Tanpa Outlet (Legacy)',
      code: null,
      ...unassigned,
    });
  }

  const periodMetrics: PeriodMetrics = { ...aggregate };

  return {
    period: {
      dayStart: dayStart.toISOString(),
      monthStart: monthStart.toISOString(),
    },
    aggregate: periodMetrics,
    byOutlet,
    byType: {
      MAIN: toTypeRow(byOutlet, 'MAIN'),
      BRANCH: toTypeRow(byOutlet, 'BRANCH'),
    },
  };
  });
}
