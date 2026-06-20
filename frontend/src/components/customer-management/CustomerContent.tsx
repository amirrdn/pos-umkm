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
    openRepayModal,
  } = customerManagement;

  return (
    <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
      <CustomerSearchBar
        searchQuery={searchQuery}
        loading={loading}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        onRefresh={() => fetchCustomers(searchQuery)}
      />

      <CustomerListPanel
        customers={customers}
        loading={loading}
        error={error}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onRepay={openRepayModal}
      />
    </main>
  );
}
