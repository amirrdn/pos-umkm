import { CustomerOverviewStats } from './CustomerOverviewStats';
import { CustomerListPanel } from './CustomerListPanel';
import { CustomerSearchBar } from './CustomerSearchBar';
import type { UseCustomerManagementReturn } from '../../hooks/useCustomerManagement';

export interface CustomerContentProps {
  customerManagement: UseCustomerManagementReturn;
}

export function CustomerContent({ customerManagement }: CustomerContentProps) {
  const {
    customers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchCustomers,
    handleSearchSubmit,
    handleClearSearch,
    openEditModal,
    handleDelete,
  } = customerManagement;

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 min-h-0">
      {/* Panel Kartu Statistik Ringkasan Pelanggan */}
      <CustomerOverviewStats customers={customers} />

      {/* Wadah Tabel Utama Pelanggan */}
      <div className="flex-1 min-h-[560px] lg:min-h-[640px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs hover:shadow-md dark:shadow-none flex flex-col overflow-hidden backdrop-blur-md transition-all">
        {/* Toolbar & Form Pencarian */}
        <CustomerSearchBar
          searchQuery={searchQuery}
          loading={loading}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onClearSearch={handleClearSearch}
          onRefresh={() => fetchCustomers(searchQuery)}
          totalCount={customers.length}
        />

        {/* Tabel / Kartu Pelanggan */}
        <CustomerListPanel
          customers={customers}
          loading={loading}
          error={error}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>
    </main>
  );
}
