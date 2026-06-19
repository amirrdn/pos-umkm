export type OutletScopeMode = 'ALL' | 'OUTLET';

export interface OutletScope {
  mode: OutletScopeMode;
  outletId?: string;
}

export interface PeriodMetrics {
  revenueToday: number;
  revenueMonth: number;
  profitToday: number;
  profitMonth: number;
  transactionsToday: number;
}

export interface OutletBreakdownRow {
  outletId: string;
  type: 'MAIN' | 'BRANCH';
  name: string;
  code: string | null;
  revenueToday: number;
  revenueMonth: number;
  profitToday: number;
  profitMonth: number;
  transactionsToday: number;
}

export interface TypeBreakdownRow {
  revenueToday: number;
  revenueMonth: number;
  profitToday: number;
  profitMonth: number;
  transactionsToday: number;
  outletCount: number;
}

export interface OutletBreakdownResult {
  period: { dayStart: string; monthStart: string };
  aggregate: PeriodMetrics;
  byOutlet: OutletBreakdownRow[];
  byType: {
    MAIN: TypeBreakdownRow;
    BRANCH: TypeBreakdownRow;
  };
}

export interface TransactionProfitInput {
  discount: unknown;
  grandTotal?: unknown;
  items: Array<{
    priceAtTransaction: unknown;
    costAtTransaction: unknown;
    quantity: number;
  }>;
}

export interface OutletMetricsAccumulator {
  revenueToday: number;
  revenueMonth: number;
  profitToday: number;
  profitMonth: number;
  transactionsToday: number;
}
