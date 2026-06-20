import { MutationModal } from './MutationModal';
import { StockLedgerDrawer } from './StockLedgerDrawer';
import { CreateTransferModal } from './CreateTransferModal';
import { ConfirmModal } from './ConfirmModal';
import type { UseInventoryReturn } from '../../hooks/useInventory';

export interface InventoryModalsProps {
  inventory: UseInventoryReturn;
}

export function InventoryModals({ inventory }: InventoryModalsProps) {
  const {
    isMutationModalOpen,
    setIsMutationModalOpen,
    selectedProduct,
    mutationSubmitting,
    mutationError,
    mutationForm,
    setMutationForm,
    mutationOutletStock,
    mutationStockLoading,
    selectedMutationOutlet,
    accessibleOutlets,
    mutationEligibleOutlets,
    mutationOutletGroups,
    handleMutationTypeChange,
    handleMutationSubmit,
    isLedgerModalOpen,
    setIsLedgerModalOpen,
    ledgerProduct,
    ledgerEntries,
    ledgerLoading,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferForm,
    setTransferForm,
    transferSubmitting,
    transferFormError,
    transferFromOutletOptions,
    transferToOutletOptions,
    sourceProductSelectOptions,
    sourceOutletProducts,
    sourceOutletLoading,
    handleTransferSubmit,
    confirmModal,
    setConfirmModal,
    confirmLoading,
    setConfirmLoading,
  } = inventory;

  return (
    <>
      {isMutationModalOpen && selectedProduct && (
        <MutationModal
          selectedProduct={selectedProduct}
          mutationSubmitting={mutationSubmitting}
          mutationError={mutationError}
          mutationForm={mutationForm}
          setMutationForm={setMutationForm}
          mutationOutletStock={mutationOutletStock}
          mutationStockLoading={mutationStockLoading}
          selectedMutationOutlet={selectedMutationOutlet}
          accessibleOutlets={accessibleOutlets}
          mutationEligibleOutlets={mutationEligibleOutlets}
          mutationOutletGroups={mutationOutletGroups}
          handleMutationTypeChange={handleMutationTypeChange}
          handleMutationSubmit={handleMutationSubmit}
          onClose={() => setIsMutationModalOpen(false)}
        />
      )}

      {isLedgerModalOpen && ledgerProduct && (
        <StockLedgerDrawer
          ledgerProduct={ledgerProduct}
          ledgerEntries={ledgerEntries}
          ledgerLoading={ledgerLoading}
          onClose={() => setIsLedgerModalOpen(false)}
        />
      )}

      {isTransferModalOpen && (
        <CreateTransferModal
          transferForm={transferForm}
          setTransferForm={setTransferForm}
          transferSubmitting={transferSubmitting}
          transferFormError={transferFormError}
          transferFromOutletOptions={transferFromOutletOptions}
          transferToOutletOptions={transferToOutletOptions}
          sourceProductSelectOptions={sourceProductSelectOptions}
          sourceOutletProducts={sourceOutletProducts}
          sourceOutletLoading={sourceOutletLoading}
          handleTransferSubmit={handleTransferSubmit}
          onClose={() => setIsTransferModalOpen(false)}
        />
      )}

      <ConfirmModal
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        confirmLoading={confirmLoading}
        setConfirmLoading={setConfirmLoading}
      />
    </>
  );
}
