export type StaffTab = 'active' | 'pending';

export type StaffRoleFilter = 'all' | string;

export interface StaffOverviewMetrics {
  activeStaffCount: number;
  inactiveStaffCount: number;
  pendingApprovalCount: number;
}

export interface StaffListQuery {
  search?: string;
  roleName?: string;
  approvalStatus?: 'APPROVED' | 'PENDING';
}

export interface StaffListResult {
  staff: StaffUser[];
  summary: StaffOverviewMetrics;
}

export type StaffConfirmActionType = 'approve' | 'reject' | 'deactivate' | 'activate' | 'bulk-approve';

export interface StaffConfirmAction {
  type: StaffConfirmActionType;
  staff?: StaffUser;
  staffIds?: string[];
}

export interface OutletOption {
  id: string;
  name: string;
  code?: string | null;
  type?: 'MAIN' | 'BRANCH';
}

export interface OutletHierarchy {
  main: OutletOption | null;
  branches: OutletOption[];
}

export interface StaffRole {
  id: string;
  name: string;
  description: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  approvalStatus: string;
  createdAt?: string;
  userOutlets: {
    outlet: {
      id: string;
      name: string;
    };
  }[];
  userRoles: {
    role: {
      id: string;
      name: string;
    };
  }[];
}

export interface StaffFormState {
  name: string;
  email: string;
  password: string;
  roleId: string;
  outletIds: string[];
}

export interface StaffNotification {
  type: 'success' | 'error';
  message: string;
}

export type StaffFormStep = 1 | 2;

export interface StaffFormFieldErrors {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  outletIds?: string;
}

export interface StaffDetailStats {
  totalShifts: number;
  openShifts: number;
}

export interface StaffDetail extends StaffUser {
  updatedAt: string;
  emailVerifiedAt: string | null;
  stats: StaffDetailStats;
}

export interface StaffBulkApproveResult {
  approvedCount: number;
  skippedCount: number;
  staff: StaffUser[];
}
