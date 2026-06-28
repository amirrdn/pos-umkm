import type { ActiveShift } from '../../../store/useShiftStore';
import type { PosReceiptTransaction } from '../../../hooks/pos/posUtils';
import type { PosModalVisibility } from '../../../types/posModal.types';
import { ShiftModal } from '../../ShiftModal';
import { CloseShiftModal } from '../../CloseShiftModal';
import { PosSuccessModal } from '../../pos/PosSuccessModal';
import { PosQrisModal } from '../../pos/PosQrisModal';
import { PosCheckoutConfirmModal } from '../../pos/PosCheckoutConfirmModal';
import { PosShiftDrawer } from '../../pos/PosShiftDrawer';
import { PosAddCustomerModal } from '../../pos/PosAddCustomerModal';
import { PosOnboarding } from '../../pos/PosOnboarding';
import { PosHelpModal } from '../../pos/PosHelpModal';
import { AccessibleModalLayer } from './AccessibleModalLayer';
import { getActiveModalKey, hasOpenModal, MODAL_LABELS } from './modalPriority';
import { useBodyScrollLock } from '../../../hooks/pos/useBodyScrollLock';

export type { PosModalVisibility };

interface ModalRendererProps {
  visibility: PosModalVisibility;
  cashierName: string;
  shiftData: {
    activeShift: ActiveShift | null;
    isShiftLoading: boolean;
    handleOpenShift: (cashStart: number) => Promise<void>;
    handleCloseShift: (cashActual: number) => Promise<void>;
    setShowCloseShiftModal: (val: boolean) => void;
    setShowShiftDrawer: (val: boolean) => void;
    cartItemCount: number;
  };
  checkoutData: {
    handleCheckout: () => void;
    executeCheckout: () => Promise<void>;
    grandTotal: number;
    paymentMethod: string;
    isSubmitting: boolean;
    cartItemCount: number;
    handlePrint: () => void;
    handleSendWhatsApp: (tx: PosReceiptTransaction) => void;
    handleFinishTransaction: () => void;
    handleCancelQris: () => void;
    handleOpenCustomerDisplay: () => void;
    setShowCheckoutConfirm: (val: boolean) => void;
    showToast: (type: 'success' | 'error', message: string) => void;
  };
  transactionData: PosReceiptTransaction | null;
  cashReceived: number | '';
  setCashReceived: (val: number | '') => void;
  customerData: {
    setShowAddCustomerModal: (val: boolean) => void;
    newCustName: string;
    setNewCustName: (val: string) => void;
    newCustPhone: string;
    setNewCustPhone: (val: string) => void;
    newCustEmail: string;
    setNewCustEmail: (val: string) => void;
    isCreatingCustomer: boolean;
    handleCreateCustomerSubmit: (name: string, phone: string, email: string) => Promise<boolean>;
  };
  qrisData: {
    qrisUrl: string;
    qrisInvoiceNumber: string;
    qrisGrandTotal: number;
    qrisFullscreen: boolean;
    qrisPaymentStatus: 'waiting' | 'paid';
    setQrisFullscreen: (val: boolean) => void;
  };
  onboardingStep: number;
  advanceOnboarding: () => void;
  completeOnboarding: () => void;
  onCloseHelp: () => void;
}

export function ModalRenderer({
  visibility,
  cashierName,
  shiftData,
  checkoutData,
  transactionData,
  cashReceived,
  setCashReceived,
  customerData,
  qrisData,
  onboardingStep,
  advanceOnboarding,
  completeOnboarding,
  onCloseHelp,
}: ModalRendererProps) {
  const activeModal = getActiveModalKey(visibility);
  useBodyScrollLock(hasOpenModal(visibility));

  const trapFocus = (key: keyof PosModalVisibility) => activeModal === key;

  return (
    <>
      <AccessibleModalLayer
        isOpen={visibility.shiftRequired}
        trapFocus={trapFocus('shiftRequired')}
        label={MODAL_LABELS.shiftRequired}
      >
        <ShiftModal
          cashierName={cashierName}
          onOpen={shiftData.handleOpenShift}
          isLoading={shiftData.isShiftLoading}
        />
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.closeShift && Boolean(shiftData.activeShift)}
        trapFocus={trapFocus('closeShift')}
        label={MODAL_LABELS.closeShift}
        onEscape={() => shiftData.setShowCloseShiftModal(false)}
      >
        {shiftData.activeShift && (
          <CloseShiftModal
            shift={shiftData.activeShift}
            onClose={shiftData.handleCloseShift}
            onCancel={() => shiftData.setShowCloseShiftModal(false)}
            isLoading={shiftData.isShiftLoading}
            cartItemCount={shiftData.cartItemCount}
            hasPendingQris={visibility.qris}
          />
        )}
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.shiftDrawer}
        trapFocus={trapFocus('shiftDrawer')}
        label={MODAL_LABELS.shiftDrawer}
        onEscape={() => shiftData.setShowShiftDrawer(false)}
      >
        <PosShiftDrawer
          shift={shiftData.activeShift}
          onClose={() => shiftData.setShowShiftDrawer(false)}
          onCloseShift={() => shiftData.setShowCloseShiftModal(true)}
        />
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.checkoutConfirm}
        trapFocus={trapFocus('checkoutConfirm')}
        label={MODAL_LABELS.checkoutConfirm}
        onEscape={() => checkoutData.setShowCheckoutConfirm(false)}
      >
        <PosCheckoutConfirmModal
          itemCount={checkoutData.cartItemCount}
          grandTotal={checkoutData.grandTotal}
          paymentMethod={checkoutData.paymentMethod}
          submitting={checkoutData.isSubmitting}
          onClose={() => checkoutData.setShowCheckoutConfirm(false)}
          onConfirm={() => void checkoutData.executeCheckout()}
        />
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.qris}
        trapFocus={trapFocus('qris')}
        label={MODAL_LABELS.qris}
        onEscape={checkoutData.handleCancelQris}
      >
        <PosQrisModal
          qrisUrl={qrisData.qrisUrl}
          qrisInvoiceNumber={qrisData.qrisInvoiceNumber}
          qrisGrandTotal={qrisData.qrisGrandTotal}
          qrisFullscreen={qrisData.qrisFullscreen}
          qrisPaymentStatus={qrisData.qrisPaymentStatus}
          setQrisFullscreen={qrisData.setQrisFullscreen}
          handleCancelQris={checkoutData.handleCancelQris}
          handleOpenCustomerDisplay={checkoutData.handleOpenCustomerDisplay}
          showToast={checkoutData.showToast}
        />
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.success && Boolean(transactionData)}
        trapFocus={trapFocus('success')}
        label={MODAL_LABELS.success}
      >
        {transactionData && (
          <PosSuccessModal
            currentTransaction={transactionData}
            cashReceived={cashReceived}
            setCashReceived={setCashReceived}
            handlePrint={checkoutData.handlePrint}
            handleSendWhatsApp={checkoutData.handleSendWhatsApp}
            handleFinishTransaction={checkoutData.handleFinishTransaction}
          />
        )}
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.addCustomer}
        trapFocus={trapFocus('addCustomer')}
        label={MODAL_LABELS.addCustomer}
        onEscape={() => customerData.setShowAddCustomerModal(false)}
      >
        <PosAddCustomerModal
          setShowAddCustomerModal={customerData.setShowAddCustomerModal}
          newCustName={customerData.newCustName}
          setNewCustName={customerData.setNewCustName}
          newCustPhone={customerData.newCustPhone}
          setNewCustPhone={customerData.setNewCustPhone}
          newCustEmail={customerData.newCustEmail}
          setNewCustEmail={customerData.setNewCustEmail}
          handleCreateCustomerSubmit={customerData.handleCreateCustomerSubmit}
          isCreatingCustomer={customerData.isCreatingCustomer}
        />
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.onboarding}
        trapFocus={trapFocus('onboarding')}
        label={MODAL_LABELS.onboarding}
        onEscape={completeOnboarding}
      >
        <PosOnboarding
          step={onboardingStep}
          onNext={advanceOnboarding}
          onSkip={completeOnboarding}
        />
      </AccessibleModalLayer>

      <AccessibleModalLayer
        isOpen={visibility.help}
        trapFocus={trapFocus('help')}
        label={MODAL_LABELS.help}
        onEscape={onCloseHelp}
      >
        <PosHelpModal onClose={onCloseHelp} />
      </AccessibleModalLayer>
    </>
  );
}
