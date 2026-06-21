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
      phone: phone.trim() ? phone : null
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">

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
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Tambah Cabang</span>
          </button>
        }
      />

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

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, kode atau alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>
          </div>

          <button
            onClick={fetchHierarchy}
            className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </button>
        </div>

        {loading && !hierarchy ? (
          <div className="py-12 text-center text-slate-400 font-bold">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Memuat data hierarki...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 font-bold">
            Terjadi kesalahan: {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* OUTLET UTAMA */}
            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-4 flex items-center gap-2">
                <Store className="h-4 w-4 text-indigo-500" />
                Outlet Utama (Pusat & Gudang)
              </h3>
              {hierarchy?.main ? (
                <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border-2 border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
                        <Store className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight">{hierarchy.main.name}</h4>
                          <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Pusat</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300">KODE: {hierarchy.main.code || 'PST'}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {hierarchy.main.address || 'Alamat belum diatur'}</span>
                          <span className="flex items-center gap-1"><PhoneCall className="h-3.5 w-3.5 text-slate-400" /> {hierarchy.main.phone || 'Telepon belum diatur'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="text-center bg-slate-100/60 dark:bg-slate-800/40 px-4 py-2.5 rounded-2xl min-w-[80px]">
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{hierarchy.main.activeStaff || 0}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Staf Aktif</p>
                      </div>
                      <div className="text-center bg-slate-100/60 dark:bg-slate-800/40 px-4 py-2.5 rounded-2xl min-w-[80px]">
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{hierarchy.main.totalStockSKUs || 0}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider mt-0.5">Stok SKU</p>
                      </div>
                      <button
                        onClick={() => openEditModal(hierarchy.main!)}
                        className="cursor-pointer px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 text-indigo-750 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profil
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-slate-900 text-center py-6 text-slate-400 rounded-3xl font-bold">
                  Data outlet utama tidak tersedia.
                </div>
              )}
            </div>

            {/* CABANG-CABANG */}
            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-4 flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-500" />
                Daftar Cabang Toko ({filteredBranches.length})
              </h3>
              {filteredBranches.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl py-12 text-center text-slate-400 font-bold">
                  Belum ada cabang terdaftar atau hasil pencarian tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden ${
                        branch.isActive === false
                          ? 'border-amber-200/80 dark:border-amber-900/40 opacity-90'
                          : 'border-slate-200/85 dark:border-slate-800'
                      }`}
                    >
                      {branch.isActive === false && (
                        <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md">
                          Nonaktif
                        </span>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                            <Store className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">{branch.name}</h4>
                            <p className="text-[9px] text-slate-400 font-mono font-bold tracking-wider uppercase mt-0.5">KODE: {branch.code || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs border-t border-b border-slate-100 dark:border-slate-800/80 py-2">
                          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-1.5">
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200">{branch.activeStaff || 0}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Staf</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-1.5">
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200">{branch.totalStockSKUs || 0}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase mt-0.5">SKU</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                            <span>{branch.address || 'Alamat belum diatur'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{branch.phone || 'Telepon belum diatur'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleToggleActive(branch)}
                          className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            branch.isActive === false
                              ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400'
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
                          onClick={() => openEditModal(branch)}
                          className="cursor-pointer px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 hover:text-indigo-650 dark:hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id, branch.name)}
                          className="cursor-pointer px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-650 dark:text-rose-450 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <Store className="h-4 w-4 text-indigo-600" />
                {modalMode === 'create' ? 'Daftar Cabang Baru' : 'Edit Informasi Outlet'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-650 text-xs font-bold"
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
                  placeholder={editOutletType === 'MAIN' ? 'Contoh: Toko Pusat Utama' : 'Contoh: Cabang Dago Bandung'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Kode Outlet</label>
                <input
                  type="text"
                  disabled={editOutletType === 'MAIN' && modalMode === 'edit'}
                  placeholder="Contoh: CBG-01 (Opsional, otomatis digenerasi jika kosong)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
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
                  className="cursor-pointer flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-150 transition-all flex items-center justify-center"
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
