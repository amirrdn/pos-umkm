import { PrismaClient, MutationType } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * Mengambil riwayat mutasi stok (kartu stok) untuk sebuah produk.
 */
export async function getStockLedger(tenantId: string, productId: string, outletId?: string | null) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId, deletedAt: null },
    select: { id: true, name: true, sku: true, stock: true },
  });

  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  if (outletId) {
    const outletStockRecord = await prisma.outletStock.findFirst({
      where: { tenantId, outletId, productId }
    });
    product.stock = outletStockRecord ? outletStockRecord.stock : 0;
  }

  const whereClause: any = { tenantId, productId };
  if (outletId) {
    whereClause.outletId = outletId;
  }

  const ledger = await prisma.stockLedger.findMany({
    where: whereClause,
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
  input: { productId: string; type: MutationType; quantity: number; note?: string },
  outletId?: string | null
) {
  const { productId, type, quantity, note } = input;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { requireStockApproval: true }
  });

  if (!tenant) {
    throw new Error('Tenant tidak ditemukan.');
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  const roles = user.userRoles.map(ur => ur.role.name);
  const isStafGudang = roles.includes('Staf Gudang');
  const isOwnerOrManager = roles.some(r => ['Owner', 'TENANT_ADMIN', 'Manager'].includes(r));

  if (tenant.requireStockApproval && isStafGudang && !isOwnerOrManager) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan.');
    }

    const request = await prisma.stockRequest.create({
      data: {
        tenantId,
        productId,
        userId,
        outletId: outletId || null,
        type,
        quantity,
        note: note ?? null,
        status: 'PENDING'
      },
      include: {
        product: { select: { id: true, name: true, stock: true } }
      }
    });

    return {
      isPendingApproval: true,
      request,
      product
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan.');
    }

    const isDeltaPositive = type === 'RESTOCK' || type === 'ADJUSTMENT_PLUS' || type === 'RETURN';
    const delta = isDeltaPositive ? quantity : -quantity;
    let stockBefore = product.stock;

    if (outletId) {
      const outletStockRecord = await tx.outletStock.findFirst({
        where: { tenantId, outletId, productId }
      });
      stockBefore = outletStockRecord ? outletStockRecord.stock : 0;
    }

    const stockAfter = stockBefore + delta;

    if (stockAfter < 0) {
      throw new Error(`Stok tidak mencukupi untuk penyesuaian ini. Stok saat ini: ${stockBefore}, pengurangan diminta: ${quantity}.`);
    }

    if (outletId) {
      await tx.outletStock.upsert({
        where: { outletId_productId: { outletId, productId } },
        create: { tenantId, outletId, productId, stock: stockAfter },
        update: { stock: stockAfter }
      });
    } else {
      await tx.product.update({
        where: { id: productId },
        data: { stock: stockAfter },
      });
    }

    const ledgerEntry = await tx.stockLedger.create({
      data: {
        tenantId,
        productId,
        userId,
        outletId: outletId || null,
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

  return {
    isPendingApproval: false,
    ...result
  };
}

/**
 * Mengambil ringkasan stok semua produk tenant dengan saldo stok terkini.
 * Digunakan untuk halaman Overview Inventaris.
 */
export async function getInventorySummary(tenantId: string, outletId?: string | null) {
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      category: { select: { name: true } },
      outletStocks: {
        where: outletId ? { outletId } : undefined
      },
      _count: { select: { stockLedgers: true } },
    },
  });

  if (outletId) {
    return products.map(p => {
      const os = (p as any).outletStocks?.[0];
      return {
        ...p,
        stock: os ? os.stock : 0
      };
    });
  }

  return products;
}

/**
 * Mengambil seluruh daftar StockRequest berstatus PENDING.
 */
export async function listStockRequests(tenantId: string, outletId?: string | null) {
  const whereClause: any = { tenantId, status: 'PENDING' };
  if (outletId) {
    whereClause.outletId = outletId;
  }

  const requests = await prisma.stockRequest.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          outletStocks: outletId ? { where: { outletId } } : undefined
        }
      },
      user: { select: { id: true, name: true, email: true } },
    }
  });

  if (outletId) {
    return requests.map(req => {
      const os = (req.product as any).outletStocks?.[0];
      return {
        ...req,
        product: {
          ...req.product,
          stock: os ? os.stock : 0
        }
      };
    });
  }

  return requests;
}

/**
 * Menyetujui permintaan stok, mengubah stok produk secara ACID, dan mencatat ke StockLedger.
 */
export async function approveStockRequest(tenantId: string, requestId: string, approvedById: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.stockRequest.findFirst({
      where: { id: requestId, tenantId, status: 'PENDING' },
      include: { product: true }
    });

    if (!request) {
      throw new Error('Permintaan persetujuan stok tidak ditemukan atau sudah diproses.');
    }

    const { productId, type, quantity, note, outletId } = request;
    const isDeltaPositive = type === 'RESTOCK' || type === 'ADJUSTMENT_PLUS' || type === 'RETURN';
    const delta = isDeltaPositive ? quantity : -quantity;
    let stockBefore = request.product.stock;

    if (outletId) {
      const outletStockRecord = await tx.outletStock.findFirst({
        where: { tenantId, outletId, productId }
      });
      stockBefore = outletStockRecord ? outletStockRecord.stock : 0;
    }

    const stockAfter = stockBefore + delta;

    if (stockAfter < 0) {
      throw new Error(`Stok tidak mencukupi untuk persetujuan ini. Stok saat ini: ${stockBefore}, pengurangan diminta: ${quantity}.`);
    }

    let updatedProductStock = stockAfter;

    if (outletId) {
      await tx.outletStock.upsert({
        where: { outletId_productId: { outletId, productId } },
        create: { tenantId, outletId, productId, stock: stockAfter },
        update: { stock: stockAfter }
      });
    } else {
      await tx.product.update({
        where: { id: productId },
        data: { stock: stockAfter }
      });
    }

    const ledgerEntry = await tx.stockLedger.create({
      data: {
        tenantId,
        productId,
        userId: request.userId,
        outletId: outletId || null,
        type,
        quantity: delta,
        stockBefore,
        stockAfter,
        note: note ? `${note} (Disetujui)` : `Disetujui`,
      }
    });

    const updatedRequest = await tx.stockRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedById
      }
    });

    return {
      request: updatedRequest,
      ledgerEntry,
      product: { ...request.product, stock: updatedProductStock }
    };
  });
}

/**
 * Menolak permintaan mutasi stok.
 */
export async function rejectStockRequest(tenantId: string, requestId: string, approvedById: string) {
  const request = await prisma.stockRequest.findFirst({
    where: { id: requestId, tenantId, status: 'PENDING' }
  });

  if (!request) {
    throw new Error('Permintaan persetujuan stok tidak ditemukan atau sudah diproses.');
  }

  const updatedRequest = await prisma.stockRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      approvedById
    }
  });

  return updatedRequest;
}

/**
 * Memperbarui pengaturan approval tenant.
 */
export async function updateTenantSettings(tenantId: string, requireStockApproval: boolean) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { requireStockApproval }
  });
}

/**
 * Mengambil pengaturan approval tenant.
 */
export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { requireStockApproval: true }
  });
}
