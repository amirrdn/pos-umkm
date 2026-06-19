import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { API_BASE_URL } from '../config';
import {
  Users, UserPlus, Shield, Power, Trash2, ArrowLeft,
  Loader2, Mail, Lock, User, Plus, X, AlertCircle, CheckCircle2,
  Sun, Moon, ChevronDown, Search, Check, Pencil, AlertTriangle, MapPin
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  approvalStatus: string; // PENDING, APPROVED, REJECTED
  userOutlets: {
    outlet: {
      id: string;
      name: string;
    }
  }[];
  userRoles: {
    role: {
      id: string;
      name: string;
    }
  }[];
}

export function StaffManagementView() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const { theme, toggleTheme } = useThemeStore();

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [outletsList, setOutletsList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rolesList, setRolesList] = useState<{ id: string; name: string; description: string }[]>([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    outletIds: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredRoles = rolesList.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, isDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          filteredRoles.length > 0 ? (prev + 1) % filteredRoles.length : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          filteredRoles.length > 0 ? (prev - 1 + filteredRoles.length) % filteredRoles.length : 0
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredRoles.length > 0 && filteredRoles[highlightedIndex]) {
          const selectedRole = filteredRoles[highlightedIndex];
          setNewStaff(prev => ({ ...prev, roleId: selectedRole.id }));
          setIsDropdownOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
      case 'Tab':
        setIsDropdownOpen(false);
        break;
      default:
        break;
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRolesList(data.data);
        if (data.data.length > 0) {
          const defaultRole = data.data.find((r: any) => r.name === 'Kasir') || data.data[0];
          setNewStaff(prev => ({ ...prev, roleId: defaultRole.id }));
        }
      }
    } catch (err) {
      console.error('Gagal mengambil daftar peran:', err);
    }
  };

  const fetchOutlets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/outlets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOutletsList(data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar outlet:', err);
    }
  };

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
    const isAllowed = currentUser?.roles.includes('Owner') || currentUser?.roles.includes('TENANT_ADMIN') || currentUser?.roles.includes('Manager');
    if (!isAllowed) {
      navigate('/pos');
      return;
    }
    fetchStaff();
    fetchRoles();
    fetchOutlets();
  }, [token, currentUser]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

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

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/staff/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus staf.');
      }
      showSuccess(`Staf "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveStaff = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/staff/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyetujui pendaftaran staf.');
      }
      showSuccess(`Pendaftaran staf "${data.data.name}" berhasil disetujui.`);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRejectStaff = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/staff/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menolak pendaftaran staf.');
      }
      showSuccess(`Pendaftaran staf "${data.data.name}" ditolak.`);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingStaff(null);
    const defaultRole = rolesList.find((r: any) => r.name === 'Kasir') || rolesList[0];
    setNewStaff({
      name: '',
      email: '',
      password: '',
      roleId: defaultRole?.id || '',
      outletIds: []
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setNewStaff({
      name: staff.name,
      email: staff.email,
      password: '',
      roleId: staff.userRoles[0]?.role.id || '',
      outletIds: staff.userOutlets ? staff.userOutlets.map(uo => uo.outlet.id) : []
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError(null);

      const isEdit = !!editingStaff;
      const url = isEdit
        ? `${API_BASE_URL}/api/staff/${editingStaff.id}`
        : `${API_BASE_URL}/api/staff`;
      const method = isEdit ? 'PATCH' : 'POST';

      const payload = isEdit
        ? { name: newStaff.name, roleId: newStaff.roleId, outletIds: newStaff.outletIds }
        : newStaff;

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} staf.`);
      }

      showSuccess(isEdit ? `Karyawan "${data.data.name}" berhasil diperbarui.` : `Karyawan baru "${data.data.name}" berhasil didaftarkan.`);
      setIsModalOpen(false);
      const defaultRole = rolesList.find((r: any) => r.name === 'Kasir') || rolesList[0];
      setNewStaff({ name: '', email: '', password: '', roleId: defaultRole?.id || '', outletIds: [] });
      setEditingStaff(null);
      fetchStaff();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOutletToggle = (outletId: string) => {
    setNewStaff(prev => {
      const exists = prev.outletIds.includes(outletId);
      const updated = exists
        ? prev.outletIds.filter(id => id !== outletId)
        : [...prev.outletIds, outletId];
      return { ...prev, outletIds: updated };
    });
  };

  const displayedStaff = staffList.filter(staff => {
    if (activeTab === 'active') {
      return staff.approvalStatus === 'APPROVED';
    } else {
      return staff.approvalStatus === 'PENDING';
    }
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Header Premium (Glassmorphism & Gradient) */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pos')}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all active:scale-95 duration-200"
            title="Kembali ke POS"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-400 bg-clip-text text-transparent">
                Kelola Karyawan & Staf
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Atur hak akses staf kasir dan admin tenant Anda</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
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
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-950/50 hover:shadow-indigo-900/30 hover:-translate-y-0.5 active:scale-95 duration-200"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Staf
          </button>
        </div>
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'active'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-350'
            }`}
          >
            Staf Aktif ({staffList.filter(s => s.approvalStatus === 'APPROVED').length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'pending'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-350'
            }`}
          >
            Permintaan Persetujuan ({staffList.filter(s => s.approvalStatus === 'PENDING').length})
          </button>
        </div>

        {/* Tabel Karyawan */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat daftar karyawan...</p>
            </div>
          ) : displayedStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Users className="w-16 h-16 text-slate-700 dark:text-slate-600" />
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {activeTab === 'active' ? 'Belum Ada Karyawan' : 'Tidak Ada Permintaan Baru'}
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-md">
                  {activeTab === 'active'
                    ? 'Daftarkan karyawan atau kasir Anda agar mereka dapat mulai melayani penjualan di toko Anda.'
                    : 'Semua permintaan pendaftaran staf telah diproses.'}
                </p>
              </div>
              {activeTab === 'active' && (
                <button
                  onClick={openAddModal}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 duration-200"
                >
                  <Plus className="w-4 h-4" /> Tambah Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Outlet</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {displayedStaff.map((staff) => {
                    const initials = staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const isSelf = staff.id === currentUser?.id;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                {staff.name}
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-700 font-normal">
                                    Saya
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-550">ID: {staff.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-650 dark:text-slate-300">
                          {staff.email}
                        </td>
                        <td className="px-6 py-4">
                          {staff.userRoles.map((ur) => {
                            const rName = ur.role.name;
                            const isOwnerOrAdmin = rName === 'Owner' || rName === 'TENANT_ADMIN';
                            const isManager = rName === 'Manager';
                            const isGudang = rName === 'Staf Gudang';
                            let badgeStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                            if (isOwnerOrAdmin) {
                              badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                            } else if (isManager) {
                              badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                            } else if (isGudang) {
                              badgeStyle = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                            } else {
                              badgeStyle = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'; // Kasir
                            }
                            return (
                              <span key={ur.role.name} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}>
                                <Shield className="w-3.5 h-3.5" />
                                {rName}
                              </span>
                            );
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {staff.userOutlets && staff.userOutlets.length > 0 ? (
                              staff.userOutlets.map((uo) => (
                                <span key={uo.outlet.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700/50 rounded-md">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                  {uo.outlet.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Global / Semua Outlet</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            activeTab === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : staff.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              activeTab === 'pending'
                                ? 'bg-amber-400'
                                : staff.isActive ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}></span>
                            {activeTab === 'pending' ? 'Menunggu Approval' : staff.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {activeTab === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveStaff(staff.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                title="Setujui Pendaftaran"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Setujui
                              </button>
                              <button
                                onClick={() => handleRejectStaff(staff.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                title="Tolak Pendaftaran"
                              >
                                <X className="w-3.5 h-3.5" />
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Aktif/Nonaktif */}
                              <button
                                onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                                disabled={isSelf}
                                className={`p-2 rounded-lg border transition-all duration-200 ${
                                  isSelf
                                    ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-650'
                                    : staff.isActive
                                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95'
                                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95'
                                }`}
                                title={staff.isActive ? "Nonaktifkan Karyawan" : "Aktifkan Karyawan"}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              {/* Edit Karyawan */}
                              <button
                                onClick={() => openEditModal(staff)}
                                disabled={isSelf}
                                className={`p-2 rounded-lg border transition-all duration-200 ${
                                  isSelf
                                    ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-650'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 border-slate-200 dark:border-slate-700'
                                }`}
                                title="Edit Karyawan"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Hapus Karyawan */}
                              <button
                                onClick={() => setDeleteTarget(staff)}
                                disabled={isSelf}
                                className={`p-2 rounded-lg border transition-all duration-200 ${
                                  isSelf
                                    ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-650'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 border-slate-200 dark:border-slate-700'
                                }`}
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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

      {/* Modal Tambah/Edit Staf (Glassmorphism + Backdrop Blur) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !submitting && setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 rounded-t-2xl border-b border-slate-150 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                {editingStaff ? (
                  <Pencil className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <UserPlus className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                )}
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  {editingStaff ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStaff} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {modalError && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{modalError}</p>
                  </div>
                )}

                {/* Input Nama */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-550">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Input Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Akun</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-550">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      disabled={!!editingStaff}
                      placeholder="budi@domain.com"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Input Password */}
                {!editingStaff && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kata Sandi</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-550">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                        value={newStaff.password}
                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                {/* Dropdown Role (Custom Select2-like) */}
                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pilih Hak Akses / Peran</label>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onKeyDown={handleDropdownKeyDown}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 text-left relative"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-850 dark:text-slate-200 text-xs">
                          {rolesList.find(r => r.id === newStaff.roleId)?.name || 'Pilih Peran...'}
                        </p>
                        {rolesList.find(r => r.id === newStaff.roleId)?.description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-550 line-clamp-1 mt-0.5">
                            {rolesList.find(r => r.id === newStaff.roleId)?.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-550 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {/* Options Panel */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Search Input */}
                      <div className="relative border-b border-slate-150 dark:border-slate-850 p-2 bg-slate-50/50 dark:bg-slate-950/50 flex items-center">
                        <Search className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Cari peran..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={handleDropdownKeyDown}
                          className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all duration-155"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3.5 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850/40 py-1">
                        {filteredRoles.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-450 dark:text-slate-500 text-center">
                            Tidak ada peran yang cocok
                          </div>
                        ) : (
                          filteredRoles.map((role, idx) => {
                            const isCurrentlySelected = role.id === newStaff.roleId;
                            const isHighlighted = idx === highlightedIndex;
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => {
                                  setNewStaff({ ...newStaff, roleId: role.id });
                                  setIsDropdownOpen(false);
                                  setSearchTerm('');
                                }}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors ${
                                  isCurrentlySelected
                                    ? 'bg-indigo-50 dark:bg-indigo-600/15'
                                    : isHighlighted
                                      ? 'bg-slate-50 dark:bg-slate-800/60'
                                      : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}
                              >
                                <div className="space-y-0.5 pr-4">
                                  <p className={`font-bold ${isCurrentlySelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {role.name}
                                  </p>
                                  {role.description && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                      {role.description}
                                    </p>
                                  )}
                                </div>
                                {isCurrentlySelected && (
                                  <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Checkbox List Outlets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pilih Outlet Penempatan</label>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2">
                    {outletsList.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-600 italic">Belum ada outlet aktif.</p>
                    ) : (
                      outletsList.map(outlet => (
                        <label key={outlet.id} className="flex items-center gap-3 cursor-pointer select-none">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={newStaff.outletIds.includes(outlet.id)}
                              onChange={() => handleOutletToggle(outlet.id)}
                              className="peer sr-only"
                              disabled={submitting}
                            />
                            <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors"></div>
                            <Check className="absolute inset-0 w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                          </div>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{outlet.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/10 dark:shadow-indigo-950/30 transition-all animate-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    editingStaff ? 'Simpan Perubahan' : 'Daftarkan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus (Custom & Profesional) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !submitting && setDeleteTarget(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Icon Container */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4 border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              Hapus Karyawan?
            </h3>
            <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus karyawan <strong className="text-slate-850 dark:text-slate-200 font-semibold">"{deleteTarget.name}"</strong>? Akun ini akan dinonaktifkan secara permanen dan tidak akan bisa masuk ke dalam outlet Anda lagi.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 duration-150"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 duration-150"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus Akun'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
