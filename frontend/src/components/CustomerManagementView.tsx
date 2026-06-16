import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useCustomerStore, type Customer } from '../store/useCustomerStore';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Users,
  Coffee,
  ShoppingBag,
  History,
  Package,
  ArrowUpDown,
  BarChart2,
  LogOut,
  AlertCircle,
  CheckCircle,
  Sun,
  Moon,
  Tag
} from 'lucide-react';

export const CustomerManagementView: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();

  const { customers, fetchCustomers, createCustomer, updateCustomer, deleteCustomer, loading, error } = useCustomerStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentId, setCurrentId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId('');
    setName('');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setModalMode('edit');
    setCurrentId(cust.id);
    setName(cust.name);
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nama pelanggan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      phone: phone.trim() ? phone : null,
      email: email.trim() ? email : null
    };

    try {
      if (modalMode === 'create') {
        const res = await createCustomer(payload);
        if (res.success) {
          showToast('success', 'Pelanggan baru berhasil ditambahkan!');
          setIsModalOpen(false);
        } else {
          showToast('error', res.message || 'Gagal menambahkan pelanggan.');
        }
      } else {
        const res = await updateCustomer(currentId, payload);
        if (res.success) {
          showToast('success', 'Data pelanggan berhasil diperbarui!');
          setIsModalOpen(false);
        } else {
          showToast('error', res.message || 'Gagal memperbarui pelanggan.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${name}"? Data riwayat transaksi mereka akan dilepas tautannya.`)) {
      try {
        const res = await deleteCustomer(id);
        if (res.success) {
          showToast('success', 'Pelanggan berhasil dihapus.');
        } else {
          showToast('error', res.message || 'Gagal menghapus pelanggan.');
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">

      {/* HEADER NAVIGASI BAR */}
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

        {/* Menu Navigasi Admin / Kasir */}
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

          {/* Menu Khusus Owner / Admin */}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm transition-all duration-150"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Pelanggan
                  </button>
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

        {/* Profil Kasir & Logout */}
        <div className="flex items-center gap-3">
          {/* Tombol Switcher Tema (Dark / Light) */}
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
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{user?.roles.join(', ') || 'Staff'}</p>
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

      {/* POPUP NOTIFIKASI */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl shadow-xl text-xs font-bold border animate-in slide-in-from-bottom duration-200 ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-250 text-rose-800'
          }`}>
          {notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Database Pelanggan</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kelola data keanggotaan dan kumpulkan poin loyalitas membership pelanggan.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4.5 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150 transition-all active:scale-97"
          >
            <Plus className="h-4 w-4" />
            Tambah Pelanggan
          </button>
        </div>

        {/* Pencarian dan Filter */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau no. telepon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Cari
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchCustomers('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2"
              >
                Reset
              </button>
            )}
          </form>

          <button
            onClick={() => fetchCustomers(searchQuery)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </button>
        </div>

        {/* TABEL PELANGGAN */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 w-16 text-center">No</th>
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4">No. Telepon / WhatsApp</th>
                  <th className="px-6 py-4">Alamat Email</th>
                  <th className="px-6 py-4 text-center">Poin Loyalitas</th>
                  <th className="px-6 py-4">Tanggal Bergabung</th>
                  <th className="px-6 py-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Memuat data pelanggan...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-rose-500 font-bold">
                      Terjadi kesalahan: {error}
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                      Belum ada pelanggan terdaftar di tenant ini.
                    </td>
                  </tr>
                ) : (
                  customers.map((cust, idx) => (
                    <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors font-medium">
                      <td className="px-6 py-4 text-center text-slate-400 dark:text-slate-500 font-bold">{idx + 1}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold">{cust.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{cust.phone || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{cust.email || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-indigo-50 text-indigo-800 font-black px-2.5 py-1 rounded-lg text-[10px]">
                          {cust.points} Pts
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(cust.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                            title="Edit Pelanggan"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.id, cust.name)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* DIALOG MODAL: TAMBAH / EDIT PELANGGAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                {modalMode === 'create' ? 'Daftar Pelanggan Baru' : 'Edit Data Pelanggan'}
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
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Contoh: 0812XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Alamat Email</label>
                <input
                  type="email"
                  placeholder="Contoh: budi@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
