import { DashboardMetricsCards } from './DashboardMetricsCards';
import { DashboardTrendChart } from './DashboardTrendChart';
import { DashboardBreakdownChart } from './DashboardBreakdownChart';
import { DashboardBestSellersChart } from './DashboardBestSellersChart';
import { DashboardBestSellersTable } from './DashboardBestSellersTable';
import type { UseDashboardAdminReturn } from '../../hooks/useDashboardAdmin';

export interface DashboardOverviewPanelProps {
  dashboard: UseDashboardAdminReturn;
}

export function DashboardOverviewPanel({ dashboard }: DashboardOverviewPanelProps) {
  const {
    loading,
    summary,
    lowStock,
    activeOutletId,
    todayMargin,
    monthMargin,
    trendData,
    tenantWideAccess,
    typeBreakdownChartData,
    bestSellers,
  } = dashboard;

  return (
    <>
      <DashboardMetricsCards
        loading={loading}
        summary={summary}
        lowStock={lowStock}
        activeOutletId={activeOutletId}
        todayMargin={todayMargin}
        monthMargin={monthMargin}
      />

      <DashboardTrendChart loading={loading} trendData={trendData} />

      {tenantWideAccess && !activeOutletId && (
        <DashboardBreakdownChart loading={loading} typeBreakdownChartData={typeBreakdownChartData} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DashboardBestSellersChart loading={loading} bestSellers={bestSellers} />
        <DashboardBestSellersTable loading={loading} bestSellers={bestSellers} />
      </div>
    </>
  );
}
