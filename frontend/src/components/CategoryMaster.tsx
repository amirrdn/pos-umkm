import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';
import { AppShellHeader } from './AppShellHeader';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Tag,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  prefix: string;
}

export const CategoryMaster: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentId, setCurrentId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil data kategori.');
      }

      setCategories(data.data || []);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Koneksi ke API kategori gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentId('');
    setName('');
    setPrefix('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setModalMode('edit');
    setCurrentId(category.id);
    setName(category.name);
    setPrefix(category.prefix);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !prefix.trim()) {
      showToast('error', 'Semua kolom wajib diisi dengan nilai yang valid.');
      return;
    }

    const payload = {
      name: name.trim(),
      prefix: prefix.trim().toUpperCase()
    };

    const url = modalMode === 'create'
      ? `${API_BASE_URL}/api/categories`
      : `${API_BASE_URL}/api/categories/${currentId}`;

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
        throw new Error(data.message || 'Gagal menyimpan kategori.');
      }

      showToast('success', modalMode === 'create' ? 'Kategori baru berhasil ditambahkan.' : 'Kategori berhasil diperbarui.');
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memproses kategori.');
    }
  };

  const openDeleteDialog = (category: Category) => {
    setTargetCategory(category);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setTargetCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (!targetCategory) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${targetCategory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user?.tenantId || ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus kategori.');
      }

      showToast('success', 'Kategori berhasil dihapus.');
      closeDeleteDialog();
      fetchCategories();
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan saat menghapus.');
      setIsDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-350 transform translate-y-0 ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-300'
          }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer ml-2 hover:opacity-75 text-xs font-bold">✕</button>
        </div>
      )}

      <AppShellHeader
        title="Master Kategori"
        subtitle="Kategori produk & prefix SKU"
        icon={Tag}
        accent="indigo"
        user={user}
        onLogout={handleLogout}
        showOutletSwitcher={false}
        trailingActions={
          <button
            onClick={handleOpenCreate}
            type="button"
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Tambah Kategori</span>
          </button>
        }
      />

      {/* AREA UTAMA / DAFTAR TABEL */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">

        {/* Kontainer Utama Tabel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">

          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              Daftar Kategori Aktif ({categories.length})
            </h3>
            <button
              onClick={fetchCategories}
              className="cursor-pointer p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memuat data kategori...</p>
              </div>
            ) : categories.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-4 px-6">Nama Kategori</th>
                    <th className="py-4 px-6">Prefix SKU</th>
                    <th className="py-4 px-6">Slug (SEO)</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-bold">{cat.name}</td>
                      <td className="py-4 px-6">
                        <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/50">
                          {cat.prefix}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 dark:text-slate-500 font-mono text-[10px]">{cat.slug}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="cursor-pointer p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                            title="Edit Kategori"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(cat)}
                            className="cursor-pointer p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                            title="Hapus Kategori"
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
              <div className="h-full w-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Tag className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold">Belum ada kategori terdaftar.</p>
                <button
                  onClick={handleOpenCreate}
                  className="cursor-pointer mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-150 transition-all"
                >
                  Tambah Kategori Pertama
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FORM MODAL ADD/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <div className="bg-indigo-100 dark:bg-indigo-500/10 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                {modalMode === 'create' ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              </div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Tambah Kategori Baru' : 'Edit Data Kategori'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Makanan Berat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Prefix SKU</label>
                <input
                  type="text"
                  placeholder="Contoh: MKN (Maksimal 10 Karakter)"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-800 dark:text-slate-100 uppercase"
                  maxLength={10}
                  required
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1">
                  Digunakan untuk mengenerate SKU otomatis (contoh: prefix MKN akan menghasilkan MKN-001, MKN-002, dst.)
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-100 transition-all"
                >
                  {modalMode === 'create' ? 'Tambah Kategori' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DELETE MODAL */}
      {isDeleteOpen && targetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" onClick={closeDeleteDialog}></div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-full border border-rose-100 dark:border-rose-950/50 mb-4 shadow-sm animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Hapus Kategori?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus kategori <span className="font-bold text-slate-800 dark:text-slate-250">"{targetCategory.name}"</span>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeDeleteDialog}
                disabled={deleteLoading}
                className="cursor-pointer flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="cursor-pointer flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-150 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus Kategori'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
