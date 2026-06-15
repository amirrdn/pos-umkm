import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';
import { 
  Users, UserPlus, Shield, Power, Trash2, ArrowLeft, 
  Loader2, Mail, Lock, User, Plus, X, AlertCircle, CheckCircle2 
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  userRoles: {
    role: {
      name: string;
    }
  }[];
}

export function StaffManagementView() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // State Modal Tambah Staf
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    roleName: 'Kasir' // Default role
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch daftar staf
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengambil data staf.');
      }
      setStaffList(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // Hanya Owner/Admin yang bisa mengakses kelola staf
    const isOwner = currentUser?.roles.includes('Owner') || currentUser?.roles.includes('TENANT_ADMIN');
    if (!isOwner) {
      navigate('/pos');
      return;
    }
    fetchStaff();
  }, [token, currentUser]);

  // Toast auto-clear helper
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah status staf.');
      }
      showSuccess(`Status ${data.data.name} berhasil diubah.`);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Soft Delete Karyawan
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus staf "${name}"? Akun ini tidak akan bisa login lagi.`)) {
      return;
    }
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus staf.');
      }
      showSuccess(`Staf ${name} berhasil dihapus.`);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Tambah Karyawan Baru
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError(null);

      const res = await fetch(`${API_BASE_URL}/api/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStaff)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menambahkan staf baru.');
      }

      showSuccess(`Karyawan baru "${data.data.name}" berhasil didaftarkan.`);
      setIsModalOpen(false);
      setNewStaff({ name: '', email: '', password: '', roleName: 'Kasir' });
      fetchStaff();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Premium (Glassmorphism & Gradient) */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/pos')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-95 duration-200"
            title="Kembali ke POS"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                Kelola Karyawan & Staf
              </h1>
              <p className="text-xs text-slate-400">Atur hak akses staf kasir dan admin tenant Anda</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-950/50 hover:shadow-indigo-900/30 hover:-translate-y-0.5 active:scale-95 duration-200"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Staf
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Alert Notifikasi */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 animate-pulse">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Tabel Karyawan */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-400 text-sm">Memuat daftar karyawan...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Users className="w-16 h-16 text-slate-700" />
              <div>
                <h3 className="text-lg font-semibold text-slate-300">Belum Ada Karyawan</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md">Daftarkan karyawan atau kasir Anda agar mereka dapat mulai melayani penjualan di toko Anda.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-all active:scale-95 duration-200"
              >
                <Plus className="w-4 h-4" /> Tambah Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {staffList.map((staff) => {
                    const initials = staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const isOwner = staff.userRoles.some(ur => ur.role.name === 'Owner' || ur.role.name === 'TENANT_ADMIN');
                    const isSelf = staff.id === currentUser?.id;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                                {staff.name}
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-700 font-normal">
                                    Saya
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">ID: {staff.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {staff.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isOwner 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            <Shield className="w-3.5 h-3.5" />
                            {isOwner ? 'Owner' : 'Kasir'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            staff.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                            {staff.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Aktif/Nonaktif */}
                            <button
                              onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                              disabled={isSelf}
                              className={`p-2 rounded-lg border transition-all duration-200 ${
                                isSelf 
                                  ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600' 
                                  : staff.isActive 
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95' 
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95'
                              }`}
                              title={staff.isActive ? "Nonaktifkan Karyawan" : "Aktifkan Karyawan"}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Hapus Karyawan */}
                            <button
                              onClick={() => handleDeleteStaff(staff.id, staff.name)}
                              disabled={isSelf}
                              className={`p-2 rounded-lg border transition-all duration-200 ${
                                isSelf 
                                  ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600' 
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-rose-400 active:scale-95'
                              }`}
                              title="Hapus Karyawan"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </main>

      {/* Modal Tambah Staf (Glassmorphism + Backdrop Blur) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !submitting && setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100">Tambah Karyawan Baru</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStaff}>
              <div className="p-6 space-y-4">
                {modalError && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{modalError}</p>
                  </div>
                )}

                {/* Input Nama */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Input Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Email Akun</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email"
                      required
                      placeholder="budi@domain.com"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Kata Sandi</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      type="password"
                      required
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Dropdown Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Pilih Hak Akses / Peran</label>
                  <select
                    value={newStaff.roleName}
                    onChange={(e) => setNewStaff({ ...newStaff, roleName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                  >
                    <option value="Kasir">Kasir (Hanya akses transaksi POS & history)</option>
                    <option value="Owner">Owner (Akses penuh seluruh laporan & pengaturan)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl border border-slate-700/80 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-950/30 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Daftarkan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
