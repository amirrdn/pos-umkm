import { prisma } from '../lib/prisma';
import { CreateSupplierInput, UpdateSupplierInput } from '../schemas/supplier.schema';

export class SupplierService {
  async getAllSuppliers(tenantId: string) {
    return prisma.supplier.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSupplierById(tenantId: string, id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!supplier) {
      throw new Error('Supplier tidak ditemukan.');
    }

    return supplier;
  }

  async createSupplier(tenantId: string, data: CreateSupplierInput) {
    return prisma.supplier.create({
      data: {
        tenantId,
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
      },
    });
  }

  async updateSupplier(tenantId: string, id: string, data: UpdateSupplierInput) {
    await this.getSupplierById(tenantId, id);

    return prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
      },
    });
  }

  async deleteSupplier(tenantId: string, id: string) {
    await this.getSupplierById(tenantId, id);

    return prisma.supplier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
