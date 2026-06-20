import { StaffFormModal } from './StaffFormModal';
import { StaffDeleteModal } from './StaffDeleteModal';
import type { UseStaffManagementReturn } from '../../hooks/useStaffManagement';

export interface StaffModalsProps {
  staffManagement: UseStaffManagementReturn;
}

export function StaffModals({ staffManagement }: StaffModalsProps) {
  const { deleteTarget, setDeleteTarget, submitting, handleDeleteStaff } = staffManagement;

  return (
    <>
      <StaffFormModal staffManagement={staffManagement} />
      <StaffDeleteModal
        deleteTarget={deleteTarget}
        submitting={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStaff}
      />
    </>
  );
}
