import type { StaffTab, StaffUser } from '../../types/staffManagement';

export interface StaffStatusBadgeProps {
  staff: StaffUser;
  activeTab: StaffTab;
}

export function StaffStatusBadge({ staff, activeTab }: StaffStatusBadgeProps) {
  const isPendingTab = activeTab === 'pending';
  const isActiveStaff = staff.isActive;

  const badgeClassName = isPendingTab
    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    : isActiveStaff
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-slate-800 text-slate-500 border border-slate-700/50';

  const dotClassName = isPendingTab
    ? 'bg-amber-400'
    : isActiveStaff
      ? 'bg-emerald-500'
      : 'bg-slate-500';

  const label = isPendingTab ? 'Menunggu Approval' : isActiveStaff ? 'Aktif' : 'Nonaktif';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClassName}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClassName}`} />
      {label}
    </span>
  );
}
