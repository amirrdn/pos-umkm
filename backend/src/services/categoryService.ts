import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCategoryInput {
  name: string;
  prefix: string;
}

interface UpdateCategoryInput {
  name?: string;
  prefix?: string;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export class CategoryService {
  async getAllCategories(tenantId: string) {
    return prisma.category.findMany({
      where: {
        tenantId
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async createCategory(tenantId: string, data: CreateCategoryInput) {
    const slug = slugify(data.name);

    const existing = await prisma.category.findFirst({
      where: {
        tenantId,
        slug
      }
    });

    if (existing) {
      throw new Error(`Kategori dengan nama/slug "${data.name}" sudah terdaftar.`);
    }

    return prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        slug,
        prefix: data.prefix.toUpperCase().trim()
      }
    });
  }

  async updateCategory(tenantId: string, categoryId: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId
      }
    });

    if (!category) {
      throw new Error('Kategori tidak ditemukan.');
    }

    let slug = category.slug;
    if (data.name && data.name !== category.name) {
      slug = slugify(data.name);

      const existing = await prisma.category.findFirst({
        where: {
          tenantId,
          slug,
          id: { not: categoryId }
        }
      });

      if (existing) {
        throw new Error(`Kategori dengan nama "${data.name}" sudah terdaftar.`);
      }
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        slug,
        prefix: data.prefix ? data.prefix.toUpperCase().trim() : undefined
      }
    });
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId
      }
    });

    if (!category) {
      throw new Error('Kategori tidak ditemukan.');
    }

    const activeProductsCount = await prisma.product.count({
      where: {
        categoryId,
        tenantId,
        deletedAt: null
      }
    });

    if (activeProductsCount > 0) {
      throw new Error('Kategori tidak bisa dihapus karena masih digunakan oleh produk aktif.');
    }

    return prisma.category.delete({
      where: { id: categoryId }
    });
  }

  async getNextSkuForCategory(tenantId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId }
    });

    if (!category) {
      throw new Error('Kategori tidak ditemukan.');
    }

    const prefix = category.prefix.toUpperCase().trim();

    const products = await prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        sku: {
          startsWith: `${prefix}-`
        }
      },
      select: { sku: true }
    });

    let maxNum = 0;
    for (const p of products) {
      const parts = p.sku.split('-');
      if (parts.length >= 2) {
        const numStr = parts[parts.length - 1];
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(3, '0');
    return `${prefix}-${paddedNum}`;
  }
}
