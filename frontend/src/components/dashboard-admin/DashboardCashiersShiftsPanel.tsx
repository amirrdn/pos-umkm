import { DashboardCashierReportsPanel } from './DashboardCashierReportsPanel';
import { DashboardShiftReportsPanel } from './DashboardShiftReportsPanel';
import type { UseDashboardAdminReturn } from '../../hooks/useDashboardAdmin';

export interface DashboardCashiersShiftsPanelProps {
  dashboard: UseDashboardAdminReturn;
}

export function DashboardCashiersShiftsPanel({ dashboard }: DashboardCashiersShiftsPanelProps) {
  const { loading, cashierReports, shiftReports } = dashboard;

  return (
    <div className="space-y-8">
      <DashboardCashierReportsPanel loading={loading} cashierReports={cashierReports} />
      <DashboardShiftReportsPanel loading={loading} shiftReports={shiftReports} />
    </div>
  );
}
