import { BarChart2 } from 'lucide-react';
import { useDashboardAdmin } from '../hooks/useDashboardAdmin';
import { AppShellHeader } from './AppShellHeader';
import { DashboardContent } from './dashboard-admin';

export default function DashboardAdmin() {
  const dashboard = useDashboardAdmin();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150">
      <AppShellHeader
        title="Dashboard & Laporan"
        subtitle="Analitik kinerja & laba tenant"
        icon={BarChart2}
        accent="indigo"
        user={dashboard.user}
        onLogout={dashboard.handleLogout}
        showOutletSwitcher={dashboard.tenantWideAccess}
        outletSwitcherAllowAll
      />

      <DashboardContent dashboard={dashboard} />
    </div>
  );
}
