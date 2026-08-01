import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Search,
  ChevronDown,
  Filter,
  Store,
  Clock,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AppShellHeader } from '../AppShellHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { getSuppliersApi, type Supplier } from '../../api/supplierApi';
import { getProductsApi } from '../../api/productMasterApi';
import type { MasterProduct } from '../../types/productMaster';
import {
  getPurchaseOrdersApi,
  createPurchaseOrderApi,
  receivePurchaseOrderApi,
  cancelPurchaseOrderApi,
  type PurchaseOrder,
  type POPaginationMeta,
} from '../../api/poApi';

interface PopupConfirmState {
  isOpen: boolean;
  type: 'receive' | 'cancel';
  poId: string;
  poNumber: string;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  message: string;
}

export function PurchaseOrderView() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Core Data States
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & KPI States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<POPaginationMeta>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasMore: false,
    summary: {
      totalOrders: 0,
      pendingCount: 0,
      receivedCount: 0,
      cancelledCount: 0,
      totalAmount: 0,
    },
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Modal & Popup States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Professional Alert Popup Modal State
  const [confirmPopup, setConfirmPopup] = useState<PopupConfirmState>({
    isOpen: false,
    type: 'receive',
    poId: '',
    poNumber: '',
  });

  // Toast Notification State
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'success',
    message: '',
  });

  // Form Create State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; costPrice: number }[]>([
    { productId: '', quantity: 1, costPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [poRes, supData, prodData] = await Promise.all([
        getPurchaseOrdersApi({
          page,
          limit,
          search: searchQuery || undefined,
          status: statusFilter || undefined,
          supplierId: supplierFilter || undefined,
        }),
        getSuppliersApi(),
        getProductsApi(),
      ]);

      setOrders(poRes.orders);
      if (poRes.pagination) {
        setPagination(poRes.pagination);
      }
      setSuppliers(supData);
      setProducts(prodData);
    } catch {
      showToast('error', 'Gagal memuat data Purchase Order.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter, supplierFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setSupplierFilter('');
    setPage(1);
  };

  const handleAddItemRow = () => {
    setPoItems([...poItems, { productId: '', quantity: 1, costPrice: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...poItems];
    updated[index].productId = productId;
    if (prod) {
      updated[index].costPrice = prod.purchasePrice || 0;
    }
    setPoItems(updated);
  };

  const handleItemChange = (index: number, field: 'quantity' | 'costPrice', val: number) => {
    const updated = [...poItems];
    updated[index][field] = val;
    setPoItems(updated);
  };

  const calculateGrandTotal = () => {
    return poItems.reduce((acc, item) => acc + item.quantity * item.costPrice, 0);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast('error', 'Silakan pilih supplier.');
      return;
    }
    const validItems = poItems.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', 'Pilih minimal 1 produk dengan jumlah lebih dari 0.');
      return;
    }

    setSubmitting(true);
    try {
      await createPurchaseOrderApi({
        supplierId: selectedSupplierId,
        items: validItems,
      });
      showToast('success', 'Purchase Order berhasil dibuat!');
      setCreateModalOpen(false);
      setSelectedSupplierId('');
      setPoItems([{ productId: '', quantity: 1, costPrice: 0 }]);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal membuat Purchase Order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Confirmation Popup
  const openReceiveConfirm = (po: PurchaseOrder) => {
    setConfirmPopup({
      isOpen: true,
      type: 'receive',
      poId: po.id,
      poNumber: po.poNumber,
    });
  };

  const openCancelConfirm = (po: PurchaseOrder) => {
    setConfirmPopup({
      isOpen: true,
      type: 'cancel',
      poId: po.id,
      poNumber: po.poNumber,
    });
  };

  // Execute Action upon Popup Confirm
  const executeReceivePO = async () => {
    if (!confirmPopup.poId) return;
    setActionLoading(true);
    try {
      await receivePurchaseOrderApi(confirmPopup.poId);
      showToast('success', `Stok barang PO ${confirmPopup.poNumber} berhasil ditambahkan!`);
      setConfirmPopup({ isOpen: false, type: 'receive', poId: '', poNumber: '' });
      setDetailModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memproses penerimaan barang.');
    } finally {
      setActionLoading(false);
    }
  };

  const executeCancelPO = async () => {
    if (!confirmPopup.poId) return;
    setActionLoading(true);
    try {
      await cancelPurchaseOrderApi(confirmPopup.poId);
      showToast('success', `PO ${confirmPopup.poNumber} telah dibatalkan.`);
      setConfirmPopup({ isOpen: false, type: 'cancel', poId: '', poNumber: '' });
      setDetailModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal membatalkan Purchase Order.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesai / Diterima
          </span>
        );
      case 'ORDERED':
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Diterima
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded-full border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            Dibatalkan
          </span>
        );
      default:
        return null;
    }
  };

  const isFiltered = Boolean(searchQuery || statusFilter || supplierFilter);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <AppShellHeader
        title="Kulakan & Purchase Order"
        subtitle="Pencatatan pembelian barang dari pemasok & penambahan stok fisik otomatis"
        icon={ShoppingCart}
        accent="indigo"
        user={user}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast Alert Component */}
        {toast.show && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-3 transition-all animate-bounce ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-extrabold">{toast.message}</span>
          </div>
        )}

        {/* 1. INFORMATIONAL KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total PO */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Restok PO
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-50 block truncate font-mono tracking-tight">
                {pagination.summary.totalOrders} Transaksi
              </span>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 truncate">
                Riwayat Pembelian
              </span>
            </div>
            <div className="p-3 rounded-2xl border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Pending PO */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Menunggu Diterima
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 block truncate font-mono tracking-tight">
                {pagination.summary.pendingCount} Order
              </span>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 truncate">
                Status Draft / Dipesan
              </span>
            </div>
            <div className="p-3 rounded-2xl border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Received PO */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Kulakan Selesai
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block truncate font-mono tracking-tight">
                {pagination.summary.receivedCount} Order
              </span>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 truncate">
                Stok fisik bertambah
              </span>
            </div>
            <div className="p-3 rounded-2xl border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Total Amount */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Nominal Restok
              </span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block truncate font-mono tracking-tight">
                Rp {pagination.summary.totalAmount.toLocaleString('id-ID')}
              </span>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 truncate">
                Akumulasi pengeluaran
              </span>
            </div>
            <div className="p-3 rounded-2xl border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. MAIN CONTENT TABLE CONTAINER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[560px] lg:min-h-[640px]">
          {/* TOOLBAR & FILTER PANEL (Select2 Style) */}
          <div className="p-5 border-b border-slate-200/90 dark:border-slate-800 flex flex-col gap-4 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span>Daftar Riwayat Purchase Order</span>
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-2xl shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Buat PO / Kulakan
              </button>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 w-4.5 h-4.5 transition-colors" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan No. PO atau nama supplier..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10.5 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Multi-Select Filters (Select2 Style) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="relative flex-1 sm:flex-initial">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 w-4 h-4 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="cursor-pointer appearance-none w-full sm:w-auto pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs hover:border-indigo-500"
                  >
                    <option value="">Semua Status</option>
                    <option value="DRAFT">Draft / Dipesan</option>
                    <option value="RECEIVED">Selesai / Diterima</option>
                    <option value="CANCELLED">Dibatalkan</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
                </div>

                {/* Supplier Filter */}
                <div className="relative flex-1 sm:flex-initial">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 w-4 h-4 pointer-events-none" />
                  <select
                    value={supplierFilter}
                    onChange={(e) => {
                      setSupplierFilter(e.target.value);
                      setPage(1);
                    }}
                    className="cursor-pointer appearance-none w-full sm:w-auto pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs hover:border-indigo-500"
                  >
                    <option value="">Semua Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
                </div>

                {/* Reset Filters */}
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="cursor-pointer px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-extrabold hover:bg-rose-100 transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    Bersihkan Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TABLE CONTENT CONTAINER */}
          <div className="flex-1 overflow-x-auto min-h-0 flex flex-col justify-between">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2 flex-1">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Memuat daftar Purchase Order...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3 flex-1">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                  <ShoppingCart className="w-8 h-8 text-slate-400 opacity-60" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {isFiltered ? 'Purchase Order Tidak Ditemukan' : 'Belum Ada Riwayat PO'}
                </h4>
                <p className="text-xs max-w-sm">
                  {isFiltered
                    ? 'Tidak ada transaksi PO yang sesuai dengan filter atau kata kunci pencarian Anda.'
                    : 'Klik tombol "Buat PO / Kulakan" untuk menambah transaksi kulakan baru.'}
                </p>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700"
                  >
                    Bersihkan Filter
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider sticky top-0 z-10 border-b-2 border-slate-200 dark:border-slate-700 backdrop-blur-md">
                  <tr>
                    <th className="py-4.5 px-6">No. PO</th>
                    <th className="py-4.5 px-6">Supplier</th>
                    <th className="py-4.5 px-6">Tanggal</th>
                    <th className="py-4.5 px-6 text-right">Total Pembelian</th>
                    <th className="py-4.5 px-6 text-center">Status</th>
                    <th className="py-4.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {orders.map((po) => (
                    <tr
                      key={po.id}
                      className="group hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-5 px-6 font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">
                        {po.poNumber}
                      </td>
                      <td className="py-5 px-6 font-extrabold text-slate-900 dark:text-slate-50">
                        {po.supplier.name}
                      </td>
                      <td className="py-5 px-6 text-slate-500 dark:text-slate-400 text-xs font-mono">
                        {new Date(po.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-5 px-6 text-right font-black text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                        Rp {Number(po.totalAmount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-5 px-6 text-center">{getStatusBadge(po.status)}</td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPO(po);
                              setDetailModalOpen(true);
                            }}
                            className="cursor-pointer p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-250 dark:border-slate-700 transition-all shadow-2xs"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
                            <>
                              <button
                                type="button"
                                onClick={() => openReceiveConfirm(po)}
                                className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all shadow-2xs flex items-center gap-1 active:scale-95"
                                title="Terima Barang"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Terima
                              </button>
                              <button
                                type="button"
                                onClick={() => openCancelConfirm(po)}
                                className="cursor-pointer p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition-all shadow-2xs active:scale-95"
                                title="Batalkan"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. PAGINATION FOOTER CONTROL */}
            {!loading && orders.length > 0 && (
              <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 mt-auto">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Menampilkan{' '}
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {(pagination.page - 1) * pagination.limit + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  dari{' '}
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {pagination.totalCount}
                  </span>{' '}
                  PO
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="cursor-pointer px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            className={`cursor-pointer w-8 h-8 rounded-xl text-xs font-black transition-all ${
                              pagination.page === pageNum
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (
                        (pageNum === 2 && pagination.page > 3) ||
                        (pageNum === pagination.totalPages - 1 &&
                          pagination.page < pagination.totalPages - 2)
                      ) {
                        return (
                          <span key={pageNum} className="text-slate-400 font-bold px-1 text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="cursor-pointer px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. PROFESSIONAL POPUP ALERT MODAL (RECEIVE & CANCEL) */}
      {confirmPopup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3.5">
              {confirmPopup.type === 'receive' ? (
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                  {confirmPopup.type === 'receive'
                    ? 'Konfirmasi Penerimaan Barang'
                    : 'Konfirmasi Pembatalan PO'}
                </h3>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  {confirmPopup.poNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              {confirmPopup.type === 'receive'
                ? 'Proses penerimaan barang ini akan menambah stok fisik produk secara otomatis ke katalog inventory dan meng-update harga HPP. Lanjutkan?'
                : 'Apakah Anda yakin ingin membatalkan Purchase Order ini? Tindakan ini akan mengubah status PO menjadi Dibatalkan.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmPopup({ isOpen: false, type: 'receive', poId: '', poNumber: '' })}
                className="cursor-pointer px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmPopup.type === 'receive' ? executeReceivePO : executeCancelPO}
                className={`cursor-pointer px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-md transition-all active:scale-95 flex items-center gap-2 ${
                  confirmPopup.type === 'receive'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {confirmPopup.type === 'receive' ? 'Ya, Terima & Tambah Stok' : 'Ya, Batalkan PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE PO MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Buat Purchase Order Baru
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-5">
              {/* Select Supplier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Supplier <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="cursor-pointer appearance-none w-full pl-4 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Daftar Produk Kulakan
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="cursor-pointer text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris Produk
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl"
                    >
                      <div className="flex-1 relative">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="cursor-pointer appearance-none w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">-- Pilih Produk --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Jumlah"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-center text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>

                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Harga Beli"
                          value={item.costPrice}
                          onChange={(e) => handleItemChange(idx, 'costPrice', Number(e.target.value))}
                          className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-right text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                        />
                      </div>

                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="cursor-pointer p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                  Estimasi Total Pembelian:
                </span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  Rp {calculateGrandTotal().toLocaleString('id-ID')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="cursor-pointer px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DETAIL PO MODAL */}
      {detailModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Detail Purchase Order
                </h3>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {selectedPO.poNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 font-semibold block">Supplier</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                  {selectedPO.supplier.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Status</span>
                <div className="mt-1">{getStatusBadge(selectedPO.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Dibuat Oleh</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedPO.createdBy.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Tanggal Dibuat</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {new Date(selectedPO.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Rincian Barang Pembelian
              </h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase">
                    <tr>
                      <th className="py-3 px-4">Nama Produk</th>
                      <th className="py-3 px-4 text-center">Jumlah</th>
                      <th className="py-3 px-4 text-right">Harga Beli</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {selectedPO.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                          {item.product?.name || 'Produk'}
                          {item.product?.sku && (
                            <span className="block text-[10px] text-indigo-600 font-mono">
                              SKU: {item.product.sku}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{item.quantity} pcs</td>
                        <td className="py-3 px-4 text-right font-mono">
                          Rp {Number(item.costPrice).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-black font-mono text-indigo-600 dark:text-indigo-400">
                          Rp {Number(item.subTotal).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase">
                Grand Total Pembelian
              </span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                Rp {Number(selectedPO.totalAmount).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="cursor-pointer px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Tutup
              </button>
              {(selectedPO.status === 'DRAFT' || selectedPO.status === 'ORDERED') && (
                <button
                  type="button"
                  onClick={() => openReceiveConfirm(selectedPO)}
                  className="cursor-pointer px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Terima Barang & Tambah Stok
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
