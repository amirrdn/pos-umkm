import { OutletType, type Outlet } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  attachOutletStats,
  fetchOutletStats,
  findMainOutletByTenant,
} from '../domain/outlet/outlet.repository';

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
  isActive?: boolean;
}

type OutletWithStats = Outlet & { activeStaff: number; totalStockSKUs: number };

export class OutletService {
  /** Mengambil semua outlet milik tenant; optional filter hanya yang operasional (isActive). */
  async getAllOutlets(tenantId: string, operationalOnly = false) {
    return prisma.outlet.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(operationalOnly ? { isActive: true } : {}),
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Mengambil detail outlet berdasarkan ID. */
  async getOutletById(tenantId: string, id: string) {
    const outlet = await prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!outlet) {
      throw new Error('Outlet tidak ditemukan atau Anda tidak memiliki akses ke data ini.');
    }

    return outlet;
  }

  /** Mengambil outlet utama (MAIN) tenant — alias kontrak GET /api/outlets/main. */
  async getMainOutlet(tenantId: string) {
    const outlet = await findMainOutletByTenant(tenantId);

    if (!outlet) {
      throw new Error('Outlet utama (pusat) tidak ditemukan untuk tenant ini.');
    }

    return outlet;
  }

  /**
   * Mengambil hierarki outlet (MAIN + BRANCH) beserta statistik.
   * Statistik: 2× groupBy paralel, bukan N+1 per outlet.
   */
  async getOutletHierarchy(tenantId: string) {
    const [mainOutlet, branches] = await Promise.all([
      findMainOutletByTenant(tenantId),
      prisma.outlet.findMany({
        where: { tenantId, type: OutletType.BRANCH, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const outletIds = [mainOutlet?.id, ...branches.map((b) => b.id)].filter(
      (id): id is string => Boolean(id)
    );

    const { staffByOutlet, stockSkuByOutlet } = await fetchOutletStats(outletIds);

    const withStats = (list: Outlet[]) =>
      attachOutletStats(list, staffByOutlet, stockSkuByOutlet);

    return {
      main: mainOutlet ? withStats([mainOutlet])[0] : null,
      branches: withStats(branches),
    } satisfies { main: OutletWithStats | null; branches: OutletWithStats[] };
  }

  /** Membuat cabang (BRANCH) baru di bawah Outlet Utama (MAIN). */
  async createBranch(tenantId: string, data: CreateBranchInput) {
    const mainOutlet = await findMainOutletByTenant(tenantId);

    if (!mainOutlet) {
      throw new Error('Outlet utama (pusat) tidak ditemukan. Harap hubungi administrator.');
    }

    const code = await this.resolveUniqueBranchCode(tenantId, data.code?.trim() || null);

    return prisma.$transaction(async (tx) => {
      const outlet = await tx.outlet.create({
        data: {
          tenantId,
          type: OutletType.BRANCH,
          parentOutletId: mainOutlet.id,
          name: data.name,
          code,
          address: data.address || null,
          phone: data.phone || null,
        },
      });

      const products = await tx.product.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true },
      });

      if (products.length > 0) {
        await tx.outletStock.createMany({
          data: products.map((product) => ({
            tenantId,
            outletId: outlet.id,
            productId: product.id,
            stock: 0,
          })),
          skipDuplicates: true,
        });
      }

      return outlet;
    });
  }

  /** Memperbarui profil outlet MAIN — alias kontrak PUT /api/outlets/main (1× lookup). */
  async updateMainOutlet(tenantId: string, data: UpdateOutletInput) {
    const main = await this.getMainOutlet(tenantId);
    return this.applyOutletUpdate(main, tenantId, data);
  }

  /** Memperbarui informasi data outlet. */
  async updateOutlet(tenantId: string, id: string, data: UpdateOutletInput) {
    const outlet = await prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!outlet) {
      throw new Error('Outlet tidak ditemukan atau Anda tidak memiliki akses.');
    }

    return this.applyOutletUpdate(outlet, tenantId, data);
  }

  private async applyOutletUpdate(
    outlet: Outlet,
    tenantId: string,
    data: UpdateOutletInput
  ) {
    if (data.code && data.code !== outlet.code) {
      const codeConflict = await prisma.outlet.findFirst({
        where: {
          tenantId,
          code: data.code,
          deletedAt: null,
          id: { not: outlet.id },
        },
        select: { id: true },
      });
      if (codeConflict) {
        throw new Error('Kode outlet tersebut sudah digunakan oleh outlet lain.');
      }
    }

    if (data.isActive !== undefined) {
      if (outlet.type === OutletType.MAIN) {
        throw new Error('Outlet utama (pusat) tidak dapat dinonaktifkan.');
      }
      if (data.isActive === false) {
        const openShift = await prisma.shift.findFirst({
          where: { outletId: outlet.id, status: 'OPEN' },
          select: { id: true },
        });
        if (openShift) {
          throw new Error(
            'Tidak dapat menonaktifkan cabang karena masih ada shift kasir yang aktif (OPEN).'
          );
        }
      }
    }

    return prisma.outlet.update({
      where: { id: outlet.id },
      data: {
        name: data.name ?? outlet.name,
        code: data.code !== undefined ? data.code : outlet.code,
        address: data.address !== undefined ? data.address : outlet.address,
        phone: data.phone !== undefined ? data.phone : outlet.phone,
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  /** Menghapus outlet secara halus dengan validasi tipe MAIN dan shift aktif. */
  async deleteOutlet(tenantId: string, id: string) {
    const outlet = await prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, type: true },
    });

    if (!outlet) {
      throw new Error('Outlet tidak ditemukan atau Anda tidak memiliki hak akses menghapusnya.');
    }

    if (outlet.type === OutletType.MAIN) {
      throw new Error('Outlet utama (pusat) tidak dapat dihapus.');
    }

    const openShift = await prisma.shift.findFirst({
      where: { outletId: id, status: 'OPEN' },
      select: { id: true },
    });

    if (openShift) {
      throw new Error(
        'Tidak dapat menghapus outlet karena masih ada shift kasir yang aktif (OPEN).'
      );
    }

    return prisma.outlet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Generate kode cabang unik per tenant; auto CBG-XX jika kosong. */
  private async resolveUniqueBranchCode(
    tenantId: string,
    requestedCode: string | null
  ): Promise<string> {
    let code =
      requestedCode ||
      `CBG-${String(
        (await prisma.outlet.count({
          where: { tenantId, type: OutletType.BRANCH, deletedAt: null },
        })) + 1
      ).padStart(2, '0')}`;

    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? code : `${code}-${suffix}`;
      const exists = await prisma.outlet.findFirst({
        where: { tenantId, code: candidate, deletedAt: null },
        select: { id: true },
      });
      if (!exists) return candidate;
      suffix += 1;
    }
  }
}
