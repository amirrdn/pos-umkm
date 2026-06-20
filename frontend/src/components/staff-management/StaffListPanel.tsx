import {
  Check,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Power,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { getRoleDisplayLabel } from '../../utils/roles';
import { getRoleBadgeClass, getStaffInitials } from '../../utils/staffManagementHelpers';
import type { StaffTab, StaffUser } from '../../types/staffManagement';

export interface StaffListPanelProps {
  loading: boolean;
  activeTab: StaffTab;
  displayedStaff: StaffUser[];
  currentUserId?: string;
  onOpenAddModal: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onEdit: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
}

export function StaffListPanel({
  loading,
  activeTab,
  displayedStaff,
  currentUserId,
  onOpenAddModal,
  onApprove,
  onReject,
  onToggleStatus,
  onEdit,
  onDelete,
}: StaffListPanelProps) {
  return (
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
              type="button"
              onClick={onOpenAddModal}
              className="cursor-pointer mt-2 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 duration-200"
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
                const initials = getStaffInitials(staff.name);
                const isSelf = staff.id === currentUserId;

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
                          <p className="text-xs text-slate-400 dark:text-slate-550">
                            ID: {staff.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-650 dark:text-slate-300">{staff.email}</td>
                    <td className="px-6 py-4">
                      {staff.userRoles.map((ur) => (
                        <span
                          key={ur.role.name}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(ur.role.name)}`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {getRoleDisplayLabel(ur.role.name)}
                        </span>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {staff.userRoles.some((ur) => ur.role.name === 'Admin') ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-semibold border border-violet-500/20 rounded-md">
                            <Shield className="w-2.5 h-2.5" />
                            Lintas Tenant
                          </span>
                        ) : staff.userOutlets && staff.userOutlets.length > 0 ? (
                          staff.userOutlets.map((uo) => (
                            <span
                              key={uo.outlet.id}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700/50 rounded-md"
                            >
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              {uo.outlet.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                            Global / Semua Outlet
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          activeTab === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : staff.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activeTab === 'pending'
                              ? 'bg-amber-400'
                              : staff.isActive
                                ? 'bg-emerald-500'
                                : 'bg-slate-500'
                          }`}
                        />
                        {activeTab === 'pending'
                          ? 'Menunggu Approval'
                          : staff.isActive
                            ? 'Aktif'
                            : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activeTab === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onApprove(staff.id)}
                            className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                            title="Setujui Pendaftaran"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(staff.id)}
                            className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                            title="Tolak Pendaftaran"
                          >
                            <X className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleStatus(staff.id, staff.isActive)}
                            disabled={isSelf}
                            className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-650'
                                : staff.isActive
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95'
                            }`}
                            title={staff.isActive ? 'Nonaktifkan Karyawan' : 'Aktifkan Karyawan'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(staff)}
                            disabled={isSelf}
                            className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-650'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Edit Karyawan"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(staff)}
                            disabled={isSelf}
                            className={`cursor-pointer p-2 rounded-lg border transition-all duration-200 ${
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
  );
}
