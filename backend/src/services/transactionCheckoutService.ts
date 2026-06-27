import { Prisma } from '@prisma/client';
import {
  CheckoutError,
  computeCheckoutPricing,
  computeEarnedPoints,
  generateCheckoutInvoiceNumber,
  toCheckoutError,
} from '../domain/transaction';
import type { CheckoutCommand } from '../domain/transaction';
import { prisma, type PrismaTx } from '../lib/prisma';
import { MidtransService } from './midtransService';
import { SubscriptionService, TIER_LIMITS } from './subscriptionService';
import { isSubscriptionExpired } from '../lib/subscription';
import { decrementOutletStockBulk } from '../domain/inventory/stock.repository';
import { logError } from '../lib/logger';

const checkoutTransactionInclude = {
  items: {
    include: {
      product: { select: { name: true, sku: true } },
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      points: true,
    },
  },
  outlet: true,
} satisfies Prisma.TransactionInclude;

export type CheckoutTransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof checkoutTransactionInclude;
}>;

export interface CheckoutProcessResult {
  transaction: CheckoutTransactionRecord;
  qrString?: string;
}

interface PreparedCheckoutItem {
  productId: string;
  quantity: number;
  priceAtTransaction: Prisma.Decimal;
  costAtTransaction: Prisma.Decimal;
  subtotal: Prisma.Decimal;
}

/**
 * Orchestrates POS checkout: subscription guards, ACID transaction, optional QRIS finalize.
 */
export async function processCheckout(command: CheckoutCommand): Promise<CheckoutProcessResult> {
  const subscriptionAccess = {
    bypassLimits: command.bypassSubscriptionLimits,
    subscriptionSnapshot: command.tenantSubscription,
  };

  const canCreateTransaction = await SubscriptionService.checkTransactionLimit(
    command.tenantId,
    subscriptionAccess
  );
  if (!canCreateTransaction) {
    throw new CheckoutError(
      'Batas maksimal kuota transaksi bulanan untuk paket Anda telah tercapai. Silakan lakukan upgrade untuk melanjutkan penjualan.',
      'LIMIT_EXCEEDED',
      403
    );
  }



  const invoiceNumber = generateCheckoutInvoiceNumber();

  let result: CheckoutTransactionRecord;
  try {
    result = await prisma.$executeRawWithTenant(
      command.tenantId,
      (tx) => executeCheckoutTransaction(tx, command, invoiceNumber),
      { maxWait: 15000, timeout: 30000 }
    );
  } catch (error: unknown) {
    const mapped = toCheckoutError(error);
    if (mapped) {
      throw mapped;
    }
    throw error;
  }

  if (command.paymentMethod === 'QRIS') {
    return finalizeQrisCheckout(result);
  }

  return { transaction: result };
}

async function executeCheckoutTransaction(
  tx: PrismaTx,
  command: CheckoutCommand,
  invoiceNumber: string
): Promise<CheckoutTransactionRecord> {
  const {
    items,
    discountType,
    discountValue,
    applyTax,
    paymentMethod,
    customerId,
    shiftId,
    tenantId,
    userId,
    outletId,
  } = command;

  if (!outletId) {
    throw new CheckoutError(
      'Aksi ditolak: Transaksi POS wajib dikaitkan dengan Outlet aktif.',
      'OUTLET_REQUIRED',
      400
    );
  }

  const tenant = command.tenantSubscription;

  if (isSubscriptionExpired(tenant) && !command.bypassSubscriptionLimits) {
    throw new CheckoutError(
      'Masa langganan Anda telah habis. Akses menulis data diblokir. Harap lakukan pembayaran untuk melanjutkan.',
      'LIMIT_EXCEEDED',
      403
    );
  }

  if (paymentMethod === 'QRIS' && !command.bypassSubscriptionLimits) {
    const limits = TIER_LIMITS[tenant.subscriptionTier as keyof typeof TIER_LIMITS];
    if (!limits || !limits.hasQris) {
      throw new CheckoutError(
        'Metode pembayaran QRIS tidak tersedia untuk tingkat paket Anda. Silakan lakukan upgrade.',
        'TIER_INSUFFICIENT',
        400
      );
    }
  }

  const productIds = items.map((item) => item.productId);
  const products = await tx.product.findMany({
    where: {
      id: { in: productIds },
      tenantId,
      deletedAt: null,
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const priceOverrides = await tx.outletProductPrice.findMany({
    where: {
      outletId,
      productId: { in: productIds },
    },
  });
  const priceOverrideMap = new Map(priceOverrides.map((po) => [po.productId, po.price]));

  const stockLevels = await tx.outletStock.findMany({
    where: {
      outletId,
      productId: { in: productIds },
    },
  });
  const stockMap = new Map(stockLevels.map((sl) => [sl.productId, sl.stock]));

  const itemsToCreate: PreparedCheckoutItem[] = [];
  const stockLedgerEntries: Prisma.StockLedgerCreateManyInput[] = [];
  const pricingLineItems: { unitPrice: Prisma.Decimal; quantity: number }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new CheckoutError(
        `Produk dengan ID ${item.productId} tidak ditemukan di tenant Anda.`,
        'PRODUCT_NOT_FOUND',
        400
      );
    }

    const priceOverride = priceOverrideMap.get(product.id);
    const activeSellingPrice = priceOverride !== undefined ? priceOverride : product.sellingPrice;
    const sellingPrice = new Prisma.Decimal(activeSellingPrice);
    const costPrice = new Prisma.Decimal(product.purchasePrice);
    const itemSubtotal = sellingPrice.mul(item.quantity);

    itemsToCreate.push({
      productId: product.id,
      quantity: item.quantity,
      priceAtTransaction: sellingPrice,
      costAtTransaction: costPrice,
      subtotal: itemSubtotal,
    });
    pricingLineItems.push({ unitPrice: sellingPrice, quantity: item.quantity });

    const stockBefore = stockMap.get(product.id) ?? 0;
    const stockAfter = stockBefore - item.quantity;
    if (stockAfter < 0) {
      throw new CheckoutError(
        `Stok tidak mencukupi untuk ${product.name}. Tersedia: ${stockBefore}, diminta: ${item.quantity}.`,
        'STOCK_INSUFFICIENT',
        400
      );
    }
  }

  try {
    const bulkItems = itemsToCreate.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const stockChanges = await decrementOutletStockBulk(tx, tenantId, outletId, bulkItems);
    
    for (const change of stockChanges) {
      stockLedgerEntries.push({
        tenantId,
        productId: change.productId,
        userId,
        type: 'SALE',
        quantity: -change.quantity,
        stockBefore: change.stockBefore,
        stockAfter: change.stockAfter,
        outletId,
        note: paymentMethod === 'QRIS' ? 'Penjualan QRIS (Pending) - Invoice' : 'Penjualan - Invoice',
      });
    }
  } catch (err: unknown) {
    throw new CheckoutError(
      err instanceof Error ? err.message : 'Stok tidak mencukupi untuk beberapa barang.',
      'STOCK_INSUFFICIENT',
      400
    );
  }

  const { subTotal, discountAmount, taxAmount, grandTotal } = computeCheckoutPricing({
    lineItems: pricingLineItems,
    discountType,
    discountValue,
    applyTax,
  });



  if (customerId) {
    const customer = await tx.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) {
      throw new CheckoutError('Pelanggan tidak ditemukan di tenant Anda.', 'CUSTOMER_NOT_FOUND', 400);
    }

    const earnedPoints = computeEarnedPoints(grandTotal);
    const updateData: Prisma.CustomerUpdateInput = {};

    if (earnedPoints > 0) {
      updateData.points = { increment: earnedPoints };
    }


    if (Object.keys(updateData).length > 0) {
      await tx.customer.update({
        where: { id: customerId },
        data: updateData,
      });
    }
  }

  if (shiftId) {
    const openShift = await tx.shift.findFirst({
      where: {
        id: shiftId,
        tenantId,
        userId,
        outletId,
        status: 'OPEN',
      },
      select: { id: true },
    });

    if (!openShift) {
      throw new CheckoutError(
        'Shift tidak valid, sudah ditutup, atau tidak terbuka di outlet ini.',
        'SHIFT_INVALID',
        400
      );
    }
  }



  const transaction = await tx.transaction.create({
    data: {
      tenantId,
      userId,
      outletId,
      shiftId: shiftId ?? null,
      customerId: customerId || null,
      paymentMethod: paymentMethod ?? 'CASH',
      invoiceNumber,
      subTotal,
      discount: discountAmount,
      tax: taxAmount,
      grandTotal,
      status: paymentMethod === 'QRIS' ? 'PENDING' : 'COMPLETED',
      items: {
        create: itemsToCreate.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtTransaction: item.priceAtTransaction,
          costAtTransaction: item.costAtTransaction,
          subtotal: item.subtotal,
        })),
      },
    },
    include: checkoutTransactionInclude,
  });

  if (stockLedgerEntries.length > 0) {
    await tx.stockLedger.createMany({
      data: stockLedgerEntries.map((entry) => ({
        ...entry,
        transactionId: transaction.id,
        note: `${entry.note} ${invoiceNumber}`,
      })),
    });
  }

  return transaction;
}

async function finalizeQrisCheckout(
  transaction: CheckoutTransactionRecord
): Promise<CheckoutProcessResult> {
  try {
    const chargeRes = await MidtransService.createQrisCharge(
      transaction.invoiceNumber,
      Number(transaction.grandTotal)
    );

    const finalResult = await prisma.$executeRawWithTenant(
      transaction.tenantId,
      (tx) => tx.transaction.update({
        where: { id: transaction.id },
        data: { qrisUrl: chargeRes.qrisUrl },
        include: checkoutTransactionInclude,
      })
    );

    return {
      transaction: finalResult,
      qrString: chargeRes.qrString || undefined,
    };
  } catch (midtransError: unknown) {
    logError('finalizeQrisCheckout.midtrans', midtransError);

    try {
      await prisma.$executeRawWithTenant(
        transaction.tenantId,
        (tx) => tx.transaction.delete({ where: { id: transaction.id } })
      );
    } catch (cleanupError) {
      logError('finalizeQrisCheckout.cleanup', cleanupError);
    }

    const message = midtransError instanceof Error ? midtransError.message : 'Unknown error';
    throw new CheckoutError(
      `Gagal membuat pembayaran QRIS: ${message}`,
      'QRIS_CHARGE_FAILED',
      500
    );
  }
}
