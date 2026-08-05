import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useOutletStore, type Outlet } from '../store/useOutletStore';
import { getErrorMessage } from '../api/types';
import { AppShellHeader } from './AppShellHeader';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  Store,
  MapPin,
  PhoneCall,
  Power,
  PowerOff,
  X,
  Users,
  Package,
} from 'lucide-react';

export const OutletManagementView: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { hierarchy, fetchHierarchy, createBranch, updateOutlet, deleteOutlet, loading, error } = useOutletStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentId, setCurrentId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editOutletType, setEditOutletType] = useState<'MAIN' | 'BRANCH'>('BRANCH');

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId('');
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
    setEditOutletType('BRANCH');
    setIsModalOpen(true);
  };

  const openEditModal = (outlet: Outlet) => {
    setModalMode('edit');
    setCurrentId(outlet.id);
    setName(outlet.name);
    setCode(outlet.code || '');
    setAddress(outlet.address || '');
    setPhone(outlet.phone || '');
    setEditOutletType(outlet.type);
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
      code: code.trim() ? code.trim() : null,
      address: address.trim() ? address : null,
      phone: phone.trim() ? phone : null,
    };

    try {
      if (modalMode === 'create') {
        const res = await createBranch(payload);
        if (res.success) {
          showToast('success', 'Cabang baru berhasil ditambahkan!');
          setIsModalOpen(false);
        } else {
          showToast('error', res.message || 'Gagal menambahkan cabang.');
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
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus cabang "${name}"? Seluruh data stok cabang ini akan dilepas.`)) {
      try {
        const res = await deleteOutlet(id);
        if (res.success) {
          showToast('success', 'Cabang berhasil dihapus.');
        } else {
          showToast('error', res.message || 'Gagal menghapus cabang.');
        }
      } catch (err: unknown) {
        showToast('error', getErrorMessage(err, 'Terjadi kesalahan sistem saat menghapus.'));
      }
    }
  };

  const handleToggleActive = async (branch: Outlet) => {
    const activating = branch.isActive === false;
    const msg = activating
      ? `Aktifkan kembali cabang "${branch.name}"?`
      : `Nonaktifkan cabang "${branch.name}"? Cabang tidak akan muncul di POS dan operasi kasir.`;
    if (!window.confirm(msg)) return;

    try {
      const res = await updateOutlet(branch.id, { isActive: activating });
      if (res.success) {
        showToast('success', activating ? 'Cabang berhasil diaktifkan.' : 'Cabang berhasil dinonaktifkan.');
      } else {
        showToast('error', res.message || 'Gagal mengubah status cabang.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const branchesList = hierarchy?.branches || [];
  const filteredBranches = branchesList.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.code && b.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.address && b.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors duration-150">
      <AppShellHeader
        title="Kelola Outlet"
        subtitle="Hierarki outlet utama & cabang operasional"
        icon={Store}
        accent="indigo"
        user={user}
        onLogout={handleLogout}
        showOutletSwitcher={false}
        trailingActions={
          <button
            onClick={openCreateModal}
            type="button"
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Tambah Cabang</span>
          </button>
        }
      />

      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs font-extrabold border backdrop-blur-md transition-all animate-bounce ${notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 min-h-0">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 w-4.5 h-4.5 transition-colors" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, kode atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10.5 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchHierarchy}
            className="cursor-pointer group p-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0 shadow-2xs flex items-center justify-center gap-1.5 self-start sm:self-auto text-xs font-bold"
          >
            <RefreshCw
              className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'
                }`}
            />
            <span>Perbarui Data</span>
          </button>
        </div>

        {loading && !hierarchy ? (
          <div className="py-16 text-center text-slate-400 font-extrabold flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
            <span>Memuat data hierarki outlet...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50 dark:bg-rose-950/40 rounded-3xl border border-rose-200 dark:border-rose-800 p-6">
            Terjadi kesalahan: {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center gap-2 px-1">
                <Store className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Outlet Utama (Pusat & Gudang)
              </h3>
              {hierarchy?.main ? (
                <div className="bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border-2 border-indigo-500/30 dark:border-indigo-500/40 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-md shadow-indigo-500/20 shrink-0">
                        <Store className="h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-lg text-slate-900 dark:text-slate-100 tracking-tight truncate">
                            {hierarchy.main.name}
                          </h4>
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                            Pusat
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          <span className="font-mono bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            KODE: {hierarchy.main.code || 'PST'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                            {hierarchy.main.address || 'Alamat belum diatur'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <PhoneCall className="h-4 w-4 text-slate-400 shrink-0" />
                            {hierarchy.main.phone || 'Telepon belum diatur'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-200 dark:border-slate-800">
                      <div className="text-center bg-white/80 dark:bg-slate-800/60 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 min-w-[90px]">
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {hierarchy.main.activeStaff || 0}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                          <Users className="w-3 h-3 text-indigo-500" />
                          Staf
                        </p>
                      </div>
                      <div className="text-center bg-white/80 dark:bg-slate-800/60 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 min-w-[90px]">
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {hierarchy.main.totalStockSKUs || 0}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                          <Package className="w-3 h-3 text-emerald-500" />
                          SKU
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditModal(hierarchy.main!)}
                        className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profil
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center py-8 text-slate-400 rounded-3xl font-extrabold text-xs">
                  Data outlet utama tidak tersedia.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center gap-2 px-1">
                <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Daftar Cabang Toko ({filteredBranches.length})
              </h3>
              {filteredBranches.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl py-12 text-center text-slate-400 font-extrabold text-xs">
                  Belum ada cabang terdaftar atau hasil pencarian tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden backdrop-blur-md ${branch.isActive === false
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200/90 dark:border-slate-800'
                        }`}
                    >
                      {branch.isActive === false && (
                        <span className="absolute top-3.5 right-3.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                          Nonaktif
                        </span>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                            <Store className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 pr-14">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">
                              {branch.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold tracking-wider uppercase mt-0.5">
                              KODE: {branch.code || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-1 text-center text-xs border-t border-b border-slate-100 dark:border-slate-800 py-2.5">
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800">
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {branch.activeStaff || 0}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-0.5">
                              Staf
                            </p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800">
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {branch.totalStockSKUs || 0}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-0.5">
                              SKU
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-semibold pt-1">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{branch.address || 'Alamat belum diatur'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{branch.phone || 'Telepon belum diatur'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(branch)}
                          className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-2xs ${branch.isActive === false
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                        >
                          {branch.isActive === false ? (
                            <>
                              <Power className="w-3.5 h-3.5" />
                              Aktifkan
                            </>
                          ) : (
                            <>
                              <PowerOff className="w-3.5 h-3.5" />
                              Nonaktifkan
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(branch)}
                          className="cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-2xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(branch.id, branch.name)}
                          className="cursor-pointer px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                {modalMode === 'create' ? 'Daftar Cabang Baru' : 'Edit Informasi Outlet'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Nama Outlet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={editOutletType === 'MAIN' ? 'Contoh: Toko Pusat Utama' : 'Contoh: Cabang Dago Bandung'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Kode Outlet</label>
                <input
                  type="text"
                  disabled={editOutletType === 'MAIN' && modalMode === 'edit'}
                  placeholder="Contoh: CBG-01 (Opsional, otomatis digenerasi jika kosong)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Alamat Outlet</label>
                <textarea
                  placeholder="Contoh: Jl. Dago No. 123, Bandung"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Nomor Telepon Outlet</label>
                <input
                  type="text"
                  placeholder="Contoh: 022-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer flex-1 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : modalMode === 'create' ? 'Simpan Cabang' : 'Perbarui Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
