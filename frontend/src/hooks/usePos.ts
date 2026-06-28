import { useState, useEffect, useMemo, useCallback, useRef, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore, canManageSubscription, isPlatformAdmin } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useShiftStore } from '../store/useShiftStore';
import { getRoleDisplayLabel } from '../utils/roles';
import { isApiError } from '../api/types';
import { resolveSilentOutletApi } from '../api/posApi';

import { type Product, type PosReceiptTransaction } from './pos/posUtils';
import { usePosOnboarding } from './pos/usePosOnboarding';
import { usePosCustomer } from './pos/usePosCustomer';
import { usePosProducts } from './pos/usePosProducts';
import { usePosShift } from './pos/usePosShift';
import { usePosCheckout } from './pos/usePosCheckout';
import { usePosPrint } from './pos/usePosPrint';

export type { Product, PosReceiptTransaction };

interface UsePosOptions {
  printRef: RefObject<HTMLDivElement | null>;
}

export function usePos({ printRef }: UsePosOptions) {
  const navigate = useNavigate();

  const {
    cart,
    subTotal,
    grandTotal,
    clearCart,
    discountType,
    discountValue,
    applyTax,
    setDiscount,
    setApplyTax,
    addToCart,
    removeFromCart,
    updateQuantity,
  } = useCartStore(
    useShallow((state) => ({
      cart: state.cart,
      subTotal: state.subTotal,
      grandTotal: state.grandTotal,
      clearCart: state.clearCart,
      discountType: state.discountType,
      discountValue: state.discountValue,
      applyTax: state.applyTax,
      setDiscount: state.setDiscount,
      setApplyTax: state.setApplyTax,
      addToCart: state.addToCart,
      removeFromCart: state.removeFromCart,
      updateQuantity: state.updateQuantity,
    }))
  );

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const setActiveOutlet = useAuthStore((state) => state.setActiveOutlet);
  const logout = useAuthStore((state) => state.logout);

  const { theme, toggleTheme } = useThemeStore();
  const { subscription, fetchActiveSubscription } = useSubscriptionStore();
  const { clearShift } = useShiftStore();

  const userRoles = user?.roles ?? [];
  const platformAdmin = isPlatformAdmin(userRoles);
  const managesSubscription = canManageSubscription(userRoles);
  const subscriptionBypass = platformAdmin || subscription?.platformAdminBypass === true;

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cartFeedback, setCartFeedback] = useState<{
    name: string;
    price: number;
    quantity: number;
  } | null>(null);
  const [showCartPanel, setShowCartPanel] = useState<boolean>(false);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 5000);
  }, []);

  const showCartAdded = useCallback((payload: { name: string; price: number; quantity: number }) => {
    if (cartFeedbackTimeoutRef.current) {
      clearTimeout(cartFeedbackTimeoutRef.current);
    }
    setCartFeedback(payload);
    cartFeedbackTimeoutRef.current = setTimeout(() => {
      setCartFeedback(null);
      cartFeedbackTimeoutRef.current = null;
    }, 2200);
  }, []);

  const handleLogout = useCallback(() => {
    clearCart();
    clearShift();
    logout();
  }, [clearCart, clearShift, logout]);

  const checkTokenExpiration = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : isApiError(err) ? err.message : '';
    const isExpired =
      message.toLowerCase().includes('kedaluwarsa') ||
      message.toLowerCase().includes('expired') ||
      message.toLowerCase().includes('authorization') ||
      message.toLowerCase().includes('akses ditolak');
    if (isExpired) {
      showToast('error', 'Sesi Anda telah kedaluwarsa. Mengalihkan ke halaman login...');
      setTimeout(() => {
        handleLogout();
        navigate('/login');
      }, 2000);
      return true;
    }
    return false;
  }, [showToast, handleLogout, navigate]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveSubscription();
    }
  }, [isAuthenticated, activeOutletId, fetchActiveSubscription]);

  // Resolve silent outlet for platform admin
  useEffect(() => {
    if (!platformAdmin || activeOutletId || !isAuthenticated) return;

    const resolveSilentOutlet = async () => {
      try {
        const data = await resolveSilentOutletApi();
        const outlets = data.data ?? [];
        const mainOutlet = outlets.find((o: { type?: string }) => o.type === 'MAIN') ?? outlets[0];
        if (mainOutlet?.id) {
          setActiveOutlet(mainOutlet.id);
        }
      } catch (err) {
        console.error('Gagal menyiapkan outlet operasional untuk admin platform:', err);
      }
    };

    resolveSilentOutlet();
  }, [platformAdmin, activeOutletId, isAuthenticated, setActiveOutlet]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setShowCartPanel(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const activeOutletName = useMemo(() => {
    if (!activeOutletId || !user?.outlets) return null;
    return user.outlets.find((outlet) => outlet.id === activeOutletId)?.name ?? null;
  }, [activeOutletId, user]);

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const primaryRole = getRoleDisplayLabel(user?.roles[0] ?? 'Kasir');
  const showAdminNav = !!(
    user?.roles.includes('Owner') ||
    user?.roles.includes('Admin') ||
    user?.roles.includes('Manager') ||
    user?.roles.includes('Staf Gudang')
  );
  const showManagementNav = !!(showAdminNav && !user?.roles.includes('Staf Gudang'));
  const showOutletNav = !!(user?.roles.includes('Owner') || user?.roles.includes('Admin'));

  // Call Sub-Hooks
  const onboarding = usePosOnboarding();
  const customer = usePosCustomer({ activeOutletId, showToast });
  const products = usePosProducts({
    isAuthenticated,
    activeOutletId,
    platformAdmin,
    showToast,
    showCartAdded,
    checkTokenExpiration,
  });
  const shift = usePosShift({ isAuthenticated, user, showToast, checkTokenExpiration, handleLogout });
  const checkout = usePosCheckout({
    user,
    activeOutletId,
    subscriptionBypass,
    subscription,
    activeShift: shift.activeShift,
    selectedCustomer: customer.selectedCustomer,
    setSelectedCustomer: customer.setSelectedCustomer,
    setProducts: products.setProducts,
    showToast,
    checkTokenExpiration,
    setShowCartPanel,
  });
  const print = usePosPrint({ printRef, cashReceived: checkout.cashReceived });

  return {
    // Stores & states
    isAuthenticated,
    user,
    activeOutletId,
    setActiveOutlet,
    theme,
    toggleTheme,
    subscription,
    platformAdmin,
    managesSubscription,
    subscriptionBypass,
    activeShift: shift.activeShift,
    isShiftLoading: shift.isShiftLoading,
    hasCheckedActiveShift: shift.hasCheckedActiveShift,
    shiftError: shift.shiftError,
    showCloseShiftModal: shift.showCloseShiftModal,
    setShowCloseShiftModal: shift.setShowCloseShiftModal,
    products: products.catalogProducts,
    loadingProducts: products.catalogLoading,
    paymentMethod: checkout.paymentMethod,
    setPaymentMethod: checkout.setPaymentMethod,
    isSubmitting: checkout.isSubmitting,
    notification,
    setNotification,
    cartFeedback,
    searchQuery: products.searchQuery,
    setSearchQuery: products.setSearchQuery,
    selectedCategory: products.selectedCategory,
    setSelectedCategory: products.setSelectedCategory,
    showCartPanel,
    setShowCartPanel,
    showSuccessModal: checkout.showSuccessModal,
    setShowSuccessModal: checkout.setShowSuccessModal,
    currentTransaction: checkout.currentTransaction,
    cashReceived: checkout.cashReceived,
    setCashReceived: checkout.setCashReceived,
    showQrisModal: checkout.showQrisModal,
    setShowQrisModal: checkout.setShowQrisModal,
    qrisUrl: checkout.qrisUrl,
    qrisInvoiceNumber: checkout.qrisInvoiceNumber,
    qrisGrandTotal: checkout.qrisGrandTotal,
    qrisFullscreen: checkout.qrisFullscreen,
    setQrisFullscreen: checkout.setQrisFullscreen,
    selectedCustomer: customer.selectedCustomer,
    setSelectedCustomer: customer.setSelectedCustomer,
    customerQuery: customer.customerQuery,
    setCustomerQuery: customer.setCustomerQuery,
    searchResults: customer.searchResults,
    setSearchResults: customer.setSearchResults,
    showAddCustomerModal: customer.showAddCustomerModal,
    setShowAddCustomerModal: customer.setShowAddCustomerModal,
    newCustName: customer.newCustName,
    setNewCustName: customer.setNewCustName,
    newCustPhone: customer.newCustPhone,
    setNewCustPhone: customer.setNewCustPhone,
    newCustEmail: customer.newCustEmail,
    setNewCustEmail: customer.setNewCustEmail,
    isCreatingCustomer: customer.isCreatingCustomer,
    inStockOnly: products.inStockOnly,
    setInStockOnly: products.setInStockOnly,
    showCheckoutConfirm: checkout.showCheckoutConfirm,
    setShowCheckoutConfirm: checkout.setShowCheckoutConfirm,
    showShiftDrawer: shift.showShiftDrawer,
    setShowShiftDrawer: shift.setShowShiftDrawer,
    cartBadgePulse: products.cartBadgePulse,
    isOnline,
    activeOutletName,
    recentProducts: products.recentProducts,
    popularProducts: products.popularProducts,
    canCheckout: checkout.canCheckout,
    checkoutConfirmEnabled: checkout.checkoutConfirmEnabled,
    qrisPaymentStatus: checkout.qrisPaymentStatus,
    showOnboarding: onboarding.showOnboarding,
    onboardingStep: onboarding.onboardingStep,
    advanceOnboarding: onboarding.advanceOnboarding,
    completeOnboarding: onboarding.completeOnboarding,
    searchInputRef: products.searchInputRef,
    focusSearchInput: products.focusSearchInput,

    // Cart details
    cart,
    subTotal,
    grandTotal,
    discountType,
    discountValue,
    applyTax,
    setDiscount,
    setApplyTax,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,

    // Derived values
    cartItemCount,
    shiftStartedLabel: shift.shiftStartedLabel,
    primaryRole,
    showAdminNav,
    showManagementNav,
    showOutletNav,
    filteredProducts: products.filteredProducts,
    categoriesList: products.categoriesList,
    handleAddToCart: products.handleAddToCart,
    handleSearchKeyDown: products.handleSearchKeyDown,
    incrementLastCartItem: products.incrementLastCartItem,
    decrementLastCartItem: products.decrementLastCartItem,

    // Handlers
    showToast,
    handleLogout,
    handleOpenCustomerDisplay: checkout.handleOpenCustomerDisplay,
    handleCreateCustomerSubmit: customer.handleCreateCustomerSubmit,
    handlePrint: print.handlePrint,
    handleSendWhatsApp: print.handleSendWhatsApp,
    handleFinishTransaction: checkout.handleFinishTransaction,
    handleCheckout: checkout.handleCheckout,
    executeCheckout: checkout.executeCheckout,
    handleOpenShift: shift.handleOpenShift,
    handleCloseShift: shift.handleCloseShift,
    handleCancelQris: checkout.handleCancelQris,
    getRemainingStock: products.getRemainingStock,
  };
}
