import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POService } from '../../services/poService';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    supplier: {
      findFirst: vi.fn(),
    },
    purchaseOrder: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    product: {
      update: vi.fn(),
    },
    outletStock: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    stockLedger: {
      create: vi.fn(),
    },
  },
}));

describe('POService', () => {
  let service: POService;
  const mockTenantId = 'tenant-101';
  const mockUserId = 'user-101';

  beforeEach(() => {
    service = new POService();
    vi.clearAllMocks();
  });

  it('should throw an error when creating PO for non-existent supplier', async () => {
    vi.mocked(prisma.supplier.findFirst).mockResolvedValue(null);

    await expect(
      service.createPO(mockTenantId, mockUserId, {
        supplierId: 'invalid-sup',
        items: [{ productId: 'prod-1', quantity: 10, costPrice: 5000 }],
      })
    ).rejects.toThrow('Supplier tidak ditemukan.');
  });

  it('should create purchase order and calculate totalAmount correctly', async () => {
    vi.mocked(prisma.supplier.findFirst).mockResolvedValue({ id: 'sup-1', tenantId: mockTenantId } as never);
    vi.mocked(prisma.purchaseOrder.create).mockResolvedValue({
      id: 'po-1',
      poNumber: 'PO-202607-1234',
      totalAmount: 50000,
    } as never);

    const input = {
      supplierId: 'sup-1',
      items: [{ productId: 'prod-1', quantity: 10, costPrice: 5000 }],
    };

    const result = await service.createPO(mockTenantId, mockUserId, input);

    expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          supplierId: 'sup-1',
          totalAmount: 50000,
        }),
      })
    );
    expect(result.id).toBe('po-1');
  });

  it('should prevent receiving a PO that is already RECEIVED', async () => {
    const mockPO = {
      id: 'po-1',
      tenantId: mockTenantId,
      status: 'RECEIVED',
      items: [],
    };
    vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(mockPO as never);

    await expect(service.receivePO(mockTenantId, mockUserId, 'po-1')).rejects.toThrow(
      'Purchase Order ini sudah diterima sebelumnya.'
    );
  });
});
