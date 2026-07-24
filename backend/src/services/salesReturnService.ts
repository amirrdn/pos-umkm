import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateSalesReturnInput } from '../schemas/salesReturnSchema';

/**
 * Service to handle Sales Returns (Refunds) & Stock Restorations.
 */
export class SalesReturnService {
  private generateReturnNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `RET-${dateStr}-${randomSuffix}`;
  }

  /**
   * Retrieves all sales returns for a tenant with batch relations.
   */
  async getAllSalesReturns(tenantId: string) {
    return prisma.salesReturn.findMany({
      where: { tenantId },
      include: {
        transaction: {
          select: { invoiceNumber: true, grandTotal: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        outlet: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves details of a specific sales return.
   */
  async getSalesReturnById(tenantId: string, id: string) {
    const record = await prisma.salesReturn.findFirst({
      where: { id, tenantId },
      include: {
        transaction: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        outlet: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!record) {
      throw new Error('Data pengembalian barang tidak ditemukan.');
    }

    return record;
  }

  /**
   * Processes a new sales return transaction:
   * 1. Validates original transaction & returnable quantity.
   * 2. Creates SalesReturn & SalesReturnItem records.
   * 3. Restores inventory quantity in OutletStock.
   * 4. Logs RETURN mutation in StockLedger.
   */
  async createSalesReturn(tenantId: string, userId: string, data: CreateSalesReturnInput) {
    /** Single batch query fetching transaction, items, and previous returns to prevent N+1 queries */
    const transaction = await prisma.transaction.findFirst({
      where: { id: data.transactionId, tenantId },
      include: {
        items: true,
        salesReturns: {
          include: { items: true },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaksi asal tidak ditemukan.');
    }

    if (transaction.status === 'VOID') {
      throw new Error('Transaksi yang sudah VOID tidak dapat diretur.');
    }

    /** Map of product ID to purchased quantity */
    const purchasedQtyMap = new Map<string, number>();
    for (const item of transaction.items) {
      purchasedQtyMap.set(item.productId, item.quantity);
    }

    /** Map of product ID to previously returned quantity */
    const returnedQtyMap = new Map<string, number>();
    for (const ret of transaction.salesReturns) {
      for (const retItem of ret.items) {
        const prev = returnedQtyMap.get(retItem.productId) ?? 0;
        returnedQtyMap.set(retItem.productId, prev + retItem.quantity);
      }
    }

    let totalRefundAmount = new Prisma.Decimal(0);
    const returnItemsData: { productId: string; quantity: number; refundPrice: Prisma.Decimal; subtotal: Prisma.Decimal }[] = [];

    for (const reqItem of data.items) {
      const purchasedQty = purchasedQtyMap.get(reqItem.productId);
      if (purchasedQty === undefined) {
        throw new Error(`Produk dengan ID ${reqItem.productId} tidak ada dalam transaksi ini.`);
      }

      const alreadyReturned = returnedQtyMap.get(reqItem.productId) ?? 0;
      const maxReturnable = purchasedQty - alreadyReturned;

      if (reqItem.quantity > maxReturnable) {
        throw new Error(`Kuantitas retur (${reqItem.quantity}) melebihi sisa barang yang dapat dikembalikan (${maxReturnable}).`);
      }

      const refundPrice = new Prisma.Decimal(reqItem.refundPrice);
      const subtotal = refundPrice.mul(reqItem.quantity);
      totalRefundAmount = totalRefundAmount.add(subtotal);

      returnItemsData.push({
        productId: reqItem.productId,
        quantity: reqItem.quantity,
        refundPrice,
        subtotal,
      });
    }

    const returnNumber = this.generateReturnNumber();
    const outletId = transaction.outletId;

    return prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.create({
        data: {
          tenantId,
          transactionId: transaction.id,
          userId,
          outletId,
          returnNumber,
          reason: data.reason,
          totalRefundAmount,
          items: {
            create: returnItemsData,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      /** Batch update outlet stocks & log stock ledger entries */
      for (const item of returnItemsData) {
        let stockBefore = 0;
        let stockAfter = item.quantity;

        if (outletId) {
          const outletStock = await tx.outletStock.findUnique({
            where: {
              outletId_productId: {
                outletId,
                productId: item.productId,
              },
            },
          });

          stockBefore = outletStock ? outletStock.stock : 0;
          stockAfter = stockBefore + item.quantity;

          await tx.outletStock.upsert({
            where: {
              outletId_productId: {
                outletId,
                productId: item.productId,
              },
            },
            create: {
              tenantId,
              outletId,
              productId: item.productId,
              stock: item.quantity,
            },
            update: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        await tx.stockLedger.create({
          data: {
            tenantId,
            productId: item.productId,
            userId,
            outletId,
            transactionId: transaction.id,
            type: 'RETURN',
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            note: `Retur barang (${data.reason}) - ${returnNumber}`,
          },
        });
      }

      return salesReturn;
    });
  }
}
