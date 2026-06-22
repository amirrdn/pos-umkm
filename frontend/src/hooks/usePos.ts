import { useState, useEffect, useRef, useMemo, useCallback, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore, canManageSubscription, isPlatformAdmin } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useCustomerStore, type Customer } from '../store/useCustomerStore';
import { useThemeStore } from '../store/useThemeStore';
import { getRoleDisplayLabel } from '../utils/roles';
import { isApiError } from '../api/types';
import type { TransactionData } from '../components/ReceiptTemplate';
import { API_BASE_URL } from '../config';
import {
  getProductsApi,
  resolveSilentOutletApi,
  getTransactionStatusApi,
  checkoutApi,
  type PosCatalogProduct,
  type PosTransactionStatus,
} from '../api/posApi';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  imageUrl: string;
}

interface ProductApiImage {
  url: string;
  isMain?: boolean;
}

export interface PosReceiptTransaction extends TransactionData {
  cashierName?: string;
  tenantName?: string;
  customer?: (NonNullable<TransactionData['customer']> & { phone?: string | null }) | null;
}

function toReceiptTransaction(
  tx: PosTransactionStatus,
  extras: { paymentMethod: string; cashierName?: string; tenantName?: string }
): PosReceiptTransaction {
  const customer = tx.customer as
    | (NonNullable<PosTransactionStatus['customer']> & { phone?: string | null })
    | null
    | undefined;

  return {
    invoiceNumber: tx.invoiceNumber,
    createdAt: tx.createdAt ?? new Date().toISOString(),
    grandTotal: Number(tx.grandTotal),
    paymentMethod: extras.paymentMethod,
    items: (tx.items ?? []).map((item) => ({
      quantity: item.quantity,
      priceAtTransaction: Number(item.priceAtTransaction ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      product: item.product
        ? { name: item.product.name, sku: item.product.sku ?? '' }
        : undefined,
    })),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          points: customer.points ?? 0,
          phone: customer.phone ?? null,
        }
      : null,
    cashierName: extras.cashierName,
    tenantName: extras.tenantName,
  };
}

interface UsePosOptions {
  printRef: RefObject<HTMLDivElement | null>;
}

function buildProductAssetUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function usePos({ printRef }: UsePosOptions) {
  const navigate = useNavigate();

  const {
    cart,
    subTotal,
    grandTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    discountType,
    discountValue,
    applyTax,
    setDiscount,
    setApplyTax
  } = useCartStore();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const setActiveOutlet = useAuthStore((state) => state.setActiveOutlet);
  const logout = useAuthStore((state) => state.logout);
  
  const { theme, toggleTheme } = useThemeStore();
  const { subscription, fetchActiveSubscription } = useSubscriptionStore();

  const userRoles = user?.roles ?? [];
  const platformAdmin = isPlatformAdmin(userRoles);
  const managesSubscription = canManageSubscription(userRoles);
  const subscriptionBypass = platformAdmin || subscription?.platformAdminBypass === true;

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [showCartPanel, setShowCartPanel] = useState<boolean>(false);

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<PosReceiptTransaction | null>(null);
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [qrisUrl, setQrisUrl] = useState<string>('');
  const [qrisInvoiceNumber, setQrisInvoiceNumber] = useState<string>('');
  const [qrisGrandTotal, setQrisGrandTotal] = useState<number>(0);
  const [qrisFullscreen, setQrisFullscreen] = useState<boolean>(false);

  const { fetchCustomers, createCustomer } = useCustomerStore();
  const [customerByOutlet, setCustomerByOutlet] = useState<{
    outletId: string | null;
    customer: Customer | null;
  }>({ outletId: activeOutletId, customer: null });
  const selectedCustomer =
    customerByOutlet.outletId === activeOutletId ? customerByOutlet.customer : null;
  const setSelectedCustomer = useCallback(
    (customer: Customer | null) => {
      setCustomerByOutlet({ outletId: activeOutletId, customer });
    },
    [activeOutletId]
  );
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);

  const customerWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
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
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (token) {
      fetchActiveSubscription();
    }
  }, [token, activeOutletId, fetchActiveSubscription]);

  // Resolve silent outlet for platform admin
  useEffect(() => {
    if (!platformAdmin || activeOutletId || !token) return;

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
  }, [platformAdmin, activeOutletId, token, setActiveOutlet]);

  // Sync Shift active status
  useEffect(() => {
    if (token && user?.tenantId) {
      void fetchActiveShift(token, user.tenantId).then(() => {
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
  }, [token, user?.tenantId, fetchActiveShift, clearShift, navigate, handleLogout, showToast]);

  // Handle mobile cart drawer overflow hidden
  useEffect(() => {
    if (showCartPanel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCartPanel]);

  // Handle media query change to close mobile cart drawer
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setShowCartPanel(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const canFetchProducts = Boolean(token && (activeOutletId || platformAdmin));

  // Fetch katalog products
  useEffect(() => {
    if (!canFetchProducts) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoadingProducts(true);
      try {
        const data = await getProductsApi();
        if (cancelled) return;

        const mappedProducts = (data.data as PosCatalogProduct[]).map((item, index: number) => {
          const fallbacks = [
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600'
          ];
          const mainImage = item.images && item.images.length > 0
            ? (item.images.find((img: ProductApiImage) => img.isMain)?.url || item.images[0].url)
            : null;
          const finalImageUrl = mainImage && mainImage.startsWith('/uploads')
            ? buildProductAssetUrl(mainImage)
            : mainImage;
          return {
            id: item.id,
            sku: item.sku,
            name: item.name,
            price: Number(item.sellingPrice),
            stock: item.stock,
            minStock: item.minStock ?? 0,
            category: item.category?.name || 'Umum',
            imageUrl: finalImageUrl || fallbacks[index % fallbacks.length]
          };
        });

        setProducts(mappedProducts);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('Fetch Products Error:', err);
        if (!checkTokenExpiration(err)) {
          const msg = err instanceof Error ? err.message : 'Koneksi ke API produk gagal.';
          showToast('error', msg);
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetchProducts, token, activeOutletId, platformAdmin, checkTokenExpiration, showToast]);

  const catalogProducts = useMemo(
    () => (canFetchProducts ? products : []),
    [canFetchProducts, products]
  );
  const catalogLoading = canFetchProducts ? loadingProducts : false;

  const restoreLocalStock = () => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const cartItem = cart.find(item => item.productId === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock + cartItem.quantity };
        }
        return p;
      })
    );
  };

  const startQrisPolling = (invoiceNumber: string) => {
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
  };

  const handleCancelQris = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (customerWindowRef.current && !customerWindowRef.current.closed) {
      customerWindowRef.current.close();
      customerWindowRef.current = null;
    }
    setQrisFullscreen(false);
    setShowQrisModal(false);
    restoreLocalStock();
    showToast('success', 'Pembayaran QRIS dibatalkan oleh kasir.');
  };

  const handleOpenCustomerDisplay = () => {
    const params = new URLSearchParams({
      qrisUrl: qrisUrl,
      amount: qrisGrandTotal.toString(),
      invoice: qrisInvoiceNumber
    });
    const win = window.open(`/customer-display?${params.toString()}`, 'customer-display', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
    if (win) {
      customerWindowRef.current = win;
    }
  };

  const handleCustomerSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    await fetchCustomers(query);
    setSearchResults(useCustomerStore.getState().customers);
  };

  const handleCreateCustomerSubmit = async (name: string, phone: string, email: string) => {
    if (!name.trim()) {
      showToast('error', 'Nama pelanggan wajib diisi!');
      return false;
    }
    setIsCreatingCustomer(true);
    const res = await createCustomer({
      name,
      phone: phone || null,
      email: email || null
    });
    setIsCreatingCustomer(false);

    if (res.success && res.data) {
      setSelectedCustomer(res.data);
      showToast('success', 'Pelanggan berhasil didaftarkan!');
      setShowAddCustomerModal(false);
      return true;
    } else {
      showToast('error', res.message || 'Gagal mendaftarkan pelanggan.');
      return false;
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleSendWhatsApp = (transaction: PosReceiptTransaction) => {
    if (!transaction) return;

    const activeCashReceived = transaction.paymentMethod === 'CASH' ? Number(cashReceived || 0) : 0;
    const activeChange = transaction.paymentMethod === 'CASH' ? Math.max(0, activeCashReceived - transaction.grandTotal) : 0;

    const itemsText = transaction.items
      .map((item) => {
        const pName = item.product?.name || item.name || 'Produk';
        const qty = item.quantity;
        const sub = item.subtotal || (qty * (item.priceAtTransaction || item.price || 0));
        return `- ${pName} x${qty}: Rp ${Number(sub).toLocaleString('id-ID')}`;
      })
      .join('\n');

    const formattedDate = new Date(transaction.createdAt).toLocaleString('id-ID');
    const tenantName = transaction.tenantName || 'UMKM POS';
    const invoiceNum = transaction.invoiceNumber;
    const cashierName = transaction.cashierName || 'Kasir';
    const totalTagihan = Number(transaction.grandTotal).toLocaleString('id-ID');

    let paymentDetail = `Metode: ${transaction.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS'}`;
    if (transaction.paymentMethod === 'CASH') {
      paymentDetail += `\nBayar: Rp ${activeCashReceived.toLocaleString('id-ID')}\nKembali: Rp ${activeChange.toLocaleString('id-ID')}`;
    }

    let customerDetail = '';
    if (transaction.customer) {
      const earned = Math.floor(Number(transaction.grandTotal) / 10000);
      customerDetail = `\n\nPelanggan: ${transaction.customer.name}\nPoin Baru: +${earned} Pts\nTotal Poin: ${transaction.customer.points} Pts`;
    }

    const text = `*INVOICE: ${invoiceNum}*
Toko: ${tenantName}
Tanggal: ${formattedDate}
Kasir: ${cashierName}

*Daftar Produk:*
${itemsText}

*Total Tagihan: Rp ${totalTagihan}*
${paymentDetail}${customerDetail}

Terima kasih atas kunjungan Anda!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFinishTransaction = () => {
    setShowSuccessModal(false);
    setShowCartPanel(false);
    clearCart();
    setPaymentMethod('CASH');
    setCurrentTransaction(null);
    setCashReceived('');
    setSelectedCustomer(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('error', 'Keranjang belanja masih kosong!');
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

    setIsSubmitting(true);
    setNotification(null);

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
  };

  const handleOpenShift = async (cashStart: number) => {
    if (!token || !user?.tenantId) return;
    try {
      await openShift(token, user.tenantId, cashStart);
    } catch (err: unknown) {
      if (!checkTokenExpiration(err)) {
        throw err;
      }
    }
  };

  const handleCloseShift = async (cashActual: number) => {
    if (!token || !user?.tenantId || !activeShift) return;
    try {
      await closeShiftAction(token, user.tenantId, activeShift.id, cashActual);
      setShowCloseShiftModal(false);
      showToast('success', 'Shift berhasil ditutup. Sampai jumpa!');
    } catch (err: unknown) {
      if (!checkTokenExpiration(err)) {
        const msg = err instanceof Error ? err.message : 'Gagal menutup shift.';
        showToast('error', msg);
      }
    }
  };

  const getRemainingStock = (productId: string, originalStock: number): number => {
    const cartItem = cart.find(item => item.productId === productId);
    return originalStock - (cartItem ? cartItem.quantity : 0);
  };

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'SEMUA' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalogProducts, searchQuery, selectedCategory]);

  const categoriesList = useMemo(() => {
    return ['SEMUA', ...Array.from(new Set(catalogProducts.map(p => p.category)))];
  }, [catalogProducts]);

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const shiftStartedLabel = useMemo(() => {
    if (!activeShift?.startTime) return null;
    return new Date(activeShift.startTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [activeShift]);

  const primaryRole = getRoleDisplayLabel(user?.roles[0] ?? 'Kasir');
  const showAdminNav = !!(
    user?.roles.includes('Owner') ||
    user?.roles.includes('Admin') ||
    user?.roles.includes('Manager') ||
    user?.roles.includes('Staf Gudang')
  );
  const showManagementNav = !!(showAdminNav && !user?.roles.includes('Staf Gudang'));
  const showOutletNav = !!(user?.roles.includes('Owner') || user?.roles.includes('Admin'));

  return {
    // Stores & states
    token,
    user,
    activeOutletId,
    setActiveOutlet,
    theme,
    toggleTheme,
    subscription,
    platformAdmin,
    managesSubscription,
    subscriptionBypass,
    activeShift,
    isShiftLoading,
    hasCheckedActiveShift,
    shiftError,
    showCloseShiftModal,
    setShowCloseShiftModal,
    products: catalogProducts,
    loadingProducts: catalogLoading,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    notification,
    setNotification,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showCartPanel,
    setShowCartPanel,
    showSuccessModal,
    setShowSuccessModal,
    currentTransaction,
    cashReceived,
    setCashReceived,
    showQrisModal,
    setShowQrisModal,
    qrisUrl,
    qrisInvoiceNumber,
    qrisGrandTotal,
    qrisFullscreen,
    setQrisFullscreen,
    selectedCustomer,
    setSelectedCustomer,
    customerQuery,
    setCustomerQuery,
    searchResults,
    setSearchResults,
    showAddCustomerModal,
    setShowAddCustomerModal,
    newCustName,
    setNewCustName,
    newCustPhone,
    setNewCustPhone,
    newCustEmail,
    setNewCustEmail,
    isCreatingCustomer,

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
    shiftStartedLabel,
    primaryRole,
    showAdminNav,
    showManagementNav,
    showOutletNav,
    filteredProducts,
    categoriesList,

    // Handlers
    showToast,
    handleLogout,
    handleOpenCustomerDisplay,
    handleCustomerSearch,
    handleCreateCustomerSubmit,
    handlePrint,
    handleSendWhatsApp,
    handleFinishTransaction,
    handleCheckout,
    handleOpenShift,
    handleCloseShift,
    handleCancelQris,
    getRemainingStock
  };
}
