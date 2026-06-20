import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTransferStore } from '../store/useTransferStore';
import { useOutletStore, type Outlet } from '../store/useOutletStore';
import { useNotificationStore, canReceiveDraftTransferNotifications } from '../store/useNotificationStore';
import { AppShellHeader } from './AppShellHeader';
import { AppSelect, type AppSelectGroup } from './AppSelect';
import { apiClient } from '../api/apiClient';
import {
  getAssignedOutletIds,
  isOutletAssignedToUser,
  resolveAccessibleOutlets,
} from '../utils/outletAccess';
import {
  Package, ArrowUpDown, History,
  Loader2, AlertCircle, CheckCircle2, X, Info, CornerDownRight,
  Check, Ban, Store,
  Inbox, Truck, FileText, Plus, Trash2, ClipboardList, AlertTriangle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock?: number;
  purchasePrice: string;
  sellingPrice: string;
  category: {
    name: string;
  };
  _count: {
    stockLedgers: number;
  };
}

interface LedgerEntry {
  id: string;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'RETURN';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string | null;
  createdAt: string;
  user: {
    name: string;
  };
}

interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  outletId: string;
  outletName: string;
  stock: number;
  minStock: number;
}

function outletsForMutationType(all: Outlet[], type: string): Outlet[] {
  if (type === 'RESTOCK') return all.filter((o) => o.type === 'MAIN');
  return all;
}

export function InventoryView() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const activeOutletId = useAuthStore((state) => state.activeOutletId);
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'danger' | 'warning' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mutationForm, setMutationForm] = useState({
    type: 'RESTOCK',
    quantity: 1,
    note: '',
    outletId: '',
  });
  const [mutationSubmitting, setMutationSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationOutletStock, setMutationOutletStock] = useState<number | null>(null);
  const [mutationStockLoading, setMutationStockLoading] = useState(false);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerProduct, setLedgerProduct] = useState<Product | null>(null);
  const [requireStockApproval, setRequireStockApproval] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [stockRequests, setStockRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'transfers'>('inventory');

  // State untuk Transfer Stok
  const {
    transfers,
    loading: transfersLoading,
    fetchTransfers,
    createTransfer,
    approveTransfer,
    completeTransfer,
    cancelTransfer
  } = useTransferStore();

  const {
    outlets,
    hierarchy,
    fetchOutlets,
    fetchHierarchy
  } = useOutletStore();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState<{
    fromOutletId: string;
    toOutletId: string;
    note: string;
    items: { productId: string; quantity: number }[];
  }>({
    fromOutletId: '',
    toOutletId: '',
    note: '',
    items: [{ productId: '', quantity: 1 }]
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferFormError, setTransferFormError] = useState<string | null>(null);

  const [sourceOutletProducts, setSourceOutletProducts] = useState<Product[]>([]);
  const [sourceOutletLoading, setSourceOutletLoading] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  const fetchLowStock = async () => {
    try {
      const res = await apiClient.get('/api/inventory/low-stock');
      if (res.data.success) {
        setLowStockItems(res.data.data.items ?? []);
      }
    } catch (err) {
      console.error('Gagal mengambil stok rendah:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/api/inventory');
      setProducts(res.data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/inventory/settings');
      if (res.data.success) {
        setRequireStockApproval(res.data.data.requireStockApproval);
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan:', err);
    }
  };

  const fetchStockRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await apiClient.get('/api/inventory/requests');
      if (res.data.success) {
        setStockRequests(res.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil antrean persetujuan:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleToggleSettings = async () => {
    try {
      setSettingsLoading(true);
      setError(null);
      await apiClient.put('/api/inventory/settings', { requireStockApproval: !requireStockApproval });
      setRequireStockApproval(!requireStockApproval);
      showSuccess(`Pengaturan persetujuan stok berhasil diperbarui.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProcessRequest = async (id: string, action: 'approve' | 'reject') => {
    try {
      setError(null);
      const res = await apiClient.post(`/api/inventory/requests/${id}/${action}`);
      showSuccess(res.data.message || 'Permintaan mutasi stok berhasil diproses.');
      fetchStockRequests();
      fetchInventory();
      fetchLowStock();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInventory();
    fetchLowStock();
    fetchSettings();
    fetchOutlets();
    fetchHierarchy();
    fetchTransfers().then(() => refreshDraftCount());
    if (currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r))) {
      fetchStockRequests();
    }
  }, [token, currentUser, activeOutletId]);

  useEffect(() => {
    if (!isTransferModalOpen || !transferForm.fromOutletId) {
      setSourceOutletProducts([]);
      return;
    }

    const fetchSourceOutletInventory = async () => {
      try {
        setSourceOutletLoading(true);
        const res = await apiClient.get('/api/inventory', {
          headers: { 'x-outlet-id': transferForm.fromOutletId }
        });
        if (res.data.success) {
          setSourceOutletProducts(res.data.data);
        } else {
          console.error('Gagal mengambil stok outlet asal:', res.data.message);
        }
      } catch (err) {
        console.error('Gagal mengambil stok outlet asal:', err);
      } finally {
        setSourceOutletLoading(false);
      }
    };

    fetchSourceOutletInventory();
  }, [transferForm.fromOutletId, isTransferModalOpen, token]);

  useEffect(() => {
    if (!isMutationModalOpen || !selectedProduct || !mutationForm.outletId) {
      setMutationOutletStock(null);
      return;
    }

    const fetchOutletStock = async () => {
      setMutationStockLoading(true);
      try {
        const res = await apiClient.get(`/api/inventory/${selectedProduct.id}/ledger`, {
          headers: { 'x-outlet-id': mutationForm.outletId },
        });
        if (res.data.success) {
          setMutationOutletStock(res.data.data.product?.stock ?? 0);
        }
      } catch (err) {
        console.error('Gagal mengambil stok outlet:', err);
      } finally {
        setMutationStockLoading(false);
      }
    };

    fetchOutletStock();
  }, [isMutationModalOpen, selectedProduct?.id, mutationForm.outletId]);

  const allTenantOutlets = useMemo(() => {
    if (outlets.length > 0) return outlets;
    if (!hierarchy) return [];
    const list: Outlet[] = [];
    if (hierarchy.main) list.push(hierarchy.main);
    list.push(...hierarchy.branches);
    return list;
  }, [outlets, hierarchy]);

  const accessibleOutlets = useMemo(
    () => resolveAccessibleOutlets(allTenantOutlets, currentUser),
    [allTenantOutlets, currentUser]
  );

  const mutationEligibleOutlets = useMemo(
    () => outletsForMutationType(accessibleOutlets, mutationForm.type),
    [accessibleOutlets, mutationForm.type]
  );

  const selectedMutationOutlet = mutationEligibleOutlets.find(
    (o) => o.id === mutationForm.outletId
  );

  const mutationOutletGroups = useMemo((): AppSelectGroup[] => {
    const groups: AppSelectGroup[] = [];
    const mains = mutationEligibleOutlets.filter((o) => o.type === 'MAIN');
    const branches = mutationEligibleOutlets.filter((o) => o.type === 'BRANCH');
    if (mains.length > 0) {
      groups.push({
        label: 'Outlet Utama',
        options: mains.map((o) => ({ value: o.id, label: o.name })),
      });
    }
    if (branches.length > 0) {
      groups.push({
        label: 'Cabang',
        options: branches.map((o) => ({
          value: o.id,
          label: o.code ? `${o.name} (${o.code})` : o.name,
        })),
      });
    }
    return groups;
  }, [mutationEligibleOutlets]);

  const transferFromOutletOptions = useMemo(
    () =>
      outlets
        .filter((o) => o.isActive !== false)
        .filter(
          (o) =>
            currentUser?.roles.some((r) => ['Owner', 'Manager', 'Admin'].includes(r)) ||
            isOutletAssignedToUser(currentUser, o.id)
        )
        .map((o) => ({ value: o.id, label: o.name, description: o.type })),
    [outlets, currentUser]
  );

  const transferToOutletOptions = useMemo(() => {
    const fromOutlet = outlets.find((fo) => fo.id === transferForm.fromOutletId);
    if (!fromOutlet) return [];
    return outlets
      .filter((o) => o.isActive !== false)
      .filter((o) => {
        if (o.id === fromOutlet.id) return false;
        return fromOutlet.type === 'MAIN' ? o.type === 'BRANCH' : o.type === 'MAIN';
      })
      .map((o) => ({ value: o.id, label: o.name, description: o.type }));
  }, [outlets, transferForm.fromOutletId]);

  const sourceProductSelectOptions = useMemo(
    () =>
      sourceOutletProducts.map((p) => ({
        value: p.id,
        label: p.name,
        description: `SKU: ${p.sku} · Tersedia: ${p.stock}`,
      })),
    [sourceOutletProducts]
  );

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openMutationModal = (product: Product) => {
    const eligible = outletsForMutationType(accessibleOutlets, 'RESTOCK');
    const defaultOutletId =
      eligible.length === 1
        ? eligible[0].id
        : activeOutletId && eligible.some((o) => o.id === activeOutletId)
          ? activeOutletId
          : eligible[0]?.id ?? '';

    setSelectedProduct(product);
    setMutationForm({
      type: 'RESTOCK',
      quantity: 1,
      note: '',
      outletId: defaultOutletId,
    });
    setMutationOutletStock(null);
    setMutationError(null);
    setIsMutationModalOpen(true);
  };

  const handleMutationTypeChange = (type: string) => {
    const eligible = outletsForMutationType(accessibleOutlets, type);
    const nextOutletId = eligible.some((o) => o.id === mutationForm.outletId)
      ? mutationForm.outletId
      : eligible.length === 1
        ? eligible[0].id
        : eligible.find((o) => o.type === 'MAIN')?.id ?? eligible[0]?.id ?? '';

    setMutationForm({ ...mutationForm, type, outletId: nextOutletId });
  };

  const handleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!mutationForm.outletId) {
      setMutationError('Pilih outlet tujuan mutasi stok terlebih dahulu.');
      return;
    }

    try {
      setMutationSubmitting(true);
      setMutationError(null);

      const res = await apiClient.post('/api/inventory/mutate', {
        productId: selectedProduct.id,
        type: mutationForm.type,
        quantity: Number(mutationForm.quantity),
        note: mutationForm.note
      }, {
        headers: { 'x-outlet-id': mutationForm.outletId }
      });

      const data = res.data;

      if (data.data?.isPendingApproval) {
        showSuccess(data.message || 'Permintaan mutasi stok berhasil diajukan.');
        if (currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r))) {
          fetchStockRequests();
        }
      } else {
        showSuccess(`Stok produk "${selectedProduct.name}" berhasil diperbarui.`);
      }
      setIsMutationModalOpen(false);
      fetchInventory();
      fetchLowStock();
    } catch (err: any) {
      setMutationError(err.message);
    } finally {
      setMutationSubmitting(false);
    }
  };

  const openLedgerModal = async (product: Product) => {
    setLedgerProduct(product);
    setIsLedgerModalOpen(true);
    setLedgerLoading(true);
    try {
      const res = await apiClient.get(`/api/inventory/${product.id}/ledger`);
      setLedgerEntries(res.data.data.ledger);
    } catch (err: any) {
      alert(err.message);
      setIsLedgerModalOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const isOwner = currentUser?.roles.includes('Owner');
  const isOwnerOrManager = currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r));
  const canMutate = currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin', 'Staf Gudang'].includes(r));
  const draftTransferCount = useNotificationStore((state) => state.draftTransferCount);
  const refreshDraftCount = useNotificationStore((state) => state.fetchDraftTransferCount);
  const lowStockCount = lowStockItems.length;

  const isBelowMinStock = (prod: Product) =>
    (prod.minStock ?? 0) > 0 && prod.stock < (prod.minStock ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      <AppShellHeader
        title="Kelola Stok"
        subtitle="Kartu Stok & Mutasi"
        icon={Package}
        accent="emerald"
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Alert Notifikasi */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 animate-pulse">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {lowStockCount > 0 && activeTab === 'inventory' && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                {lowStockCount} produk stok di bawah batas minimum
              </p>
              <p className="text-xs mt-0.5 opacity-90 truncate">
                {lowStockItems.slice(0, 3).map((item) => item.productName).join(', ')}
                {lowStockCount > 3 ? ` +${lowStockCount - 3} lainnya` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Tab Header & Settings Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'inventory'
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
                }`}
            >
              Overview Inventaris
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black">
                  {lowStockCount}
                </span>
              )}
            </button>
            {isOwnerOrManager && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'requests'
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
                  }`}
              >
                Persetujuan Stok
                {stockRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-indigo-650 text-white rounded-full font-black animate-bounce">
                    {stockRequests.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab('transfers')}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'transfers'
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
                }`}
            >
              Transfer Stok
              {currentUser && canReceiveDraftTransferNotifications(currentUser.roles) && draftTransferCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-indigo-650 text-white rounded-full font-black animate-pulse">
                  {draftTransferCount}
                </span>
              )}
            </button>
          </div>

          {/* Toggle Setting (Hanya Owner) */}
          {isOwner && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl">
              <span className="text-xs font-semibold text-slate-655 dark:text-slate-400">Persetujuan Stok Oleh Owner/Manager</span>
              <button
                type="button"
                onClick={handleToggleSettings}
                disabled={settingsLoading}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${requireStockApproval ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-700'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${requireStockApproval ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Tabel Inventaris */}
        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat inventaris produk...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Package className="w-16 h-16 text-slate-700" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Produk Kosong</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-md">Katalog produk belum terdaftar. Silakan tambahkan produk baru di menu Kelola Produk terlebih dahulu.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Nama Produk / SKU</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4 text-right">Harga Beli (HPP)</th>
                      <th className="px-6 py-4 text-right">Harga Jual</th>
                      <th className="px-6 py-4 text-center">Stok Saat Ini</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                    {products.map((prod) => {
                      const belowMin = isBelowMinStock(prod);
                      const stockStatus = belowMin
                        ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                        : prod.stock <= 5
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        : prod.stock <= 15
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{prod.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 font-mono tracking-wider">{prod.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {prod.category?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                            Rp {Number(prod.purchasePrice).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                            Rp {Number(prod.sellingPrice).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${stockStatus}`}>
                              {prod.stock} unit
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Kartu Stok */}
                              <button
                                onClick={() => openLedgerModal(prod)}
                                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-150 active:scale-95"
                                title="Riwayat Kartu Stok"
                              >
                                <History className="w-3.5 h-3.5" />
                                Kartu Stok
                              </button>

                              {/* Mutasi Manual (Khusus Owner/Admin/Manager/Staf Gudang) */}
                              {canMutate && (
                                <button
                                  onClick={() => openMutationModal(prod)}
                                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 transition-all duration-150 active:scale-95"
                                  title="Mutasi Stok Manual"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                  Mutasi
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tabel Antrean Persetujuan Stok */}
        {activeTab === 'requests' && isOwnerOrManager && (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
            {requestsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat permintaan persetujuan stok...</p>
              </div>
            ) : stockRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Package className="w-16 h-16 text-slate-700" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Antrean Bersih</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-md">Tidak ada permintaan persetujuan stok pending saat ini.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Produk</th>
                      <th className="px-6 py-4">Pengaju</th>
                      <th className="px-6 py-4">Tipe Mutasi</th>
                      <th className="px-6 py-4 text-center">Jumlah</th>
                      <th className="px-6 py-4">Catatan</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                    {stockRequests.map((req) => {
                      return (
                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{req.product.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">{req.product.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {req.user.name}
                          </td>
                          <td className="px-6 py-4 text-slate-650 dark:text-slate-405">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${req.type === 'RESTOCK'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : req.type === 'ADJUSTMENT_PLUS'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                              }`}>
                              {req.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200 font-mono">
                            {req.quantity} unit
                          </td>
                          <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate" title={req.note || ''}>
                            {req.note || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Tombol Setujui */}
                              <button
                                onClick={() => handleProcessRequest(req.id, 'approve')}
                                className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-150"
                                title="Setujui Mutasi"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Setujui
                              </button>
                              {/* Tombol Tolak */}
                              <button
                                onClick={() => handleProcessRequest(req.id, 'reject')}
                                className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-150"
                                title="Tolak Mutasi"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tabel Riwayat & Manajemen Transfer Stok */}
        {activeTab === 'transfers' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Riwayat & Pengiriman Transfer Stok</h3>
                <p className="text-xs text-slate-500 mt-1">Kelola pergerakan stok antar outlet utama dan cabang secara terpusat.</p>
              </div>
              <button
                onClick={() => {
                  setTransferForm({
                    fromOutletId: '',
                    toOutletId: '',
                    note: '',
                    items: [{ productId: '', quantity: 1 }]
                  });
                  setTransferFormError(null);
                  setIsTransferModalOpen(true);
                }}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Buat Transfer Stok
              </button>
            </div>

            {/* Table Transfers */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
              {transfersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat riwayat transfer stok...</p>
                </div>
              ) : transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <ClipboardList className="w-16 h-16 text-slate-700" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Belum Ada Transfer Stok</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-md">Tidak ada data transfer stok yang tercatat dalam sistem.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">ID / Tanggal</th>
                        <th className="px-6 py-4">Rute Transfer</th>
                        <th className="px-6 py-4">Item & Detail</th>
                        <th className="px-6 py-4">Pengaju / Approval</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                      {transfers.map((tf) => {
                        const statusColors = {
                          DRAFT: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                          IN_TRANSIT: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                          COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                          CANCELLED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                        }[tf.status];

                        const userAssignedOutletIds = currentUser
                          ? [...getAssignedOutletIds(currentUser)]
                          : [];
                        const isUserOwnerOrManager = currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r));

                        const canUserApprove = isUserOwnerOrManager && tf.status === 'DRAFT';
                        const canUserCancel = (isUserOwnerOrManager && (tf.status === 'DRAFT' || tf.status === 'IN_TRANSIT')) || (tf.status === 'DRAFT' && tf.requestedById === currentUser?.id);
                        const canUserReceive = (isUserOwnerOrManager || userAssignedOutletIds.includes(tf.toOutletId)) && tf.status === 'IN_TRANSIT';

                        return (
                          <tr key={tf.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">#{tf.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{new Date(tf.createdAt).toLocaleString('id-ID')}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  <span className="text-xs text-slate-500">Asal:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{tf.fromOutlet.name}</span>
                                  <span className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold">{tf.fromOutlet.type}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-450"></span>
                                  <span className="text-xs text-slate-500">Ke:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{tf.toOutlet.name}</span>
                                  <span className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold">{tf.toOutlet.type}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="max-w-[240px] divide-y divide-slate-100 dark:divide-slate-800/40">
                                  {tf.items.map((item) => (
                                    <div key={item.id} className="py-1 flex justify-between text-xs">
                                      <span className="text-slate-700 dark:text-slate-300 truncate pr-2 max-w-[160px]" title={item.product?.name}>
                                        {item.product?.name}
                                      </span>
                                      <span className="font-bold font-mono text-indigo-500">{item.quantity} unit</span>
                                    </div>
                                  ))}
                                </div>
                                {tf.note && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                    "{tf.note}"
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <p>Diajukan: <span className="font-semibold text-slate-800 dark:text-slate-200">{tf.requestedBy?.name || 'Staf'}</span></p>
                                {tf.approvedBy && (
                                  <p>Disetujui: <span className="font-semibold text-slate-800 dark:text-slate-200">{tf.approvedBy.name}</span></p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors}`}>
                                {tf.status === 'DRAFT' && <FileText className="w-3 h-3" />}
                                {tf.status === 'IN_TRANSIT' && <Truck className="w-3 h-3 animate-pulse" />}
                                {tf.status === 'COMPLETED' && <Check className="w-3 h-3" />}
                                {tf.status === 'CANCELLED' && <Ban className="w-3 h-3" />}
                                {tf.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {canUserApprove && (
                                  <button
                                    onClick={() => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Setujui Transfer Stok',
                                        message: 'Setujui transfer ini? Tindakan ini akan langsung memotong stok di outlet asal.',
                                        type: 'warning',
                                        confirmText: 'Setujui',
                                        cancelText: 'Batal',
                                        onConfirm: async () => {
                                          const res = await approveTransfer(tf.id);
                                          if (res.success) {
                                            showSuccess('Transfer stok disetujui, barang dalam perjalanan.');
                                            fetchInventory();
                                            void refreshDraftCount();
                                          } else {
                                            setError(res.message || 'Gagal menyetujui transfer stok.');
                                          }
                                        }
                                      });
                                    }}
                                    className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-emerald-605 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all shadow active:scale-95"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                )}
                                {canUserReceive && (
                                  <button
                                    onClick={() => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Konfirmasi Penerimaan Barang',
                                        message: 'Konfirmasi penerimaan barang untuk transfer ini? Stok outlet tujuan akan bertambah.',
                                        type: 'success',
                                        confirmText: 'Terima Barang',
                                        cancelText: 'Batal',
                                        onConfirm: async () => {
                                          const res = await completeTransfer(tf.id);
                                          if (res.success) {
                                            showSuccess('Transfer stok berhasil diselesaikan, barang diterima.');
                                            fetchInventory();
                                            void refreshDraftCount();
                                          } else {
                                            setError(res.message || 'Gagal menyelesaikan transfer stok.');
                                          }
                                        }
                                      });
                                    }}
                                    className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow active:scale-95"
                                  >
                                    <Inbox className="w-3.5 h-3.5" />
                                    Terima Barang
                                  </button>
                                )}
                                {canUserCancel && (
                                  <button
                                    onClick={() => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Batalkan Transfer Stok',
                                        message: 'Apakah Anda yakin ingin membatalkan transfer stok ini?',
                                        type: 'danger',
                                        confirmText: 'Batalkan Transfer',
                                        cancelText: 'Batal',
                                        onConfirm: async () => {
                                          const res = await cancelTransfer(tf.id);
                                          if (res.success) {
                                            showSuccess('Transfer stok berhasil dibatalkan.');
                                            fetchInventory();
                                            void refreshDraftCount();
                                          } else {
                                            setError(res.message || 'Gagal membatalkan transfer stok.');
                                          }
                                        }
                                      });
                                    }}
                                    className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold rounded-lg border border-rose-500/20 transition-all active:scale-95"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Batal
                                  </button>
                                )}
                                {!canUserApprove && !canUserReceive && !canUserCancel && (
                                  <span className="text-xs text-slate-500 italic">Tidak ada aksi</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Mutasi Manual */}
      {isMutationModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={() => !mutationSubmitting && setIsMutationModalOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Mutasi Stok Manual</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMutationModalOpen(false)}
                disabled={mutationSubmitting}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMutationSubmit}>
              <div className="p-6 space-y-4">
                {mutationError && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">

                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{mutationError}</p>
                  </div>
                )}

                {/* Info Stok Saat Ini */}
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 text-xs">
                  <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <p>
                    Stok di{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedMutationOutlet?.name ?? 'outlet terpilih'}
                    </span>
                    :{' '}
                    {mutationStockLoading ? (
                      <span className="italic">memuat...</span>
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {mutationOutletStock ?? selectedProduct.stock} unit
                      </span>
                    )}
                  </p>
                </div>

                {/* Dropdown Tipe Mutasi — di atas outlet agar cabang muncul saat ADJUSTMENT/RETURN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipe Penyesuaian</label>
                  <AppSelect
                    value={mutationForm.type}
                    onChange={handleMutationTypeChange}
                    searchable={false}
                    options={[
                      { value: 'RESTOCK', label: 'RESTOCK', description: '+ Tambah Stok / Pasokan' },
                      { value: 'ADJUSTMENT_PLUS', label: 'ADJUSTMENT_PLUS', description: '+ Penyesuaian / Temuan Barang' },
                      { value: 'ADJUSTMENT_MINUS', label: 'ADJUSTMENT_MINUS', description: '- Penyesuaian / Rusak / Hilang' },
                      { value: 'RETURN', label: 'RETURN', description: '+ Retur dari Pelanggan' },
                    ]}
                  />
                  {mutationForm.type === 'RESTOCK' && accessibleOutlets.length > 1 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">
                      RESTOCK supplier hanya ke Outlet Utama. Untuk mutasi stok di cabang, pilih ADJUSTMENT atau RETURN.
                    </p>
                  )}
                </div>

                {/* Outlet */}
                {mutationEligibleOutlets.length > 1 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Outlet</label>
                    <AppSelect
                      value={mutationForm.outletId}
                      onChange={(outletId) =>
                        setMutationForm({ ...mutationForm, outletId })
                      }
                      placeholder="-- Pilih Outlet --"
                      groups={mutationOutletGroups}
                      searchable={mutationEligibleOutlets.length > 4}
                    />
                  </div>
                ) : mutationEligibleOutlets.length === 1 ? (
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>
                      Outlet: <span className="font-bold">{mutationEligibleOutlets[0].name}</span>
                      {mutationEligibleOutlets[0].type === 'MAIN' ? ' (Pusat)' : ' (Cabang)'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Tidak ada outlet aktif yang dapat dipilih untuk mutasi ini.</span>
                  </div>
                )}

                {/* Input Kuantitas — hapus duplikat tipe di bawah */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Jumlah Penyesuaian (Unit)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={mutationForm.quantity}
                    onChange={(e) => setMutationForm({ ...mutationForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
                  />
                </div>

                {/* Input Catatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Catatan / Alasan Mutasi</label>
                  <textarea
                    required
                    placeholder="Contoh: Barang rusak saat pengiriman, Restock mingguan dari supplier X"
                    value={mutationForm.note}
                    onChange={(e) => setMutationForm({ ...mutationForm, note: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 h-20 placeholder-slate-400 dark:placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMutationModalOpen(false)}
                  disabled={mutationSubmitting}
                  className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mutationSubmitting || !mutationForm.outletId}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/30 transition-all"
                >
                  {mutationSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Mutasi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal/Drawer Kartu Stok */}
      {isLedgerModalOpen && ledgerProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsLedgerModalOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header Drawer */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Kartu Stok Produk</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ledgerProduct.name} (SKU: {ledgerProduct.sku})</p>
                </div>
              </div>
              <button
                onClick={() => setIsLedgerModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Riwayat */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {ledgerLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Memuat riwayat mutasi stok...</p>
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <History className="w-12 h-12 text-slate-700" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada mutasi stok tercatat untuk produk ini.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-6">
                  {ledgerEntries.map((entry) => {
                    const isPositive = entry.quantity > 0;
                    const sign = isPositive ? '+' : '';
                    const colorClass = isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10';

                    return (
                      <div key={entry.id} className="relative group">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />

                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${entry.type === 'SALE'
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : entry.type === 'RESTOCK'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                              }`}>
                              {entry.type}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                              {new Date(entry.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 dark:text-slate-400">Mutasi:</span>
                              <span className={`font-bold font-mono px-2 py-0.5 rounded ${colorClass}`}>
                                {sign}{entry.quantity} unit
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {entry.stockBefore} → <span className="text-slate-700 dark:text-slate-200 font-bold">{entry.stockAfter} unit</span>
                            </div>
                          </div>

                          {entry.note && (
                            <div className="flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                              <CornerDownRight className="w-3.5 h-3.5 text-slate-550 flex-shrink-0 mt-0.5" />
                              <p className="italic">"{entry.note}"</p>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 text-right">
                            Oleh: <span className="font-semibold text-slate-600 dark:text-slate-400">{entry.user?.name || 'Sistem'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Drawer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>Total Entri: {ledgerEntries.length}</span>
              <span>Stok saat ini: {ledgerProduct.stock} unit</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Transfer Stok */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={() => !transferSubmitting && setIsTransferModalOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Buat Pengiriman / Transfer Stok</h3>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Kirim stok antar outlet utama dan cabang</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                disabled={transferSubmitting}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setTransferFormError(null);

                if (!transferForm.fromOutletId) {
                  setTransferFormError('Silakan pilih outlet asal.');
                  return;
                }
                if (!transferForm.toOutletId) {
                  setTransferFormError('Silakan pilih outlet tujuan.');
                  return;
                }

                const cleanItems = transferForm.items.filter(item => item.productId && item.quantity > 0);
                if (cleanItems.length === 0) {
                  setTransferFormError('Silakan tambahkan minimal 1 item barang yang valid.');
                  return;
                }

                for (const item of cleanItems) {
                  const sourceProd = sourceOutletProducts.find(p => p.id === item.productId);
                  const availableStock = sourceProd ? sourceProd.stock : 0;
                  if (item.quantity > availableStock) {
                    setTransferFormError(`Stok produk '${sourceProd?.name || 'terpilih'}' tidak mencukupi. Tersedia: ${availableStock}, diminta: ${item.quantity}.`);
                    return;
                  }
                }

                try {
                  setTransferSubmitting(true);
                  const res = await createTransfer({
                    fromOutletId: transferForm.fromOutletId,
                    toOutletId: transferForm.toOutletId,
                    note: transferForm.note || undefined,
                    items: cleanItems
                  });

                  if (res.success) {
                    showSuccess(res.data?.status === 'IN_TRANSIT'
                      ? 'Transfer stok berhasil dibuat dan barang dalam perjalanan.'
                      : 'Draf transfer stok berhasil diajukan dan menunggu approval.'
                    );
                    setIsTransferModalOpen(false);
                    fetchInventory();
                    void refreshDraftCount();
                  } else {
                    setTransferFormError(res.message || 'Terjadi kesalahan saat memproses transfer.');
                  }
                } catch (err: any) {
                  setTransferFormError(err.message || 'Terjadi kesalahan.');
                } finally {
                  setTransferSubmitting(false);
                }
              }}
            >
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {transferFormError && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-rose-550/10 border border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-305 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{transferFormError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Outlet Asal (Pengirim)</label>
                    <AppSelect
                      value={transferForm.fromOutletId}
                      onChange={(fromOutletId) => {
                        setTransferForm({
                          ...transferForm,
                          fromOutletId,
                          toOutletId: '',
                          items: [{ productId: '', quantity: 1 }],
                        });
                      }}
                      placeholder="-- Pilih Outlet Asal --"
                      searchable={transferFromOutletOptions.length > 4}
                      options={transferFromOutletOptions}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Outlet Tujuan (Penerima)</label>
                    <AppSelect
                      value={transferForm.toOutletId}
                      onChange={(toOutletId) => setTransferForm({ ...transferForm, toOutletId })}
                      placeholder="-- Pilih Outlet Tujuan --"
                      disabled={!transferForm.fromOutletId}
                      searchable={transferToOutletOptions.length > 4}
                      options={transferToOutletOptions}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Catatan Transfer (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pemindahan stok sisa, Restock bulanan cabang"
                    value={transferForm.note}
                    onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-555 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:border-indigo-550 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Daftar Item Barang</label>
                    <button
                      type="button"
                      disabled={!transferForm.fromOutletId}
                      onClick={() => {
                        setTransferForm({
                          ...transferForm,
                          items: [...transferForm.items, { productId: '', quantity: 1 }]
                        });
                      }}
                      className="cursor-pointer flex items-center gap-1 text-xs text-indigo-500 font-bold hover:text-indigo-400 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Baris
                    </button>
                  </div>

                  {sourceOutletLoading && (
                    <p className="text-xs text-slate-500 italic animate-pulse">Memuat data produk dan stok dari outlet pengirim...</p>
                  )}

                  {!transferForm.fromOutletId && (
                    <div className="text-center p-6 bg-slate-555 dark:bg-slate-955 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                      Pilih outlet asal terlebih dahulu untuk mulai memilih produk.
                    </div>
                  )}

                  {transferForm.fromOutletId && !sourceOutletLoading && transferForm.items.map((item, index) => {
                    const selectedSourceProd = sourceOutletProducts.find(p => p.id === item.productId);
                    const availableStock = selectedSourceProd ? selectedSourceProd.stock : 0;

                    return (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-555 dark:bg-slate-955/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 relative group">
                        <div className="flex-1 w-full space-y-1">
                          <AppSelect
                            size="sm"
                            value={item.productId}
                            onChange={(val) => {
                              const alreadyExists = transferForm.items.some(
                                (it, i) => it.productId === val && i !== index
                              );
                              if (alreadyExists) {
                                alert('Produk ini sudah dipilih di baris lain.');
                                return;
                              }
                              const cleanItems = [...transferForm.items];
                              cleanItems[index] = { ...cleanItems[index], productId: val };
                              setTransferForm({ ...transferForm, items: cleanItems });
                            }}
                            placeholder="-- Pilih Produk --"
                            searchable
                            searchPlaceholder="Cari produk..."
                            options={sourceProductSelectOptions}
                          />
                        </div>

                        <div className="w-full sm:w-32 flex items-center gap-2">
                          <input
                            type="number"
                            required
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              const cleanItems = [...transferForm.items];
                              cleanItems[index] = { ...cleanItems[index], quantity: val };
                              setTransferForm({ ...transferForm, items: cleanItems });
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-center focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            / max {availableStock}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const cleanItems = [...transferForm.items];
                            cleanItems.splice(index, 1);
                            setTransferForm({
                              ...transferForm,
                              items: cleanItems.length === 0 ? [{ productId: '', quantity: 1 }] : cleanItems
                            });
                          }}
                          className="cursor-pointer p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors absolute top-2 right-2 sm:static self-end sm:self-auto"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={transferSubmitting}
                  className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting || !transferForm.fromOutletId || !transferForm.toOutletId}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-950/30 transition-all disabled:opacity-50"
                >
                  {transferSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Transfer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Custom */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => !confirmLoading && setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          />

          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Top decorative color strip */}
            <div className={`h-1.5 w-full ${
              confirmModal.type === 'danger' ? 'bg-rose-500' :
              confirmModal.type === 'warning' ? 'bg-amber-500' :
              confirmModal.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
            }`} />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl border flex-shrink-0 ${
                  confirmModal.type === 'danger' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-500' :
                  confirmModal.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-550' :
                  confirmModal.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-500' :
                  'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-500'
                }`}>
                  {confirmModal.type === 'danger' && <AlertCircle className="w-6 h-6" />}
                  {confirmModal.type === 'warning' && <AlertCircle className="w-6 h-6" />}
                  {confirmModal.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                  {(!confirmModal.type || confirmModal.type === 'info') && <Info className="w-6 h-6" />}
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {confirmModal.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={confirmLoading}
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="cursor-pointer px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
                >
                  {confirmModal.cancelText || 'Batal'}
                </button>
                <button
                  type="button"
                  disabled={confirmLoading}
                  onClick={async () => {
                    try {
                      setConfirmLoading(true);
                      await confirmModal.onConfirm();
                    } catch (err) {
                      console.error('Error in confirm action:', err);
                    } finally {
                      setConfirmLoading(false);
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }
                  }}
                  className={`cursor-pointer flex items-center gap-1.5 px-4 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                    confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20' :
                    confirmModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-950/20' :
                    confirmModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20' :
                    'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/20'
                  }`}
                >
                  {confirmLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    confirmModal.confirmText || 'Konfirmasi'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
