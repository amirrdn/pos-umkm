import { prisma } from '../../lib/prisma';
import {
  buildSummary,
  detectIssues,
  fetchActiveOutlets,
  repairOutletHierarchyBatch,
} from './outlet.repository';
import type {
  OutletIntegrityReport,
  OutletRepairAction,
  OutletRepairResult,
} from './outlet.types';

function buildReport(issues: ReturnType<typeof detectIssues>): OutletIntegrityReport {
  return {
    checkedAt: new Date().toISOString(),
    isHealthy: issues.length === 0,
    issues,
    summary: buildSummary(issues),
  };
}

/** Audit integritas hierarki outlet — satu query DB, analisis in-memory. */
export async function auditOutletIntegrity(): Promise<OutletIntegrityReport> {
  const outlets = await fetchActiveOutlets();
  return buildReport(detectIssues(outlets));
}

function issuesToActions(issues: ReturnType<typeof detectIssues>): OutletRepairAction[] {
  return issues.map((issue) => ({
    action:
      issue.code === 'TENANT_WITHOUT_MAIN'
        ? 'PROMOTE_TO_MAIN'
        : issue.code === 'MULTIPLE_MAIN'
          ? 'FIX_BRANCH_PARENT'
          : issue.code === 'MAIN_HAS_PARENT'
            ? 'CLEAR_MAIN_PARENT'
            : 'SET_PARENT',
    tenantId: issue.tenantId,
    outletId: issue.outletId ?? issue.tenantId,
    outletName: issue.outletName ?? '—',
    detail: issue.detail,
  }));
}

/**
 * Perbaiki hierarki outlet — batch SQL idempotent.
 * Aman dijalankan ulang; no-op jika data sudah sehat.
 */
export async function repairOutletIntegrity(): Promise<OutletRepairResult> {
  const outletsBefore = await fetchActiveOutlets();
  const issuesBefore = detectIssues(outletsBefore);

  if (issuesBefore.length === 0) {
    return {
      repairedAt: new Date().toISOString(),
      actions: [],
      reportAfter: buildReport([]),
      stats: { promoted: 0, demoted: 0, clearedMainParent: 0, linkedBranches: 0 },
    };
  }

  const actions = issuesToActions(issuesBefore);

  const stats = await prisma.$transaction(async (tx) => repairOutletHierarchyBatch(tx));

  const reportAfter = buildReport(detectIssues(await fetchActiveOutlets()));

  if (!reportAfter.isHealthy) {
    throw new Error(
      `Repair selesai tetapi masih ada ${reportAfter.issues.length} issue. Jalankan outlet:audit untuk detail.`
    );
  }

  return {
    repairedAt: new Date().toISOString(),
    actions,
    reportAfter,
    stats,
  };
}
