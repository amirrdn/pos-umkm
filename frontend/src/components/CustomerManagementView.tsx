import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCustomerStore, type Customer } from '../store/useCustomerStore';
import { AppShellHeader } from './AppShellHeader';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Users,
  AlertCircle,
  CheckCircle,
  DollarSign,
  CreditCard,
} from 'lucide-react';

export const CustomerManagementView: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

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

  // State untuk Bayar Hutang
  const [isRepayModalOpen, setIsRepayModalOpen] = useState<boolean>(false);
  const [repayCustomer, setRepayCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState<number | ''>('');
  const [repayMethod, setRepayMethod] = useState<string>('CASH');
  const [repayNote, setRepayNote] = useState<string>('');
  const [isRepaying, setIsRepaying] = useState<boolean>(false);

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

  const openRepayModal = (cust: Customer) => {
    setRepayCustomer(cust);
    setRepayAmount(Number(cust.debtBalance));
    setRepayMethod('CASH');
    setRepayNote('');
    setIsRepayModalOpen(true);
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayCustomer) return;
    if (!repayAmount || Number(repayAmount) <= 0) {
      showToast('error', 'Jumlah pembayaran tidak valid!');
      return;
    }

    setIsRepaying(true);
    try {
      const res = await useCustomerStore.getState().payDebt(
        repayCustomer.id,
        Number(repayAmount),
        repayMethod,
        repayNote
      );

      if (res.success) {
        showToast('success', `Berhasil mencatat pembayaran hutang Rp ${Number(repayAmount).toLocaleString('id-ID')}`);
        setIsRepayModalOpen(false);
        setRepayCustomer(null);
        setRepayAmount('');
      } else {
        showToast('error', res.message || 'Gagal memproses pembayaran hutang.');
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan sistem saat memproses pembayaran.');
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">

      <AppShellHeader
        title="Kelola Pelanggan"
        subtitle="Database membership & poin loyalitas"
        icon={Users}
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
            <span className="hidden sm:inline">Tambah Pelanggan</span>
          </button>
        }
      />

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
              className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
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
                className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-700 px-2"
              >
                Reset
              </button>
            )}
          </form>

          <button
            onClick={() => fetchCustomers(searchQuery)}
            className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto"
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
                  <th className="px-6 py-4 text-right">Saldo Hutang</th>
                  <th className="px-6 py-4">Tanggal Bergabung</th>
                  <th className="px-6 py-4 w-36 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Memuat data pelanggan...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-rose-500 font-bold">
                      Terjadi kesalahan: {error}
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">
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
                      <td className="px-6 py-4 text-right">
                        <span className={`font-extrabold ${Number(cust.debtBalance) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          Rp {Number(cust.debtBalance || 0).toLocaleString('id-ID')}
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
                          {Number(cust.debtBalance) > 0 && (
                            <button
                              onClick={() => openRepayModal(cust)}
                              className="cursor-pointer px-2.5 py-1 text-[10px] font-extrabold bg-rose-50 hover:bg-rose-105 text-rose-700 hover:text-rose-800 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-350 dark:hover:text-rose-200 rounded-lg transition-colors flex items-center gap-1"
                              title="Bayar Cicilan Hutang"
                            >
                              <DollarSign className="h-3 w-3" />
                              Bayar
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(cust)}
                            className="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                            title="Edit Pelanggan"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.id, cust.name)}
                            className="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
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
                className="cursor-pointer text-slate-400 hover:text-slate-650 text-xs font-bold"
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

      {/* DIALOG MODAL: BAYAR HUTANG */}
      {isRepayModalOpen && repayCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-rose-600" />
                Bayar Cicilan Hutang
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsRepayModalOpen(false);
                  setRepayCustomer(null);
                }}
                className="cursor-pointer text-slate-400 hover:text-slate-650 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl space-y-1">
              <p className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-wide">Pelanggan</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{repayCustomer.name}</p>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-rose-200/50 dark:border-rose-900/30">
                <span className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-wide">Total Hutang</span>
                <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                  Rp {Number(repayCustomer.debtBalance).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <form onSubmit={handleRepaySubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRepayMethod('CASH')}
                    className={`cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${repayMethod === 'CASH'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100'
                      }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Tunai / Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod('QRIS')}
                    className={`cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${repayMethod === 'QRIS'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100'
                      }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    QRIS / E-Wallet
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Jumlah Pembayaran (Rp) *</label>
                  <button
                    type="button"
                    onClick={() => setRepayAmount(Number(repayCustomer.debtBalance))}
                    className="cursor-pointer text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wide"
                  >
                    Bayar Lunas
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={Number(repayCustomer.debtBalance)}
                    placeholder="Masukkan nominal..."
                    value={repayAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRepayAmount(val === '' ? '' : Number(val));
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Keterangan / Catatan</label>
                <textarea
                  placeholder="Contoh: Cicilan pertama, pembayaran tunai oleh kasir"
                  rows={2}
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsRepayModalOpen(false);
                    setRepayCustomer(null);
                  }}
                  className="cursor-pointer flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRepaying}
                  className="cursor-pointer flex-1 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-150 transition-all flex items-center justify-center"
                >
                  {isRepaying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Catat Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
