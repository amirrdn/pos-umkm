import { Shield } from 'lucide-react';
import { buildStaffRoleGuide } from '../../utils/staffManagementHelpers';
import type { StaffRole } from '../../types/staffManagement';

export interface StaffRoleGuideCardProps {
  selectedRole: StaffRole | undefined;
}

export function StaffRoleGuideCard({ selectedRole }: StaffRoleGuideCardProps) {
  const roleGuide = buildStaffRoleGuide(selectedRole);

  if (!roleGuide) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-400 dark:text-slate-500">
        Pilih peran untuk melihat penjelasan hak akses.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200/70 dark:border-indigo-800/50 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{roleGuide.title}</p>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{roleGuide.description}</p>
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        Akses: {roleGuide.accessSummary}
      </p>
    </div>
  );
}
