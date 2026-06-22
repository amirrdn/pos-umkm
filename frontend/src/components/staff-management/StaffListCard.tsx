import { Calendar } from 'lucide-react';
import { getStaffInitials, formatStaffRegistrationDate } from '../../utils/staffManagementHelpers';
import { StaffOutletTags } from './StaffOutletTags';
import { StaffRoleBadges } from './StaffRoleBadges';
import { StaffRowActions } from './StaffRowActions';
import { StaffStatusBadge } from './StaffStatusBadge';
import type { StaffTab, StaffUser } from '../../types/staffManagement';

export interface StaffListCardProps {
  staff: StaffUser;
  activeTab: StaffTab;
  isSelf: boolean;
  isProcessing: boolean;
  isSelected?: boolean;
  showBulkSelection?: boolean;
  onApprove: (staff: StaffUser) => void;
  onReject: (staff: StaffUser) => void;
  onToggleStatus: (staff: StaffUser) => void;
  onEdit: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
  onSelectStaff: (staff: StaffUser) => void;
  onToggleSelection?: (staffId: string) => void;
}

export function StaffListCard({
  staff,
  activeTab,
  isSelf,
  isProcessing,
  isSelected = false,
  showBulkSelection = false,
  onApprove,
  onReject,
  onToggleStatus,
  onEdit,
  onDelete,
  onSelectStaff,
  onToggleSelection,
}: StaffListCardProps) {
  const registrationDate = formatStaffRegistrationDate(staff.createdAt);

  return (
    <article
      onClick={() => onSelectStaff(staff)}
      className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors flex flex-col gap-3 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {showBulkSelection && (
          <div onClick={(event) => event.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection?.(staff.id)}
              className="w-4 h-4 mt-2 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/30"
            />
          </div>
        )}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
          {getStaffInitials(staff.name)}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-0">
              <span className="truncate">{staff.name}</span>
              {isSelf && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-700 font-normal shrink-0">
                  Saya
                </span>
              )}
            </p>
            <StaffStatusBadge staff={staff} activeTab={activeTab} />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{staff.email}</p>

          {activeTab === 'pending' && registrationDate && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              Daftar {registrationDate}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StaffRoleBadges staff={staff} />
        <StaffOutletTags staff={staff} />
      </div>

      <div onClick={(event) => event.stopPropagation()}>
        <StaffRowActions
        staff={staff}
        activeTab={activeTab}
        isSelf={isSelf}
        isProcessing={isProcessing}
        layout="card"
        onApprove={onApprove}
        onReject={onReject}
        onToggleStatus={onToggleStatus}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      </div>
    </article>
  );
}
