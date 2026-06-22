export type DashboardTab = 'OVERVIEW' | 'CASHIERS_SHIFTS';

export interface SummaryData {
  revenueToday: number;
  revenueMonth: number;
  transactionsTodayCount: number;
  profitToday: number;
  profitMonth: number;
}

export interface BestSellerProduct {
  productId: string;
  name: string;
  sku: string;
  totalQuantity: number;
}

export interface TrendData {
  date: string;
  revenue: number;
  profit: number;
  customerTransactions: number;
}

export interface TypeBreakdownRow {
  revenueToday: number;
  revenueMonth: number;
  profitToday: number;
  profitMonth: number;
  transactionsToday: number;
  outletCount: number;
}

export interface BreakdownData {
  byType: {
    MAIN: TypeBreakdownRow;
    BRANCH: TypeBreakdownRow;
  };
}

export interface LowStockSummary {
  count: number;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    outletId: string;
    outletName: string;
    stock: number;
    minStock: number;
  }>;
}

export interface CashierReport {
  cashierId: string;
  name: string;
  email: string;
  totalTransactions: number;
  totalSales: number;
  cashSales: number;
  qrisSales: number;
  debtSales: number;
}

export interface ShiftReport {
  id: string;
  cashierName: string;
  startTime: string;
  endTime: string | null;
  cashStart: number;
  cashExpected: number;
  cashActual: number | null;
  difference: number | null;
  status: string;
  totalSales: number;
  cashSales: number;
  qrisSales: number;
  debtSales: number;
  transactionCount: number;
}

export interface TypeBreakdownChartRow {
  label: string;
  omset: number;
  laba: number;
}

export interface DashboardData {
  summary: SummaryData;
  bestSellers: BestSellerProduct[];
  trendData: TrendData[];
  cashierReports: CashierReport[];
  shiftReports: ShiftReport[];
  lowStock: LowStockSummary;
  breakdown: BreakdownData | null;
}
