import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { usePos } from '../hooks/usePos';
import { usePosKeyboard } from '../hooks/usePosKeyboard';
import { ReceiptTemplate } from './ReceiptTemplate';
import { PosHeader } from './pos/PosHeader';
import { PosNavigation } from './pos/PosNavigation';
import { PosProductGrid } from './pos/PosProductGrid';
import { PosCartPanel } from './pos/PosCartPanel';
import { PosSubscriptionBanner } from './pos/PosSubscriptionBanner';
import { PosStatusBar } from './pos/PosStatusBar';
import { ModalRenderer } from './PosView/modal-stack/ModalRenderer';
import { PosAlertBanner } from './pos/PosAlertBanner';
import { PosCartAddedSnackbar } from './pos/PosCartAddedSnackbar';

export const PosView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const printComponentRef = useRef<HTMLDivElement>(null);
  const pos = usePos({ printRef: printComponentRef });
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowHelpModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    focusSearchInput,
    setShowCartPanel,
    handleCheckout,
    incrementLastCartItem,
    decrementLastCartItem,
  } = pos;

  const keyboardHandlers = useMemo(
    () => ({
      onFocusSearch: focusSearchInput,
      onCloseCart: () => setShowCartPanel(false),
      onOpenCart: () => setShowCartPanel(true),
      onCheckout: () => void handleCheckout(),
      onIncrementLastItem: incrementLastCartItem,
      onDecrementLastItem: decrementLastCartItem,
    }),
    [
      focusSearchInput,
      setShowCartPanel,
      handleCheckout,
      incrementLastCartItem,
      decrementLastCartItem,
    ]
  );

  usePosKeyboard(keyboardHandlers);

  const modalVisibility = {
    shiftRequired: pos.hasCheckedActiveShift && !pos.activeShift && !pos.isShiftLoading,
    closeShift: pos.showCloseShiftModal,
    checkoutConfirm: pos.showCheckoutConfirm,
    qris: pos.showQrisModal,
    success: pos.showSuccessModal,
    shiftDrawer: pos.showShiftDrawer,
    addCustomer: pos.showAddCustomerModal,
    onboarding: pos.showOnboarding,
    help: showHelpModal,
  };

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">
      <div className="hidden print:block">
        <ReceiptTemplate ref={printComponentRef} transactionData={pos.currentTransaction} />
      </div>

      <PosAlertBanner
        alert={pos.notification}
        onDismiss={() => pos.setNotification(null)}
      />

      <PosCartAddedSnackbar feedback={pos.cartFeedback} />

      {pos.shiftError && (
        <div className="shrink-0 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{pos.shiftError}</span>
        </div>
      )}

      <PosHeader
        platformAdmin={pos.platformAdmin}
        activeShift={pos.activeShift}
        shiftStartedLabel={pos.shiftStartedLabel}
        setShowCloseShiftModal={pos.setShowCloseShiftModal}
        setShowCartPanel={pos.setShowCartPanel}
        cartItemCount={pos.cartItemCount}
        cartBadgePulse={pos.cartBadgePulse}
        theme={pos.theme}
        toggleTheme={pos.toggleTheme}
        user={pos.user}
        primaryRole={pos.primaryRole}
        handleLogout={pos.handleLogout}
        onHelpClick={() => setShowHelpModal(true)}
      />

      <PosStatusBar
        activeOutletName={pos.activeOutletName}
        shiftActive={Boolean(pos.activeShift)}
        shiftStartedLabel={pos.shiftStartedLabel}
        cartItemCount={pos.cartItemCount}
        grandTotal={pos.grandTotal}
        isOnline={pos.isOnline}
        onShiftClick={pos.activeShift ? () => pos.setShowShiftDrawer(true) : undefined}
      />

      <PosNavigation
        navigate={navigate}
        locationPathname={location.pathname}
        showAdminNav={pos.showAdminNav}
        showManagementNav={pos.showManagementNav}
        showOutletNav={pos.showOutletNav}
        managesSubscription={pos.managesSubscription}
      />

      <PosSubscriptionBanner
        subscription={pos.subscription}
        subscriptionBypass={pos.subscriptionBypass}
        managesSubscription={pos.managesSubscription}
        navigate={navigate}
      />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <PosProductGrid
          loadingProducts={pos.loadingProducts}
          filteredProducts={pos.filteredProducts}
          recentProducts={pos.recentProducts}
          categoriesList={pos.categoriesList}
          selectedCategory={pos.selectedCategory}
          setSelectedCategory={pos.setSelectedCategory}
          searchQuery={pos.searchQuery}
          setSearchQuery={pos.setSearchQuery}
          inStockOnly={pos.inStockOnly}
          setInStockOnly={pos.setInStockOnly}
          searchInputRef={pos.searchInputRef}
          onSearchKeyDown={pos.handleSearchKeyDown}
          addToCart={pos.handleAddToCart}
          getRemainingStock={pos.getRemainingStock}
          hasProducts={pos.products.length > 0}
        />

        <PosCartPanel
          cart={pos.cart}
          cartItemCount={pos.cartItemCount}
          showCartPanel={pos.showCartPanel}
          setShowCartPanel={pos.setShowCartPanel}
          updateQuantity={pos.updateQuantity}
          removeFromCart={pos.removeFromCart}
          paymentMethod={pos.paymentMethod}
          setPaymentMethod={pos.setPaymentMethod}
          selectedCustomer={pos.selectedCustomer}
          setSelectedCustomer={pos.setSelectedCustomer}
          customerQuery={pos.customerQuery}
          setCustomerQuery={pos.setCustomerQuery}
          searchResults={pos.searchResults}
          setSearchResults={pos.setSearchResults}
          setShowAddCustomerModal={pos.setShowAddCustomerModal}
          discountType={pos.discountType}
          discountValue={pos.discountValue}
          setDiscount={pos.setDiscount}
          applyTax={pos.applyTax}
          setApplyTax={pos.setApplyTax}
          subTotal={pos.subTotal}
          grandTotal={pos.grandTotal}
          handleCheckout={pos.handleCheckout}
          isSubmitting={pos.isSubmitting}
          canCheckout={pos.canCheckout}
          activeShift={Boolean(pos.activeShift)}
          popularProducts={pos.popularProducts}
          onAddToCart={pos.handleAddToCart}
        />
      </main>

      <ModalRenderer
        visibility={modalVisibility}
        cashierName={pos.user?.name || 'Kasir'}
        shiftData={{
          activeShift: pos.activeShift,
          isShiftLoading: pos.isShiftLoading,
          handleOpenShift: pos.handleOpenShift,
          handleCloseShift: pos.handleCloseShift,
          setShowCloseShiftModal: pos.setShowCloseShiftModal,
          setShowShiftDrawer: pos.setShowShiftDrawer,
          cartItemCount: pos.cartItemCount,
        }}
        checkoutData={{
          handleCheckout: pos.handleCheckout,
          executeCheckout: pos.executeCheckout,
          grandTotal: pos.grandTotal,
          paymentMethod: pos.paymentMethod,
          isSubmitting: pos.isSubmitting,
          cartItemCount: pos.cartItemCount,
          handlePrint: pos.handlePrint,
          handleSendWhatsApp: pos.handleSendWhatsApp,
          handleFinishTransaction: pos.handleFinishTransaction,
          handleCancelQris: pos.handleCancelQris,
          handleOpenCustomerDisplay: pos.handleOpenCustomerDisplay,
          setShowCheckoutConfirm: pos.setShowCheckoutConfirm,
          showToast: pos.showToast,
        }}
        transactionData={pos.currentTransaction}
        cashReceived={pos.cashReceived}
        setCashReceived={pos.setCashReceived}
        customerData={{
          setShowAddCustomerModal: pos.setShowAddCustomerModal,
          newCustName: pos.newCustName,
          setNewCustName: pos.setNewCustName,
          newCustPhone: pos.newCustPhone,
          setNewCustPhone: pos.setNewCustPhone,
          newCustEmail: pos.newCustEmail,
          setNewCustEmail: pos.setNewCustEmail,
          isCreatingCustomer: pos.isCreatingCustomer,
          handleCreateCustomerSubmit: pos.handleCreateCustomerSubmit,
        }}
        qrisData={{
          qrisUrl: pos.qrisUrl,
          qrisInvoiceNumber: pos.qrisInvoiceNumber,
          qrisGrandTotal: pos.qrisGrandTotal,
          qrisFullscreen: pos.qrisFullscreen,
          qrisPaymentStatus: pos.qrisPaymentStatus,
          setQrisFullscreen: pos.setQrisFullscreen,
        }}
        onboardingStep={pos.onboardingStep}
        advanceOnboarding={pos.advanceOnboarding}
        completeOnboarding={pos.completeOnboarding}
        onCloseHelp={() => setShowHelpModal(false)}
      />
    </div>
  );
};
