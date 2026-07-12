import { prisma } from '../lib/prisma';
import { CategoryService } from './categoryService';
import {
  mapProductsWithComputedStock,
  seedOutletStocksForNewProduct,
} from '../domain/inventory';
import { cacheGetOrSet } from '../lib/cache';
import {
  posCatalogCacheKey,
  CACHE_TTL,
  invalidatePosCatalogForTenant,
  invalidatePosCatalogForOutlet,
} from '../lib/cacheKeys';

interface CreateProductInput {
  categoryId: string;
  name: string;
  sku?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  images?: { url: string; isMain?: boolean }[];
}

interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  sku?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  images?: { url: string; isMain?: boolean }[];
}

const PRODUCT_LIST_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: { select: { id: true, url: true, isMain: true } },
  outletStocks: {
    select: {
      stock: true,
      minStock: true,
      outletId: true,
      outlet: { select: { name: true, type: true } },
    },
  },
  outletPrices: {
    select: { price: true, outletId: true },
  },
} as const;

/**
 * Service Layer untuk Pengelolaan Produk.
 * Stok selalu computed dari OutletStock — tidak ada kolom Product.stock.
 */
export class ProductService {
  /** Katalog POS — select minimal per outlet, tanpa nested outlet / semua cabang. */
  async getPosCatalogProducts(tenantId: string, outletId: string) {
    const key = posCatalogCacheKey(tenantId, outletId);
    return cacheGetOrSet(key, CACHE_TTL.POS_CATALOG, () =>
      this.fetchPosCatalogFromDb(tenantId, outletId)
    );
  }

  private async fetchPosCatalogFromDb(tenantId: string, outletId: string) { 
    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        sku: true,
        name: true,
        sellingPrice: true,
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: [{ isMain: 'desc' }, {id: 'asc'}],
          take: 1,
          select: { url: true, isMain: true}
        },
        outletStocks: {
          where: { outletId },
          select: { stock: true, minStock: true, outletId: true },
          take: 1,
        },
        outletPrices: {
          where: { outletId },
          select: { price: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc'},
    });

    return products.map((product) => {
      const stockRow = product.outletStocks[0];
      const priceOverride = product.outletPrices[0]?.price;
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        sellingPrice: priceOverride !== null && priceOverride !== undefined ? priceOverride : product.sellingPrice,
        stock: stockRow ? stockRow.stock : 0,
        minStock: stockRow ? stockRow.minStock : 0,
        category: product.category,
        images: product.images
      };
    });
  }
  async getAllProducts(tenantId: string, outletId?: string | null) {
    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        ...PRODUCT_LIST_INCLUDE,
        outletStocks: {
          where: outletId ? { outletId } : undefined,
          select: PRODUCT_LIST_INCLUDE.outletStocks.select,
        },
        outletPrices: {
          where: outletId ? { outletId } : undefined,
          select: PRODUCT_LIST_INCLUDE.outletPrices.select,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const withStock = mapProductsWithComputedStock(products, outletId);

    if (!outletId) {
      return withStock;
    }

    return withStock.map((product) => {
      const priceOverride = product.outletPrices[0]?.price;
      return {
        ...product,
        sellingPrice:
          priceOverride !== null && priceOverride !== undefined
            ? Number(priceOverride)
            : Number(product.sellingPrice),
      };
    });
  }

  async createProduct(tenantId: string, data: CreateProductInput) {
    const categoryExists = await prisma.category.findFirst({
      where: { id: data.categoryId, tenantId },
      select: { id: true },
    });

    if (!categoryExists) {
      throw new Error('Kategori produk tidak ditemukan atau tidak berada di bawah tenant yang sama.');
    }

    let sku = data.sku?.trim() ?? '';
    if (!sku) {
      const categoryService = new CategoryService();
      sku = await categoryService.getNextSkuForCategory(tenantId, data.categoryId);
    } else {
      const skuExists = await prisma.product.findFirst({
        where: { sku, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (skuExists) {
        throw new Error(`SKU [${sku}] sudah terdaftar untuk produk lain di toko Anda.`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId,
          categoryId: data.categoryId,
          name: data.name,
          sku,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          images:
            data.images && data.images.length > 0
              ? {
                  create: data.images.map((img) => ({
                    url: img.url,
                    isMain: img.isMain ?? false,
                  })),
                }
              : undefined,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { select: { id: true, url: true, isMain: true } },
        },
      });
      
      await seedOutletStocksForNewProduct(tx, {
        tenantId,
        productId: product.id,
        mainStock: data.stock ?? 0,
      });

      const result = { ...product, stock: data.stock ?? 0 };
      await invalidatePosCatalogForTenant(tenantId);
      return result;
    });
  }

  async updateProduct(tenantId: string, productId: string, data: UpdateProductInput) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      select: { id: true, sku: true },
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan atau Anda tidak memiliki akses ke produk ini.');
    }

    if (data.categoryId) {
      const categoryExists = await prisma.category.findFirst({
        where: { id: data.categoryId, tenantId },
        select: { id: true },
      });
      if (!categoryExists) {
        throw new Error('Kategori produk baru tidak ditemukan di bawah tenant Anda.');
      }
    }

    if (data.sku && data.sku !== product.sku) {
      const skuExists = await prisma.product.findFirst({
        where: { sku: data.sku, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (skuExists) {
        throw new Error(`SKU [${data.sku}] sudah digunakan oleh produk aktif lainnya.`);
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        sku: data.sku,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        images: data.images
          ? {
              deleteMany: {},
              create: data.images.map((img) => ({
                url: img.url,
                isMain: img.isMain ?? false,
              })),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, url: true, isMain: true } },
      },
    });

    await invalidatePosCatalogForTenant(tenantId);
    return updated;
  }

  async deleteProduct(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan atau Anda tidak memiliki hak akses menghapusnya.');
    }

    const deleted = await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    await invalidatePosCatalogForTenant(tenantId);
    return deleted;
  }

  async setPriceOverride(
    tenantId: string,
    data: { outletId: string; productId: string; price: number }
  ) {
    const { outletId, productId, price } = data;

    const [product, outlet] = await Promise.all([
      prisma.product.findFirst({
        where: { id: productId, tenantId, deletedAt: null },
        select: { id: true },
      }),
      prisma.outlet.findFirst({
        where: { id: outletId, tenantId, deletedAt: null },
        select: { id: true },
      }),
    ]);

    if (!product || !outlet) {
      throw new Error('Produk atau outlet tidak ditemukan.');
    }

    const result = await prisma.outletProductPrice.upsert({
      where: { outletId_productId: { outletId, productId } },
      create: { tenantId, outletId, productId, price },
      update: { price },
    });

    await invalidatePosCatalogForOutlet(tenantId, outletId);
    return result;
  }

  async deletePriceOverride(tenantId: string, outletId: string, productId: string) {
    const override = await prisma.outletProductPrice.findFirst({
      where: { outletId, productId, tenantId },
      select: { outletId: true, productId: true },
    });

    if (!override) {
      throw new Error('Harga khusus tidak ditemukan.');
    }

    const deleted = await prisma.outletProductPrice.delete({
      where: { outletId_productId: { outletId, productId } },
    });

    await invalidatePosCatalogForOutlet(tenantId, outletId);
    return deleted;
  }

  async setMinStock(
    tenantId: string,
    data: { outletId: string; productId: string; minStock: number }
  ) {
    const { outletId, productId, minStock } = data;

    const [product, outlet] = await Promise.all([
      prisma.product.findFirst({
        where: { id: productId, tenantId, deletedAt: null },
        select: { id: true },
      }),
      prisma.outlet.findFirst({
        where: { id: outletId, tenantId, deletedAt: null },
        select: { id: true },
      }),
    ]);

    if (!product || !outlet) {
      throw new Error('Produk atau outlet tidak ditemukan.');
    }

    const result = await prisma.outletStock.upsert({
      where: { outletId_productId: { outletId, productId } },
      create: { tenantId, outletId, productId, stock: 0, minStock },
      update: { minStock },
    });

    await invalidatePosCatalogForOutlet(tenantId, outletId);
    return result;
  }

  async getOutletSettingsForProduct(tenantId: string, productId: string) {
    const [prices, stocks] = await Promise.all([
      prisma.outletProductPrice.findMany({
        where: { productId, tenantId },
        include: { outlet: { select: { name: true } } },
      }),
      prisma.outletStock.findMany({
        where: { productId, tenantId },
        include: { outlet: { select: { name: true } } },
      }),
    ]);

    return { prices, stocks };
  }
}
