import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import {
  approveStaffApi,
  bulkApproveStaffApi,
  createStaffApi,
  deleteStaffApi,
  getOutletHierarchyApi,
  getStaffDetailApi,
  getStaffListApi,
  getStaffRolesApi,
  rejectStaffApi,
  toggleStaffStatusApi,
  updateStaffApi,
} from '../api/staffManagementApi';
import {
  buildStaffFormFromUser,
  buildStaffListQuery,
  createEmptyStaffForm,
  findDefaultRoleId,
  hasStaffFormFieldErrors,
  isStaffManagementAllowed,
  validateStaffAccessStep,
  validateStaffAccountStep,
} from '../utils/staffManagementHelpers';
import type {
  OutletHierarchy,
  StaffConfirmAction,
  StaffDetail,
  StaffFormFieldErrors,
  StaffFormState,
  StaffFormStep,
  StaffOverviewMetrics,
  StaffRole,
  StaffRoleFilter,
  StaffTab,
  StaffUser,
} from '../types/staffManagement';

interface FetchStaffOptions {
  search?: string;
  roleFilter?: StaffRoleFilter;
  tab?: StaffTab;
}

const emptyStaffOverviewMetrics: StaffOverviewMetrics = {
  activeStaffCount: 0,
  inactiveStaffCount: 0,
  pendingApprovalCount: 0,
};

export function useStaffManagement() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const fetchActiveSubscription = useSubscriptionStore((state) => state.fetchActiveSubscription);

  const [displayedStaff, setDisplayedStaff] = useState<StaffUser[]>([]);
  const [staffOverviewMetrics, setStaffOverviewMetrics] =
    useState<StaffOverviewMetrics>(emptyStaffOverviewMetrics);
  const [outletHierarchy, setOutletHierarchy] = useState<OutletHierarchy>({ main: null, branches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<StaffTab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rolesList, setRolesList] = useState<StaffRole[]>([]);
  const [newStaff, setNewStaff] = useState<StaffFormState>(createEmptyStaffForm(''));
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<StaffConfirmAction | null>(null);
  const [processingStaffId, setProcessingStaffId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<StaffFormStep>(1);
  const [fieldErrors, setFieldErrors] = useState<StaffFormFieldErrors>({});
  const [detailStaff, setDetailStaff] = useState<StaffUser | null>(null);
  const [staffDetail, setStaffDetail] = useState<StaffDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const staffQuota = subscription?.usage.staff ?? null;
  const canRegisterNewStaff =
    subscription?.platformAdminBypass === true || staffQuota === null || !staffQuota.isFull;

  const isStaffManagementSessionAllowed = isStaffManagementAllowed(currentUser?.roles);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showSuccess = useCallback((message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 3000);
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const roles = await getStaffRolesApi();
      setRolesList(roles);
      setNewStaff((previous) => ({
        ...previous,
        roleId: previous.roleId || findDefaultRoleId(roles),
      }));
    } catch (err) {
      console.error('Gagal mengambil daftar peran:', err);
    }
  }, []);

  const fetchOutletHierarchy = useCallback(async () => {
    try {
      setOutletHierarchy(await getOutletHierarchyApi());
    } catch (err) {
      console.error('Gagal mengambil hierarki outlet:', err);
    }
  }, []);

  const fetchStaff = useCallback(
    async (options?: FetchStaffOptions) => {
      const tab = options?.tab ?? activeTab;
      const search = options?.search ?? searchQuery;
      const role = options?.roleFilter ?? roleFilter;

      try {
        setLoading(true);
        setError(null);
        const result = await getStaffListApi(buildStaffListQuery(tab, search, role));
        setDisplayedStaff(result.staff);
        setStaffOverviewMetrics(result.summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mengambil data staf.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, roleFilter, searchQuery]
  );

  const refreshStaffPage = useCallback(async () => {
    await Promise.all([fetchStaff(), fetchActiveSubscription()]);
  }, [fetchStaff, fetchActiveSubscription]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isStaffManagementSessionAllowed) {
      navigate('/pos');
      return;
    }

    Promise.resolve().then(() => {
      void Promise.all([fetchRoles(), fetchOutletHierarchy(), fetchActiveSubscription()]);
    });
  }, [
    isAuthenticated,
    currentUser,
    navigate,
    fetchRoles,
    fetchOutletHierarchy,
    fetchActiveSubscription,
    isStaffManagementSessionAllowed,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isStaffManagementSessionAllowed) {
      return;
    }

    Promise.resolve().then(() => {
      void fetchStaff();
    });
  }, [activeTab, roleFilter, isAuthenticated, isStaffManagementSessionAllowed, fetchStaff]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setSelectedStaffIds([]);
      setDetailStaff(null);
      setStaffDetail(null);
    });
  }, [activeTab]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void fetchStaff();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setRoleFilter('all');
    void fetchStaff({ search: '', roleFilter: 'all' });
  };

  const resetStaffFormState = () => {
    setFormStep(1);
    setFieldErrors({});
    setModalError(null);
  };

  const openAddModal = () => {
    if (!canRegisterNewStaff) {
      setError('Kuota staf paket Anda sudah penuh. Upgrade paket untuk menambah karyawan.');
      return;
    }
    setEditingStaff(null);
    setNewStaff(createEmptyStaffForm(findDefaultRoleId(rolesList)));
    resetStaffFormState();
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setNewStaff(buildStaffFormFromUser(staff));
    resetStaffFormState();
    setIsModalOpen(true);
  };

  const advanceFormStep = () => {
    const accountErrors = validateStaffAccountStep(newStaff, false);
    if (hasStaffFormFieldErrors(accountErrors)) {
      setFieldErrors(accountErrors);
      return;
    }
    setFieldErrors({});
    setFormStep(2);
  };

  const retreatFormStep = () => {
    setFieldErrors({});
    setFormStep(1);
  };

  const requestApproveStaff = (staff: StaffUser) => {
    setConfirmAction({ type: 'approve', staff });
  };

  const requestRejectStaff = (staff: StaffUser) => {
    setConfirmAction({ type: 'reject', staff });
  };

  const requestBulkApprove = () => {
    if (selectedStaffIds.length === 0) {
      return;
    }
    setConfirmAction({ type: 'bulk-approve', staffIds: selectedStaffIds });
  };

  const openDetailDrawer = (staff: StaffUser) => {
    setDetailStaff(staff);
    setStaffDetail(null);
    setDetailLoading(true);

    void (async () => {
      try {
        const detail = await getStaffDetailApi(staff.id);
        setStaffDetail(detail);
      } catch (err) {
        console.error('Gagal mengambil detail staf:', err);
      } finally {
        setDetailLoading(false);
      }
    })();
  };

  const closeDetailDrawer = () => {
    setDetailStaff(null);
    setStaffDetail(null);
    setDetailLoading(false);
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((previous) =>
      previous.includes(staffId)
        ? previous.filter((id) => id !== staffId)
        : [...previous, staffId]
    );
  };

  const toggleSelectAllPending = () => {
    const pendingIds = displayedStaff.map((staff) => staff.id);
    const isAllSelected =
      pendingIds.length > 0 && pendingIds.every((id) => selectedStaffIds.includes(id));

    setSelectedStaffIds(isAllSelected ? [] : pendingIds);
  };

  const clearStaffSelection = () => {
    setSelectedStaffIds([]);
  };

  const requestToggleStaffStatus = (staff: StaffUser) => {
    setConfirmAction({
      type: staff.isActive ? 'deactivate' : 'activate',
      staff,
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }

    const { type, staff, staffIds } = confirmAction;

    try {
      setProcessingStaffId(staff?.id ?? 'bulk');
      setError(null);

      if (type === 'bulk-approve') {
        const ids = staffIds ?? [];
        const result = await bulkApproveStaffApi(ids);
        showSuccess(`${result.approvedCount} permintaan staf berhasil disetujui.`);
        setSelectedStaffIds([]);
      } else if (!staff) {
        return;
      } else {
        const staffId = staff.id;

        if (type === 'approve') {
          const updated = await approveStaffApi(staffId);
          showSuccess(`Pendaftaran staf "${updated.name}" berhasil disetujui.`);
        } else if (type === 'reject') {
          const updated = await rejectStaffApi(staffId);
          showSuccess(`Pendaftaran staf "${updated.name}" ditolak.`);
        } else if (type === 'deactivate') {
          const updated = await toggleStaffStatusApi(staffId, false);
          showSuccess(`Staf "${updated.name}" dinonaktifkan.`);
        } else {
          const updated = await toggleStaffStatusApi(staffId, true);
          showSuccess(`Staf "${updated.name}" diaktifkan kembali.`);
        }
      }

      setConfirmAction(null);
      await Promise.all([fetchStaff(), fetchActiveSubscription()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memproses permintaan staf.';
      setError(message);
    } finally {
      setProcessingStaffId(null);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await deleteStaffApi(deleteTarget.id);
      showSuccess(`Staf "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      await Promise.all([fetchStaff(), fetchActiveSubscription()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus staf.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingStaff && formStep === 1) {
      advanceFormStep();
      return;
    }

    const isEdit = Boolean(editingStaff);
    const accountErrors = validateStaffAccountStep(newStaff, isEdit);
    const accessErrors = validateStaffAccessStep(newStaff, rolesList, outletHierarchy);
    const validationErrors = { ...accountErrors, ...accessErrors };

    if (hasStaffFormFieldErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      if (!isEdit && hasStaffFormFieldErrors(accountErrors)) {
        setFormStep(1);
      }
      return;
    }

    if (!isEdit && !canRegisterNewStaff) {
      setModalError('Kuota staf paket Anda sudah penuh. Upgrade paket untuk menambah karyawan.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      setFieldErrors({});

      const result = isEdit
        ? await updateStaffApi(editingStaff!.id, {
            name: newStaff.name.trim(),
            roleId: newStaff.roleId,
            outletIds: newStaff.outletIds,
          })
        : await createStaffApi({
            ...newStaff,
            name: newStaff.name.trim(),
            email: newStaff.email.trim(),
          });

      showSuccess(
        isEdit
          ? `Karyawan "${result.name}" berhasil diperbarui.`
          : `Karyawan baru "${result.name}" berhasil didaftarkan.`
      );
      setIsModalOpen(false);
      setNewStaff(createEmptyStaffForm(findDefaultRoleId(rolesList)));
      setEditingStaff(null);
      resetStaffFormState();
      await Promise.all([fetchStaff(), fetchActiveSubscription()]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Gagal ${editingStaff ? 'memperbarui' : 'menambahkan'} staf.`;
      setModalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOutletToggle = (outletId: string) => {
    setNewStaff((previous) => {
      const exists = previous.outletIds.includes(outletId);
      const outletIds = exists
        ? previous.outletIds.filter((id) => id !== outletId)
        : [...previous.outletIds, outletId];
      return { ...previous, outletIds };
    });
  };

  const hasActiveStaffFilters = searchQuery.trim().length > 0 || roleFilter !== 'all';
  const activeStaffCount =
    staffOverviewMetrics.activeStaffCount + staffOverviewMetrics.inactiveStaffCount;
  const pendingStaffCount = staffOverviewMetrics.pendingApprovalCount;
  const tabStaffCount = activeTab === 'active' ? activeStaffCount : pendingStaffCount;
  const isStaffListFilteredEmpty =
    !loading && displayedStaff.length === 0 && hasActiveStaffFilters && tabStaffCount > 0;

  const selectPendingTab = () => setActiveTab('pending');

  const openEditModalFromDetail = (staff: StaffUser) => {
    closeDetailDrawer();
    openEditModal(staff);
  };

  const pendingIds = displayedStaff.map((staff) => staff.id);
  const isAllPendingSelected =
    activeTab === 'pending' &&
    pendingIds.length > 0 &&
    pendingIds.every((id) => selectedStaffIds.includes(id));

  const navigateToUpgradePlan = () => navigate('/admin/pricing');

  return {
    currentUser,
    handleLogout,
    outletHierarchy,
    loading,
    error,
    successMsg,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    isModalOpen,
    setIsModalOpen,
    rolesList,
    newStaff,
    setNewStaff,
    submitting,
    modalError,
    editingStaff,
    deleteTarget,
    setDeleteTarget,
    confirmAction,
    setConfirmAction,
    processingStaffId,
    formStep,
    fieldErrors,
    staffQuota,
    canRegisterNewStaff,
    staffOverviewMetrics,
    fetchStaff,
    refreshStaffPage,
    handleSearchSubmit,
    handleClearSearch,
    handleToggleStatus: requestToggleStaffStatus,
    handleDeleteStaff,
    handleApproveStaff: requestApproveStaff,
    handleRejectStaff: requestRejectStaff,
    executeConfirmAction,
    openAddModal,
    openEditModal,
    advanceFormStep,
    retreatFormStep,
    handleCreateStaff,
    handleOutletToggle,
    displayedStaff,
    activeStaffCount,
    pendingStaffCount,
    isStaffListFilteredEmpty,
    selectPendingTab,
    navigateToUpgradePlan,
    detailStaff,
    staffDetail,
    detailLoading,
    openDetailDrawer,
    closeDetailDrawer,
    openEditModalFromDetail,
    selectedStaffIds,
    toggleStaffSelection,
    toggleSelectAllPending,
    clearStaffSelection,
    isAllPendingSelected,
    requestBulkApprove,
  };
}

export type UseStaffManagementReturn = ReturnType<typeof useStaffManagement>;
