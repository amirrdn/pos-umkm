import { useState } from 'react';
import { Plus, Users, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
      <Users className="w-16 h-16 text-slate-400 dark:text-slate-600" />
      <div>
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
          {isFilteredEmpty
            ? 'Tidak Ada Hasil Pencarian'
            : activeTab === 'active'
              ? 'Belum Ada Karyawan'
              : 'Tidak Ada Permintaan Baru'}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md">
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
          className="cursor-pointer mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 duration-200"
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filterKey = `${displayedStaff.length}-${activeTab}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);

  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalItems = displayedStaff.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedStaff = displayedStaff.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs hover:shadow-md dark:shadow-none flex flex-col overflow-hidden backdrop-blur-md transition-all">
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
            {paginatedStaff.map((staff) => (
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
                <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700">
                  {showBulkSelection && <th className="px-4 py-4 w-10" />}
                  <th className="px-6 py-4">Karyawan</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Outlet</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-350">
                {paginatedStaff.map((staff) => {
                  const isSelf = staff.id === currentUserId;
                  const isProcessing = processingStaffId === staff.id;
                  const registrationDate = formatStaffRegistrationDate(staff.createdAt);

                  return (
                    <tr
                      key={staff.id}
                      onClick={() => onSelectStaff(staff)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800"
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
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                            {getStaffInitials(staff.name)}
                          </div>
                          <p className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {staff.name}
                            {isSelf && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-700 font-bold">
                                Saya
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        <p>{staff.email}</p>
                        {activeTab === 'pending' && registrationDate && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
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

          <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                Menampilkan <strong className="text-slate-900 dark:text-slate-100">{totalItems > 0 ? startIndex + 1 : 0}</strong> -{' '}
                <strong className="text-slate-900 dark:text-slate-100">{endIndex}</strong> dari{' '}
                <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> Karyawan
              </span>

              <div className="relative inline-block">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-1 pl-2.5 pr-7 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={10}>10 / hal</option>
                  <option value={25}>25 / hal</option>
                  <option value={50}>50 / hal</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${pageNum === currentPage
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
