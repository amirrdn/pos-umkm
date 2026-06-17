import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useOutletStore, type Outlet } from '../store/useOutletStore';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Coffee,
  ShoppingBag,
  History,
  Package,
  ArrowUpDown,
  Users,
  BarChart2,
  LogOut,
  AlertCircle,
  CheckCircle,
  Sun,
  Moon,
  Tag,
  Store,
  MapPin,
  PhoneCall
} from 'lucide-react';

export const OutletManagementView: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();

  const { outlets, fetchOutlets, createOutlet, updateOutlet, deleteOutlet, loading, error } = useOutletStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentId, setCurrentId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchOutlets();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId('');
    setName('');
    setAddress('');
    setPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (outlet: Outlet) => {
    setModalMode('edit');
    setCurrentId(outlet.id);
    setName(outlet.name);
    setAddress(outlet.address || '');
    setPhone(outlet.phone || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nama outlet wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      address: address.trim() ? address : null,
      phone: phone.trim() ? phone : null
    };

    try {
      if (modalMode === 'create') {
        const res = await createOutlet(payload);
        if (res.success) {
          showToast('success', 'Outlet baru berhasil ditambahkan!');
          setIsModalOpen(false);
        } else {
          showToast('error', res.message || 'Gagal menambahkan outlet.');
        }
      } else {
        const res = await updateOutlet(currentId, payload);
        if (res.success) {
          showToast('success', 'Data outlet berhasil diperbarui!');
          setIsModalOpen(false);
        } else {
          showToast('error', res.message || 'Gagal memperbarui outlet.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus outlet "${name}"? Seluruh data stok outlet ini akan dilepas.`)) {
      try {
        const res = await deleteOutlet(id);
        if (res.success) {
          showToast('success', 'Outlet berhasil dihapus.');
        } else {
          showToast('error', res.message || 'Gagal menghapus outlet.');
        }
      } catch (err) {
        showToast('error', 'Terjadi kesalahan sistem saat menghapus.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredOutlets = outlets.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.address && o.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-150">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-wide uppercase">SaaSPOS</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold tracking-wider uppercase">UMKM Platform</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Kasir POS
          </button>
          <button
            onClick={() => navigate('/pos/history')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
          >
            <History className="w-3.5 h-3.5" />
            Riwayat
          </button>

          {(user?.roles.includes('Owner') || user?.roles.includes('TENANT_ADMIN') || user?.roles.includes('Manager') || user?.roles.includes('Staf Gudang')) && (
            <>
              <button
                onClick={() => navigate('/admin/products')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
              >
                <Package className="w-3.5 h-3.5" />
                Produk
              </button>
              <button
                onClick={() => navigate('/admin/categories')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
              >
                <Tag className="w-3.5 h-3.5" />
                Kategori
              </button>
              <button
                onClick={() => navigate('/admin/inventory')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Stok
              </button>

              {!user?.roles.includes('Staf Gudang') && (
                <>
                  <button
                    onClick={() => navigate('/admin/staff')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Staf
                  </button>
                  <button
                    onClick={() => navigate('/admin/customers')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Pelanggan
                  </button>
                  {(user?.roles.includes('Owner') || user?.roles.includes('TENANT_ADMIN')) && (
                    <button
                      onClick={() => navigate('/admin/outlets')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm transition-all duration-150"
                    >
                      <Store className="w-3.5 h-3.5" />
                      Outlet
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-150"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Dashboard
                  </button>
                </>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-150 active:scale-95"
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
            <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">{user?.roles.join(', ') || 'Staff'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl shadow-xl text-xs font-bold border animate-in slide-in-from-bottom duration-200 ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-250 text-rose-800'
          }`}>
          {notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Manajemen Cabang / Outlet</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daftarkan dan kelola informasi cabang toko multi-outlet untuk segmentasi produk dan staf.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4.5 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150 transition-all active:scale-97"
          >
            <Plus className="h-4 w-4" />
            Tambah Outlet
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>
          </div>

          <button
            onClick={fetchOutlets}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && outlets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Memuat data outlet...
            </div>
          ) : error ? (
            <div className="col-span-full py-12 text-center text-rose-500 font-bold">
              Terjadi kesalahan: {error}
            </div>
          ) : filteredOutlets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold">
              Belum ada outlet terdaftar atau hasil pencarian tidak ditemukan.
            </div>
          ) : (
            filteredOutlets.map((outlet) => (
              <div
                key={outlet.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-200">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">{outlet.name}</h3>
                      <p className="text-[9px] text-slate-400 font-mono font-bold tracking-wider uppercase mt-0.5">ID: {outlet.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <span>{outlet.address || 'Alamat belum diatur'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{outlet.phone || 'Telepon belum diatur'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEditModal(outlet)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 hover:text-indigo-650 dark:hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(outlet.id, outlet.name)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-650 dark:text-rose-450 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <Store className="h-4 w-4 text-indigo-600" />
                {modalMode === 'create' ? 'Daftar Outlet Baru' : 'Edit Informasi Outlet'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nama Outlet *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Utama Cabang Bandung"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Alamat Outlet</label>
                <textarea
                  placeholder="Contoh: Jl. Dago No. 123, Bandung"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nomor Telepon Outlet</label>
                <input
                  type="text"
                  placeholder="Contoh: 022-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-150 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : modalMode === 'create' ? 'Simpan' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
