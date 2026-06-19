import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { API_BASE_URL } from '../config';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Package,
  Tag,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  ShoppingBag,
  BarChart2,
  Users,
  ArrowUpDown,
  Sun,
  Moon,
  LogOut,
  Upload,
  Store
} from 'lucide-react';

interface ProductImage {
  id?: string;
  url: string;
  isMain: boolean;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  images?: ProductImage[];
  outletStocks?: any[];
}

export const ProductMaster: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentId, setCurrentId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('cat-minuman-111');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [images, setImages] = useState<{ url: string; isMain: boolean }[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [categories, setCategories] = useState<{ id: string; name: string; prefix: string }[]>([]);
  const [isAutoSku, setIsAutoSku] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'general' | 'outlets'>('general');
  const [outlets, setOutlets] = useState<any[]>([]);
  const [overridePrices, setOverridePrices] = useState<Record<string, number>>({});
  const [minStocks, setMinStocks] = useState<Record<string, number>>({});
  const [filterOutletId, setFilterOutletId] = useState<string>('');

  const fetchOutlets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOutlets(data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar outlet:', err);
    }
  };

  const fetchOutletSettings = async (prodId: string) => {
    try {
      const outletRes = await fetch(`${API_BASE_URL}/api/outlets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });
      const outletJson = await outletRes.json();
      if (outletRes.ok && outletJson.success) {
        setOutlets(outletJson.data || []);
      }

      const settingsRes = await fetch(`${API_BASE_URL}/api/products/${prodId}/outlet-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });
      const settingsJson = await settingsRes.json();
      if (settingsRes.ok && settingsJson.success) {
        const priceMap: Record<string, number> = {};
        const stockMap: Record<string, number> = {};
        (settingsJson.data.prices || []).forEach((p: any) => {
          priceMap[p.outletId] = Number(p.price);
        });
        (settingsJson.data.stocks || []).forEach((s: any) => {
          stockMap[s.outletId] = Number(s.minStock);
        });
        setOverridePrices(priceMap);
        setMinStocks(stockMap);
      }
    } catch (err) {
      console.error('Gagal mengambil detail cabang:', err);
    }
  };

  const handleSavePrice = async (outletId: string, price: number | undefined) => {
    try {
      if (price === undefined || isNaN(price) || price <= 0) {
        const res = await fetch(`${API_BASE_URL}/api/products/price-override`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': user?.tenantId || ''
          },
          body: JSON.stringify({ outletId, productId: currentId })
        });
        if (res.ok) {
          showToast('success', 'Harga khusus cabang dihapus (menggunakan harga dasar).');
          const newPrices = { ...overridePrices };
          delete newPrices[outletId];
          setOverridePrices(newPrices);
        } else {
          const data = await res.json();
          showToast('error', data.message || 'Gagal menghapus harga khusus.');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/products/price-override`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': user?.tenantId || ''
          },
          body: JSON.stringify({ outletId, productId: currentId, price })
        });
        if (res.ok) {
          showToast('success', 'Harga khusus cabang berhasil disimpan!');
        } else {
          const data = await res.json();
          showToast('error', data.message || 'Gagal menyimpan harga khusus.');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan jaringan.');
    }
  };

  const handleSaveMinStock = async (outletId: string, minStock: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/min-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify({ outletId, productId: currentId, minStock })
      });
      if (res.ok) {
        showToast('success', 'Limit stok minimum cabang berhasil disimpan!');
      } else {
        const data = await res.json();
        showToast('error', data.message || 'Gagal menyimpan limit stok.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan jaringan.');
    }
  };

  const fetchProducts = async (selectedOutletId: string = filterOutletId) => {
    setLoading(true);
    try {
      const url = selectedOutletId
        ? `${API_BASE_URL}/api/products?outletId=${selectedOutletId}`
        : `${API_BASE_URL}/api/products`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil data produk.');
      }

      const mapped = data.data.map((item: any) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        purchasePrice: Number(item.purchasePrice),
        sellingPrice: Number(item.sellingPrice),
        stock: item.stock,
        categoryId: item.categoryId,
        categoryName: item.category?.name || 'Umum',
        images: item.images || [],
        outletStocks: item.outletStocks || []
      }));

      setProducts(mapped);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Koneksi ke API produk gagal.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil kategori:', err);
    }
  };

  const fetchNextSku = async (catId: string) => {
    if (!catId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${catId}/next-sku`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSku(data.data.nextSku);
      }
    } catch (err) {
      console.error('Gagal mengambil SKU otomatis:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
      fetchOutlets();
    }
  }, [token]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setActiveTab('general');
    setCurrentId('');
    setName('');
    const defaultCatId = categories.length > 0 ? categories[0].id : '';
    setCategoryId(defaultCatId);
    setSku('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setStock(0);
    setImages([]);
    setIsAutoSku(true);
    if (defaultCatId) {
      fetchNextSku(defaultCatId);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setModalMode('edit');
    setActiveTab('general');
    setCurrentId(product.id);
    setName(product.name);
    setSku(product.sku);
    setCategoryId(product.categoryId);
    setPurchasePrice(product.purchasePrice);
    setSellingPrice(product.sellingPrice);
    setStock(product.stock);
    setImages(product.images ? product.images.map(img => ({ url: img.url, isMain: img.isMain })) : []);
    setIsAutoSku(false);
    setOverridePrices({});
    setMinStocks({});
    fetchOutletSettings(product.id);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ukuran file terlalu besar. Maksimal adalah 5 MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Format file tidak didukung. Hanya diperbolehkan JPG, PNG, GIF, atau WEBP.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('success', 'Gambar berhasil diunggah.');
        setImages([...images, { url: data.url, isMain: images.length === 0 }]);
      } else {
        showToast('error', data.message || 'Gagal mengunggah gambar.');
      }
    } catch (err) {
      console.error('Image Upload Error:', err);
      showToast('error', 'Terjadi kesalahan jaringan saat mengunggah gambar.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || purchasePrice <= 0 || sellingPrice <= 0 || stock < 0) {
      showToast('error', 'Semua kolom wajib diisi dengan nilai yang valid.');
      return;
    }

    const payload = modalMode === 'create'
      ? {
        categoryId,
        name,
        sku,
        purchasePrice,
        sellingPrice,
        stock,
        images: images.filter(img => img.url.trim() !== '')
      }
      : {
        categoryId,
        name,
        sku,
        purchasePrice,
        sellingPrice,
        stock,
        images: images.filter(img => img.url.trim() !== '')
      };

    const url = modalMode === 'create'
      ? `${API_BASE_URL}/api/products`
      : `${API_BASE_URL}/api/products/${currentId}`;

    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan produk.');
      }

      showToast('success', modalMode === 'create' ? 'Produk berhasil ditambahkan!' : 'Produk berhasil diperbarui!');
      setIsModalOpen(false);
      fetchProducts();

    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Terjadi kesalahan saat memproses data.');
    }
  };

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus produk ini?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus produk.');
      }

      showToast('success', 'Produk berhasil dihapus.');
      fetchProducts();

    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Terjadi kesalahan saat menghapus.');
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-350 transform translate-y-0 ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-75 text-xs font-bold">✕</button>
        </div>
      )}

      {/* HEADER UTAMA */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Master Produk</h1>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">Pengelolaan Barang & Stok</p>
          </div>
        </div>

        {/* Menu Navigasi Global */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {user?.roles.some((role) => ['Owner', 'TENANT_ADMIN', 'Manager', 'Kasir'].includes(role)) && (
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Stok
          </button>

          {!user?.roles.includes('Staf Gudang') && (
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
              {(user?.roles.includes('Owner') || user?.roles.includes('TENANT_ADMIN')) && (
                <button
                  onClick={() => navigate('/admin/outlets')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
                >
                  <Store className="w-3.5 h-3.5" />
                  Outlet
                </button>
              )}
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
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{user?.roles.join(', ') || 'Staff'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-150"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>

          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-97 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-150 transition-all"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk Baru
          </button>
        </div>
      </header>

      {/* AREA UTAMA / DAFTAR TABEL */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">

        {/* Kontainer Utama Tabel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">

          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              Master Produk Aktif ({products.length})
            </h3>
            
            <div className="flex items-center gap-3">
              {/* Dropdown Filter Outlet untuk Owner/Manager */}
              {(user?.roles.includes('Owner') || user?.roles.includes('TENANT_ADMIN') || user?.roles.includes('Manager')) && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Cabang:</span>
                  <select
                    value={filterOutletId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilterOutletId(val);
                      fetchProducts(val);
                    }}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                  >
                    <option value="">Semua Outlet (Total)</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} ({outlet.type === 'MAIN' ? 'Pusat' : 'Cabang'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => fetchProducts(filterOutletId)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memuat data produk...</p>
              </div>
            ) : products.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-4 px-6">SKU / Kode</th>
                    <th className="py-4 px-6">Nama Produk</th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6 text-right">Harga Beli</th>
                    <th className="py-4 px-6 text-right">Harga Jual</th>
                    <th className="py-4 px-6 text-center">Stok</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-indigo-600 uppercase">{product.sku}</td>
                      <td className="py-4 px-6 text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={(() => {
                                  const mainImg = product.images.find(img => img.isMain)?.url || product.images[0].url;
                                  return mainImg.startsWith('/uploads') ? `${API_BASE_URL}${mainImg}` : mainImg;
                                })()}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                }}
                              />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <span className="font-bold">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-bold">
                          {product.categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">Rp {product.purchasePrice.toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6 text-right font-bold">Rp {product.sellingPrice.toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${product.stock === 0
                            ? 'bg-rose-50 text-rose-700'
                            : product.stock <= 5
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                          {product.stock} pcs
                        </span>
                        
                        {/* Stok Breakdown per Outlet (hanya jika filterOutletId kosong) */}
                        {!filterOutletId && product.outletStocks && product.outletStocks.length > 0 && (
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 space-y-0.5 max-w-[120px] mx-auto text-left border-t border-slate-100 dark:border-slate-800/50 pt-1">
                            {product.outletStocks.map((os: any) => (
                              <div key={os.outletId} className="flex justify-between gap-1.5">
                                <span className="truncate">{os.outlet?.name || 'Cabang'}:</span>
                                <span className="font-bold shrink-0">{os.stock} pcs</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                <Package className="h-12 w-12 text-slate-200 mb-3" />
                <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">Belum ada data produk</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Gunakan tombol "Tambah Produk Baru" di atas untuk mendaftarkan barang.</p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* MODAL POP-UP / DIALOG FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4">

            {/* Header Modal */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                {modalMode === 'create' ? 'Tambah Produk Baru' : 'Edit Informasi Produk'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-slate-900">

              {modalMode === 'edit' && (
                <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 mb-5 pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`pb-2 text-xs font-bold transition-all ${
                      activeTab === 'general'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
                    }`}
                  >
                    Informasi Umum
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('outlets')}
                    className={`pb-2 text-xs font-bold transition-all ${
                      activeTab === 'outlets'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400'
                    }`}
                  >
                    Pengaturan Cabang ({outlets.length})
                  </button>
                </div>
              )}

              {activeTab === 'general' ? (
                <>
                  {/* Grid 2 Column */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* SKU */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SKU / Kode Barang</label>
                        {modalMode === 'create' && (
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isAutoSku}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setIsAutoSku(checked);
                                if (checked && categoryId) {
                                  fetchNextSku(categoryId);
                                }
                              }}
                              className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 rounded border-slate-300"
                            />
                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">Otomatis</span>
                          </label>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: MNM-001"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        disabled={modalMode === 'create' && isAutoSku}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${modalMode === 'create' && isAutoSku
                            ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700'
                          }`}
                        required
                      />
                    </div>

                    {/* Kategori */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kategori Produk</label>
                      <select
                        value={categoryId}
                        onChange={(e) => {
                          const newCatId = e.target.value;
                          setCategoryId(newCatId);
                          if (modalMode === 'create' && isAutoSku) {
                            fetchNextSku(newCatId);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Nama Produk */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Lengkap Produk</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Contoh: Kopi Latte Dingin"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Grid 3 Column */}
                  <div className="grid grid-cols-3 gap-4">

                    {/* Harga Beli */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Harga Beli</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          placeholder="10000"
                          value={purchasePrice || ''}
                          onChange={(e) => setPurchasePrice(Number(e.target.value))}
                          className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
                          required
                        />
                      </div>
                    </div>

                    {/* Harga Jual */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Harga Jual</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          placeholder="18000"
                          value={sellingPrice || ''}
                          onChange={(e) => setSellingPrice(Number(e.target.value))}
                          className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
                          required
                        />
                      </div>
                    </div>

                    {/* Stok */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {modalMode === 'create' ? 'Stok Awal' : 'Stok Saat Ini'}
                      </label>

                      {modalMode === 'create' ? (
                        <input
                          type="number"
                          placeholder="50"
                          value={stock || ''}
                          onChange={(e) => setStock(Number(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
                          required
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                          <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <span className="text-amber-600 dark:text-amber-400 text-sm font-black">{stock}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Stok terkunci</p>
                            <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 leading-tight">
                              Ubah melalui <button type="button" onClick={() => { setIsModalOpen(false); navigate('/admin/inventory'); }} className="font-extrabold underline hover:no-underline">Mutasi Stok</button>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Gambar Produk */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                      Gambar Produk ({images.length}/8)
                    </label>

                    <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
                      {images.map((img, index) => {
                        const displayUrl = img.url.startsWith('/uploads') ? `${API_BASE_URL}${img.url}` : img.url;
                        return (
                          <div
                            key={index}
                            className={`relative aspect-square rounded-xl border overflow-hidden group transition-all duration-200 ${img.isMain
                                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600'
                              }`}
                          >
                            <img
                              src={displayUrl}
                              alt="Pratinjau Produk"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                              }}
                            />

                            {/* Utama badge / select */}
                            <button
                              type="button"
                              title="Jadikan gambar utama"
                              onClick={() => {
                                const newImgs = images.map((im, idx) => ({
                                  ...im,
                                  isMain: idx === index
                                }));
                                setImages(newImgs);
                              }}
                              className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[9px] font-extrabold transition-all duration-200 shadow-sm ${img.isMain
                                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900'
                                  : 'bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                              Utama
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                const newImgs = images.filter((_, idx) => idx !== index);
                                if (img.isMain && newImgs.length > 0) {
                                  newImgs[0].isMain = true;
                                }
                                setImages(newImgs);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-500 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all duration-200 shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Upload Card */}
                      {images.length < 8 && (
                        <label
                          className={`relative aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all duration-200 group ${uploading ? 'opacity-50 pointer-events-none' : ''
                            }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                          {uploading ? (
                            <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors duration-200" />
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors duration-200">
                                Unggah
                              </span>
                            </>
                          )}
                        </label>
                      )}
                    </div>

                    {images.length === 0 && !uploading && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                        Belum ada gambar ditambahkan. Produk akan menampilkan placeholder default di POS.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tentukan harga jual khusus dan batas limit stok minimum untuk masing-masing cabang. Jika harga khusus dikosongkan, sistem akan otomatis menggunakan harga jual utama (Rp {sellingPrice.toLocaleString('id-ID')}).
                  </p>
                  <div className="space-y-3">
                    {outlets.map((outlet) => {
                      const customPrice = overridePrices[outlet.id];
                      const minStockVal = minStocks[outlet.id] ?? 0;
                      
                      return (
                        <div key={outlet.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-indigo-500" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{outlet.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${outlet.type === 'MAIN' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                              {outlet.type === 'MAIN' ? 'Pusat' : 'Cabang'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {/* Harga Jual Khusus */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Harga Jual Khusus</label>
                              <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                                  <input
                                    type="number"
                                    placeholder="Gunakan harga utama"
                                    value={customPrice === undefined ? '' : customPrice}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setOverridePrices({
                                        ...overridePrices,
                                        [outlet.id]: val === '' ? undefined : Number(val)
                                      });
                                    }}
                                    className="w-full pl-7 pr-1.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSavePrice(outlet.id, customPrice)}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>

                            {/* Limit Stok Minimum */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Limit Stok Minimum</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={minStockVal}
                                  onChange={(e) => {
                                    setMinStocks({
                                      ...minStocks,
                                      [outlet.id]: Number(e.target.value)
                                    });
                                  }}
                                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveMinStock(outlet.id, minStockVal)}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                >
                  {activeTab === 'outlets' ? 'Tutup' : 'Batalkan'}
                </button>
                {activeTab === 'general' && (
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-100 transition-all"
                  >
                    {modalMode === 'create' ? 'Tambah Produk' : 'Simpan Perubahan'}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
