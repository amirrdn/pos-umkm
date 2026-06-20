import type { BreakdownData, TypeBreakdownChartRow } from '../types/dashboardAdmin';

export const DASHBOARD_CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export function formatDashboardRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export function calculateProfitMargin(revenue: number, profit: number): number {
  if (!revenue) return 0;
  return Math.round((profit / revenue) * 100);
}

export function buildTypeBreakdownChartData(breakdown: BreakdownData | null): TypeBreakdownChartRow[] {
  if (!breakdown) return [];
  return [
    {
      label: 'Toko Pusat (MAIN)',
      omset: breakdown.byType.MAIN.revenueMonth,
      laba: breakdown.byType.MAIN.profitMonth,
    },
    {
      label: `Cabang (${breakdown.byType.BRANCH.outletCount} outlet)`,
      omset: breakdown.byType.BRANCH.revenueMonth,
      laba: breakdown.byType.BRANCH.profitMonth,
    },
  ];
}

export function formatChartYAxisTick(val: number): string {
  return `Rp ${val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : `${(val / 1000).toFixed(0)}k`}`;
}

export function formatTrendChartDateTick(date: string): string {
  const parts = date.split('-');
  return `${parts[2]}/${parts[1]}`;
}

export function getChartTooltipStyle(theme: 'light' | 'dark') {
  return {
    backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
    borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
    borderRadius: '1rem',
    color: theme === 'light' ? '#0f172a' : '#f8fafc',
    fontSize: '11px',
    fontFamily: 'monospace',
  };
}

export function getBarChartTooltipStyle(theme: 'light' | 'dark') {
  return {
    backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
    borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
    borderRadius: '0.75rem',
    color: theme === 'light' ? '#0f172a' : '#f8fafc',
    fontSize: '11px',
  };
}

export function getShiftDifferenceClass(difference: number | null): string {
  const hasDiff = difference !== null && difference !== 0;
  const isDeficit = difference !== null && difference < 0;
  if (!hasDiff) return 'text-slate-650 dark:text-slate-400';
  if (isDeficit) return 'text-rose-600 dark:text-rose-450';
  return 'text-amber-600 dark:text-amber-400';
}

export function formatShiftDifference(difference: number | null, formatRupiah: (v: number) => string): string {
  if (difference === null) return '-';
  return `${difference > 0 ? '+' : ''}${formatRupiah(difference)}`;
}

export function formatShiftDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}
