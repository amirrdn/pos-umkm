import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore, isTenantOwner } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useReactToPrint } from 'react-to-print';
import { ReceiptTemplate } from './ReceiptTemplate';
import { ShiftModal } from './ShiftModal';
import { CloseShiftModal } from './CloseShiftModal';
import { OutletSwitcher } from './OutletSwitcher';
import { DraftTransferNavBadge } from './DraftTransferNavBadge';
import { useCustomerStore } from '../store/useCustomerStore';
import { useThemeStore } from '../store/useThemeStore';
import { API_BASE_URL } from '../config';
import { buildApiHeaders } from '../utils/apiHeaders';
import { AppSelect } from './AppSelect';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Package,
  Coffee,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  LogOut,
  User,
  BarChart2,
  Printer,
  MessageCircle,
  Check,
  History,
  Users,
  ArrowUpDown,
  Sun,
  Moon,
  Tag,
  Maximize2,
  Monitor,
  X,
  Store
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  imageUrl: string;
}

export const PosView: React.FC = () => {
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
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { subscription, fetchActiveSubscription } = useSubscriptionStore();

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

  const componentRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  const [showQrisModal, setShowQrisModal] = useState<boolean>(false);
  const [qrisUrl, setQrisUrl] = useState<string>('');
  const [qrisInvoiceNumber, setQrisInvoiceNumber] = useState<string>('');
  const [qrisGrandTotal, setQrisGrandTotal] = useState<number>(0);
  const [_qrisString, setQrisString] = useState<string>('');
  const [qrisFullscreen, setQrisFullscreen] = useState<boolean>(false);
  const customerWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<any>(null);

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
        const response = await fetch(`${API_BASE_URL}/api/transactions/status/${invoiceNumber}`, {
          method: 'GET',
          headers: buildApiHeaders(),
        });

        if (!response.ok) {
          throw new Error('Gagal mengecek status transaksi.');
        }

        const resData = await response.json();
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


  const { fetchCustomers, createCustomer } = useCustomerStore();
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);

  const handleCustomerSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    await fetchCustomers(query);
    setSearchResults(useCustomerStore.getState().customers);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'GET',
          headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Gagal mengambil data produk dari server.');
        }

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
            ? `${API_BASE_URL}${mainImage}`
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

    if (token && activeOutletId) {
      fetchProducts();
    } else if (token && !activeOutletId) {
      setProducts([]);
      setLoadingProducts(false);
    }
  }, [token, activeOutletId]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'SEMUA' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = ['SEMUA', ...Array.from(new Set(products.map(p => p.category)))];

  const getRemainingStock = (productId: string, originalStock: number): number => {
    const cartItem = cart.find(item => item.productId === productId);
    return originalStock - (cartItem ? cartItem.quantity : 0);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
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

    // Periksa status langganan sebelum checkout
    if (subscription?.status === 'EXPIRED') {
      showToast('error', 'Aksi ditolak: Masa langganan Anda telah habis. Aksi kasir diblokir.');
      return;
    }

    if (subscription?.usage.transactions.isFull) {
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
      const response = await fetch(`${API_BASE_URL}/api/transactions/checkout`, {
        method: 'POST',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memproses transaksi.');
      }

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
        setQrisString(data.data.qrString || '');
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

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

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

  useEffect(() => {
    if (token && user?.tenantId) {
      fetchActiveShift(token, user.tenantId);
    } else {
      clearShift();
    }
  }, [token, user?.tenantId]);

  useEffect(() => {
    clearCart();
    setSelectedCustomer(null);
  }, [activeOutletId]);

  const primaryRole = user?.roles[0] ?? 'Kasir';
  const showAdminNav =
    user?.roles.includes('Owner') ||
    user?.roles.includes('Admin') ||
    user?.roles.includes('Manager') ||
    user?.roles.includes('Staf Gudang');
  const showManagementNav = showAdminNav && !user?.roles.includes('Staf Gudang');
  const showOutletNav = user?.roles.includes('Owner') || user?.roles.includes('Admin');

  const isNavActive = (path: string) => {
    if (path === '/pos') return location.pathname === '/pos';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navItemClass = (path: string) =>
    `cursor-pointer flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
      isNavActive(path)
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  const shiftStartedLabel = useMemo(() => {
    if (!activeShift?.startTime) return null;
    return new Date(activeShift.startTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [activeShift?.startTime]);

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">

      {/* Modal Buka Shift — diblokir jika belum ada shift aktif */}
      {hasCheckedActiveShift && !activeShift && !isShiftLoading && (
        <ShiftModal
          cashierName={user?.name || 'Kasir'}
          onOpen={handleOpenShift}
          isLoading={isShiftLoading}
        />
      )}

      {/* Modal Tutup Shift */}
      {showCloseShiftModal && activeShift && (
        <CloseShiftModal
          shift={activeShift}
          onClose={handleCloseShift}
          onCancel={() => setShowCloseShiftModal(false)}
          isLoading={isShiftLoading}
        />
      )}

      {/* Template Struk Tersembunyi (hanya terlihat saat cetak) */}
      <div className="hidden print:block">
        <ReceiptTemplate ref={componentRef} transactionData={currentTransaction} />
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="cursor-pointer ml-2 hover:opacity-75 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER UTAMA */}
      <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Bar konteks operasional */}
        <div className="px-5 py-3 flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2.5 rounded-xl text-white shadow-md shadow-indigo-500/25">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  SaaS POS
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Terminal Kasir
                </p>
              </div>
            </div>

            <div className="hidden md:block h-9 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                Outlet
              </span>
              <OutletSwitcher operationalOnly size="md" className="min-w-0" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeShift && (
              <div className="hidden sm:flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 px-3 py-2 rounded-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <div className="leading-tight">
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Shift Aktif</p>
                  {shiftStartedLabel && (
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                      Mulai {shiftStartedLabel}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowCloseShiftModal(true)}
                  className="cursor-pointer ml-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                >
                  Tutup
                </button>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="cursor-pointer p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase">
                {(user?.name ?? 'K').charAt(0)}
              </div>
              <div className="leading-tight max-w-[140px]">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name || 'Operator'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                {primaryRole}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 rounded-xl transition-all active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Bar navigasi */}
        <nav className="px-5 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button onClick={() => navigate('/pos')} className={navItemClass('/pos')}>
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            Kasir
          </button>
          <button onClick={() => navigate('/pos/history')} className={navItemClass('/pos/history')}>
            <History className="w-3.5 h-3.5 shrink-0" />
            Riwayat
          </button>

          {showAdminNav && (
            <>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
              <button onClick={() => navigate('/admin/products')} className={navItemClass('/admin/products')}>
                <Package className="w-3.5 h-3.5 shrink-0" />
                Produk
              </button>
              <button onClick={() => navigate('/admin/categories')} className={navItemClass('/admin/categories')}>
                <Tag className="w-3.5 h-3.5 shrink-0" />
                Kategori
              </button>
              <button onClick={() => navigate('/admin/inventory')} className={navItemClass('/admin/inventory')}>
                <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
                Stok
                <DraftTransferNavBadge />
              </button>

              {showManagementNav && (
                <>
                  <button onClick={() => navigate('/admin/staff')} className={navItemClass('/admin/staff')}>
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    Staf
                  </button>
                  <button onClick={() => navigate('/admin/customers')} className={navItemClass('/admin/customers')}>
                    <User className="w-3.5 h-3.5 shrink-0" />
                    Pelanggan
                  </button>
                  {showOutletNav && (
                    <button onClick={() => navigate('/admin/outlets')} className={navItemClass('/admin/outlets')}>
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      Outlet
                    </button>
                  )}
                  <button onClick={() => navigate('/admin/dashboard')} className={navItemClass('/admin/dashboard')}>
                    <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                    Dashboard
                  </button>
                  {isTenantOwner(user?.roles ?? []) && (
                    <button onClick={() => navigate('/admin/billing')} className={navItemClass('/admin/billing')}>
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      Billing
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </nav>
      </header>

      {/* Banner Peringatan Langganan */}
      {subscription && subscription.status === 'EXPIRED' && (
        <div className="bg-rose-600 text-white px-5 py-3 text-xs font-bold flex justify-between items-center shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 animate-bounce" />
            <span>Masa aktif langganan Anda telah kedaluwarsa. Aplikasi saat ini terkunci (Mode Read-Only). Aksi kasir diblokir hingga pembayaran diperbarui.</span>
          </div>
          {isTenantOwner(user?.roles ?? []) && (
            <button
              onClick={() => navigate('/admin/billing')}
              className="cursor-pointer bg-white text-rose-650 px-3.5 py-1.5 rounded-lg font-black hover:bg-slate-100 transition-all text-[10px] uppercase shadow-sm active:scale-97"
            >
              Bayar Sekarang
            </button>
          )}
        </div>
      )}

      {subscription && !subscription.usage.transactions.isFull && subscription.usage.transactions.isNearLimit && subscription.status !== 'EXPIRED' && (
        <div className="bg-amber-500 text-slate-900 px-5 py-2.5 text-xs font-bold flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Kuota transaksi bulanan Anda hampir habis ({subscription.usage.transactions.current} / {subscription.usage.transactions.limit} trxs). Harap lakukan upgrade paket untuk kelancaran kasir.</span>
          </div>
          {isTenantOwner(user?.roles ?? []) && (
            <button
              onClick={() => navigate('/admin/billing')}
              className="cursor-pointer bg-slate-900 text-white px-3.5 py-1.5 rounded-lg font-black hover:bg-slate-800 transition-all text-[10px] uppercase shadow-sm active:scale-97"
            >
              Upgrade Paket
            </button>
          )}
        </div>
      )}

      {subscription && subscription.usage.transactions.isFull && subscription.status !== 'EXPIRED' && (
        <div className="bg-rose-600 text-white px-5 py-3 text-xs font-bold flex justify-between items-center shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 animate-bounce" />
            <span>Kuota transaksi bulanan Anda telah penuh ({subscription.usage.transactions.current} / {subscription.usage.transactions.limit} trxs). Checkout POS ditangguhkan.</span>
          </div>
          {isTenantOwner(user?.roles ?? []) && (
            <button
              onClick={() => navigate('/admin/billing')}
              className="cursor-pointer bg-white text-rose-600 px-3.5 py-1.5 rounded-lg font-black hover:bg-slate-100 transition-all text-[10px] uppercase shadow-sm active:scale-97"
            >
              Upgrade Sekarang
            </button>
          )}
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex overflow-hidden">

        {/* KOLOM KIRI (70%): Area Katalog Produk */}
        <section className="w-[70%] h-full flex flex-col p-6 overflow-hidden">

          {/* Filter Kategori & Pencarian */}
          <div className="flex justify-between items-center mb-6 shrink-0 gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Kolom Pencarian */}
            <div className="relative w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU atau nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Grid Katalog Produk */}
          <div className="flex-1 overflow-y-auto pr-2">
            {loadingProducts ? (
              <div className="h-60 w-full flex flex-col items-center justify-center">
                <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-500">Loading produk...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const remainingStock = getRemainingStock(product.id, product.stock);
                  const isOutOfStock = remainingStock <= 0;
                  const isLowStock =
                    !isOutOfStock && product.minStock > 0 && remainingStock < product.minStock;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        sku: product.sku,
                        stock: product.stock
                      })}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all cursor-pointer group flex flex-col relative ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                    >
                      {/* Gambar Produk */}
                      <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-350 tracking-wide">
                          {product.category.toUpperCase()}
                        </span>
                        {isLowStock && (
                          <span className="absolute top-2 right-2 bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="h-3 w-3" />
                            Stok Rendah
                          </span>
                        )}
                      </div>

                      {/* Informasi Produk */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{product.sku}</p>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-extrabold text-slate-900 dark:text-slate-50 text-base">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>

                          <span className={`text-[11px] font-bold flex items-center gap-1 ${isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                                ? 'text-rose-500'
                              : remainingStock <= 5
                                ? 'text-amber-600'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                            <Package className="h-3.5 w-3.5" />
                            {isOutOfStock ? 'Habis' : `${remainingStock} Stok`}
                          </span>
                        </div>
                      </div>

                      {/* Overlay Habis */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center font-bold text-rose-700 dark:text-rose-450 text-sm">
                          Stok Habis
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 p-6">
                <Coffee className="h-12 w-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Produk tidak ditemukan</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Belum ada produk aktif yang terdaftar di tenant Anda.</p>
              </div>
            )}
          </div>
        </section>

        {/* KOLOM KANAN (30%): Panel Keranjang Belanja */}
        <section className="w-[30%] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl relative z-10">

          {/* Header Panel */}
          <div className="py-3 px-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-indigo-600" />
              Keranjang Belanja
            </h2>
            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Item
            </span>
          </div>

          {/* Area Konten Scrollable: Daftar Barang & Form Input */}
          <div className="flex-1 overflow-y-auto">

            {/* Daftar Barang */}
            <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl group hover:border-indigo-100 dark:hover:border-indigo-900/40 hover:bg-indigo-50/10 dark:hover:bg-slate-800/60 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate leading-snug">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.sku}</p>
                      <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs mt-1.5">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Kuantitas Control */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="cursor-pointer h-7 w-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateQuantity(item.productId, val === '' ? 1 : Number(val));
                        }}
                        min={1}
                        max={item.stock}
                        className="w-10 text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="cursor-pointer h-7 w-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Hapus Item */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                  <ShoppingBag className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="font-bold text-slate-500 dark:text-slate-400 text-xs">Keranjang kosong</p>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">Pilih produk di katalog untuk ditambahkan.</p>
                </div>
              )}
            </div>

            {/* Form Input Pembayaran */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">

              {/* Opsi Metode Pembayaran */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`cursor-pointer flex items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${paymentMethod === 'CASH'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`cursor-pointer flex items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${paymentMethod === 'QRIS'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    QRIS
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCustomer}
                    onClick={() => setPaymentMethod('DEBT')}
                    className={`cursor-pointer flex items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${!selectedCustomer
                        ? 'bg-slate-100 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-655 cursor-not-allowed opacity-50'
                        : paymentMethod === 'DEBT'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    title={!selectedCustomer ? 'Pilih pelanggan terlebih dahulu untuk metode HUTANG' : 'Metode Hutang'}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Hutang
                  </button>
                </div>
              </div>

              {/* Database Pelanggan & Membership */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Users className="h-3 w-3 text-indigo-500" />
                    Pelanggan & Membership
                  </span>
                  {!selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => setShowAddCustomerModal(true)}
                      className="cursor-pointer text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 uppercase tracking-wide flex items-center gap-0.5"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      Pelanggan Baru
                    </button>
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl p-2 flex justify-between items-start gap-1">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-100">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{selectedCustomer.phone}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-bold px-1.5 py-0.5 rounded">
                          {selectedCustomer.points} Pts
                        </span>
                        {Math.floor(grandTotal / 10000) > 0 && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                            +{Math.floor(grandTotal / 10000)} Pts Baru
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        if (paymentMethod === 'DEBT') {
                          setPaymentMethod('CASH');
                        }
                      }}
                      className="cursor-pointer text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                      title="Lepas Tautan Pelanggan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama / nomor telepon..."
                        value={customerQuery}
                        onChange={(e) => {
                          setCustomerQuery(e.target.value);
                          handleCustomerSearch(e.target.value);
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      />
                      {customerQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerQuery('');
                            setSearchResults([]);
                          }}
                          className="cursor-pointer absolute right-3 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Dropdown Hasil Pencarian */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {searchResults.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setCustomerQuery('');
                              setSearchResults([]);
                            }}
                            className="cursor-pointer w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs gap-2"
                          >
                            <div>
                              <p className="text-slate-800 dark:text-slate-100 font-bold">{cust.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{cust.phone || '-'}</p>
                            </div>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                              {cust.points} Pts
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Opsi Diskon & Pajak */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Diskon Belanja</span>
                  <div className="flex gap-2">
                    <AppSelect
                      size="sm"
                      className="w-36 shrink-0"
                      value={discountType}
                      onChange={(v) => setDiscount(v as 'PERCENT' | 'NOMINAL', discountValue)}
                      searchable={false}
                      options={[
                        { value: 'NOMINAL', label: 'Nominal (Rp)' },
                        { value: 'PERCENT', label: 'Persentase (%)' },
                      ]}
                    />
                    <input
                      type="number"
                      value={discountValue || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDiscount(discountType, val === '' ? 0 : Number(val));
                      }}
                      placeholder="Nilai potongan..."
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <label htmlFor="tax-toggle" className="text-[10px] font-black text-slate-500 dark:text-slate-400 cursor-pointer uppercase tracking-wide">
                    Terapkan PPN (11%)
                  </label>
                  <input
                    id="tax-toggle"
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Footer Tagihan & Checkout (Fixed di Bawah) */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">

            {/* Ringkasan Harga */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold">Rp {subTotal.toLocaleString('id-ID')}</span>
              </div>

              {/* Baris Diskon jika ada */}
              {discountValue > 0 && (
                <div className="flex justify-between items-center text-[11px] text-rose-600">
                  <span>
                    Diskon {discountType === 'PERCENT' ? `(${discountValue}%)` : ''}
                  </span>
                  <span className="font-bold">
                    - Rp {Math.min(subTotal, discountType === 'PERCENT' ? (subTotal * discountValue / 100) : discountValue).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {/* Baris PPN jika ada */}
              {applyTax && (
                <div className="flex justify-between items-center text-[11px] text-amber-700 dark:text-amber-500">
                  <span>PPN (11%)</span>
                  <span className="font-bold">
                    Rp {Math.max(0, (subTotal - (discountType === 'PERCENT' ? (subTotal * discountValue / 100) : discountValue)) * 0.11).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-200/50 dark:border-slate-850">
                <span>Total Tagihan</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-black">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Tombol Checkout */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className={`cursor-pointer w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-lg transition-all ${cart.length === 0
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-none cursor-not-allowed'
                  : isSubmitting
                    ? 'bg-indigo-500 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-99 shadow-indigo-200 dark:shadow-none'
                }`}
            >
              {isSubmitting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Selesaikan Transaksi (Checkout)'
              )}
            </button>
          </div>
        </section>
      </main>

      {/* Modal Sukses Transaksi */}
      {showSuccessModal && currentTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">

            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-center text-white relative">
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                <Check className="h-8 w-8 text-white stroke-[3px]" />
              </div>
              <h3 className="text-xl font-black tracking-wide">Transaksi Berhasil!</h3>
              <p className="text-emerald-100 text-xs mt-1 font-medium">Invoice: {currentTransaction.invoiceNumber}</p>
            </div>

            {/* Konten Modal */}
            <div className="p-6 space-y-6 flex-1">

              {/* Ringkasan Transaksi */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold text-slate-700">
                    {currentTransaction.paymentMethod === 'CASH' ? 'TUNAI' : currentTransaction.paymentMethod === 'DEBT' ? 'HUTANG' : 'QRIS'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-700">
                    Rp {Number(currentTransaction.subTotal || currentTransaction.grandTotal).toLocaleString('id-ID')}
                  </span>
                </div>
                {Number(currentTransaction.discount) > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-600">
                    <span>Diskon</span>
                    <span className="font-bold">
                      - Rp {Number(currentTransaction.discount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {Number(currentTransaction.tax) > 0 && (
                  <div className="flex justify-between items-center text-xs text-amber-700">
                    <span>PPN (11%)</span>
                    <span className="font-bold">
                      Rp {Number(currentTransaction.tax).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 pt-2 border-t border-slate-200/50">
                  <span>Total Tagihan</span>
                  <span className="text-indigo-600 text-base">
                    Rp {Number(currentTransaction.grandTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Rincian Cash / Tunai */}
              {currentTransaction.paymentMethod === 'CASH' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Uang Tunai Diterima (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCashReceived(val === '' ? '' : Number(val));
                        }}
                        placeholder="Masukkan nominal..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Hitung Kembalian */}
                  {cashReceived !== '' && (
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Uang Kembalian</span>
                      <span className={`text-lg font-black ${Number(cashReceived) - currentTransaction.grandTotal < 0
                          ? 'text-rose-600'
                          : 'text-amber-700'
                        }`}>
                        Rp {Math.max(0, Number(cashReceived) - currentTransaction.grandTotal).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {/* Warning Kurang Bayar */}
                  {cashReceived !== '' && Number(cashReceived) - currentTransaction.grandTotal < 0 && (
                    <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Uang diterima kurang dari total belanja!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal / Tombol Aksi */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Cetak Struk */}
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-97 transition-all shadow-sm"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  Cetak Struk
                </button>

                {/* Kirim WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(currentTransaction)}
                  className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 active:scale-97 transition-all shadow-sm"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  Kirim ke WA
                </button>
              </div>

              {/* Selesai */}
              <button
                type="button"
                onClick={handleFinishTransaction}
                disabled={
                  currentTransaction.paymentMethod === 'CASH' &&
                  (cashReceived === '' || Number(cashReceived) - currentTransaction.grandTotal < 0)
                }
                className={`cursor-pointer w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all ${currentTransaction.paymentMethod === 'CASH' &&
                    (cashReceived === '' || Number(cashReceived) - currentTransaction.grandTotal < 0)
                    ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-97 shadow-indigo-100'
                  }`}
              >
                Selesai & Transaksi Baru
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QRIS Fullscreen Overlay (Opsi B) - Layar untuk diputar ke Customer */}
      {showQrisModal && qrisFullscreen && (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center gap-8 p-8">
          {/* Exit Fullscreen button */}
          <button
            type="button"
            onClick={() => setQrisFullscreen(false)}
            className="cursor-pointer absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Store info */}
          <div className="text-center">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">Scan untuk Membayar</p>
            <p className="text-white/30 text-xs font-medium">Invoice: {qrisInvoiceNumber}</p>
          </div>

          {/* QR Code besar */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-indigo-500/20">
            {qrisUrl ? (
              <img
                src={qrisUrl}
                alt="QRIS Code"
                className="w-72 h-72 object-contain"
              />
            ) : (
              <div className="w-72 h-72 flex items-center justify-center">
                <RefreshCw className="h-12 w-12 animate-spin text-indigo-500" />
              </div>
            )}
          </div>

          {/* Total tagihan besar */}
          <div className="text-center">
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">Total Tagihan</p>
            <p className="text-5xl font-black text-white tracking-tight">
              Rp {qrisGrandTotal.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Accepted apps */}
          <p className="text-white/30 text-xs font-medium text-center max-w-xs leading-relaxed">
            GoPay · OVO · Dana · LinkAja · ShopeePay · Mobile Banking
          </p>

          {/* Polling indicator */}
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="animate-pulse">Menunggu Pembayaran...</span>
          </div>
        </div>
      )}

      {/* Modal QRIS Pembayaran Dinamis */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">

            {/* Header Modal */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 text-center text-white relative">
              <div className="mx-auto bg-white/20 h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-black tracking-wide">Scan QRIS Dinamis</h3>
              <p className="text-indigo-100 text-xs mt-1 font-medium">Invoice: {qrisInvoiceNumber}</p>
            </div>

            {/* Konten QRIS */}
            <div className="p-6 flex flex-col items-center space-y-4">
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Tagihan</span>
                <span className="text-3xl font-extrabold text-indigo-600 block mt-1">
                  Rp {qrisGrandTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="relative p-4 bg-white rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center w-60 h-60">
                {qrisUrl ? (
                  <img
                    src={qrisUrl}
                    alt="QRIS Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="text-xs font-bold">Menyiapkan QRIS...</span>
                  </div>
                )}
              </div>

              {/* Loader Polling Status */}
              <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-4 py-2.5 rounded-full text-indigo-700 text-xs font-bold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="animate-pulse">Menunggu Pembayaran...</span>
              </div>

              {/* Aksi Customer Display */}
              {qrisUrl && (
                <div className="flex gap-2 w-full">
                  {/* Opsi B: Fullscreen - putar layar ke customer */}
                  <button
                    type="button"
                    onClick={() => setQrisFullscreen(true)}
                    title="Tampilkan fullscreen, lalu putar layar ke arah customer"
                    className="cursor-pointer flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Putar Layar
                  </button>

                  {/* Opsi A: Customer Display Window */}
                  <button
                    type="button"
                    onClick={handleOpenCustomerDisplay}
                    title="Buka di window baru untuk layar customer / monitor kedua"
                    className="cursor-pointer flex-1 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Layar Customer
                  </button>
                </div>
              )}

              {/* Tombol Simulator */}
              {qrisUrl && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(qrisUrl);
                    showToast('success', 'Tautan Gambar QRIS disalin ke clipboard!');
                  }}
                  className="cursor-pointer w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xl transition-all active:scale-97 flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  🔗 Salin Tautan QRIS (Simulator)
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400 font-medium px-4 leading-relaxed">
                Scan kode QR di atas menggunakan GoPay, OVO, Dana, LinkAja, ShopeePay, atau aplikasi Mobile Banking Anda.
              </p>
            </div>

            {/* Footer Modal / Tombol Batal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelQris}
                className="cursor-pointer w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-97 flex items-center justify-center gap-1.5"
              >
                Batal Pembayaran (Kembali ke POS)
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Tambah Pelanggan Baru Cepat */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                Daftar Pelanggan Baru
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setNewCustName('');
                  setNewCustPhone('');
                  setNewCustEmail('');
                }}
                className="cursor-pointer text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCustName.trim()) {
                showToast('error', 'Nama pelanggan wajib diisi!');
                return;
              }
              setIsCreatingCustomer(true);
              const res = await createCustomer({
                name: newCustName,
                phone: newCustPhone || null,
                email: newCustEmail || null
              });
              setIsCreatingCustomer(false);

              if (res.success && res.data) {
                setSelectedCustomer(res.data);
                showToast('success', 'Pelanggan berhasil didaftarkan!');
                setShowAddCustomerModal(false);
                setNewCustName('');
                setNewCustPhone('');
                setNewCustEmail('');
              } else {
                showToast('error', res.message || 'Gagal mendaftarkan pelanggan.');
              }
            }} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nomor Telepon (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="Contoh: 0812XXXXXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Alamat Email</label>
                <input
                  type="email"
                  placeholder="Contoh: budi@gmail.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setNewCustName('');
                    setNewCustPhone('');
                    setNewCustEmail('');
                  }}
                  className="cursor-pointer flex-1 py-2.5 border border-slate-200 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="cursor-pointer flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-150 transition-all flex items-center justify-center"
                >
                  {isCreatingCustomer ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Daftarkan & Tautkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
