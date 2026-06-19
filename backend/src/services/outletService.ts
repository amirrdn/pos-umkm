import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateOutletInput {
  name: string;
  address?: string | null;
  phone?: string | null;
}

interface CreateBranchInput {
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
}

interface UpdateOutletInput {
  name?: string;
  code?: string | null;
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
   * Mengambil hierarki outlet (MAIN + BRANCH) beserta statistiknya.
   */
  async getOutletHierarchy(tenantId: string) {
    const mainOutlet = await prisma.outlet.findFirst({
      where: {
        tenantId,
        type: 'MAIN',
        deletedAt: null
      }
    });

    const branches = await prisma.outlet.findMany({
      where: {
        tenantId,
        type: 'BRANCH',
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const mapStats = async (outlet: any) => {
      if (!outlet) return null;

      const activeStaff = await prisma.userOutlet.count({
        where: {
          outletId: outlet.id,
          user: {
            deletedAt: null,
            approvalStatus: 'APPROVED'
          }
        }
      });

      const totalStockSKUs = await prisma.outletStock.count({
        where: {
          outletId: outlet.id,
          product: {
            deletedAt: null
          }
        }
      });

      return {
        ...outlet,
        activeStaff,
        totalStockSKUs
      };
    };

    const mainWithStats = mainOutlet ? await mapStats(mainOutlet) : null;
    const branchesWithStats = await Promise.all(branches.map((b) => mapStats(b)));

    return {
      main: mainWithStats,
      branches: branchesWithStats
    };
  }

  /**
   * Membuat outlet baru (biasanya diakses via internal/legacy).
   */
  async createOutlet(tenantId: string, data: CreateOutletInput) {
    return prisma.$transaction(async (tx) => {
      const outlet = await tx.outlet.create({
        data: {
          tenantId,
          name: data.name,
          address: data.address || null,
          phone: data.phone || null
        }
      });

      const products = await tx.product.findMany({
        where: {
          tenantId,
          deletedAt: null
        }
      });

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
   * Membuat cabang (BRANCH) baru di bawah Outlet Utama (MAIN).
   */
  async createBranch(tenantId: string, data: CreateBranchInput) {
    const mainOutlet = await prisma.outlet.findFirst({
      where: {
        tenantId,
        type: 'MAIN',
        deletedAt: null
      }
    });

    if (!mainOutlet) {
      throw new Error('Outlet utama (pusat) tidak ditemukan. Harap hubungi administrator.');
    }

    let code = data.code?.trim() || null;
    if (!code) {
      const count = await prisma.outlet.count({
        where: {
          tenantId,
          type: 'BRANCH',
          deletedAt: null
        }
      });
      code = `CBG-${String(count + 1).padStart(2, '0')}`;
    }

    // Pastikan kode unik per tenant
    const existingCode = await prisma.outlet.findFirst({
      where: {
        tenantId,
        code,
        deletedAt: null
      }
    });

    if (existingCode) {
      let suffix = 1;
      let safeCode = code;
      let check = true;
      while (check) {
        safeCode = `${code}-${suffix}`;
        const conflict = await prisma.outlet.findFirst({
          where: { tenantId, code: safeCode, deletedAt: null }
        });
        if (!conflict) {
          check = false;
        } else {
          suffix++;
        }
      }
      code = safeCode;
    }

    return prisma.$transaction(async (tx) => {
      // 1. Buat outlet cabang baru
      const outlet = await tx.outlet.create({
        data: {
          tenantId,
          type: 'BRANCH',
          parentOutletId: mainOutlet.id,
          name: data.name,
          code,
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

    if (data.code && data.code !== outlet.code) {
      const codeConflict = await prisma.outlet.findFirst({
        where: {
          tenantId,
          code: data.code,
          deletedAt: null,
          id: { not: id }
        }
      });
      if (codeConflict) {
        throw new Error('Kode outlet tersebut sudah digunakan oleh outlet lain.');
      }
    }

    return prisma.outlet.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : outlet.name,
        code: data.code !== undefined ? data.code : outlet.code,
        address: data.address !== undefined ? data.address : outlet.address,
        phone: data.phone !== undefined ? data.phone : outlet.phone
      }
    });
  }

  /**
   * Menghapus outlet secara halus (Soft Delete) dengan validasi tipe dan shift aktif.
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

    if (outlet.type === 'MAIN') {
      throw new Error('Outlet utama (pusat) tidak dapat dihapus.');
    }

    const openShift = await prisma.shift.findFirst({
      where: {
        outletId: id,
        status: 'OPEN'
      }
    });

    if (openShift) {
      throw new Error('Tidak dapat menghapus outlet karena masih ada shift kasir yang aktif (OPEN).');
    }

    return prisma.outlet.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
