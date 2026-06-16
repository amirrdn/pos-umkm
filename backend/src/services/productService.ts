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
  async getAllProducts(tenantId: string) {
    return prisma.product.findMany({
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Membuat produk baru di dalam lingkup tenant tertentu.
   */
  async createProduct(tenantId: string, data: CreateProductInput) {
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

    return prisma.product.create({
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
}
