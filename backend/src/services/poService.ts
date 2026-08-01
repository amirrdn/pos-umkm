import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreatePOInput } from '../schemas/po.schema';

export interface GetPOQueryOptions {
  tenantId: string;
  search?: string;
  status?: string;
  supplierId?: string;
  outletId?: string;
  page?: number;
  limit?: number;
}

export class POService {
  private generatePONumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PO-${dateStr}-${randomSuffix}`;
  }

  async getAllPO(options: GetPOQueryOptions | string) {
    let tenantId: string;
    let search: string | undefined;
    let status: string | undefined;
    let supplierId: string | undefined;
    let outletId: string | undefined;
    let page = 1;
    let limit = 10;

    if (typeof options === 'object') {
      tenantId = options.tenantId;
      search = options.search;
      status = options.status;
      supplierId = options.supplierId;
      outletId = options.outletId;
      page = options.page && options.page > 0 ? Number(options.page) : 1;
      limit = options.limit && options.limit > 0 ? Number(options.limit) : 10;
    } else {
      tenantId = options;
    }

    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId,
    };

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { poNumber: { contains: q, mode: 'insensitive' } },
        { supplier: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (status && status.trim() !== '') {
      where.status = status as any;
    }

    if (supplierId && supplierId.trim() !== '') {
      where.supplierId = supplierId;
    }

    if (outletId && outletId.trim() !== '') {
      where.outletId = outletId;
    }

    const [totalCount, orders, allTenantPOs, pendingCount, receivedCount, cancelledCount] =
      await Promise.all([
        prisma.purchaseOrder.count({ where }),
        prisma.purchaseOrder.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            supplier: true,
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            outlet: {
              select: { id: true, name: true },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.purchaseOrder.aggregate({
          where: { tenantId },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        prisma.purchaseOrder.count({ where: { tenantId, status: { in: ['DRAFT', 'ORDERED'] } } }),
        prisma.purchaseOrder.count({ where: { tenantId, status: 'RECEIVED' } }),
        prisma.purchaseOrder.count({ where: { tenantId, status: 'CANCELLED' } }),
      ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
        summary: {
          totalOrders: allTenantPOs._count.id || 0,
          pendingCount,
          receivedCount,
          cancelledCount,
          totalAmount: Number(allTenantPOs._sum.totalAmount || 0),
        },
      },
    };
  }

  async getPOById(tenantId: string, id: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        outlet: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!po) {
      throw new Error('Purchase Order tidak ditemukan.');
    }

    return po;
  }

  async createPO(tenantId: string, userId: string, data: CreatePOInput) {
    // Validasi supplier
    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, tenantId, deletedAt: null },
    });

    if (!supplier) {
      throw new Error('Supplier tidak ditemukan.');
    }

    let totalAmount = 0;
    const itemsData = data.items.map((item) => {
      const subTotal = item.quantity * item.costPrice;
      totalAmount += subTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        costPrice: item.costPrice,
        subTotal,
      };
    });

    const poNumber = this.generatePONumber();

    return prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        outletId: data.outletId || null,
        createdById: userId,
        poNumber,
        totalAmount,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        items: {
          createMany: {
            data: itemsData,
          },
        },
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  async receivePO(tenantId: string, userId: string, poId: string) {
    const po = await this.getPOById(tenantId, poId);

    if (po.status === 'RECEIVED') {
      throw new Error('Purchase Order ini sudah diterima sebelumnya.');
    }

    if (po.status === 'CANCELLED') {
      throw new Error('Purchase Order yang sudah dibatalkan tidak bisa diterima.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update PO Status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'RECEIVED',
          recievedDate: new Date(),
        },
      });

      // 2. Loop setiap item PO untuk update stok & buat mutasi
      for (const item of po.items) {
        // Update HPP/Harga Beli produk utama ke yang terbaru
        await tx.product.update({
          where: { id: item.productId },
          data: {
            purchasePrice: item.costPrice,
          },
        });

        // Hitung stok sebelum & sesudah jika pakai outletStock
        let stockBefore = 0;
        let stockAfter = item.quantity;

        if (po.outletId) {
          const outletStock = await tx.outletStock.findUnique({
            where: {
              outletId_productId: {
                outletId: po.outletId,
                productId: item.productId,
              },
            },
          });

          stockBefore = outletStock ? outletStock.stock : 0;
          stockAfter = stockBefore + item.quantity;

          await tx.outletStock.upsert({
            where: {
              outletId_productId: {
                outletId: po.outletId,
                productId: item.productId,
              },
            },
            create: {
              tenantId,
              outletId: po.outletId,
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

        // Catat di StockLedger (Mutasi RESTOCK)
        await tx.stockLedger.create({
          data: {
            tenantId,
            productId: item.productId,
            userId,
            outletId: po.outletId || null,
            purchaseOrderId: po.id,
            type: 'RESTOCK',
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            note: `Restock dari PO ${po.poNumber}`,
          },
        });
      }

      return updatedPO;
    });
  }

  async cancelPO(tenantId: string, poId: string) {
    const po = await this.getPOById(tenantId, poId);

    if (po.status === 'RECEIVED') {
      throw new Error('PO yang sudah diterima tidak bisa dibatalkan.');
    }

    return prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'CANCELLED' },
    });
  }
}
