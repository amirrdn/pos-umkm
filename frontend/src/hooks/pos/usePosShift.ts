import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShiftStore } from '../../store/useShiftStore';
import type { AuthUser } from '../../store/useAuthStore';

interface UsePosShiftOptions {
  isAuthenticated: boolean;
  user: AuthUser | null;
  showToast: (type: 'success' | 'error', message: string) => void;
  checkTokenExpiration: (err: unknown) => boolean;
  handleLogout: () => void;
}

export function usePosShift({
  isAuthenticated,
  user,
  showToast,
  checkTokenExpiration,
  handleLogout,
}: UsePosShiftOptions) {
  const navigate = useNavigate();
  const {
    activeShift,
    isLoading: isShiftLoading,
    hasCheckedActiveShift,
    fetchActiveShift,
    openShift,
    closeShift: closeShiftAction,
    clearShift,
    error: shiftError,
  } = useShiftStore();

  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [showShiftDrawer, setShowShiftDrawer] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && user?.tenantId) {
      void fetchActiveShift().then(() => {
        const err = useShiftStore.getState().error;
        if (!err) return;

        const isExpired =
          err.toLowerCase().includes('kedaluwarsa') ||
          err.toLowerCase().includes('expired') ||
          err.toLowerCase().includes('authorization') ||
          err.toLowerCase().includes('akses ditolak');

        if (isExpired) {
          showToast('error', 'Sesi Anda telah kedaluwarsa. Mengalihkan ke halaman login...');
          setTimeout(() => {
            handleLogout();
            navigate('/login');
          }, 2000);
        }
      });
    } else {
      clearShift();
    }
  }, [isAuthenticated, user?.tenantId, fetchActiveShift, clearShift, navigate, handleLogout, showToast]);

  const handleOpenShift = async (cashStart: number) => {
    if (!isAuthenticated || !user?.tenantId) return;
    try {
      await openShift(cashStart);
    } catch (err: unknown) {
      if (!checkTokenExpiration(err)) {
        throw err;
      }
    }
  };

  const handleCloseShift = async (cashActual: number) => {
    if (!isAuthenticated || !user?.tenantId || !activeShift) return;
    try {
      await closeShiftAction(activeShift.id, cashActual);
      setShowCloseShiftModal(false);
      showToast('success', 'Shift berhasil ditutup. Sampai jumpa!');
    } catch (err: unknown) {
      if (!checkTokenExpiration(err)) {
        const msg = err instanceof Error ? err.message : 'Gagal menutup shift.';
        showToast('error', msg);
      }
    }
  };

  const shiftStartedLabel = useMemo(() => {
    if (!activeShift?.startTime) return null;
    return new Date(activeShift.startTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [activeShift]);

  return {
    activeShift,
    isShiftLoading,
    hasCheckedActiveShift,
    shiftError,
    showCloseShiftModal,
    setShowCloseShiftModal,
    showShiftDrawer,
    setShowShiftDrawer,
    handleOpenShift,
    handleCloseShift,
    shiftStartedLabel,
  };
}
