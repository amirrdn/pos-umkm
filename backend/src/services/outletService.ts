import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateOutletInput {
  name: string;
  address?: string | null;
  phone?: string | null;
}

interface UpdateOutletInput {
  name?: string;
  address?: string | null;
  phone?: string | null;
}

export class OutletService {
  /**
   * Mengambil semua outlet aktif milik tenant tertentu.
   */
  async getAllOutlets(tenantId: string) {
    return prisma.outlet.findMany({
      where: {
        tenantId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  /**
   * Mengambil detail outlet berdasarkan ID.
   */
  async getOutletById(tenantId: string, id: string) {
    const outlet = await prisma.outlet.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      }
    });

    if (!outlet) {
      throw new Error('Outlet tidak ditemukan atau Anda tidak memiliki akses ke data ini.');
    }

    return outlet;
  }

  /**
   * Membuat outlet baru dan menginisialisasi OutletStock untuk seluruh produk yang ada di tenant.
   */
  async createOutlet(tenantId: string, data: CreateOutletInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Buat outlet baru
      const outlet = await tx.outlet.create({
        data: {
          tenantId,
          name: data.name,
          address: data.address || null,
          phone: data.phone || null
        }
      });

      // 2. Ambil seluruh produk aktif milik tenant
      const products = await tx.product.findMany({
        where: {
          tenantId,
          deletedAt: null
        }
      });

      // 3. Buat entri stok awal 0 di tabel OutletStock untuk setiap produk
      if (products.length > 0) {
        await tx.outletStock.createMany({
          data: products.map((product) => ({
            tenantId,
            outletId: outlet.id,
            productId: product.id,
            stock: 0
          }))
        });
      }

      return outlet;
    });
  }

  /**
   * Memperbarui informasi data outlet.
   */
  async updateOutlet(tenantId: string, id: string, data: UpdateOutletInput) {
    const outlet = await prisma.outlet.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      }
    });

    if (!outlet) {
      throw new Error('Outlet tidak ditemukan atau Anda tidak memiliki akses.');
    }

    return prisma.outlet.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : outlet.name,
        address: data.address !== undefined ? data.address : outlet.address,
        phone: data.phone !== undefined ? data.phone : outlet.phone
      }
    });
  }

  /**
   * Menghapus outlet secara halus (Soft Delete).
   */
  async deleteOutlet(tenantId: string, id: string) {
    const outlet = await prisma.outlet.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      }
    });

    if (!outlet) {
      throw new Error('Outlet tidak ditemukan atau Anda tidak memiliki hak akses menghapusnya.');
    }

    return prisma.outlet.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
