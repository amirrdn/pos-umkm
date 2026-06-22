import { StaffOutletSelector } from './StaffOutletSelector';
import { StaffRoleDropdown } from './StaffRoleDropdown';
import { StaffRoleGuideCard } from './StaffRoleGuideCard';
import { findStaffRoleById } from '../../utils/staffManagementHelpers';
import type {
  OutletHierarchy,
  StaffFormFieldErrors,
  StaffFormState,
  StaffRole,
} from '../../types/staffManagement';

export interface StaffFormAccessStepProps {
  form: StaffFormState;
  fieldErrors: StaffFormFieldErrors;
  rolesList: StaffRole[];
  outletHierarchy: OutletHierarchy;
  submitting: boolean;
  onSelectRole: (roleId: string) => void;
  onToggleOutlet: (outletId: string) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">{message}</p>;
}

export function StaffFormAccessStep({
  form,
  fieldErrors,
  rolesList,
  outletHierarchy,
  submitting,
  onSelectRole,
  onToggleOutlet,
}: StaffFormAccessStepProps) {
  const selectedRole = findStaffRoleById(rolesList, form.roleId);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <StaffRoleDropdown
          rolesList={rolesList}
          selectedRoleId={form.roleId}
          onSelectRole={onSelectRole}
        />
        <FieldError message={fieldErrors.roleId} />
      </div>

      <StaffRoleGuideCard selectedRole={selectedRole} />

      <div className="space-y-1.5">
        <StaffOutletSelector
          outletHierarchy={outletHierarchy}
          selectedOutletIds={form.outletIds}
          submitting={submitting}
          onToggle={onToggleOutlet}
        />
        <FieldError message={fieldErrors.outletIds} />
      </div>
    </div>
  );
}
