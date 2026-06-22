import { StaffFormModal } from './StaffFormModal';
import { StaffDeleteModal } from './StaffDeleteModal';
import { StaffConfirmModal } from './StaffConfirmModal';
import { StaffDetailDrawer } from './StaffDetailDrawer';
import type { UseStaffManagementReturn } from '../../hooks/useStaffManagement';

export interface StaffModalsProps {
  staffManagement: UseStaffManagementReturn;
}

export function StaffModals({ staffManagement }: StaffModalsProps) {
  const {
    deleteTarget,
    setDeleteTarget,
    submitting,
    handleDeleteStaff,
    confirmAction,
    setConfirmAction,
    processingStaffId,
    executeConfirmAction,
    detailStaff,
    staffDetail,
    detailLoading,
    activeTab,
    currentUser,
    closeDetailDrawer,
    openEditModalFromDetail,
  } = staffManagement;

  return (
    <>
      <StaffFormModal staffManagement={staffManagement} />
      <StaffConfirmModal
        confirmAction={confirmAction}
        submitting={processingStaffId !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void executeConfirmAction()}
      />
      <StaffDeleteModal
        deleteTarget={deleteTarget}
        submitting={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStaff}
      />
      <StaffDetailDrawer
        staff={detailStaff}
        detail={staffDetail}
        loading={detailLoading}
        activeTab={activeTab}
        isSelf={detailStaff?.id === currentUser?.id}
        onClose={closeDetailDrawer}
        onEdit={openEditModalFromDetail}
      />
    </>
  );
}
