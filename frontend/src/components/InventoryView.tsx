import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { API_BASE_URL } from '../config';
import {
  Package, ArrowUpDown, History,
  Loader2, AlertCircle, CheckCircle2, X, Info, CornerDownRight,
  Sun, Moon, Check, Ban, ShoppingBag, Users, BarChart2, LogOut, Tag
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
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

export function InventoryView() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mutationForm, setMutationForm] = useState({
    type: 'RESTOCK', // RESTOCK, ADJUSTMENT_PLUS, ADJUSTMENT_MINUS, RETURN
    quantity: 1,
    note: ''
  });
  const [mutationSubmitting, setMutationSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerProduct, setLedgerProduct] = useState<Product | null>(null);
  const [requireStockApproval, setRequireStockApproval] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [stockRequests, setStockRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengambil data inventaris.');
      }
      setProducts(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequireStockApproval(data.data.requireStockApproval);
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan:', err);
    }
  };

  const fetchStockRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/inventory/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStockRequests(data.data);
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
      const res = await fetch(`${API_BASE_URL}/api/inventory/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requireStockApproval: !requireStockApproval })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah pengaturan.');
      }
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
      const res = await fetch(`${API_BASE_URL}/api/inventory/requests/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memproses permintaan.');
      }
      showSuccess(data.message || 'Permintaan mutasi stok berhasil diproses.');
      fetchStockRequests();
      fetchInventory();
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
    fetchSettings();
    if (currentUser?.roles.some(r => ['Owner', 'TENANT_ADMIN', 'Manager'].includes(r))) {
      fetchStockRequests();
    }
  }, [token, currentUser]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openMutationModal = (product: Product) => {
    setSelectedProduct(product);
    setMutationForm({
      type: 'RESTOCK',
      quantity: 1,
      note: ''
    });
    setMutationError(null);
    setIsMutationModalOpen(true);
  };

  const handleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setMutationSubmitting(true);
      setMutationError(null);

      const res = await fetch(`${API_BASE_URL}/api/inventory/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: mutationForm.type,
          quantity: Number(mutationForm.quantity),
          note: mutationForm.note
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal melakukan mutasi stok.');
      }

      if (data.data?.isPendingApproval) {
        showSuccess(data.message || 'Permintaan mutasi stok berhasil diajukan.');
        if (currentUser?.roles.some(r => ['Owner', 'TENANT_ADMIN', 'Manager'].includes(r))) {
          fetchStockRequests();
        }
      } else {
        showSuccess(`Stok produk "${selectedProduct.name}" berhasil diperbarui.`);
      }
      setIsMutationModalOpen(false);
      fetchInventory();
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
      const res = await fetch(`${API_BASE_URL}/api/inventory/${product.id}/ledger`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengambil kartu stok.');
      }
      setLedgerEntries(data.data.ledger);
    } catch (err: any) {
      alert(err.message);
      setIsLedgerModalOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const isOwner = currentUser?.roles.includes('Owner') || currentUser?.roles.includes('TENANT_ADMIN');
  const isOwnerOrManager = currentUser?.roles.some(r => ['Owner', 'TENANT_ADMIN', 'Manager'].includes(r));
  const canMutate = currentUser?.roles.some(r => ['Owner', 'TENANT_ADMIN', 'Manager', 'Staf Gudang'].includes(r));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Header Premium */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Kelola Stok</h1>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Kartu Stok & Mutasi</p>
          </div>
        </div>

        {/* Menu Navigasi Global */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {currentUser?.roles.some((role) => ['Owner', 'TENANT_ADMIN', 'Manager', 'Kasir'].includes(role)) && (
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Kasir POS
            </button>
          )}
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            Produk
          </button>
          <button
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
          >
            <Tag className="w-3.5 h-3.5" />
            Kategori
          </button>
          <button
            onClick={() => navigate('/admin/inventory')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Stok
          </button>

          {!currentUser?.roles.includes('Staf Gudang') && (
            <>
              <button
                onClick={() => navigate('/admin/staff')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                Staf
              </button>
              <button
                onClick={() => navigate('/admin/customers')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                Pelanggan
              </button>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* Tombol Switcher Tema (Dark / Light) */}
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-150 active:scale-95"
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-slate-600" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{currentUser?.roles.join(', ') || 'Staff'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-150"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

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

        {/* Tab Header & Settings Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
                }`}
            >
              Overview Inventaris
            </button>
            {isOwnerOrManager && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'requests'
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
                      const stockStatus = prod.stock <= 5
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
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-150 active:scale-95"
                                title="Riwayat Kartu Stok"
                              >
                                <History className="w-3.5 h-3.5" />
                                Kartu Stok
                              </button>

                              {/* Mutasi Manual (Khusus Owner/Admin/Manager/Staf Gudang) */}
                              {canMutate && (
                                <button
                                  onClick={() => openMutationModal(prod)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 transition-all duration-150 active:scale-95"
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
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-150"
                                title="Setujui Mutasi"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Setujui
                              </button>
                              {/* Tombol Tolak */}
                              <button
                                onClick={() => handleProcessRequest(req.id, 'reject')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-150"
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
      </main>

      {/* Modal Mutasi Manual */}
      {isMutationModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                  <p>Stok produk saat ini di laci penyimpanan: <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedProduct.stock} unit</span>.</p>
                </div>

                {/* Dropdown Tipe Mutasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipe Penyesuaian</label>
                  <select
                    value={mutationForm.type}
                    onChange={(e) => setMutationForm({ ...mutationForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
                  >
                    <option value="RESTOCK">RESTOCK (+ Tambah Stok / Pasokan)</option>
                    <option value="ADJUSTMENT_PLUS">ADJUSTMENT_PLUS (+ Penyesuaian / Temuan Barang)</option>
                    <option value="ADJUSTMENT_MINUS">ADJUSTMENT_MINUS (- Penyesuaian / Rusak / Hilang)</option>
                    <option value="RETURN">RETURN (+ Retur dari Pelanggan)</option>
                  </select>
                </div>

                {/* Input Kuantitas */}
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
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mutationSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/30 transition-all"
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
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
    </div>
  );
}
