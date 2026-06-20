import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { usePos } from '../hooks/usePos';
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

export const PosView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pos = usePos();

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">
      {/* Modal Buka Shift — diblokir jika belum ada shift aktif */}
      {pos.hasCheckedActiveShift && !pos.activeShift && !pos.isShiftLoading && (
        <ShiftModal
          cashierName={pos.user?.name || 'Kasir'}
          onOpen={pos.handleOpenShift}
          isLoading={pos.isShiftLoading}
        />
      )}

      {/* Modal Tutup Shift */}
      {pos.showCloseShiftModal && pos.activeShift && (
        <CloseShiftModal
          shift={pos.activeShift}
          onClose={pos.handleCloseShift}
          onCancel={() => pos.setShowCloseShiftModal(false)}
          isLoading={pos.isShiftLoading}
        />
      )}

      {/* Template Struk Tersembunyi (hanya terlihat saat cetak) */}
      <div className="hidden print:block">
        <ReceiptTemplate ref={pos.printComponentRef} transactionData={pos.currentTransaction} />
      </div>

      {/* Toast Notification */}
      {pos.notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 ${
            pos.notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {pos.notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{pos.notification.message}</span>
          <button
            onClick={() => pos.setNotification(null)}
            className="cursor-pointer ml-2 hover:opacity-75 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER UTAMA */}
      <PosHeader
        platformAdmin={pos.platformAdmin}
        activeShift={pos.activeShift}
        shiftStartedLabel={pos.shiftStartedLabel}
        setShowCloseShiftModal={pos.setShowCloseShiftModal}
        setShowCartPanel={pos.setShowCartPanel}
        cartItemCount={pos.cartItemCount}
        theme={pos.theme}
        toggleTheme={pos.toggleTheme}
        user={pos.user}
        primaryRole={pos.primaryRole}
        handleLogout={pos.handleLogout}
      />

      {/* Bar navigasi */}
      <PosNavigation
        navigate={navigate}
        locationPathname={location.pathname}
        showAdminNav={pos.showAdminNav}
        showManagementNav={pos.showManagementNav}
        showOutletNav={pos.showOutletNav}
        managesSubscription={pos.managesSubscription}
      />

      {/* Banner Peringatan Langganan */}
      <PosSubscriptionBanner
        subscription={pos.subscription}
        subscriptionBypass={pos.subscriptionBypass}
        managesSubscription={pos.managesSubscription}
        navigate={navigate}
      />

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <PosProductGrid
          loadingProducts={pos.loadingProducts}
          filteredProducts={pos.filteredProducts}
          categoriesList={pos.categoriesList}
          selectedCategory={pos.selectedCategory}
          setSelectedCategory={pos.setSelectedCategory}
          searchQuery={pos.searchQuery}
          setSearchQuery={pos.setSearchQuery}
          addToCart={pos.addToCart}
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
          handleCustomerSearch={pos.handleCustomerSearch}
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
          debtFeatureEnabled={pos.debtFeatureEnabled}
        />
      </main>

      {/* Modal Sukses Transaksi */}
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

      {/* Modal QRIS Pembayaran Dinamis */}
      {pos.showQrisModal && (
        <PosQrisModal
          qrisUrl={pos.qrisUrl}
          qrisInvoiceNumber={pos.qrisInvoiceNumber}
          qrisGrandTotal={pos.qrisGrandTotal}
          qrisFullscreen={pos.qrisFullscreen}
          setQrisFullscreen={pos.setQrisFullscreen}
          handleCancelQris={pos.handleCancelQris}
          handleOpenCustomerDisplay={pos.handleOpenCustomerDisplay}
          showToast={pos.showToast}
        />
      )}

      {/* Modal Tambah Pelanggan Baru Cepat */}
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
