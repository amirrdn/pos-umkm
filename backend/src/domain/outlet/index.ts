export {
  auditOutletIntegrity,
  repairOutletIntegrity,
} from './outletIntegrity.service';

export type {
  OutletIntegrityIssue,
  OutletIntegrityIssueCode,
  OutletIntegrityReport,
  OutletRepairAction,
  OutletRepairResult,
  OutletRepairStats,
} from './outlet.types';

export { fetchOutletStats, findMainOutletByTenant } from './outlet.repository';
