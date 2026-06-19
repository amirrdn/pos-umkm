#!/usr/bin/env ts-node
/**
 * CLI: audit & repair integritas hierarki outlet (Sprint 1 — P0.1)
 *
 * Usage:
 *   npm run outlet:audit
 *   npm run outlet:repair
 */
import 'dotenv/config';
import { auditOutletIntegrity, repairOutletIntegrity } from '../../domain/outlet';

const command = process.argv[2];

function printReport(report: Awaited<ReturnType<typeof auditOutletIntegrity>>) {
  console.log('\n=== Outlet Integrity Audit ===');
  console.log(`Checked at : ${report.checkedAt}`);
  console.log(`Healthy    : ${report.isHealthy ? 'YES ✓' : 'NO ✗'}`);
  console.log('Summary    :', report.summary);

  if (report.issues.length > 0) {
    console.log('\nIssues:');
    for (const issue of report.issues) {
      console.log(`  [${issue.code}] tenant=${issue.tenantId}`, issue.outletName ?? '', '—', issue.detail);
    }
  } else {
    console.log('\nTidak ada issue. Hierarki MAIN/BRANCH valid.');
  }
}

async function main() {
  if (command === 'audit') {
    const report = await auditOutletIntegrity();
    printReport(report);
    process.exit(report.isHealthy ? 0 : 1);
  }

  if (command === 'repair') {
    const before = await auditOutletIntegrity();
    printReport(before);

    if (before.isHealthy) {
      console.log('\nRepair dilewati — data sudah sehat.');
      process.exit(0);
    }

    console.log('\nMenjalankan repair batch...');
    const result = await repairOutletIntegrity();

    console.log('\nRepair stats:', result.stats);
    if (result.actions.length > 0) {
      console.log(`\n${result.actions.length} issue ditangani.`);
    }

    printReport(result.reportAfter);
    process.exit(0);
  }

  console.error('Usage: npm run outlet:audit | npm run outlet:repair');
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error('[outlet-integrity]', err instanceof Error ? err.message : err);
  process.exit(1);
});
