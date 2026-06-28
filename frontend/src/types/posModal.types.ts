import type { ActiveShift } from '../store/useShiftStore';
import type { PosReceiptTransaction } from '../hooks/pos/posUtils';

export type ModalPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ModalState {
  id: string;
  priority: number;
  isOpen: boolean;
  data?: Record<string, unknown>;
}

export interface PosModalVisibility {
  shiftRequired: boolean;
  closeShift: boolean;
  checkoutConfirm: boolean;
  qris: boolean;
  success: boolean;
  shiftDrawer: boolean;
  addCustomer: boolean;
  onboarding: boolean;
  help: boolean;
}

export interface ShiftModalData {
  activeShift: ActiveShift | null;
  isShiftLoading: boolean;
  hasCheckedActiveShift: boolean;
  shiftError: string | null;
  cashierName: string;
  onOpenShift: (cashStart: number) => Promise<void>;
  onCloseShift: (cashActual: number) => Promise<void>;
}

export interface CheckoutModalData {
  itemCount: number;
  grandTotal: number;
  paymentMethod: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface SuccessModalData {
  transaction: PosReceiptTransaction;
  cashReceived: number | '';
  setCashReceived: (val: number | '') => void;
  onPrint: () => void;
  onSendWhatsApp: (tx: PosReceiptTransaction) => void;
  onFinish: () => void;
}

export interface QrisModalData {
  qrisUrl: string;
  invoiceNumber: string;
  grandTotal: number;
  fullscreen: boolean;
  paymentStatus: 'waiting' | 'paid';
  setFullscreen: (val: boolean) => void;
  onCancel: () => void;
  onOpenCustomerDisplay: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export interface CustomerModalData {
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  isCreating: boolean;
  onSubmit: () => void;
}

export interface OnboardingModalData {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

export interface ShiftDrawerData {
  shift: ActiveShift | null;
  onClose: () => void;
  onCloseShift: () => void;
}