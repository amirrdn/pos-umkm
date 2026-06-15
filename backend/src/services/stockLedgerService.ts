import { PrismaClient, MutationType } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * Mengambil riwayat mutasi stok (kartu stok) untuk sebuah produk.
 */
export async function getStockLedger(tenantId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId, deletedAt: null },
    select: { id: true, name: true, sku: true, stock: true },
  });

  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  const ledger = await prisma.stockLedger.findMany({
    where: { tenantId, productId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
    },
    take: 100,
  });

  return { product, ledger };
}

/**
 * Melakukan mutasi stok manual (restok, penyesuaian, retur).
 * Operasi SALE ditangani otomatis oleh checkout.
 */
export async function createStockMutation(
  tenantId: string,
  userId: string,
  input: { productId: string; type: MutationType; quantity: number; note?: string }
) {
  const { productId, type, quantity, note } = input;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan.');
    }

    const isDeltaPositive = type === 'RESTOCK' || type === 'ADJUSTMENT_PLUS' || type === 'RETURN';
    const delta = isDeltaPositive ? quantity : -quantity;
    const stockBefore = product.stock;
    const stockAfter = stockBefore + delta;

    if (stockAfter < 0) {
      throw new Error(`Stok tidak mencukupi untuk penyesuaian ini. Stok saat ini: ${stockBefore}, pengurangan diminta: ${quantity}.`);
    }

    await tx.product.update({
      where: { id: productId },
      data: { stock: stockAfter },
    });

    const ledgerEntry = await tx.stockLedger.create({
      data: {
        tenantId,
        productId,
        userId,
        type,
        quantity: delta,
        stockBefore,
        stockAfter,
        note: note ?? null,
      },
    });

    return {
      ledgerEntry,
      product: { ...product, stock: stockAfter },
    };
  });
}

/**
 * Mengambil ringkasan stok semua produk tenant dengan saldo stok terkini.
 * Digunakan untuk halaman Overview Inventaris.
 */
export async function getInventorySummary(tenantId: string) {
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      category: { select: { name: true } },
      _count: { select: { stockLedgers: true } },
    },
  });

  return products;
}
