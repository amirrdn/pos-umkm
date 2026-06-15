import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import { useReactToPrint } from 'react-to-print';
import { ReceiptTemplate } from './ReceiptTemplate';
import { ShiftModal } from './ShiftModal';
import { CloseShiftModal } from './CloseShiftModal';
import { API_BASE_URL } from '../config';
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
  Clock,
  Users,
  ArrowUpDown
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
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
  
  // Ambil data autentikasi dari Zustand Auth Store
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // State Shift Kasir dari Zustand
  const { activeShift, isLoading: isShiftLoading, fetchActiveShift, openShift, closeShift: closeShiftAction, clearShift } = useShiftStore();
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);

  // Ref untuk Cetak Struk
  const componentRef = useRef<HTMLDivElement>(null);

  // State Komponen
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');

  // State Fitur Cetak Struk & Modal Sukses
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  // ==========================================
  // FETCH PRODUK ASLI DARI BACKEND
  // ==========================================
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Gunakan token dan tenantId asli dari Auth Store
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': user?.tenantId || ''
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Gagal mengambil data produk dari server.');
        }

        // Mapping data produk dari backend (mengatasi decimal/tipe data dan fallback gambar)
        const mappedProducts = data.data.map((item: any, index: number) => {
          // Buat URL Unsplash secara acak/statis berdasarkan indeks produk untuk mempercantik UI
          const fallbacks = [
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600'
          ];
          return {
            id: item.id,
            sku: item.sku,
            name: item.name,
            price: Number(item.sellingPrice),
            stock: item.stock,
            category: item.category?.name || 'Umum',
            imageUrl: fallbacks[index % fallbacks.length]
          };
        });

        setProducts(mappedProducts);
      } catch (err: any) {
        console.error('Fetch Products Error:', err);
        showToast('error', err.message || 'Koneksi ke API produk gagal.');
      } finally {
        setLoadingProducts(false);
      }
    };

    if (token) {
      fetchProducts();
    }
  }, [token, user]);

  // Filter produk berdasarkan pencarian dan kategori
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'SEMUA' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Ekstrak list kategori produk unik untuk filter
  const categoriesList = ['SEMUA', ...Array.from(new Set(products.map(p => p.category)))];

  // Helper untuk menghitung sisa stok dinamis di UI katalog berdasarkan isi keranjang belanja
  const getRemainingStock = (productId: string, originalStock: number): number => {
    const cartItem = cart.find(item => item.productId === productId);
    return originalStock - (cartItem ? cartItem.quantity : 0);
  };

  // Integrasi react-to-print v3+ (mendukung React 19)
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // Handler Kirim Struk via WhatsApp
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

    let paymentDetail = `Metode: ${transaction.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS'}`;
    if (transaction.paymentMethod === 'CASH') {
      paymentDetail += `\nBayar: Rp ${activeCashReceived.toLocaleString('id-ID')}\nKembali: Rp ${activeChange.toLocaleString('id-ID')}`;
    }

    const text = `*INVOICE: ${invoiceNum}*
Toko: ${tenantName}
Tanggal: ${formattedDate}
Kasir: ${cashierName}

================================
*Daftar Produk:*
${itemsText}
================================
*Total Tagihan: Rp ${totalTagihan}*
${paymentDetail}

Terima kasih atas kunjungan Anda!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Handler Selesai & Tutup Modal Transaksi
  const handleFinishTransaction = () => {
    setShowSuccessModal(false);
    clearCart(); // Baru dikosongkan saat tombol selesai ditekan
    setPaymentMethod('CASH'); // Reset metode pembayaran
    setCurrentTransaction(null);
    setCashReceived('');
  };

  // Handler Kirim Transaksi (Checkout) ke Backend API
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('error', 'Keranjang belanja masih kosong!');
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    // Format payload sesuai validasi Zod backend
    const payload = {
      paymentMethod,
      discountType,
      discountValue,
      applyTax,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    try {
      // Panggil API POST /api/transactions/checkout
      const response = await fetch(`${API_BASE_URL}/api/transactions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Sertakan kredensial asli
          'x-tenant-id': user?.tenantId || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memproses transaksi.');
      }

      // Berhasil - Simpan data transaksi untuk Cetak Struk / WA
      const transactionDataForReceipt = {
        ...data.data,
        paymentMethod: paymentMethod,
        cashierName: user?.name,
        tenantName: user?.tenantId === 'tenant-uuid-xyz-123' ? 'Toko Utama' : 'UMKM POS'
      };

      setCurrentTransaction(transactionDataForReceipt);
      setCashReceived(paymentMethod === 'CASH' ? grandTotal : 0);
      setShowSuccessModal(true);
      showToast('success', `Transaksi Berhasil! Invoice: ${data.data.invoiceNumber}`);
      
      // Update stok produk lokal di UI setelah checkout sukses
      setProducts(prevProducts => 
        prevProducts.map(p => {
          const cartItem = cart.find(item => item.productId === p.id);
          if (cartItem) {
            return { ...p, stock: p.stock - cartItem.quantity };
          }
          return p;
        })
      );

    } catch (err: any) {
      console.error('Error Checkout:', err);
      showToast('error', err.message || 'Koneksi ke server gagal. Gagal melakukan checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Logout: bersihkan shift dan cart sebelum keluar
  const handleLogout = () => {
    clearCart();
    clearShift();
    logout();
  };

  // Handler Buka Shift
  const handleOpenShift = async (cashStart: number) => {
    if (!token || !user?.tenantId) return;
    await openShift(token, user.tenantId, cashStart);
  };

  // Handler Tutup Shift
  const handleCloseShift = async (cashActual: number) => {
    if (!token || !user?.tenantId || !activeShift) return;
    await closeShiftAction(token, user.tenantId, activeShift.id, cashActual);
    setShowCloseShiftModal(false);
    showToast('success', 'Shift berhasil ditutup. Sampai jumpa!');
  };

  // Helper untuk memicu notifikasi Toast sementara
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Fetch shift aktif saat komponen mount
  useEffect(() => {
    if (token && user?.tenantId) {
      fetchActiveShift(token, user.tenantId);
    }
  }, [token, user?.tenantId]);

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* Modal Buka Shift — diblokir jika belum ada shift aktif */}
      {!activeShift && !isShiftLoading && (
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
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 ${
          notification.type === 'success' 
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
            className="ml-2 hover:opacity-75 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER UTAMA */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">UMKM POS</h1>
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Kasir: {user?.name || 'Operator'} ({user?.roles[0]})
            </p>
          </div>
        </div>

        {/* Kolom Pencarian */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari SKU atau nama produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Menu Navigasi Global */}
        <nav className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm animate-all duration-150"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Kasir POS
          </button>
          <button
            onClick={() => navigate('/pos/history')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-605 hover:text-slate-900 hover:bg-slate-200/50 transition-all duration-150"
          >
            <History className="w-3.5 h-3.5" />
            Riwayat
          </button>
          
          {/* Menu Khusus Owner / Admin */}
          {(user?.roles.includes('Owner') || user?.roles.includes('TENANT_ADMIN')) && (
            <>
              <button
                onClick={() => navigate('/admin/products')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-605 hover:text-slate-900 hover:bg-slate-200/50 transition-all duration-150"
              >
                <Package className="w-3.5 h-3.5" />
                Produk
              </button>
              <button
                onClick={() => navigate('/admin/inventory')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-605 hover:text-slate-900 hover:bg-slate-200/50 transition-all duration-150"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Stok
              </button>
              <button
                onClick={() => navigate('/admin/staff')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-605 hover:text-slate-900 hover:bg-slate-200/50 transition-all duration-150"
              >
                <Users className="w-3.5 h-3.5" />
                Staf
              </button>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-605 hover:text-slate-900 hover:bg-slate-200/50 transition-all duration-150"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </>
          )}
        </nav>

        {/* Informasi Akun & Logout */}
        <div className="flex items-center gap-3">

          {/* Badge Status Shift */}
          {activeShift && (
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Shift Aktif</span>
              <button
                onClick={() => setShowCloseShiftModal(true)}
                className="ml-1 text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-wide"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-4">
            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">{user?.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* KOLOM KIRI (70%): Area Katalog Produk */}
        <section className="w-[70%] h-full flex flex-col p-6 overflow-hidden">
          
          {/* Filter Kategori */}
          <div className="flex gap-2 mb-6 shrink-0">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
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
                      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col relative ${
                        isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {/* Gambar Produk */}
                      <div className="h-44 w-full bg-slate-100 overflow-hidden relative shrink-0">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 tracking-wide">
                          {product.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Informasi Produk */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{product.sku}</p>
                          <h3 className="font-bold text-slate-800 text-sm mt-1 leading-snug group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                          <span className="font-extrabold text-slate-900 text-base">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                          
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${
                            isOutOfStock 
                              ? 'text-rose-600' 
                              : remainingStock <= 5 
                                ? 'text-amber-600' 
                                : 'text-slate-500'
                          }`}>
                            <Package className="h-3.5 w-3.5" />
                            {isOutOfStock ? 'Habis' : `${remainingStock} Stok`}
                          </span>
                        </div>
                      </div>

                      {/* Overlay Habis */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center font-bold text-rose-700 text-sm">
                          Stok Habis
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-3xl bg-white p-6">
                <Coffee className="h-12 w-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-600 text-sm">Produk tidak ditemukan</p>
                <p className="text-slate-400 text-xs mt-1">Belum ada produk aktif yang terdaftar di tenant Anda.</p>
              </div>
            )}
          </div>
        </section>

        {/* KOLOM KANAN (30%): Panel Keranjang Belanja */}
        <section className="w-[30%] h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden shadow-2xl relative z-10">
          
          {/* Header Panel */}
          <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
              Keranjang Belanja
            </h2>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Item
            </span>
          </div>

          {/* Daftar Barang */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div 
                  key={item.productId}
                  className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl group hover:border-indigo-100 hover:bg-indigo-50/10 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.sku}</p>
                    <p className="font-extrabold text-indigo-600 text-xs mt-1.5">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Kuantitas Control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="h-7 w-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    
                    <span className="text-xs font-bold text-slate-800 w-6 text-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="h-7 w-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Hapus Item */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                <ShoppingBag className="h-12 w-12 text-slate-200 mb-3" />
                <p className="font-bold text-slate-500 text-sm">Keranjang kosong</p>
                <p className="text-slate-400 text-xs mt-1">Pilih produk di area katalog untuk menambahkannya ke sini.</p>
              </div>
            )}
          </div>

          {/* Panel Pembayaran & Checkout */}
          <div className="p-6 border-t border-slate-200 bg-slate-50/80 shrink-0 space-y-4">
            
            {/* Opsi Metode Pembayaran */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-150'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  Tunai / Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-150'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  QRIS / E-Wallet
                </button>
              </div>
            </div>

            {/* Opsi Diskon & Pajak */}
            <div className="pt-2 border-t border-slate-200/60 space-y-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Diskon Belanja</span>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscount(e.target.value as 'PERCENT' | 'NOMINAL', discountValue)}
                    className="bg-white border border-slate-250 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="NOMINAL">Nominal (Rp)</option>
                    <option value="PERCENT">Persentase (%)</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiscount(discountType, val === '' ? 0 : Number(val));
                    }}
                    placeholder="Nilai potongan..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <label htmlFor="tax-toggle" className="text-xs font-bold text-slate-600 uppercase tracking-wide cursor-pointer">
                  Terapkan PPN (11%)
                </label>
                <input
                  id="tax-toggle"
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Ringkasan Harga */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold">Rp {subTotal.toLocaleString('id-ID')}</span>
              </div>
              
              {/* Baris Diskon jika ada */}
              {discountValue > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-600">
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
                <div className="flex justify-between items-center text-xs text-amber-700">
                  <span>PPN (11%)</span>
                  <span className="font-bold">
                    Rp {Math.max(0, (subTotal - (discountType === 'PERCENT' ? (subTotal * discountValue / 100) : discountValue)) * 0.11).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 pt-1 border-t border-slate-200/50">
                <span>Total Tagihan</span>
                <span className="text-indigo-600 text-base">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Tombol Checkout */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                cart.length === 0
                  ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
                  : isSubmitting
                    ? 'bg-indigo-500 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-99 shadow-indigo-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  Selesaikan Transaksi (Checkout)
                </>
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
                    {currentTransaction.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS'}
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
                      <span className={`text-lg font-black ${
                        Number(cashReceived) - currentTransaction.grandTotal < 0 
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
                   className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-97 transition-all shadow-sm"
                 >
                   <Printer className="h-4 w-4 text-slate-500" />
                   Cetak Struk
                 </button>

                 {/* Kirim WhatsApp */}
                 <button
                   type="button"
                   onClick={() => handleSendWhatsApp(currentTransaction)}
                   className="flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 active:scale-97 transition-all shadow-sm"
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
                 className={`w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all ${
                   currentTransaction.paymentMethod === 'CASH' &&
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
    </div>
  );
};
