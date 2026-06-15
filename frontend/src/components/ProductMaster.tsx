import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
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
  ArrowUpDown
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  categoryId: string;
  categoryName: string;
}

export const ProductMaster: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  // States
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Notification States
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form States
  const [currentId, setCurrentId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('cat-minuman-111'); // Default ke Kategori Minuman
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);

  // Load products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
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

      // Map backend products
      const mapped = data.data.map((item: any) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        purchasePrice: Number(item.purchasePrice),
        sellingPrice: Number(item.sellingPrice),
        stock: item.stock,
        categoryId: item.categoryId,
        categoryName: item.category?.name || 'Umum'
      }));

      setProducts(mapped);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Koneksi ke API produk gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentId('');
    setName('');
    setSku('');
    setCategoryId('cat-minuman-111');
    setPurchasePrice(0);
    setSellingPrice(0);
    setStock(0);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (product: Product) => {
    setModalMode('edit');
    setCurrentId(product.id);
    setName(product.name);
    setSku(product.sku);
    setCategoryId(product.categoryId);
    setPurchasePrice(product.purchasePrice);
    setSellingPrice(product.sellingPrice);
    setStock(product.stock);
    setIsModalOpen(true);
  };

  // Handle Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || purchasePrice <= 0 || sellingPrice <= 0 || stock < 0) {
      showToast('error', 'Semua kolom wajib diisi dengan nilai yang valid.');
      return;
    }

    const payload = {
      categoryId,
      name,
      sku,
      purchasePrice,
      sellingPrice,
      stock
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
      fetchProducts(); // Refresh list

    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Terjadi kesalahan saat memproses data.');
    }
  };

  // Handle Delete
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
      fetchProducts(); // Refresh list

    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Terjadi kesalahan saat menghapus.');
    }
  };

  // Helper untuk menampilkan Toast
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-350 transform translate-y-0 ${
          notification.type === 'success' 
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Master Produk</h1>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">Pengelolaan Barang & Stok</p>
          </div>
        </div>

        {/* Menu Navigasi Global */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Kasir POS
          </button>
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm"
          >
            <Package className="w-3.5 h-3.5" />
            Produk
          </button>
          <button
            onClick={() => navigate('/admin/inventory')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Stok
          </button>
          <button
            onClick={() => navigate('/admin/staff')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            Staf
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </nav>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-97 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-150 transition-all"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk Baru
        </button>
      </header>

      {/* AREA UTAMA / DAFTAR TABEL */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        
        {/* Kontainer Utama Tabel */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
          
          <div className="p-5 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              Master Produk Aktif ({products.length})
            </h3>
            <button 
              onClick={fetchProducts}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-500">Memuat data produk...</p>
              </div>
            ) : products.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-indigo-600 uppercase">{product.sku}</td>
                      <td className="py-4 px-6 text-slate-900">{product.name}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold">
                          {product.categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">Rp {product.purchasePrice.toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6 text-right font-bold">Rp {product.sellingPrice.toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          product.stock === 0 
                            ? 'bg-rose-50 text-rose-700' 
                            : product.stock <= 5 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {product.stock} pcs
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
                <p className="font-bold text-slate-500 text-sm">Belum ada data produk</p>
                <p className="text-slate-400 text-xs mt-1">Gunakan tombol "Tambah Produk Baru" di atas untuk mendaftarkan barang.</p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* MODAL POP-UP / DIALOG FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4">
            
            {/* Header Modal */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                {modalMode === 'create' ? 'Tambah Produk Baru' : 'Edit Informasi Produk'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Grid 2 Column */}
              <div className="grid grid-cols-2 gap-4">
                {/* SKU */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">SKU / Kode Barang</label>
                  <input
                    type="text"
                    placeholder="PROD-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                    required
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kategori Produk</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                  >
                    <option value="cat-minuman-111">Minuman</option>
                    <option value="cat-makanan-222">Makanan</option>
                  </select>
                </div>
              </div>

              {/* Nama Produk */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap Produk</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contoh: Kopi Latte Dingin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Grid 3 Column */}
              <div className="grid grid-cols-3 gap-4">
                
                {/* Harga Beli */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Harga Beli</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      placeholder="10000"
                      value={purchasePrice || ''}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Harga Jual */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Harga Jual</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      placeholder="18000"
                      value={sellingPrice || ''}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Stok */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Jumlah Stok</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={stock || ''}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                    required
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-100 transition-all"
                >
                  {modalMode === 'create' ? 'Tambah Produk' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
