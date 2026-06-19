import type { PrismaTx } from '../../lib/prisma';
import { incrementOutletStock, snapshotStockAfterSale } from './stock.repository';

interface TransactionItemRow {
  productId: string;
  quantity: number;
}

interface TransactionStockContext {
  id: string;
  tenantId: string;
  userId: string;
  outletId: string | null;
  items: TransactionItemRow[];
}

/** Buat entri StockLedger SALE untuk transaksi QRIS yang sudah lunas. */
export async function buildQrisSaleLedgerEntries(
  tx: PrismaTx,
  transaction: TransactionStockContext,
  note: string
): Promise<
  Array<{
    tenantId: string;
    productId: string;
    userId: string;
    transactionId: string;
    type: 'SALE';
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    outletId: string | null;
    note: string;
  }>
> {
  if (!transaction.outletId) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        event: 'transaction_missing_outlet_id',
        transactionId: transaction.id,
        message: 'Ledger SALE dilewati — transaksi legacy tanpa outletId.',
      })
    );
    return [];
  }

  const entries = [];

  for (const item of transaction.items) {
    const { stockBefore, stockAfter } = await snapshotStockAfterSale(
      tx,
      transaction.outletId,
      item.productId,
      item.quantity
    );

    entries.push({
      tenantId: transaction.tenantId,
      productId: item.productId,
      userId: transaction.userId,
      transactionId: transaction.id,
      type: 'SALE' as const,
      quantity: -item.quantity,
      stockBefore,
      stockAfter,
      outletId: transaction.outletId,
      note,
    });
  }

  return entries;
}

/** Kembalikan stok outlet saat transaksi QRIS dibatalkan / expired. */
export async function restoreStockForVoidedTransaction(
  tx: PrismaTx,
  transaction: TransactionStockContext
): Promise<void> {
  if (!transaction.outletId) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        event: 'transaction_missing_outlet_id',
        transactionId: transaction.id,
        message: 'Restore stok dilewati — transaksi legacy tanpa outletId.',
      })
    );
    return;
  }

  for (const item of transaction.items) {
    await incrementOutletStock(
      tx,
      transaction.tenantId,
      transaction.outletId,
      item.productId,
      item.quantity
    );
  }
}
