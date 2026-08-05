import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreatePOInput } from '../schemas/po.schema';

/**
 * ============================================================================
 * SERVICE: PURCHASE ORDER (PO) MANAGEMENT SERVICE
 * ============================================================================
 * Handles supplier procurement workflows: PO creation, listing & filtering with
 * status metrics, receiving stock mutations (RESTOCK ledger logs & OutletStock update),
 * and PO cancellation.
 * ============================================================================
 */

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
  /**
   * Generates a unique Purchase Order number string (PO-YYYYMMDD-XXXX).
   */
  private generatePONumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PO-${dateStr}-${randomSuffix}`;
  }

  /**
   * Fetches paginated Purchase Orders matching search, status, supplier, or outlet filters.
   *
   * @param options Query options object or tenantId string.
   * @returns Orders list with pagination and summary metrics.
   */
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

  /**
   * Fetches single Purchase Order by ID scoped to tenant.
   *
   * @param tenantId Tenant ID scope.
   * @param id Purchase Order ID.
   * @returns Purchase Order detail with relations.
   */
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

  /**
   * Creates a new Purchase Order in ORDERED / DRAFT status.
   *
   * @param tenantId Tenant ID context.
   * @param userId Creator User ID.
   * @param data Validated PO input payload.
   * @returns Newly created Purchase Order.
   */
  async createPO(tenantId: string, userId: string, data: CreatePOInput) {
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

  /**
   * Processes stock reception for a Purchase Order (Status: RECEIVED).
   * Updates product cost prices, increments OutletStock balances, and logs RESTOCK StockLedger records.
   *
   * @param tenantId Tenant ID context.
   * @param userId Receiving User ID.
   * @param poId Target Purchase Order ID.
   * @returns Updated Purchase Order entity.
   */
  async receivePO(tenantId: string, userId: string, poId: string) {
    const po = await this.getPOById(tenantId, poId);

    if (po.status === 'RECEIVED') {
      throw new Error('Purchase Order ini sudah diterima sebelumnya.');
    }

    if (po.status === 'CANCELLED') {
      throw new Error('Purchase Order yang sudah dibatalkan tidak bisa diterima.');
    }

    return prisma.$transaction(async (tx) => {
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'RECEIVED',
          recievedDate: new Date(),
        },
      });

      for (const item of po.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            purchasePrice: item.costPrice,
          },
        });

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

  /**
   * Cancels a pending Purchase Order.
   *
   * @param tenantId Tenant ID scope.
   * @param poId Purchase Order ID to cancel.
   * @returns Updated Purchase Order entity.
   */
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
