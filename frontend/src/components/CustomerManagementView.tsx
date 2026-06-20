import { Plus, Users } from 'lucide-react';
import { useCustomerManagement } from '../hooks/useCustomerManagement';
import { AppShellHeader } from './AppShellHeader';
import { CustomerContent, CustomerModals } from './customer-management';

export const CustomerManagementView = () => {
  const customerManagement = useCustomerManagement();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      <AppShellHeader
        title="Kelola Pelanggan"
        subtitle="Database membership & poin loyalitas"
        icon={Users}
        accent="indigo"
        user={customerManagement.user}
        onLogout={customerManagement.handleLogout}
        showOutletSwitcher={false}
        trailingActions={
          <button
            onClick={customerManagement.openCreateModal}
            type="button"
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Tambah Pelanggan</span>
          </button>
        }
      />

      <CustomerContent customerManagement={customerManagement} />
      <CustomerModals customerManagement={customerManagement} />
    </div>
  );
};
