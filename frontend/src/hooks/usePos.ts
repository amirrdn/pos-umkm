import { useState, useEffect, useRef, useMemo, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore, canManageSubscription, isPlatformAdmin } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useThemeStore } from '../store/useThemeStore';
import { getRoleDisplayLabel } from '../utils/roles';
import {
  getProductsApi,
  resolveSilentOutletApi,
  getTransactionStatusApi,
  checkoutApi
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

interface UsePosOptions {
  printRef: RefObject<HTMLDivElement | null>;
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
  const debtFeatureEnabled = subscriptionBypass || (subscription?.features.maxDebtLimit ?? 0) > 0;

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
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [qrisUrl, setQrisUrl] = useState<string>('');
  const [qrisInvoiceNumber, setQrisInvoiceNumber] = useState<string>('');
  const [qrisGrandTotal, setQrisGrandTotal] = useState<number>(0);
  const [qrisFullscreen, setQrisFullscreen] = useState<boolean>(false);

  const { fetchCustomers, createCustomer } = useCustomerStore();
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);

  const customerWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handleLogout = () => {
    clearCart();
    clearShift();
    logout();
  };

  const checkTokenExpiration = (err: any) => {
    const isExpired = err.message?.toLowerCase().includes('kedaluwarsa') || 
                      err.message?.toLowerCase().includes('expired') || 
                      err.message?.toLowerCase().includes('authorization') || 
                      err.message?.toLowerCase().includes('akses ditolak');
    if (isExpired) {
      showToast('error', 'Sesi Anda telah kedaluwarsa. Mengalihkan ke halaman login...');
      setTimeout(() => {
        handleLogout();
        navigate('/login');
      }, 2000);
      return true;
    }
    return false;
  };

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
  }, [token, activeOutletId]);

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
      fetchActiveShift(token, user.tenantId);
    } else {
      clearShift();
    }
  }, [token, user?.tenantId]);

  // Sync Cart reset when outlet changes
  useEffect(() => {
    clearCart();
    setSelectedCustomer(null);
  }, [activeOutletId]);

  // Handle Token expiration on shift error
  useEffect(() => {
    if (shiftError) {
      const isExpired = shiftError.toLowerCase().includes('kedaluwarsa') || 
                        shiftError.toLowerCase().includes('expired') || 
                        shiftError.toLowerCase().includes('authorization') || 
                        shiftError.toLowerCase().includes('akses ditolak');
      if (isExpired) {
        showToast('error', 'Sesi Anda telah kedaluwarsa. Mengalihkan ke halaman login...');
        setTimeout(() => {
          handleLogout();
          navigate('/login');
        }, 2000);
      }
    }
  }, [shiftError]);

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

  // Fetch katalog products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const data = await getProductsApi();
        const mappedProducts = data.data.map((item: any, index: number) => {
          const fallbacks = [
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600'
          ];
          const mainImage = item.images && item.images.length > 0
            ? (item.images.find((img: any) => img.isMain)?.url || item.images[0].url)
            : null;
          const finalImageUrl = mainImage && mainImage.startsWith('/uploads')
            ? `${API_BASE_URL_ASSET(mainImage)}`
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
      } catch (err: any) {
        console.error('Fetch Products Error:', err);
        if (!checkTokenExpiration(err)) {
          showToast('error', err.message || 'Koneksi ke API produk gagal.');
        }
      } finally {
        setLoadingProducts(false);
      }
    };

    if (token && (activeOutletId || platformAdmin)) {
      fetchProducts();
    } else if (token && !activeOutletId && !platformAdmin) {
      setProducts([]);
      setLoadingProducts(false);
    }
  }, [token, activeOutletId, platformAdmin]);

  // Helper function to build asset URL
  function API_BASE_URL_ASSET(path: string) {
    // Import API_BASE_URL dynamically or use imports
    const base = useAuthStore.getState().token ? window.location.origin.includes('localhost') ? 'http://localhost:3000' : '' : '';
    // Actually, we can get API_BASE_URL from ../config
    return `${base}${path}`;
  }

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

          const transactionDataForReceipt = {
            ...resData.data,
            paymentMethod: 'QRIS',
            cashierName: user?.name,
            tenantName: user?.tenantId === 'tenant-uuid-xyz-123' ? 'Toko Utama' : 'UMKM POS'
          };
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

  const handleSendWhatsApp = (transaction: any) => {
    if (!transaction) return;

    const activeCashReceived = transaction.paymentMethod === 'CASH' ? Number(cashReceived || 0) : 0;
    const activeChange = transaction.paymentMethod === 'CASH' ? Math.max(0, activeCashReceived - transaction.grandTotal) : 0;

    const itemsText = transaction.items
      .map((item: any) => {
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

    let paymentDetail = `Metode: ${transaction.paymentMethod === 'CASH' ? 'TUNAI' : transaction.paymentMethod === 'DEBT' ? 'HUTANG' : 'QRIS'}`;
    if (transaction.paymentMethod === 'CASH') {
      paymentDetail += `\nBayar: Rp ${activeCashReceived.toLocaleString('id-ID')}\nKembali: Rp ${activeChange.toLocaleString('id-ID')}`;
    } else if (transaction.paymentMethod === 'DEBT') {
      paymentDetail += `\nSisa Hutang: Rp ${Number(transaction.customer?.debtBalance || 0).toLocaleString('id-ID')}`;
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
        setQrisGrandTotal(data.data.grandTotal);
        setShowQrisModal(true);
        startQrisPolling(data.data.invoiceNumber);
        showToast('success', 'QRIS Dinamis berhasil dibuat. Silakan scan pembayaran.');
      } else {
        const transactionDataForReceipt = {
          ...data.data,
          paymentMethod: paymentMethod,
          cashierName: user?.name,
          tenantName: user?.tenantId === 'tenant-uuid-xyz-123' ? 'Toko Utama' : 'UMKM POS'
        };

        setCurrentTransaction(transactionDataForReceipt);
        setSelectedCustomer(null);
        setCashReceived(paymentMethod === 'CASH' ? grandTotal : 0);
        setShowSuccessModal(true);
        showToast('success', `Transaksi Berhasil! Invoice: ${data.data.invoiceNumber}`);
      }

    } catch (err: any) {
      console.error('Error Checkout:', err);
      if (!checkTokenExpiration(err)) {
        showToast('error', err.message || 'Koneksi ke server gagal. Gagal melakukan checkout.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenShift = async (cashStart: number) => {
    if (!token || !user?.tenantId) return;
    try {
      await openShift(token, user.tenantId, cashStart);
    } catch (err: any) {
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
    } catch (err: any) {
      if (!checkTokenExpiration(err)) {
        showToast('error', err.message || 'Gagal menutup shift.');
      }
    }
  };

  const getRemainingStock = (productId: string, originalStock: number): number => {
    const cartItem = cart.find(item => item.productId === productId);
    return originalStock - (cartItem ? cartItem.quantity : 0);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'SEMUA' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const categoriesList = useMemo(() => {
    return ['SEMUA', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

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
  }, [activeShift?.startTime]);

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
    debtFeatureEnabled,
    activeShift,
    isShiftLoading,
    hasCheckedActiveShift,
    shiftError,
    showCloseShiftModal,
    setShowCloseShiftModal,
    products,
    loadingProducts,
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
