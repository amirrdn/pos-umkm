import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  approveStaffApi,
  createStaffApi,
  deleteStaffApi,
  getOutletHierarchyApi,
  getStaffListApi,
  getStaffRolesApi,
  rejectStaffApi,
  toggleStaffStatusApi,
  updateStaffApi,
} from '../api/staffManagementApi';
import {
  buildStaffFormFromUser,
  countStaffByApproval,
  createEmptyStaffForm,
  filterStaffByTab,
  findDefaultRoleId,
  isStaffManagementAllowed,
} from '../utils/staffManagementHelpers';
import type {
  OutletHierarchy,
  StaffFormState,
  StaffRole,
  StaffTab,
  StaffUser,
} from '../types/staffManagement';

export function useStaffManagement() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [outletHierarchy, setOutletHierarchy] = useState<OutletHierarchy>({ main: null, branches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<StaffTab>('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rolesList, setRolesList] = useState<StaffRole[]>([]);
  const [newStaff, setNewStaff] = useState<StaffFormState>(createEmptyStaffForm(''));
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const roles = await getStaffRolesApi();
      setRolesList(roles);
      if (roles.length > 0) {
        setNewStaff((prev) => ({ ...prev, roleId: findDefaultRoleId(roles) }));
      }
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

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStaffList(await getStaffListApi());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil data staf.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!isStaffManagementAllowed(currentUser?.roles)) {
      navigate('/pos');
      return;
    }
    fetchStaff();
    fetchRoles();
    fetchOutletHierarchy();
  }, [token, currentUser, navigate, fetchStaff, fetchRoles, fetchOutletHierarchy]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setError(null);
      const updated = await toggleStaffStatusApi(id, !currentStatus);
      showSuccess(`Status ${updated.name} berhasil diubah.`);
      fetchStaff();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah status staf.';
      setError(message);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      setError(null);
      await deleteStaffApi(deleteTarget.id);
      showSuccess(`Staf "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus staf.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveStaff = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await approveStaffApi(id);
      showSuccess(`Pendaftaran staf "${updated.name}" berhasil disetujui.`);
      fetchStaff();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyetujui pendaftaran staf.';
      setError(message);
      setLoading(false);
    }
  };

  const handleRejectStaff = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await rejectStaffApi(id);
      showSuccess(`Pendaftaran staf "${updated.name}" ditolak.`);
      fetchStaff();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menolak pendaftaran staf.';
      setError(message);
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setNewStaff(createEmptyStaffForm(findDefaultRoleId(rolesList)));
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setNewStaff(buildStaffFormFromUser(staff));
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError(null);

      const isEdit = Boolean(editingStaff);
      const result = isEdit
        ? await updateStaffApi(editingStaff!.id, {
            name: newStaff.name,
            roleId: newStaff.roleId,
            outletIds: newStaff.outletIds,
          })
        : await createStaffApi(newStaff);

      showSuccess(
        isEdit
          ? `Karyawan "${result.name}" berhasil diperbarui.`
          : `Karyawan baru "${result.name}" berhasil didaftarkan.`
      );
      setIsModalOpen(false);
      setNewStaff(createEmptyStaffForm(findDefaultRoleId(rolesList)));
      setEditingStaff(null);
      fetchStaff();
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
    setNewStaff((prev) => {
      const exists = prev.outletIds.includes(outletId);
      const updated = exists
        ? prev.outletIds.filter((id) => id !== outletId)
        : [...prev.outletIds, outletId];
      return { ...prev, outletIds: updated };
    });
  };

  const displayedStaff = useMemo(
    () => filterStaffByTab(staffList, activeTab),
    [staffList, activeTab]
  );

  const activeStaffCount = useMemo(
    () => countStaffByApproval(staffList, 'APPROVED'),
    [staffList]
  );

  const pendingStaffCount = useMemo(
    () => countStaffByApproval(staffList, 'PENDING'),
    [staffList]
  );

  return {
    currentUser,
    handleLogout,
    staffList,
    outletHierarchy,
    loading,
    error,
    successMsg,
    activeTab,
    setActiveTab,
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
    fetchStaff,
    handleToggleStatus,
    handleDeleteStaff,
    handleApproveStaff,
    handleRejectStaff,
    openAddModal,
    openEditModal,
    handleCreateStaff,
    handleOutletToggle,
    displayedStaff,
    activeStaffCount,
    pendingStaffCount,
  };
}

export type UseStaffManagementReturn = ReturnType<typeof useStaffManagement>;
