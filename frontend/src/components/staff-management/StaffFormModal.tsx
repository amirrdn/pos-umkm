import {
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Pencil,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { StaffRoleDropdown } from './StaffRoleDropdown';
import { StaffOutletSelector } from './StaffOutletSelector';
import type { UseStaffManagementReturn } from '../../hooks/useStaffManagement';

export interface StaffFormModalProps {
  staffManagement: UseStaffManagementReturn;
}

export function StaffFormModal({ staffManagement }: StaffFormModalProps) {
  const {
    isModalOpen,
    setIsModalOpen,
    editingStaff,
    newStaff,
    setNewStaff,
    submitting,
    modalError,
    rolesList,
    outletHierarchy,
    handleCreateStaff,
    handleOutletToggle,
  } = staffManagement;

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={() => !submitting && setIsModalOpen(false)}
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
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
            type="button"
            onClick={() => setIsModalOpen(false)}
            disabled={submitting}
            className="cursor-pointer text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateStaff} className="flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {modalError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{modalError}</p>
              </div>
            )}

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

            <StaffRoleDropdown
              rolesList={rolesList}
              selectedRoleId={newStaff.roleId}
              onSelectRole={(roleId) => setNewStaff({ ...newStaff, roleId })}
            />

            <StaffOutletSelector
              outletHierarchy={outletHierarchy}
              selectedOutletIds={newStaff.outletIds}
              submitting={submitting}
              onToggle={handleOutletToggle}
            />
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-850 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="cursor-pointer px-4 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/10 dark:shadow-indigo-950/30 transition-all animate-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingStaff ? (
                'Simpan Perubahan'
              ) : (
                'Daftarkan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
