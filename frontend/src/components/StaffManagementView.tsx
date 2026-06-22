import { UserPlus, Users } from 'lucide-react';
import { isPlatformAdmin } from '../utils/roles';
import { useStaffManagement } from '../hooks/useStaffManagement';
import { AppShellHeader } from './AppShellHeader';
import { StaffContent, StaffModals } from './staff-management';

export function StaffManagementView() {
  const staffManagement = useStaffManagement();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      <AppShellHeader
        title="Kelola Karyawan"
        subtitle={
          isPlatformAdmin(staffManagement.currentUser?.roles ?? [])
            ? 'Panel Admin Platform SaaS — kelola staf tenant'
            : 'Hak akses staf kasir & admin tenant'
        }
        icon={Users}
        accent="indigo"
        user={staffManagement.currentUser}
        onLogout={staffManagement.handleLogout}
        showOutletSwitcher={false}
        trailingActions={
          <button
            onClick={staffManagement.openAddModal}
            type="button"
            disabled={!staffManagement.canRegisterNewStaff}
            title={
              staffManagement.canRegisterNewStaff
                ? 'Tambah karyawan baru'
                : 'Kuota staf paket sudah penuh'
            }
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95 disabled:active:scale-100"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Tambah Staf</span>
          </button>
        }
      />

      <StaffContent staffManagement={staffManagement} />
      <StaffModals staffManagement={staffManagement} />
    </div>
  );
}
