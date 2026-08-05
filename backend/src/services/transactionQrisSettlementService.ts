import { prisma } from '../lib/prisma';
import { logWarn } from '../lib/logger';
import { incrementOutletStock } from '../domain/inventory/stock.repository';
import { MidtransService } from './midtransService';

/**
 * ============================================================================
 * SERVICE: QRIS PAYMENT SETTLEMENT & VOID SERVICE
 * ============================================================================
 * Handles asynchronous QRIS payment lifecycle transitions:
 * settlement (PENDING → COMPLETED), cancellation/expiry (PENDING → VOID with stock
 * reversion), and Midtrans polling for real-time payment status synchronization.
 * ============================================================================
 */

export const QRIS_FAILURE_STATUSES = ['expire', 'cancel', 'deny'] as const;

/**
 * Returns true when a Midtrans status string indicates a failed/cancelled QRIS payment.
 */
export function isQrisFailureStatus(status: string): boolean {
  return (QRIS_FAILURE_STATUSES as readonly string[]).includes(status);
}

/**
 * Settles a PENDING QRIS transaction to COMPLETED status.
 * Stock was already decremented at checkout (reservation); no additional stock mutation needed.
 *
 * @param params.transactionId Target transaction ID.
 */
export async function completeQrisSettlement(params: {
  transactionId: string;
}): Promise<void> {
  const { transactionId } = params;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: 'COMPLETED' },
    });

    const transactionWithItems = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    /**
     * Stock was already decremented at checkout (reservation).
     * No further stock deduction is needed at settlement.
     */
    if (!transactionWithItems) return;
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Voids a PENDING QRIS transaction and reverts outlet stock for each reserved item.
 * Logs a RETURN StockLedger record per item for auditability.
 *
 * @param transactionId Target transaction ID.
 */
export async function voidQrisTransaction(transactionId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: 'VOID' },
      include: { items: true },
    });

    if (transaction.outletId) {
      for (const item of transaction.items) {
        const { stockBefore, stockAfter } = await incrementOutletStock(
          tx,
          transaction.tenantId,
          transaction.outletId,
          item.productId,
          item.quantity
        );

        await tx.stockLedger.create({
          data: {
            tenantId: transaction.tenantId,
            productId: item.productId,
            userId: transaction.userId,
            transactionId: transaction.id,
            type: 'RETURN',
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            outletId: transaction.outletId,
            note: `Pengembalian stok QRIS batal/expire - Invoice ${transaction.invoiceNumber}`,
          },
        });
      }
    }
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Polls Midtrans API for current QRIS payment status and advances transaction lifecycle accordingly.
 * Used by frontend polling to detect settlement or cancellation in near-real-time.
 *
 * @param params.transactionId Internal transaction ID.
 * @param params.invoiceNumber Midtrans order ID used to query payment status.
 * @returns Resolved payment state: COMPLETED, VOID, or PENDING.
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
    logWarn(
      'qrisStatusPolling',
      `Gagal sinkronisasi status Midtrans untuk ${invoiceNumber}: ${message}`
    );
    return 'PENDING';
  }
}
