import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
}

/**
 * Service Layer untuk Pengelolaan Pelanggan.
 * Menjamin isolasi data multi-tenant dengan selalu menyaring query berdasarkan tenantId.
 */
export class CustomerService {
  /**
   * Mengambil semua pelanggan milik tenant tertentu, mendukung pencarian nama/telepon.
   */
  async getAllCustomers(tenantId: string, search?: string) {
    const whereClause: any = {
      tenantId: tenantId
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Mengambil detail pelanggan berdasarkan ID.
   */
  async getCustomerById(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: tenantId
      }
    });

    if (!customer) {
      throw new Error('Pelanggan tidak ditemukan atau Anda tidak memiliki akses ke data ini.');
    }

    return customer;
  }

  /**
   * Membuat pelanggan baru di dalam lingkup tenant tertentu.
   */
  async createCustomer(tenantId: string, data: CreateCustomerInput) {
    if (data.phone) {
      const phoneExists = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
          tenantId: tenantId
        }
      });

      if (phoneExists) {
        throw new Error(`Nomor telepon [${data.phone}] sudah terdaftar untuk pelanggan lain di toko Anda.`);
      }
    }

    return prisma.customer.create({
      data: {
        tenantId: tenantId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        points: 0
      }
    });
  }

  /**
   * Memperbarui data pelanggan tertentu milik tenant.
   */
  async updateCustomer(tenantId: string, customerId: string, data: UpdateCustomerInput) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: tenantId
      }
    });

    if (!customer) {
      throw new Error('Pelanggan tidak ditemukan atau Anda tidak memiliki akses ke data ini.');
    }

    if (data.phone && data.phone !== customer.phone) {
      const phoneExists = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
          tenantId: tenantId
        }
      });

      if (phoneExists) {
        throw new Error(`Nomor telepon [${data.phone}] sudah digunakan oleh pelanggan lainnya.`);
      }
    }

    return prisma.customer.update({
      where: {
        id: customerId
      },
      data: {
        name: data.name,
        phone: data.phone === undefined ? customer.phone : data.phone,
        email: data.email === undefined ? customer.email : data.email
      }
    });
  }

  /**
   * Menghapus pelanggan tertentu milik tenant (Hard Delete).
   * Relasi ke transaksi akan diset menjadi NULL (onDelete: SetNull).
   */
  async deleteCustomer(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: tenantId
      }
    });

    if (!customer) {
      throw new Error('Pelanggan tidak ditemukan atau Anda tidak memiliki hak akses menghapusnya.');
    }

    return prisma.customer.delete({
      where: {
        id: customerId
      }
    });
  }
}
