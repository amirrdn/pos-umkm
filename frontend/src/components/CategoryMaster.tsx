import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoriesApi,
  updateCategoryApi,
  type Category,
} from '../api/categoryApi';
import { getErrorMessage } from '../api/types';
import { AppShellHeader } from './AppShellHeader';
import { CategoryListPanel } from './category-master/CategoryListPanel';
import {
  Plus,
  Edit,
  Tag,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const CategoryMaster: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name_asc');

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

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategoriesApi({
        search: searchQuery.trim() !== '' ? searchQuery.trim() : undefined,
        sortBy: sortBy !== '' ? sortBy : undefined,
      });
      setCategories(data);
    } catch (err: unknown) {
      console.error(err);
      showToast('error', getErrorMessage(err, 'Koneksi ke API kategori gagal.'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await fetchCategories();
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchCategories]);

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
      prefix: prefix.trim().toUpperCase(),
    };

    try {
      if (modalMode === 'create') {
        await createCategoryApi(payload);
      } else {
        await updateCategoryApi(currentId, payload);
      }

      showToast(
        'success',
        modalMode === 'create'
          ? 'Kategori baru berhasil ditambahkan.'
          : 'Kategori berhasil diperbarui.'
      );
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Gagal memproses kategori.'));
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
      await deleteCategoryApi(targetCategory.id);
      showToast('success', 'Kategori berhasil dihapus.');
      closeDeleteDialog();
      fetchCategories();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Terjadi kesalahan saat menghapus.'));
      setIsDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('name_asc');
  };

  const isFiltered = searchQuery !== '' || sortBy !== 'name_asc';

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150 text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-350 transform translate-y-0 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
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

      {/* AppShell Header */}
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

      {/* Main List Panel & Overview Stats */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 min-h-0">
        <CategoryListPanel
          categories={categories}
          loading={loading}
          onRefresh={fetchCategories}
          onEdit={handleOpenEdit}
          onDelete={openDeleteDialog}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          resetFilters={resetFilters}
          isFiltered={isFiltered}
          onOpenCreate={handleOpenCreate}
        />
      </main>

      {/* FORM MODAL ADD/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          ></div>
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
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Nama Kategori
                </label>
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
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Prefix SKU
                </label>
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

      {/* CONFIRMATION DELETE MODAL */}
      {isDeleteOpen && targetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
            onClick={closeDeleteDialog}
          ></div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-full border border-rose-100 dark:border-rose-950/50 mb-4 shadow-sm animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Hapus Kategori?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus kategori{' '}
                <span className="font-bold text-slate-800 dark:text-slate-250">
                  "{targetCategory.name}"
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
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
