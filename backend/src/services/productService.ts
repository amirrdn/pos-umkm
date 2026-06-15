import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateProductInput {
  categoryId: string;
  name: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
}

interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  sku?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stock?: number;
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

    const skuExists = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        tenantId: tenantId,
        deletedAt: null
      }
    });

    if (skuExists) {
      throw new Error(`SKU [${data.sku}] sudah terdaftar untuk produk lain di toko Anda.`);
    }

    return prisma.product.create({
      data: {
        tenantId: tenantId,
        categoryId: data.categoryId,
        name: data.name,
        sku: data.sku,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        stock: data.stock
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
        stock: data.stock
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
