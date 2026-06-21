import { prisma } from '../lib/prisma';
import { buildQrisSaleLedgerEntries } from '../domain/inventory';
import { MidtransService } from './midtransService';

export const QRIS_FAILURE_STATUSES = ['expire', 'cancel', 'deny'] as const;

export function isQrisFailureStatus(status: string): boolean {
  return (QRIS_FAILURE_STATUSES as readonly string[]).includes(status);
}

/**
 * Menyelesaikan transaksi QRIS PENDING → COMPLETED dan menulis ledger stok.
 */
export async function completeQrisSettlement(params: {
  transactionId: string;
  ledgerNote: string;
}): Promise<void> {
  const { transactionId, ledgerNote } = params;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: 'COMPLETED' },
    });

    const transactionWithItems = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (!transactionWithItems) return;

    const stockLedgerEntries = await buildQrisSaleLedgerEntries(
      tx,
      transactionWithItems,
      ledgerNote
    );

    if (stockLedgerEntries.length > 0) {
      await tx.stockLedger.createMany({ data: stockLedgerEntries });
    }
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Membatalkan transaksi QRIS PENDING → VOID.
 */
export async function voidQrisTransaction(transactionId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: 'VOID' },
    });
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Sinkronkan status PENDING dari Midtrans API (dipakai polling frontend).
 */
export async function syncPendingQrisFromMidtrans(params: {
  transactionId: string;
  invoiceNumber: string;
}): Promise<'COMPLETED' | 'VOID' | 'PENDING'> {
  const { transactionId, invoiceNumber } = params;

  try {
    const midtransStatus = await MidtransService.getTransactionStatus(invoiceNumber);

    if (midtransStatus === 'settlement') {
      await completeQrisSettlement({
        transactionId,
        ledgerNote: `Penjualan (QRIS Lunas - Polling) - Invoice ${invoiceNumber}`,
      });
      return 'COMPLETED';
    }

    if (isQrisFailureStatus(midtransStatus)) {
      await voidQrisTransaction(transactionId);
      return 'VOID';
    }

    return 'PENDING';
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(
      `[Status Polling] ⚠️ Gagal sinkronisasi status dari Midtrans untuk ${invoiceNumber}:`,
      message
    );
    return 'PENDING';
  }
}
