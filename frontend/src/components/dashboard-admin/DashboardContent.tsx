import { DashboardWelcomeBanner } from './DashboardWelcomeBanner';
import { DashboardErrorBanner } from './DashboardErrorBanner';
import { DashboardTabBar } from './DashboardTabBar';
import { DashboardOverviewPanel } from './DashboardOverviewPanel';
import { DashboardCashiersShiftsPanel } from './DashboardCashiersShiftsPanel';
import type { UseDashboardAdminReturn } from '../../hooks/useDashboardAdmin';

export interface DashboardContentProps {
  dashboard: UseDashboardAdminReturn;
}

export function DashboardContent({ dashboard }: DashboardContentProps) {
  const {
    activeOutletId,
    tenantWideAccess,
    loading,
    error,
    fetchData,
    activeTab,
    setActiveTab,
  } = dashboard;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 min-h-0">
      <DashboardWelcomeBanner
        activeOutletId={activeOutletId}
        tenantWideAccess={tenantWideAccess}
        loading={loading}
        onRefresh={fetchData}
      />

      {error && <DashboardErrorBanner error={error} />}

      <DashboardTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'OVERVIEW' && <DashboardOverviewPanel dashboard={dashboard} />}
      {activeTab === 'CASHIERS_SHIFTS' && <DashboardCashiersShiftsPanel dashboard={dashboard} />}
    </main>
  );
}
