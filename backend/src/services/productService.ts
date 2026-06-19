import { PrismaClient } from '@prisma/client';
import { CategoryService } from './categoryService';

const prisma = new PrismaClient();

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
  stock?: number;
  images?: { url: string; isMain?: boolean }[];
}

/**
 * Service Layer untuk Pengelolaan Produk.
 * Menjamin isolasi data multi-tenant dengan selalu menyaring query berdasarkan tenantId.
 */
export class ProductService {
  /**
   * Mengambil semua produk aktif milik tenant tertentu.
   */
  async getAllProducts(tenantId: string, outletId?: string | null) {
    const products = await prisma.product.findMany({
      where: {
        tenantId: tenantId,
        deletedAt: null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            isMain: true
          }
        },
        outletStocks: {
          where: outletId ? { outletId } : undefined,
          select: {
            stock: true,
            minStock: true,
            outletId: true,
            outlet: {
              select: {
                name: true,
                type: true
              }
            }
          }
        },
        outletPrices: {
          where: outletId ? { outletId } : undefined,
          select: {
            price: true,
            outletId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (outletId) {
      return products.map((product) => {
        const oStock = product.outletStocks[0]?.stock ?? 0;
        const oMinStock = product.outletStocks[0]?.minStock ?? 0;
        const oPrice = product.outletPrices[0]?.price ? Number(product.outletPrices[0].price) : null;
        return {
          ...product,
          stock: oStock,
          minStock: oMinStock,
          sellingPrice: oPrice !== null ? oPrice : Number(product.sellingPrice)
        };
      });
    }

    return products.map((product) => {
      const totalStock = product.outletStocks.reduce((sum, os) => sum + os.stock, 0);
      return {
        ...product,
        stock: totalStock
      };
    });
  }

  /**
   * Membuat produk baru di dalam lingkup tenant tertentu.
   */
  async createProduct(tenantId: string, data: CreateProductInput, outletId?: string | null) {
    const categoryExists = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        tenantId: tenantId
      }
    });

    if (!categoryExists) {
      throw new Error('Kategori produk tidak ditemukan atau tidak berada di bawah tenant yang sama.');
    }

    let sku = data.sku ? data.sku.trim() : '';
    if (!sku) {
      const categoryService = new CategoryService();
      sku = await categoryService.getNextSkuForCategory(tenantId, data.categoryId);
    } else {
      const skuExists = await prisma.product.findFirst({
        where: {
          sku: sku,
          tenantId: tenantId,
          deletedAt: null
        }
      });

      if (skuExists) {
        throw new Error(`SKU [${sku}] sudah terdaftar untuk produk lain di toko Anda.`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId: tenantId,
          categoryId: data.categoryId,
          name: data.name,
          sku: sku,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          stock: data.stock,
          images: data.images && data.images.length > 0 ? {
            create: data.images.map((img: any) => ({
              url: img.url,
              isMain: img.isMain ?? false
            }))
          } : undefined
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          images: {
            select: {
              id: true,
              url: true,
              isMain: true
            }
          }
        }
      });

      // Hubungkan relasi outlet stock untuk initial stock
      let targetOutletId = outletId;
      if (!targetOutletId) {
        const mainOutlet = await tx.outlet.findFirst({
          where: { tenantId, type: 'MAIN', deletedAt: null }
        }) || await tx.outlet.findFirst({
          where: { tenantId, deletedAt: null }
        });
        if (mainOutlet) {
          targetOutletId = mainOutlet.id;
        }
      }

      if (targetOutletId) {
        await tx.outletStock.create({
          data: {
            tenantId,
            outletId: targetOutletId,
            productId: product.id,
            stock: data.stock || 0
          }
        });
      }

      return product;
    });
  }

  /**
   * Memperbarui informasi produk tertentu milik tenant.
   */
  async updateProduct(tenantId: string, productId: string, data: UpdateProductInput) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenantId,
        deletedAt: null
      }
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan atau Anda tidak memiliki akses ke produk ini.');
    }

    if (data.categoryId) {
      const categoryExists = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          tenantId: tenantId
        }
      });
      if (!categoryExists) {
        throw new Error('Kategori produk baru tidak ditemukan di bawah tenant Anda.');
      }
    }

    if (data.sku && data.sku !== product.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          sku: data.sku,
          tenantId: tenantId,
          deletedAt: null
        }
      });
      if (skuExists) {
        throw new Error(`SKU [${data.sku}] sudah digunakan oleh produk aktif lainnya.`);
      }
    }

    return prisma.product.update({
      where: {
        id: productId
      },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        sku: data.sku,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        images: data.images ? {
          deleteMany: {},
          create: data.images.map((img: any) => ({
            url: img.url,
            isMain: img.isMain ?? false
          }))
        } : undefined
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            isMain: true
          }
        }
      }
    });
  }

  /**
   * Melakukan soft delete produk tertentu milik tenant.
   */
  async deleteProduct(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenantId,
        deletedAt: null
      }
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan atau Anda tidak memiliki hak akses menghapusnya.');
    }

    return prisma.product.update({
      where: {
        id: productId
      },
      data: {
        deletedAt: new Date()
      }
    });
  }

  /**
   * Mengatur harga khusus/override untuk cabang tertentu.
   */
  async setPriceOverride(tenantId: string, data: { outletId: string; productId: string; price: number }) {
    const { outletId, productId, price } = data;

    const [product, outlet] = await Promise.all([
      prisma.product.findFirst({ where: { id: productId, tenantId, deletedAt: null } }),
      prisma.outlet.findFirst({ where: { id: outletId, tenantId, deletedAt: null } })
    ]);

    if (!product || !outlet) {
      throw new Error('Produk atau outlet tidak ditemukan.');
    }

    return prisma.outletProductPrice.upsert({
      where: {
        outletId_productId: { outletId, productId }
      },
      create: {
        tenantId,
        outletId,
        productId,
        price
      },
      update: {
        price
      }
    });
  }

  /**
   * Menghapus harga khusus/override cabang (kembali ke harga dasar).
   */
  async deletePriceOverride(tenantId: string, outletId: string, productId: string) {
    const override = await prisma.outletProductPrice.findFirst({
      where: {
        outletId,
        productId,
        tenantId
      }
    });

    if (!override) {
      throw new Error('Harga khusus tidak ditemukan.');
    }

    return prisma.outletProductPrice.delete({
      where: {
        outletId_productId: { outletId, productId }
      }
    });
  }

  /**
   * Mengatur limit stok minimum (minStock) untuk produk di outlet tertentu.
   */
  async setMinStock(tenantId: string, data: { outletId: string; productId: string; minStock: number }) {
    const { outletId, productId, minStock } = data;

    const [product, outlet] = await Promise.all([
      prisma.product.findFirst({ where: { id: productId, tenantId, deletedAt: null } }),
      prisma.outlet.findFirst({ where: { id: outletId, tenantId, deletedAt: null } })
    ]);

    if (!product || !outlet) {
      throw new Error('Produk atau outlet tidak ditemukan.');
    }

    return prisma.outletStock.upsert({
      where: {
        outletId_productId: { outletId, productId }
      },
      create: {
        tenantId,
        outletId,
        productId,
        stock: 0,
        minStock
      },
      update: {
        minStock
      }
    });
  }

  /**
   * Mengambil semua daftar harga khusus dan limit stok cabang untuk sebuah produk.
   */
  async getOutletSettingsForProduct(tenantId: string, productId: string) {
    const [prices, stocks] = await Promise.all([
      prisma.outletProductPrice.findMany({
        where: { productId, tenantId },
        include: { outlet: { select: { name: true } } }
      }),
      prisma.outletStock.findMany({
        where: { productId, tenantId },
        include: { outlet: { select: { name: true } } }
      })
    ]);

    return { prices, stocks };
  }
}
