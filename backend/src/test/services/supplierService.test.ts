import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplierService } from '../../services/supplierService';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    supplier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('SupplierService', () => {
  let service: SupplierService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    service = new SupplierService();
    vi.clearAllMocks();
  });

  it('should retrieve all active suppliers for a tenant', async () => {
    const mockSuppliers = [
      { id: 'sup-1', name: 'PT Distributor Utama', tenantId: mockTenantId, deletedAt: null },
    ];
    vi.mocked(prisma.supplier.findMany).mockResolvedValue(mockSuppliers as never);

    const result = await service.getAllSuppliers(mockTenantId);

    expect(prisma.supplier.findMany).toHaveBeenCalledWith({
      where: { tenantId: mockTenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(mockSuppliers);
  });

  it('should create a new supplier with sanitized email', async () => {
    const input = {
      name: 'CV Makmur Jaya',
      contactName: 'Budi',
      phone: '08123456789',
      email: '',
      address: 'Jakarta',
    };

    const createdSupplier = { id: 'sup-2', tenantId: mockTenantId, ...input, email: null };
    vi.mocked(prisma.supplier.create).mockResolvedValue(createdSupplier as never);

    const result = await service.createSupplier(mockTenantId, input);

    expect(prisma.supplier.create).toHaveBeenCalledWith({
      data: {
        tenantId: mockTenantId,
        name: input.name,
        contactName: input.contactName,
        phone: input.phone,
        email: null,
        address: input.address,
      },
    });
    expect(result).toEqual(createdSupplier);
  });

  it('should soft delete a supplier by setting deletedAt timestamp', async () => {
    const supplierId = 'sup-1';
    vi.mocked(prisma.supplier.findFirst).mockResolvedValue({ id: supplierId, tenantId: mockTenantId } as never);
    vi.mocked(prisma.supplier.update).mockResolvedValue({ id: supplierId, deletedAt: new Date() } as never);

    await service.deleteSupplier(mockTenantId, supplierId);

    expect(prisma.supplier.update).toHaveBeenCalledWith({
      where: { id: supplierId },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
