import { StaffAlerts } from './StaffAlerts';
import { StaffTabBar } from './StaffTabBar';
import { StaffListPanel } from './StaffListPanel';
import { StaffOverviewStats } from './StaffOverviewStats';
import { StaffPendingBanner } from './StaffPendingBanner';
import { StaffSearchBar } from './StaffSearchBar';
import { StaffBulkActionBar } from './StaffBulkActionBar';
import type { UseStaffManagementReturn } from '../../hooks/useStaffManagement';

export interface StaffContentProps {
  staffManagement: UseStaffManagementReturn;
}

export function StaffContent({ staffManagement }: StaffContentProps) {
  const {
    error,
    successMsg,
    activeTab,
    setActiveTab,
    activeStaffCount,
    pendingStaffCount,
    loading,
    displayedStaff,
    currentUser,
    rolesList,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    staffOverviewMetrics,
    staffQuota,
    openAddModal,
    handleApproveStaff,
    handleRejectStaff,
    handleToggleStatus,
    openEditModal,
    setDeleteTarget,
    processingStaffId,
    handleSearchSubmit,
    handleClearSearch,
    refreshStaffPage,
    selectPendingTab,
    navigateToUpgradePlan,
    isStaffListFilteredEmpty,
    selectedStaffIds,
    toggleStaffSelection,
    toggleSelectAllPending,
    clearStaffSelection,
    isAllPendingSelected,
    requestBulkApprove,
    openDetailDrawer,
  } = staffManagement;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 min-h-0">
      <StaffAlerts error={error} successMsg={successMsg} />

      <StaffOverviewStats
        loading={loading}
        metrics={staffOverviewMetrics}
        staffQuota={staffQuota}
        onSelectPendingTab={selectPendingTab}
        onUpgradePlan={navigateToUpgradePlan}
      />

      <StaffSearchBar
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        availableRoles={rolesList}
        loading={loading}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        onRoleFilterChange={setRoleFilter}
        onRefresh={() => void refreshStaffPage()}
      />

      {activeTab === 'active' && pendingStaffCount > 0 && (
        <StaffPendingBanner
          pendingApprovalCount={pendingStaffCount}
          onViewPendingRequests={selectPendingTab}
        />
      )}

      <StaffTabBar
        activeTab={activeTab}
        activeStaffCount={activeStaffCount}
        pendingStaffCount={pendingStaffCount}
        onTabChange={setActiveTab}
      />

      {activeTab === 'pending' && displayedStaff.length > 0 && (
        <StaffBulkActionBar
          selectedCount={selectedStaffIds.length}
          totalCount={displayedStaff.length}
          isAllSelected={isAllPendingSelected}
          submitting={processingStaffId === 'bulk'}
          onToggleSelectAll={toggleSelectAllPending}
          onClearSelection={clearStaffSelection}
          onBulkApprove={requestBulkApprove}
        />
      )}

      <StaffListPanel
        loading={loading}
        activeTab={activeTab}
        displayedStaff={displayedStaff}
        isFilteredEmpty={isStaffListFilteredEmpty}
        currentUserId={currentUser?.id}
        processingStaffId={processingStaffId}
        selectedStaffIds={selectedStaffIds}
        onOpenAddModal={openAddModal}
        onApprove={handleApproveStaff}
        onReject={handleRejectStaff}
        onToggleStatus={handleToggleStatus}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
        onSelectStaff={openDetailDrawer}
        onToggleStaffSelection={toggleStaffSelection}
      />
    </main>
  );
}
