import { StaffAlerts } from './StaffAlerts';
import { StaffTabBar } from './StaffTabBar';
import { StaffListPanel } from './StaffListPanel';
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
    openAddModal,
    handleApproveStaff,
    handleRejectStaff,
    handleToggleStatus,
    openEditModal,
    setDeleteTarget,
  } = staffManagement;

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <StaffAlerts error={error} successMsg={successMsg} />

      <StaffTabBar
        activeTab={activeTab}
        activeStaffCount={activeStaffCount}
        pendingStaffCount={pendingStaffCount}
        onTabChange={setActiveTab}
      />

      <StaffListPanel
        loading={loading}
        activeTab={activeTab}
        displayedStaff={displayedStaff}
        currentUserId={currentUser?.id}
        onOpenAddModal={openAddModal}
        onApprove={handleApproveStaff}
        onReject={handleRejectStaff}
        onToggleStatus={handleToggleStatus}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />
    </main>
  );
}
