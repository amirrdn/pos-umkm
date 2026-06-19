import type { TransactionProfitInput, OutletMetricsAccumulator } from './analytics.types';

/** Laba bersih transaksi = (harga - HPP) × qty − diskon. */
export function calculateTransactionProfit(tx: TransactionProfitInput): number {
  const itemsProfit = tx.items.reduce((sum, item) => {
    const price = Number(item.priceAtTransaction);
    const cost = Number(item.costAtTransaction ?? 0);
    return sum + (price - cost) * item.quantity;
  }, 0);

  return Math.round(itemsProfit - Number(tx.discount));
}

export function emptyMetrics(): OutletMetricsAccumulator {
  return {
    revenueToday: 0,
    revenueMonth: 0,
    profitToday: 0,
    profitMonth: 0,
    transactionsToday: 0,
  };
}

export function addTodayMetrics(
  acc: OutletMetricsAccumulator,
  revenue: number,
  profit: number
): void {
  acc.revenueToday += revenue;
  acc.profitToday += profit;
  acc.transactionsToday += 1;
}

export function addMonthMetrics(
  acc: OutletMetricsAccumulator,
  revenue: number,
  profit: number
): void {
  acc.revenueMonth += revenue;
  acc.profitMonth += profit;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfLocalMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
