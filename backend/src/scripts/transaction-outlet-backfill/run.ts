#!/usr/bin/env ts-node
/**
 * CLI: backfill outletId transaksi legacy (Sprint 1 — P0.4)
 *
 * Usage:
 *   npm run transaction:backfill:audit
 *   npm run transaction:backfill
 *   npm run transaction:backfill -- --dry-run
 */
import 'dotenv/config';
import {
  applyTransactionOutletBackfill,
  auditTransactionOutletBackfill,
} from '../../domain/transaction';

function printReport(report: Awaited<ReturnType<typeof auditTransactionOutletBackfill>>) {
  console.log('\n=== Transaction Outlet Backfill Audit ===');
  console.log(`Checked at : ${report.checkedAt}`);
  console.log('Summary    :', report.stats);

  if (report.unresolved.length > 0) {
    console.log('\nUnresolved (manual review):');
    for (const row of report.unresolved) {
      console.log(`  tx=${row.transactionId} invoice=${row.invoiceNumber} tenant=${row.tenantId}`);
    }
  } else if (report.stats.totalNullOutlet === 0) {
    console.log('\nTidak ada transaksi dengan outletId null.');
  } else {
    console.log('\nSemua transaksi null dapat di-resolve otomatis.');
  }
}

async function main() {
  const command = process.argv[2] ?? 'apply';
  const dryRun = process.argv.includes('--dry-run');

  if (command === 'audit' || dryRun) {
    const report = await auditTransactionOutletBackfill();
    printReport(report);
    process.exit(report.stats.unresolved > 0 ? 1 : 0);
  }

  if (command === 'apply') {
    const before = await auditTransactionOutletBackfill();
    printReport(before);

    if (before.stats.totalNullOutlet === 0) {
      console.log('\nBackfill dilewati — tidak ada data legacy.');
      process.exit(0);
    }

    if (before.stats.unresolved > 0) {
      console.error(
        '\nBackfill dibatalkan — masih ada transaksi yang tidak bisa di-resolve otomatis.'
      );
      process.exit(1);
    }

    console.log(`\nMenjalankan backfill${dryRun ? ' (dry-run)' : ''}...`);
    const result = await applyTransactionOutletBackfill(dryRun);

    console.log('\nResult:');
    console.log(`  Transactions updated : ${result.updatedTransactions}`);
    console.log(`  Stock ledgers synced : ${result.updatedLedgers}`);

    printReport(result.report);
    process.exit(0);
  }

  console.error('Usage: npm run transaction:backfill[:audit] [--dry-run]');
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error('[transaction-outlet-backfill]', err instanceof Error ? err.message : err);
  process.exit(1);
});
