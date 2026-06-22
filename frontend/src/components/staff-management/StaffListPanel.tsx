import { Plus, Users } from 'lucide-react';
import { getStaffInitials, formatStaffRegistrationDate } from '../../utils/staffManagementHelpers';
import { StaffListCard } from './StaffListCard';
import { StaffListSkeleton } from './StaffListSkeleton';
import { StaffOutletTags } from './StaffOutletTags';
import { StaffRoleBadges } from './StaffRoleBadges';
import { StaffRowActions } from './StaffRowActions';
import { StaffStatusBadge } from './StaffStatusBadge';
import type { StaffTab, StaffUser } from '../../types/staffManagement';

export interface StaffListPanelProps {
  loading: boolean;
  activeTab: StaffTab;
  displayedStaff: StaffUser[];
  isFilteredEmpty: boolean;
  currentUserId?: string;
  processingStaffId: string | null;
  selectedStaffIds?: string[];
  onOpenAddModal: () => void;
  onApprove: (staff: StaffUser) => void;
  onReject: (staff: StaffUser) => void;
  onToggleStatus: (staff: StaffUser) => void;
  onEdit: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
  onSelectStaff: (staff: StaffUser) => void;
  onToggleStaffSelection?: (staffId: string) => void;
}

function StaffEmptyState({
  activeTab,
  isFilteredEmpty,
  onOpenAddModal,
}: {
  activeTab: StaffTab;
  isFilteredEmpty: boolean;
  onOpenAddModal: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <Users className="w-16 h-16 text-slate-700 dark:text-slate-600" />
      <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          {isFilteredEmpty
            ? 'Tidak Ada Hasil Pencarian'
            : activeTab === 'active'
              ? 'Belum Ada Karyawan'
              : 'Tidak Ada Permintaan Baru'}
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-md">
          {isFilteredEmpty
            ? 'Coba kata kunci lain atau reset filter peran.'
            : activeTab === 'active'
              ? 'Daftarkan karyawan atau kasir Anda agar mereka dapat mulai melayani penjualan di toko Anda.'
              : 'Semua permintaan pendaftaran staf telah diproses.'}
        </p>
      </div>
      {activeTab === 'active' && !isFilteredEmpty && (
        <button
          type="button"
          onClick={onOpenAddModal}
          className="cursor-pointer mt-2 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 duration-200"
        >
          <Plus className="w-4 h-4" /> Tambah Sekarang
        </button>
      )}
    </div>
  );
}

export function StaffListPanel({
  loading,
  activeTab,
  displayedStaff,
  isFilteredEmpty,
  currentUserId,
  processingStaffId,
  selectedStaffIds = [],
  onOpenAddModal,
  onApprove,
  onReject,
  onToggleStatus,
  onEdit,
  onDelete,
  onSelectStaff,
  onToggleStaffSelection,
}: StaffListPanelProps) {
  const showBulkSelection = activeTab === 'pending' && Boolean(onToggleStaffSelection);
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
      {loading ? (
        <StaffListSkeleton />
      ) : displayedStaff.length === 0 ? (
        <StaffEmptyState
          activeTab={activeTab}
          isFilteredEmpty={isFilteredEmpty}
          onOpenAddModal={onOpenAddModal}
        />
      ) : (
        <>
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/40">
            {displayedStaff.map((staff) => (
              <StaffListCard
                key={staff.id}
                staff={staff}
                activeTab={activeTab}
                isSelf={staff.id === currentUserId}
                isProcessing={processingStaffId === staff.id}
                isSelected={selectedStaffIds.includes(staff.id)}
                showBulkSelection={showBulkSelection}
                onApprove={onApprove}
                onReject={onReject}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onSelectStaff={onSelectStaff}
                onToggleSelection={onToggleStaffSelection}
              />
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  {showBulkSelection && <th className="px-4 py-4 w-10" />}
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
                  const isSelf = staff.id === currentUserId;
                  const isProcessing = processingStaffId === staff.id;
                  const registrationDate = formatStaffRegistrationDate(staff.createdAt);

                  return (
                    <tr
                      key={staff.id}
                      onClick={() => onSelectStaff(staff)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors cursor-pointer"
                    >
                      {showBulkSelection && (
                        <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedStaffIds.includes(staff.id)}
                            onChange={() => onToggleStaffSelection?.(staff.id)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/30"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {getStaffInitials(staff.name)}
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {staff.name}
                            {isSelf && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-700 font-normal">
                                Saya
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-650 dark:text-slate-300">
                        <p>{staff.email}</p>
                        {activeTab === 'pending' && registrationDate && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            Daftar {registrationDate}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StaffRoleBadges staff={staff} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          <StaffOutletTags staff={staff} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StaffStatusBadge staff={staff} activeTab={activeTab} />
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <StaffRowActions
                          staff={staff}
                          activeTab={activeTab}
                          isSelf={isSelf}
                          isProcessing={isProcessing}
                          layout="table"
                          onApprove={onApprove}
                          onReject={onReject}
                          onToggleStatus={onToggleStatus}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
