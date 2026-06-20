export type StaffTab = 'active' | 'pending';

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
