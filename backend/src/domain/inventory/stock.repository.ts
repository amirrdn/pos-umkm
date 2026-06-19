import { OutletType, Prisma } from '@prisma/client';
import { prisma, type PrismaTx } from '../../lib/prisma';
import type { LowStockItem, ProductStockView, SeedOutletStockInput, StockLevelChange } from './stock.types';

type OutletStockRow = { outletId: string; stock: number; minStock?: number };

/** Hitung stok dari baris OutletStock yang sudah di-include. */
export function resolveStockFromRows(
  outletStocks: OutletStockRow[],
  outletId?: string | null
): number {
  if (outletId) {
    return outletStocks.find((os) => os.outletId === outletId)?.stock ?? 0;
  }
  return outletStocks.reduce((sum, os) => sum + os.stock, 0);
}

/** Ambil ID outlet MAIN tenant; null jika tidak ada. */
export async function findMainOutletId(
  tenantId: string,
  tx: PrismaTx = prisma
): Promise<string | null> {
  const main = await tx.outlet.findFirst({
    where: { tenantId, type: OutletType.MAIN, deletedAt: null },
    select: { id: true },
  });
  return main?.id ?? null;
}

/** Level stok produk di outlet tertentu. */
export async function getOutletStockLevel(
  outletId: string,
  productId: string,
  tx: PrismaTx = prisma
): Promise<number> {
  const row = await tx.outletStock.findUnique({
    where: { outletId_productId: { outletId, productId } },
    select: { stock: true },
  });
  return row?.stock ?? 0;
}

/** Total stok produk di semua outlet tenant (agregat). */
export async function getTotalStockLevel(
  tenantId: string,
  productId: string,
  tx: PrismaTx = prisma
): Promise<number> {
  const agg = await tx.outletStock.aggregate({
    where: { tenantId, productId },
    _sum: { stock: true },
  });
  return agg._sum.stock ?? 0;
}

/**
 * Stok awal produk baru: MAIN = mainStock, semua BRANCH = 0.
 * Idempotent via upsert / skipDuplicates.
 */
export async function seedOutletStocksForNewProduct(
  tx: PrismaTx,
  input: SeedOutletStockInput
): Promise<void> {
  const { tenantId, productId, mainStock } = input;

  const outlets = await tx.outlet.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, type: true },
  });

  if (outlets.length === 0) return;

  const mainOutlet =
    outlets.find((o) => o.type === OutletType.MAIN) ?? outlets[0];

  const rows = outlets.map((outlet) => ({
    tenantId,
    outletId: outlet.id,
    productId,
    stock: outlet.id === mainOutlet.id ? mainStock : 0,
  }));

  for (const row of rows) {
    await tx.outletStock.upsert({
      where: {
        outletId_productId: { outletId: row.outletId, productId: row.productId },
      },
      create: row,
      update: { stock: row.stock },
    });
  }
}

/** Kurangi stok outlet; return level sebelum & sesudah. */
export async function decrementOutletStock(
  tx: PrismaTx,
  tenantId: string,
  outletId: string,
  productId: string,
  quantity: number
): Promise<StockLevelChange> {
  const stockBefore = await getOutletStockLevel(outletId, productId, tx);
  const stockAfter = stockBefore - quantity;

  if (stockAfter < 0) {
    throw new Error(
      `Stok tidak mencukupi. Tersedia: ${stockBefore}, diminta: ${quantity}.`
    );
  }

  await tx.outletStock.upsert({
    where: { outletId_productId: { outletId, productId } },
    create: { tenantId, outletId, productId, stock: stockAfter },
    update: { stock: stockAfter },
  });

  return { stockBefore, stockAfter };
}

/** Kembalikan stok ke outlet (void / batal QRIS). */
export async function incrementOutletStock(
  tx: PrismaTx,
  tenantId: string,
  outletId: string,
  productId: string,
  quantity: number
): Promise<StockLevelChange> {
  const stockBefore = await getOutletStockLevel(outletId, productId, tx);
  const stockAfter = stockBefore + quantity;

  await tx.outletStock.upsert({
    where: { outletId_productId: { outletId, productId } },
    create: { tenantId, outletId, productId, stock: stockAfter },
    update: { stock: stockAfter },
  });

  return { stockBefore, stockAfter };
}

/** Snapshot stok untuk ledger QRIS settlement (stok sudah dikurangi saat checkout). */
export async function snapshotStockAfterSale(
  tx: PrismaTx,
  outletId: string,
  productId: string,
  quantitySold: number
): Promise<StockLevelChange> {
  const stockAfter = await getOutletStockLevel(outletId, productId, tx);
  return {
    stockAfter,
    stockBefore: stockAfter + quantitySold,
  };
}

/** Ringkas info produk + stok computed untuk response API. */
export async function buildProductStockView(
  productId: string,
  tenantId: string,
  outletId?: string | null,
  tx: PrismaTx = prisma
): Promise<ProductStockView | null> {
  const product = await tx.product.findFirst({
    where: { id: productId, tenantId, deletedAt: null },
    select: { id: true, name: true, sku: true },
  });

  if (!product) return null;

  const stock = outletId
    ? await getOutletStockLevel(outletId, productId, tx)
    : await getTotalStockLevel(tenantId, productId, tx);

  return { ...product, stock };
}

/**
 * Produk dengan stok di bawah minStock — satu query indexed (tenantId + optional outletId).
 * Hanya baris minStock > 0; urut defisit terbesar dulu.
 */
export async function findLowStockItems(
  tenantId: string,
  outletId?: string | null
): Promise<LowStockItem[]> {
  const outletFilter = outletId
    ? Prisma.sql`AND os."outletId" = ${outletId}`
    : Prisma.empty;

  return prisma.$queryRaw<LowStockItem[]>`
    SELECT
      os."productId" AS "productId",
      p.name AS "productName",
      p.sku AS sku,
      os."outletId" AS "outletId",
      o.name AS "outletName",
      os.stock AS stock,
      os."minStock" AS "minStock"
    FROM outlet_stocks os
    INNER JOIN products p ON p.id = os."productId" AND p."deletedAt" IS NULL
    INNER JOIN outlets o ON o.id = os."outletId" AND o."deletedAt" IS NULL
    WHERE os."tenantId" = ${tenantId}
      AND os."minStock" > 0
      AND os.stock < os."minStock"
      ${outletFilter}
    ORDER BY (os."minStock" - os.stock) DESC, p.name ASC
  `;
}
