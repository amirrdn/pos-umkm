import { Calendar, Clock, Loader2, Mail, ShieldCheck, User, X } from 'lucide-react';
import { getStaffInitials, formatStaffRegistrationDate } from '../../utils/staffManagementHelpers';
import { StaffOutletTags } from './StaffOutletTags';
import { StaffRoleBadges } from './StaffRoleBadges';
import { StaffStatusBadge } from './StaffStatusBadge';
import type { StaffDetail, StaffTab, StaffUser } from '../../types/staffManagement';

export interface StaffDetailDrawerProps {
  staff: StaffUser | null;
  detail: StaffDetail | null;
  loading: boolean;
  activeTab: StaffTab;
  isSelf: boolean;
  onClose: () => void;
  onEdit: (staff: StaffUser) => void;
}

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StaffDetailDrawer({
  staff,
  detail,
  loading,
  activeTab,
  isSelf,
  onClose,
  onEdit,
}: StaffDetailDrawerProps) {
  if (!staff) {
    return null;
  }

  const displayStaff = detail ?? staff;
  const registrationDate = formatStaffRegistrationDate(displayStaff.createdAt);
  const updatedAt = formatDateTime(detail?.updatedAt);
  const emailVerifiedAt = formatDateTime(detail?.emailVerifiedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {getStaffInitials(displayStaff.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate">
                {displayStaff.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayStaff.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 text-xs">Memuat detail karyawan...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <StaffStatusBadge staff={displayStaff} activeTab={activeTab} />
                {isSelf && (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                    Akun Anda
                  </span>
                )}
              </div>

              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Informasi Akun
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-sm">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Email</p>
                      <p className="text-slate-800 dark:text-slate-200">{displayStaff.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm">
                    <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Verifikasi Email</p>
                      <p className="text-slate-800 dark:text-slate-200">
                        {emailVerifiedAt ? `Terverifikasi (${emailVerifiedAt})` : 'Belum diverifikasi'}
                      </p>
                    </div>
                  </div>
                  {registrationDate && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Terdaftar</p>
                        <p className="text-slate-800 dark:text-slate-200">{registrationDate}</p>
                      </div>
                    </div>
                  )}
                  {updatedAt && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Terakhir Diperbarui</p>
                        <p className="text-slate-800 dark:text-slate-200">{updatedAt}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Peran & Outlet
                </h4>
                <div className="space-y-2">
                  <StaffRoleBadges staff={displayStaff} />
                  <StaffOutletTags staff={displayStaff} />
                </div>
              </section>

              {detail?.stats && (
                <section className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Aktivitas Shift
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Shift</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {detail.stats.totalShifts}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Shift Aktif</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {detail.stats.openShifts}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {!loading && activeTab === 'active' && !isSelf && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={() => onEdit(displayStaff)}
              className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
            >
              <User className="w-4 h-4" />
              Edit Karyawan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
