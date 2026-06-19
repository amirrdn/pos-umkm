export type OutletIntegrityIssueCode =
  | 'TENANT_WITHOUT_MAIN'
  | 'ORPHAN_BRANCH'
  | 'MAIN_HAS_PARENT'
  | 'BRANCH_WRONG_PARENT'
  | 'MULTIPLE_MAIN';

export interface OutletIntegrityIssue {
  code: OutletIntegrityIssueCode;
  tenantId: string;
  outletId?: string;
  outletName?: string;
  detail: string;
}

export interface OutletIntegrityReport {
  checkedAt: string;
  isHealthy: boolean;
  issues: OutletIntegrityIssue[];
  summary: Record<OutletIntegrityIssueCode, number>;
}

export interface OutletRepairAction {
  action: 'PROMOTE_TO_MAIN' | 'SET_PARENT' | 'CLEAR_MAIN_PARENT' | 'FIX_BRANCH_PARENT';
  tenantId: string;
  outletId: string;
  outletName: string;
  detail: string;
}

export interface OutletRepairStats {
  promoted: number;
  demoted: number;
  clearedMainParent: number;
  linkedBranches: number;
}

export interface OutletRepairResult {
  repairedAt: string;
  actions: OutletRepairAction[];
  reportAfter: OutletIntegrityReport;
  stats: OutletRepairStats;
}
