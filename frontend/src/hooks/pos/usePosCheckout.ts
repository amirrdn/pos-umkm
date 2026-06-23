import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { POS_CHECKOUT_CONFIRM_KEY } from '../../utils/posRecentProducts';
import { getTransactionStatusApi, checkoutApi } from '../../api/posApi';
import type { Customer } from '../../store/useCustomerStore';
import type { AuthUser } from '../../store/useAuthStore';
import type { SubscriptionDetails } from '../../store/useSubscriptionStore';
import type { ActiveShift } from '../../store/useShiftStore';
import {
  type Product,
  type PosReceiptTransaction,
  toReceiptTransaction,
} from './posUtils';

interface UsePosCheckoutOptions {
  user: AuthUser | null;
  activeOutletId: string | null;
  subscriptionBypass: boolean;
  subscription: SubscriptionDetails | null;
  activeShift: ActiveShift | null;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  showToast: (type: 'success' | 'error', message: string) => void;
  checkTokenExpiration: (err: unknown) => boolean;
  setShowCartPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export function usePosCheckout({
  user,
  activeOutletId,
  subscriptionBypass,
  subscription,
  activeShift,
  selectedCustomer,
  setSelectedCustomer,
  setProducts,
  showToast,
  checkTokenExpiration,
  setShowCartPanel,
}: UsePosCheckoutOptions) {
  const {
    cart,
    grandTotal,
    clearCart,
    discountType,
    discountValue,
    applyTax,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<PosReceiptTransaction | null>(null);
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState<boolean>(false);

  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [qrisUrl, setQrisUrl] = useState<string>('');
  const [qrisInvoiceNumber, setQrisInvoiceNumber] = useState<string>('');
  const [qrisGrandTotal, setQrisGrandTotal] = useState<number>(0);
  const [qrisFullscreen, setQrisFullscreen] = useState<boolean>(false);
  const [qrisPaymentStatus, setQrisPaymentStatus] = useState<'waiting' | 'paid'>('waiting');

  const customerWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkoutConfirmEnabled = useMemo(() => {
    try {
      const stored = localStorage.getItem(POS_CHECKOUT_CONFIRM_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  }, []);

  const notifyCustomerDisplayPaid = useCallback(() => {
    if (customerWindowRef.current && !customerWindowRef.current.closed) {
      customerWindowRef.current.postMessage({ type: 'QRIS_PAID' }, window.location.origin);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const restoreLocalStock = useCallback(() => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const cartItem = cart.find(item => item.productId === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock + cartItem.quantity };
        }
        return p;
      })
    );
  }, [cart, setProducts]);

  const startQrisPolling = useCallback((invoiceNumber: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const resData = await getTransactionStatusApi(invoiceNumber);
        const status = resData.data?.status;

        if (status === 'COMPLETED') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setQrisPaymentStatus('paid');
          notifyCustomerDisplayPaid();
          setShowQrisModal(false);

          const transactionDataForReceipt = toReceiptTransaction(resData.data, {
            paymentMethod: 'QRIS',
            cashierName: user?.name,
            tenantName: user?.tenantId === 'tenant-uuid-xyz-123' ? 'Toko Utama' : 'UMKM POS',
          });
          setCurrentTransaction(transactionDataForReceipt);
          setSelectedCustomer(null);
          setCashReceived(0);
          setShowSuccessModal(true);
          showToast('success', `Pembayaran QRIS Sukses! Invoice: ${invoiceNumber}`);
        } else if (status === 'VOID') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setShowQrisModal(false);
          restoreLocalStock();
          showToast('error', `Pembayaran QRIS Gagal atau Dibatalkan (Expired).`);
        }
      } catch (err) {
        console.error('Polling status error:', err);
      }
    }, 3000);
  }, [user, notifyCustomerDisplayPaid, setSelectedCustomer, restoreLocalStock, showToast]);

  const handleCancelQris = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (customerWindowRef.current && !customerWindowRef.current.closed) {
      customerWindowRef.current.close();
      customerWindowRef.current = null;
    }
    setQrisPaymentStatus('waiting');
    setQrisFullscreen(false);
    setShowQrisModal(false);
    restoreLocalStock();
    showToast('success', 'Pembayaran QRIS dibatalkan oleh kasir.');
  }, [restoreLocalStock, showToast]);

  const handleOpenCustomerDisplay = useCallback(() => {
    const params = new URLSearchParams({
      qrisUrl: qrisUrl,
      amount: qrisGrandTotal.toString(),
      invoice: qrisInvoiceNumber
    });
    const win = window.open(`/customer-display?${params.toString()}`, 'customer-display', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
    if (win) {
      customerWindowRef.current = win;
    }
  }, [qrisUrl, qrisGrandTotal, qrisInvoiceNumber]);

  const handleFinishTransaction = useCallback(() => {
    setShowSuccessModal(false);
    setShowCartPanel(false);
    clearCart();
    setPaymentMethod('CASH');
    setCurrentTransaction(null);
    setCashReceived('');
    setSelectedCustomer(null);
  }, [clearCart, setShowCartPanel, setSelectedCustomer]);

  const executeCheckout = useCallback(async () => {
    setShowCheckoutConfirm(false);
    setIsSubmitting(true);

    const payload = {
      paymentMethod,
      discountType,
      discountValue,
      applyTax,
      customerId: selectedCustomer?.id || null,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    try {
      const data = await checkoutApi(payload);

      setProducts(prevProducts =>
        prevProducts.map(p => {
          const cartItem = cart.find(item => item.productId === p.id);
          if (cartItem) {
            return { ...p, stock: p.stock - cartItem.quantity };
          }
          return p;
        })
      );

      if (paymentMethod === 'QRIS') {
        setQrisPaymentStatus('waiting');
        setQrisUrl(data.data.qrisUrl || '');
        setQrisInvoiceNumber(data.data.invoiceNumber);
        setQrisGrandTotal(Number(data.data.grandTotal));
        setShowQrisModal(true);
        startQrisPolling(data.data.invoiceNumber);
        showToast('success', 'QRIS Dinamis berhasil dibuat. Silakan scan pembayaran.');
      } else {
        const transactionDataForReceipt = toReceiptTransaction(data.data, {
          paymentMethod,
          cashierName: user?.name,
          tenantName: user?.tenantId === 'tenant-uuid-xyz-123' ? 'Toko Utama' : 'UMKM POS',
        });

        setCurrentTransaction(transactionDataForReceipt);
        setSelectedCustomer(null);
        setCashReceived(paymentMethod === 'CASH' ? grandTotal : 0);
        setShowSuccessModal(true);
        showToast('success', `Transaksi Berhasil! Invoice: ${data.data.invoiceNumber}`);
      }

    } catch (err: unknown) {
      console.error('Error Checkout:', err);
      if (!checkTokenExpiration(err)) {
        const msg = err instanceof Error ? err.message : 'Koneksi ke server gagal. Gagal melakukan checkout.';
        showToast('error', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    paymentMethod,
    discountType,
    discountValue,
    applyTax,
    selectedCustomer,
    cart,
    setProducts,
    startQrisPolling,
    showToast,
    user,
    grandTotal,
    checkTokenExpiration,
    setSelectedCustomer,
  ]);

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      showToast('error', 'Keranjang belanja masih kosong!');
      return;
    }

    if (!activeShift) {
      showToast('error', 'Buka shift terlebih dahulu sebelum melakukan pembayaran.');
      return;
    }

    if (!activeOutletId) {
      showToast('error', 'Pilih outlet aktif terlebih dahulu sebelum checkout.');
      return;
    }

    if (!subscriptionBypass && subscription?.status === 'EXPIRED') {
      showToast('error', 'Aksi ditolak: Masa langganan Anda telah habis. Aksi kasir diblokir.');
      return;
    }

    if (!subscriptionBypass && subscription?.usage.transactions.isFull) {
      showToast('error', 'Aksi ditolak: Batas maksimal kuota transaksi bulanan paket Anda telah tercapai. Harap upgrade paket Anda.');
      return;
    }

    if (checkoutConfirmEnabled) {
      setShowCheckoutConfirm(true);
      return;
    }

    await executeCheckout();
  }, [
    cart,
    activeShift,
    activeOutletId,
    subscriptionBypass,
    subscription,
    checkoutConfirmEnabled,
    executeCheckout,
    showToast,
  ]);

  const canCheckout = cart.length > 0 && Boolean(activeShift) && !isSubmitting;

  return {
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    setIsSubmitting,
    currentTransaction,
    setCurrentTransaction,
    cashReceived,
    setCashReceived,
    showSuccessModal,
    setShowSuccessModal,
    showCheckoutConfirm,
    setShowCheckoutConfirm,
    showQrisModal,
    setShowQrisModal,
    qrisUrl,
    setQrisUrl,
    qrisInvoiceNumber,
    setQrisInvoiceNumber,
    qrisGrandTotal,
    setQrisGrandTotal,
    qrisFullscreen,
    setQrisFullscreen,
    qrisPaymentStatus,
    setQrisPaymentStatus,
    restoreLocalStock,
    startQrisPolling,
    handleCancelQris,
    handleOpenCustomerDisplay,
    handleFinishTransaction,
    executeCheckout,
    handleCheckout,
    canCheckout,
    checkoutConfirmEnabled,
  };
}
