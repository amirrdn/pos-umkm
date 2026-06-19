import { MutationType } from '@prisma/client';
import {
  buildProductStockView,
  decrementOutletStock,
  findLowStockItems,
  findMainOutletId,
  incrementOutletStock,
  mapProductsWithComputedStock,
} from '../domain/inventory';
import { prisma } from '../lib/prisma';

export async function getStockLedger(
  tenantId: string,
  productId: string,
  outletId?: string | null
) {
  const product = await buildProductStockView(productId, tenantId, outletId);
  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  const whereClause: { tenantId: string; productId: string; outletId?: string } = {
    tenantId,
    productId,
  };
  if (outletId) {
    whereClause.outletId = outletId;
  }

  const ledger = await prisma.stockLedger.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
    take: 100,
  });

  return { product, ledger };
}

export async function createStockMutation(
  tenantId: string,
  userId: string,
  input: { productId: string; type: MutationType; quantity: number; note?: string },
  outletId?: string | null
) {
  const { productId, type, quantity, note } = input;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { requireStockApproval: true },
  });

  if (!tenant) {
    throw new Error('Tenant tidak ditemukan.');
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const isStafGudang = roles.includes('Staf Gudang');
  const isOwnerOrManager = roles.some((r) =>
    ['Owner', 'Manager', 'Admin'].includes(r)
  );

  const productMeta = await prisma.product.findFirst({
    where: { id: productId, tenantId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!productMeta) {
    throw new Error('Produk tidak ditemukan.');
  }

  if (tenant.requireStockApproval && isStafGudang && !isOwnerOrManager) {
    const request = await prisma.stockRequest.create({
      data: {
        tenantId,
        productId,
        userId,
        outletId: outletId || null,
        type,
        quantity,
        note: note ?? null,
        status: 'PENDING',
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const product = await buildProductStockView(productId, tenantId, outletId);

    return {
      isPendingApproval: true,
      request,
      product,
      stockAfter: product?.stock ?? 0,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    let targetOutletId = outletId;
    if (!targetOutletId) {
      targetOutletId = await findMainOutletId(tenantId, tx);
      if (!targetOutletId) {
        throw new Error('Tidak ada outlet aktif untuk tenant ini.');
      }
    }

    const isDeltaPositive =
      type === 'RESTOCK' || type === 'ADJUSTMENT_PLUS' || type === 'RETURN';
    const delta = isDeltaPositive ? quantity : -quantity;

    const { stockBefore, stockAfter } =
      delta >= 0
        ? await incrementOutletStock(tx, tenantId, targetOutletId, productId, delta)
        : await decrementOutletStock(tx, tenantId, targetOutletId, productId, -delta);

    const ledgerEntry = await tx.stockLedger.create({
      data: {
        tenantId,
        productId,
        userId,
        outletId: targetOutletId,
        type,
        quantity: delta,
        stockBefore,
        stockAfter,
        note: note ?? null,
      },
    });

    return { ledgerEntry, stockAfter };
  });

  const product = await buildProductStockView(productId, tenantId, outletId);

  return {
    isPendingApproval: false,
    ...result,
    product,
  };
}

export async function getInventorySummary(tenantId: string, outletId?: string | null) {
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      category: { select: { name: true } },
      outletStocks: {
        where: outletId ? { outletId } : undefined,
        select: { outletId: true, stock: true, minStock: true },
      },
      _count: { select: { stockLedgers: true } },
    },
  });

  return mapProductsWithComputedStock(products, outletId);
}

/** Daftar produk stok rendah per outlet (atau semua outlet tenant). */
export async function getLowStockItems(tenantId: string, outletId?: string | null) {
  const items = await findLowStockItems(tenantId, outletId ?? undefined);
  return { count: items.length, items };
}

export async function listStockRequests(tenantId: string, outletId?: string | null) {
  const whereClause: { tenantId: string; status: 'PENDING'; outletId?: string } = {
    tenantId,
    status: 'PENDING',
  };
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
          outletStocks: outletId ? { where: { outletId } } : undefined,
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return Promise.all(
    requests.map(async (req) => {
      const product = await buildProductStockView(
        req.productId,
        tenantId,
        outletId ?? req.outletId
      );
      return {
        ...req,
        product: product ?? { ...req.product, stock: 0 },
      };
    })
  );
}

export async function approveStockRequest(
  tenantId: string,
  requestId: string,
  approvedById: string
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.stockRequest.findFirst({
      where: { id: requestId, tenantId, status: 'PENDING' },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });

    if (!request) {
      throw new Error('Permintaan persetujuan stok tidak ditemukan atau sudah diproses.');
    }

    const { productId, type, quantity, note, outletId } = request;

    let targetOutletId = outletId;
    if (!targetOutletId) {
      targetOutletId = await findMainOutletId(tenantId, tx);
    }
    if (!targetOutletId) {
      throw new Error('Outlet tidak ditemukan untuk memproses persetujuan stok.');
    }

    const isDeltaPositive =
      type === 'RESTOCK' || type === 'ADJUSTMENT_PLUS' || type === 'RETURN';
    const delta = isDeltaPositive ? quantity : -quantity;

    const { stockBefore, stockAfter } =
      delta >= 0
        ? await incrementOutletStock(tx, tenantId, targetOutletId, productId, delta)
        : await decrementOutletStock(tx, tenantId, targetOutletId, productId, -delta);

    const ledgerEntry = await tx.stockLedger.create({
      data: {
        tenantId,
        productId,
        userId: request.userId,
        outletId: targetOutletId,
        type,
        quantity: delta,
        stockBefore,
        stockAfter,
        note: note ? `${note} (Disetujui)` : 'Disetujui',
      },
    });

    const updatedRequest = await tx.stockRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', approvedById },
    });

    return {
      request: updatedRequest,
      ledgerEntry,
      product: { ...request.product, stock: stockAfter },
      stockAfter,
    };
  });
}

export async function rejectStockRequest(
  tenantId: string,
  requestId: string,
  approvedById: string
) {
  const request = await prisma.stockRequest.findFirst({
    where: { id: requestId, tenantId, status: 'PENDING' },
    select: { id: true },
  });

  if (!request) {
    throw new Error('Permintaan persetujuan stok tidak ditemukan atau sudah diproses.');
  }

  return prisma.stockRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', approvedById },
  });
}

export async function updateTenantSettings(tenantId: string, requireStockApproval: boolean) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { requireStockApproval },
  });
}

export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { requireStockApproval: true },
  });
}
