import { Shield } from 'lucide-react';
import { getRoleDisplayLabel } from '../../utils/roles';
import { getRoleBadgeClass } from '../../utils/staffManagementHelpers';
import type { StaffUser } from '../../types/staffManagement';

export interface StaffRoleBadgesProps {
  staff: StaffUser;
}

export function StaffRoleBadges({ staff }: StaffRoleBadgesProps) {
  return (
    <>
      {staff.userRoles.map((userRole) => (
        <span
          key={userRole.role.name}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(userRole.role.name)}`}
        >
          <Shield className="w-3.5 h-3.5" />
          {getRoleDisplayLabel(userRole.role.name)}
        </span>
      ))}
    </>
  );
}
