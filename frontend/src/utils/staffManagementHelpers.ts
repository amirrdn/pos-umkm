import type {
  OutletHierarchy,
  StaffFormState,
  StaffRole,
  StaffTab,
  StaffUser,
} from '../types/staffManagement';

export function getStaffInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function getRoleBadgeClass(roleName: string): string {
  if (roleName === 'Admin') {
    return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
  }
  if (roleName === 'Owner') {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  if (roleName === 'Manager') {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (roleName === 'Staf Gudang') {
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  }
  return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
}

export function filterStaffByTab(staffList: StaffUser[], tab: StaffTab): StaffUser[] {
  if (tab === 'active') {
    return staffList.filter((staff) => staff.approvalStatus === 'APPROVED');
  }
  return staffList.filter((staff) => staff.approvalStatus === 'PENDING');
}

export function countStaffByApproval(staffList: StaffUser[], status: 'APPROVED' | 'PENDING'): number {
  return staffList.filter((staff) => staff.approvalStatus === status).length;
}

export function findDefaultRole(roles: StaffRole[]): StaffRole | undefined {
  return roles.find((role) => role.name === 'Kasir') ?? roles[0];
}

export function findDefaultRoleId(roles: StaffRole[]): string {
  return findDefaultRole(roles)?.id ?? '';
}

export function hasOutletHierarchy(hierarchy: OutletHierarchy): boolean {
  return Boolean(hierarchy.main) || hierarchy.branches.length > 0;
}

export function createEmptyStaffForm(defaultRoleId: string): StaffFormState {
  return {
    name: '',
    email: '',
    password: '',
    roleId: defaultRoleId,
    outletIds: [],
  };
}

export function buildStaffFormFromUser(staff: StaffUser): StaffFormState {
  return {
    name: staff.name,
    email: staff.email,
    password: '',
    roleId: staff.userRoles[0]?.role.id || '',
    outletIds: staff.userOutlets ? staff.userOutlets.map((uo) => uo.outlet.id) : [],
  };
}

export function filterRolesBySearch(roles: StaffRole[], searchTerm: string): StaffRole[] {
  const query = searchTerm.toLowerCase();
  return roles.filter(
    (role) =>
      role.name.toLowerCase().includes(query) ||
      (role.description || '').toLowerCase().includes(query)
  );
}

export function isStaffManagementAllowed(roles: string[] | undefined): boolean {
  if (!roles) return false;
  return roles.includes('Owner') || roles.includes('Admin') || roles.includes('Manager');
}
