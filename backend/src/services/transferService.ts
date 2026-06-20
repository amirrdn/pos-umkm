import { TransferStatus, MutationType } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface TransferItemInput {
  productId: string;
  quantity: number;
}

interface CreateTransferInput {
  fromOutletId: string;
  toOutletId: string;
  note?: string;
  items: TransferItemInput[];
}

/**
 * Membuat transfer stok baru.
 * Jika Tenant.requireStockApproval = false, langsung set status ke IN_TRANSIT dan kurangi stok asal.
 * Jika true, buat transfer sebagai DRAFT.
 */
export async function createTransfer(tenantId: string, userId: string, input: CreateTransferInput) {
  const { fromOutletId, toOutletId, note, items } = input;

  return await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { requireStockApproval: true }
    });

    if (!tenant) {
      throw new Error('Tenant tidak ditemukan.');
    }

    const [fromOutlet, toOutlet] = await Promise.all([
      tx.outlet.findFirst({ where: { id: fromOutletId, tenantId, deletedAt: null, isActive: true } }),
      tx.outlet.findFirst({ where: { id: toOutletId, tenantId, deletedAt: null, isActive: true } })
    ]);

    if (!fromOutlet || !toOutlet) {
      throw new Error('Outlet asal atau tujuan tidak ditemukan atau tidak aktif.');
    }

    const isFromMain = fromOutlet.type === 'MAIN';
    const isToMain = toOutlet.type === 'MAIN';

    if (isFromMain && isToMain) {
      throw new Error('Transfer tidak boleh dilakukan dari Outlet Utama ke Outlet Utama.');
    }

    const productIds = items.map(item => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new Error('Produk dalam daftar transfer tidak boleh duplikat.');
    }

    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        deletedAt: null
      }
    });

    if (products.length !== items.length) {
      throw new Error('Satu atau lebih produk tidak ditemukan atau tidak aktif.');
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    const status: TransferStatus = tenant.requireStockApproval ? 'DRAFT' : 'IN_TRANSIT';

    if (status === 'IN_TRANSIT') {
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const outletStock = await tx.outletStock.findUnique({
          where: { outletId_productId: { outletId: fromOutletId, productId: item.productId } }
        });

        const stockBefore = outletStock ? outletStock.stock : 0;
        if (stockBefore < item.quantity) {
          throw new Error(`Stok produk '${product.name}' di outlet '${fromOutlet.name}' tidak mencukupi. Tersedia: ${stockBefore}, diminta: ${item.quantity}.`);
        }

        const stockAfter = stockBefore - item.quantity;
        await tx.outletStock.upsert({
          where: { outletId_productId: { outletId: fromOutletId, productId: item.productId } },
          create: { tenantId, outletId: fromOutletId, productId: item.productId, stock: stockAfter },
          update: { stock: stockAfter }
        });

        await tx.stockLedger.create({
          data: {
            tenantId,
            productId: item.productId,
            userId,
            outletId: fromOutletId,
            type: 'TRANSFER_OUT' as MutationType,
            quantity: -item.quantity,
            stockBefore,
            stockAfter,
            note: note || `Transfer keluar ke ${toOutlet.name}`,
          }
        });
      }
    }

    const transfer = await tx.stockTransfer.create({
      data: {
        tenantId,
        fromOutletId,
        toOutletId,
        requestedById: userId,
        status,
        note: note || null,
        approvedById: status === 'IN_TRANSIT' && !tenant.requireStockApproval ? userId : null,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        fromOutlet: { select: { id: true, name: true, type: true } },
        toOutlet: { select: { id: true, name: true, type: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return transfer;
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Menyetujui transfer berstatus DRAFT.
 * Mengurangi stok dari outlet asal secara atomik, mencatat ledger TRANSFER_OUT, dan mengubah status ke IN_TRANSIT.
 */
export async function approveTransfer(tenantId: string, userId: string, transferId: string) {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        fromOutlet: true,
        toOutlet: true
      }
    });

    if (!transfer) {
      throw new Error('Transfer stok tidak ditemukan.');
    }

    if (transfer.status !== 'DRAFT') {
      throw new Error('Hanya transfer berstatus DRAFT yang dapat disetujui.');
    }

    for (const item of transfer.items) {
      const outletStock = await tx.outletStock.findUnique({
        where: { outletId_productId: { outletId: transfer.fromOutletId, productId: item.productId } }
      });

      const stockBefore = outletStock ? outletStock.stock : 0;
      if (stockBefore < item.quantity) {
        throw new Error(`Stok produk '${item.product.name}' di outlet '${transfer.fromOutlet.name}' tidak mencukupi. Tersedia: ${stockBefore}, diminta: ${item.quantity}.`);
      }

      const stockAfter = stockBefore - item.quantity;
      await tx.outletStock.upsert({
        where: { outletId_productId: { outletId: transfer.fromOutletId, productId: item.productId } },
        create: { tenantId, outletId: transfer.fromOutletId, productId: item.productId, stock: stockAfter },
        update: { stock: stockAfter }
      });

      await tx.stockLedger.create({
        data: {
          tenantId,
          productId: item.productId,
          userId,
          outletId: transfer.fromOutletId,
          type: 'TRANSFER_OUT' as MutationType,
          quantity: -item.quantity,
          stockBefore,
          stockAfter,
          note: transfer.note || `Transfer keluar ke ${transfer.toOutlet.name}`,
        }
      });
    }

    const updatedTransfer = await tx.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: 'IN_TRANSIT' as TransferStatus,
        approvedById: userId
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        fromOutlet: { select: { id: true, name: true, type: true } },
        toOutlet: { select: { id: true, name: true, type: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return updatedTransfer;
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Menyelesaikan transfer (konfirmasi penerimaan).
 * Menambah stok di outlet tujuan, mencatat ledger TRANSFER_IN, dan mengubah status ke COMPLETED.
 */
export async function completeTransfer(tenantId: string, userId: string, transferId: string) {
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
  const isOwnerOrManager = roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r));

  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        fromOutlet: true,
        toOutlet: true
      }
    });

    if (!transfer) {
      throw new Error('Transfer stok tidak ditemukan.');
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error('Hanya transfer berstatus IN_TRANSIT yang dapat diselesaikan.');
    }

    if (!isOwnerOrManager) {
      const isAssignedToTarget = await tx.userOutlet.findFirst({
        where: { userId, outletId: transfer.toOutletId }
      });
      if (!isAssignedToTarget) {
        throw new Error('Anda tidak memiliki wewenang untuk menerima transfer ini. Hanya staf outlet tujuan atau Owner/Manager yang dapat menyelesaikannya.');
      }
    }

    for (const item of transfer.items) {
      const outletStock = await tx.outletStock.findUnique({
        where: { outletId_productId: { outletId: transfer.toOutletId, productId: item.productId } }
      });

      const stockBefore = outletStock ? outletStock.stock : 0;
      const stockAfter = stockBefore + item.quantity;
      await tx.outletStock.upsert({
        where: { outletId_productId: { outletId: transfer.toOutletId, productId: item.productId } },
        create: { tenantId, outletId: transfer.toOutletId, productId: item.productId, stock: stockAfter },
        update: { stock: stockAfter }
      });

      await tx.stockLedger.create({
        data: {
          tenantId,
          productId: item.productId,
          userId,
          outletId: transfer.toOutletId,
          type: 'TRANSFER_IN' as MutationType,
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          note: transfer.note || `Transfer masuk dari ${transfer.fromOutlet.name}`,
        }
      });
    }

    const updatedTransfer = await tx.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: 'COMPLETED' as TransferStatus,
        completedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        fromOutlet: { select: { id: true, name: true, type: true } },
        toOutlet: { select: { id: true, name: true, type: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return updatedTransfer;
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Membatalkan transfer.
 * Jika status DRAFT, langsung dibatalkan (karena tidak ada mutasi stok).
 * Jika status IN_TRANSIT, kembalikan stok ke outlet asal dan catat ledger ADJUSTMENT_PLUS.
 */
export async function cancelTransfer(tenantId: string, userId: string, transferId: string) {
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
  const isOwnerOrManager = roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r));

  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        fromOutlet: true,
        toOutlet: true
      }
    });

    if (!transfer) {
      throw new Error('Transfer stok tidak ditemukan.');
    }

    if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
      throw new Error('Transfer yang sudah selesai atau dibatalkan tidak bisa diubah.');
    }

    if (transfer.status === 'IN_TRANSIT' && !isOwnerOrManager) {
      throw new Error('Hanya Owner/Manager yang dapat membatalkan pengiriman barang yang sedang dalam perjalanan.');
    }

    if (transfer.status === 'DRAFT' && !isOwnerOrManager && transfer.requestedById !== userId) {
      throw new Error('Anda tidak memiliki wewenang untuk membatalkan pengajuan transfer ini.');
    }

    if (transfer.status === 'IN_TRANSIT') {
      for (const item of transfer.items) {
        const outletStock = await tx.outletStock.findUnique({
          where: { outletId_productId: { outletId: transfer.fromOutletId, productId: item.productId } }
        });

        const stockBefore = outletStock ? outletStock.stock : 0;
        const stockAfter = stockBefore + item.quantity;
        await tx.outletStock.upsert({
          where: { outletId_productId: { outletId: transfer.fromOutletId, productId: item.productId } },
          create: { tenantId, outletId: transfer.fromOutletId, productId: item.productId, stock: stockAfter },
          update: { stock: stockAfter }
        });

        await tx.stockLedger.create({
          data: {
            tenantId,
            productId: item.productId,
            userId,
            outletId: transfer.fromOutletId,
            type: 'ADJUSTMENT_PLUS' as MutationType,
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            note: `Pengembalian stok (Batal transfer #${transfer.id.slice(0, 8)})`,
          }
        });
      }
    }

    const updatedTransfer = await tx.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: 'CANCELLED' as TransferStatus
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        fromOutlet: { select: { id: true, name: true, type: true } },
        toOutlet: { select: { id: true, name: true, type: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return updatedTransfer;
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Mengambil daftar transfer stok.
 * Bisa difilter berdasarkan outlet asal atau tujuan.
 */
export async function listTransfers(tenantId: string, filters: { fromOutletId?: string; toOutletId?: string; status?: TransferStatus }) {
  const whereClause: any = { tenantId };

  if (filters.fromOutletId) {
    whereClause.fromOutletId = filters.fromOutletId;
  }
  if (filters.toOutletId) {
    whereClause.toOutletId = filters.toOutletId;
  }
  if (filters.status) {
    whereClause.status = filters.status;
  }

  return await prisma.stockTransfer.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true }
          }
        }
      },
      fromOutlet: { select: { id: true, name: true, type: true } },
      toOutlet: { select: { id: true, name: true, type: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    }
  });
}
