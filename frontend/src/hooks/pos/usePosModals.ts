import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ShiftModalData,
  CheckoutModalData,
  SuccessModalData,
  QrisModalData,
  CustomerModalData,
  OnboardingModalData,
  ShiftDrawerData,
} from '../../types/posModal.types';

const MODAL_PRIORITIES = {
  shiftRequired: 100,
  shiftActive: 90,
  checkoutConfirm: 80,
  qrisPayment: 70,
  success: 60,
  addCustomer: 50,
  shiftDrawer: 40,
  onboarding: 30,
  help: 20,
} as const;

interface ModalStackState {
  modals: Map<string, { priority: number; isOpen: boolean; data: unknown }>;
  showModal: (id: string, priority: number, data?: unknown) => void;
  hideModal: (id: string) => void;
  hideAllModals: () => void;
  getTopModal: () => { id: string; priority: number; data: unknown } | null;
  getModalData: <T>(id: string) => T | undefined;
}

export const usePosModalStore = create<ModalStackState>()(
  persist(
    (set, get) => ({
      modals: new Map(),

      showModal: (id, priority, data) => {
        const current = get().modals.get(id);
        set({
          modals: new Map(get().modals).set(id, {
            priority,
            isOpen: true,
            data: data ?? current?.data ?? {},
          }),
        });
      },

      hideModal: (id) => {
        const modal = get().modals.get(id);
        if (modal) {
          const updated = new Map(get().modals);
          updated.set(id, { ...modal, isOpen: false });
          set({ modals: updated });
        }
      },

      hideAllModals: () => {
        const updated = new Map(get().modals);
        updated.forEach((value, key) => {
          updated.set(key, { ...value, isOpen: false });
        });
        set({ modals: updated });
      },

      getTopModal: () => {
        const openModals = Array.from(get().modals.entries())
          .filter(([, modal]) => modal.isOpen)
          .sort(([, a], [, b]) => b.priority - a.priority);

        const top = openModals[0];
        return top
          ? { id: top[0], priority: top[1].priority, data: top[1].data }
          : null;
      },

      getModalData: <T>(id: string) => {
        const modal = get().modals.get(id);
        return modal?.data as T | undefined;
      },
    }),
    {
      name: 'pos-modals',
      partialize: () => ({}),
    }
  )
);

export function usePosModals() {
  const showModal = usePosModalStore((state) => state.showModal);
  const hideModal = usePosModalStore((state) => state.hideModal);
  const hideAllModals = usePosModalStore((state) => state.hideAllModals);
  const getTopModal = usePosModalStore((state) => state.getTopModal);
  const getModalData = usePosModalStore((state) => state.getModalData);

  const openShiftRequired = useCallback((data: ShiftModalData) => {
    showModal('shiftRequired', MODAL_PRIORITIES.shiftRequired, data);
  }, [showModal]);

  const closeShiftRequired = useCallback(() => {
    hideModal('shiftRequired');
  }, [hideModal]);

  const openCheckoutConfirm = useCallback((data: CheckoutModalData) => {
    showModal('checkoutConfirm', MODAL_PRIORITIES.checkoutConfirm, data);
  }, [showModal]);

  const closeCheckoutConfirm = useCallback(() => {
    hideModal('checkoutConfirm');
  }, [hideModal]);

  const openSuccess = useCallback((data: SuccessModalData) => {
    showModal('success', MODAL_PRIORITIES.success, data);
  }, [showModal]);

  const closeSuccess = useCallback(() => {
    hideModal('success');
  }, [hideModal]);

  const openQris = useCallback((data: QrisModalData) => {
    showModal('qrisPayment', MODAL_PRIORITIES.qrisPayment, data);
  }, [showModal]);

  const closeQris = useCallback(() => {
    hideModal('qrisPayment');
  }, [hideModal]);

  const openAddCustomer = useCallback((data: CustomerModalData) => {
    showModal('addCustomer', MODAL_PRIORITIES.addCustomer, data);
  }, [showModal]);

  const closeAddCustomer = useCallback(() => {
    hideModal('addCustomer');
  }, [hideModal]);

  const openShiftDrawer = useCallback((data: ShiftDrawerData) => {
    showModal('shiftDrawer', MODAL_PRIORITIES.shiftDrawer, data);
  }, [showModal]);

  const closeShiftDrawer = useCallback(() => {
    hideModal('shiftDrawer');
  }, [hideModal]);

  const openOnboarding = useCallback((data: OnboardingModalData) => {
    showModal('onboarding', MODAL_PRIORITIES.onboarding, data);
  }, [showModal]);

  const closeOnboarding = useCallback(() => {
    hideModal('onboarding');
  }, [hideModal]);

  const openHelp = useCallback(() => {
    showModal('help', MODAL_PRIORITIES.help);
  }, [showModal]);

  const closeHelp = useCallback(() => {
    hideModal('help');
  }, [hideModal]);

  const isOpen = useCallback((id: string) => {
    const modal = usePosModalStore.getState().modals.get(id);
    return modal?.isOpen ?? false;
  }, []);

  const topModal = useMemo(() => getTopModal(), [getTopModal]);

  return {
    modals: usePosModalStore.getState().modals,
    topModal,
    isOpen,
    getModalData,
    openShiftRequired,
    closeShiftRequired,
    openCheckoutConfirm,
    closeCheckoutConfirm,
    openSuccess,
    closeSuccess,
    openQris,
    closeQris,
    openAddCustomer,
    closeAddCustomer,
    openShiftDrawer,
    closeShiftDrawer,
    openOnboarding,
    closeOnboarding,
    openHelp,
    closeHelp,
    hideAllModals,
  };
}