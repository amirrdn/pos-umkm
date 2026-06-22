import { MapPin, Shield } from 'lucide-react';
import { PLATFORM_ADMIN_ROLE } from '../../utils/roles';
import type { StaffUser } from '../../types/staffManagement';

export interface StaffOutletTagsProps {
  staff: StaffUser;
}

export function StaffOutletTags({ staff }: StaffOutletTagsProps) {
  const tagClassName =
    'inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-md border';

  if (staff.userRoles.some((userRole) => userRole.role.name === PLATFORM_ADMIN_ROLE)) {
    return (
      <span className={`${tagClassName} bg-violet-500/10 text-violet-400 border-violet-500/20`}>
        <Shield className="w-2.5 h-2.5" />
        Admin Platform
      </span>
    );
  }

  if (staff.userOutlets.length > 0) {
    return (
      <>
        {staff.userOutlets.map((userOutlet) => (
          <span
            key={userOutlet.outlet.id}
            className={`${tagClassName} bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border-slate-200 dark:border-slate-700/50`}
          >
            <MapPin className="w-2.5 h-2.5 text-slate-400" />
            {userOutlet.outlet.name}
          </span>
        ))}
      </>
    );
  }

  return (
    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Semua cabang</span>
  );
}
