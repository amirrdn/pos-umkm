import React, { useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { usePos } from '../hooks/usePos';
import { usePosKeyboard } from '../hooks/usePosKeyboard';
import { ShiftModal } from './ShiftModal';
import { CloseShiftModal } from './CloseShiftModal';
import { ReceiptTemplate } from './ReceiptTemplate';
import { PosHeader } from './pos/PosHeader';
import { PosNavigation } from './pos/PosNavigation';
import { PosProductGrid } from './pos/PosProductGrid';
import { PosCartPanel } from './pos/PosCartPanel';
import { PosSuccessModal } from './pos/PosSuccessModal';
import { PosQrisModal } from './pos/PosQrisModal';
import { PosAddCustomerModal } from './pos/PosAddCustomerModal';
import { PosSubscriptionBanner } from './pos/PosSubscriptionBanner';
import { PosStatusBar } from './pos/PosStatusBar';
import { PosCheckoutConfirmModal } from './pos/PosCheckoutConfirmModal';
import { PosShiftDrawer } from './pos/PosShiftDrawer';
import { PosOnboarding } from './pos/PosOnboarding';

export const PosView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const printComponentRef = useRef<HTMLDivElement>(null);
  const pos = usePos({ printRef: printComponentRef });

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

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">
      {pos.hasCheckedActiveShift && !pos.activeShift && !pos.isShiftLoading && (
        <ShiftModal
          cashierName={pos.user?.name || 'Kasir'}
          onOpen={pos.handleOpenShift}
          isLoading={pos.isShiftLoading}
        />
      )}

      {pos.showCloseShiftModal && pos.activeShift && (
        <CloseShiftModal
          shift={pos.activeShift}
          onClose={pos.handleCloseShift}
          onCancel={() => pos.setShowCloseShiftModal(false)}
          isLoading={pos.isShiftLoading}
          cartItemCount={pos.cartItemCount}
          hasPendingQris={pos.showQrisModal}
        />
      )}

      <div className="hidden print:block">
        <ReceiptTemplate ref={printComponentRef} transactionData={pos.currentTransaction} />
      </div>

      {pos.notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 ${
            pos.notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {pos.notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{pos.notification.message}</span>
          <button
            type="button"
            onClick={() => pos.setNotification(null)}
            className="cursor-pointer ml-2 hover:opacity-75 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

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

      {pos.showSuccessModal && pos.currentTransaction && (
        <PosSuccessModal
          currentTransaction={pos.currentTransaction}
          cashReceived={pos.cashReceived}
          setCashReceived={pos.setCashReceived}
          handlePrint={pos.handlePrint}
          handleSendWhatsApp={pos.handleSendWhatsApp}
          handleFinishTransaction={pos.handleFinishTransaction}
        />
      )}

      {pos.showQrisModal && (
        <PosQrisModal
          qrisUrl={pos.qrisUrl}
          qrisInvoiceNumber={pos.qrisInvoiceNumber}
          qrisGrandTotal={pos.qrisGrandTotal}
          qrisFullscreen={pos.qrisFullscreen}
          qrisPaymentStatus={pos.qrisPaymentStatus}
          setQrisFullscreen={pos.setQrisFullscreen}
          handleCancelQris={pos.handleCancelQris}
          handleOpenCustomerDisplay={pos.handleOpenCustomerDisplay}
          showToast={pos.showToast}
        />
      )}

      {pos.showCheckoutConfirm && (
        <PosCheckoutConfirmModal
          itemCount={pos.cartItemCount}
          grandTotal={pos.grandTotal}
          paymentMethod={pos.paymentMethod}
          submitting={pos.isSubmitting}
          onClose={() => pos.setShowCheckoutConfirm(false)}
          onConfirm={() => void pos.executeCheckout()}
        />
      )}

      {pos.showShiftDrawer && (
        <PosShiftDrawer
          shift={pos.activeShift}
          onClose={() => pos.setShowShiftDrawer(false)}
          onCloseShift={() => pos.setShowCloseShiftModal(true)}
        />
      )}

      {pos.showOnboarding && (
        <PosOnboarding
          step={pos.onboardingStep}
          onNext={pos.advanceOnboarding}
          onSkip={pos.completeOnboarding}
        />
      )}

      {pos.showAddCustomerModal && (
        <PosAddCustomerModal
          setShowAddCustomerModal={pos.setShowAddCustomerModal}
          newCustName={pos.newCustName}
          setNewCustName={pos.setNewCustName}
          newCustPhone={pos.newCustPhone}
          setNewCustPhone={pos.setNewCustPhone}
          newCustEmail={pos.newCustEmail}
          setNewCustEmail={pos.setNewCustEmail}
          handleCreateCustomerSubmit={pos.handleCreateCustomerSubmit}
          isCreatingCustomer={pos.isCreatingCustomer}
        />
      )}
    </div>
  );
};
