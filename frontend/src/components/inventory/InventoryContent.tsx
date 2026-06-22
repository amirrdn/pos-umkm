import { InventoryAlerts } from './InventoryAlerts';
import { InventoryTabBar } from './InventoryTabBar';
import { InventoryOverviewPanel } from './InventoryOverviewPanel';
import { StockRequestsPanel } from './StockRequestsPanel';
import { TransfersPanel } from './TransfersPanel';
import type { UseInventoryReturn } from '../../hooks/useInventory';

export interface InventoryContentProps {
  inventory: UseInventoryReturn;
}

export function InventoryContent({ inventory }: InventoryContentProps) {
  const {
    error,
    successMsg,
    lowStockCount,
    activeTab,
    lowStockItems,
    setActiveTab,
    isOwnerOrManager,
    stockRequests,
    currentUser,
    draftTransferCount,
    isOwner,
    requireStockApproval,
    settingsLoading,
    handleToggleSettings,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategoryName,
    setSelectedCategoryName,
    selectedStockFilter,
    setSelectedStockFilter,
    categories,
    summaryStats,
    resetFilters,
    loading,
    canMutate,
    isBelowMinStock,
    openLedgerModal,
    openMutationModal,
    requestsLoading,
    handleProcessRequest,
    transfers,
    transfersLoading,
    setTransferForm,
    setTransferFormError,
    setIsTransferModalOpen,
    setConfirmModal,
    approveTransfer,
    completeTransfer,
    cancelTransfer,
    showSuccess,
    fetchInventory,
    refreshDraftCount,
    setError,
  } = inventory;

  const isFiltered = searchQuery !== '' || selectedCategoryName !== '' || selectedStockFilter !== 'all';

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full overflow-y-auto lg:overflow-hidden flex flex-col gap-4 min-h-0">
      <InventoryAlerts
        error={error}
        successMsg={successMsg}
        lowStockCount={lowStockCount}
        activeTab={activeTab}
        lowStockItems={lowStockItems}
      />

      <InventoryTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        isOwnerOrManager={isOwnerOrManager}
        stockRequestCount={stockRequests.length}
        currentUser={currentUser}
        draftTransferCount={draftTransferCount}
        isOwner={isOwner}
        requireStockApproval={requireStockApproval}
        settingsLoading={settingsLoading}
        onToggleSettings={handleToggleSettings}
      />

      {activeTab === 'inventory' && (
        <InventoryOverviewPanel
          products={filteredProducts}
          loading={loading}
          canMutate={canMutate}
          isBelowMinStock={isBelowMinStock}
          onOpenLedger={openLedgerModal}
          onOpenMutation={openMutationModal}
          summaryStats={summaryStats}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedCategoryName={selectedCategoryName}
          onCategoryChange={setSelectedCategoryName}
          categories={categories}
          selectedStockFilter={selectedStockFilter}
          onStockFilterChange={setSelectedStockFilter}
          resetFilters={resetFilters}
          isFiltered={isFiltered}
        />
      )}

      {activeTab === 'requests' && isOwnerOrManager && (
        <StockRequestsPanel
          stockRequests={stockRequests}
          requestsLoading={requestsLoading}
          onProcessRequest={handleProcessRequest}
        />
      )}

      {activeTab === 'transfers' && (
        <TransfersPanel
          transfers={transfers}
          transfersLoading={transfersLoading}
          currentUser={currentUser}
          setTransferForm={setTransferForm}
          setTransferFormError={setTransferFormError}
          setIsTransferModalOpen={setIsTransferModalOpen}
          setConfirmModal={setConfirmModal}
          approveTransfer={approveTransfer}
          completeTransfer={completeTransfer}
          cancelTransfer={cancelTransfer}
          showSuccess={showSuccess}
          fetchInventory={fetchInventory}
          refreshDraftCount={refreshDraftCount}
          setError={setError}
        />
      )}
    </main>
  );
}
